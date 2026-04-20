const todayList = document.getElementById('today-list');
const habitsList = document.getElementById('habits-list');
const modal = document.getElementById('modal');
const habitForm = document.getElementById('habit-form');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const reminderBanner = document.getElementById('reminder-banner');
const bannerText = document.getElementById('banner-text');

document.getElementById('date-label').textContent = new Date().toLocaleDateString('es-ES', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

document.getElementById('btn-add').addEventListener('click', () => openModal());
document.getElementById('btn-cancel').addEventListener('click', () => closeModal());
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
habitForm.addEventListener('submit', saveHabit);

async function loadToday() {
  const habits = await fetch('/api/today').then(r => r.json());
  const done = habits.filter(h => h.completed).length;
  const total = habits.length;

  progressLabel.textContent = `${done} de ${total} completados`;
  progressFill.style.width = total ? `${Math.round(done / total * 100)}%` : '0%';

  const pending = habits.filter(h => !h.completed);
  if (pending.length > 0) {
    bannerText.textContent = `Tienes ${pending.length} habito(s) pendiente(s) hoy.`;
    reminderBanner.classList.remove('hidden');
  } else {
    reminderBanner.classList.add('hidden');
  }

  todayList.innerHTML = '';
  if (habits.length === 0) {
    todayList.innerHTML = '<p class="empty">No tienes habitos todavia. Crea uno abajo.</p>';
    return;
  }

  for (const h of habits) {
    const streakData = await fetch(`/api/stats/${h.id}`).then(r => r.json());
    const li = document.createElement('li');
    li.className = `habit-item${h.completed ? ' done' : ''}`;
    li.innerHTML = `
      <input type="checkbox" class="habit-check" ${h.completed ? 'checked' : ''} data-id="${h.id}" />
      <div class="habit-info">
        <div class="habit-name">${escHtml(h.name)}</div>
        <div class="habit-meta">${escHtml(h.description || '')}${h.reminder_time ? ' · ⏰ ' + h.reminder_time : ''}</div>
        ${streakData.streak > 0 ? `<div class="habit-streak">🔥 ${streakData.streak} dia(s) seguido(s)</div>` : ''}
      </div>
    `;
    li.querySelector('.habit-check').addEventListener('change', async e => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        await fetch(`/api/complete/${id}`, { method: 'POST' });
      } else {
        await fetch(`/api/complete/${id}`, { method: 'DELETE' });
      }
      loadToday();
    });
    todayList.appendChild(li);
  }
}

async function loadHabits() {
  const habits = await fetch('/api/habits').then(r => r.json());
  habitsList.innerHTML = '';
  if (habits.length === 0) {
    habitsList.innerHTML = '<p class="empty">Sin habitos todavia.</p>';
    return;
  }
  for (const h of habits) {
    const li = document.createElement('li');
    li.className = 'habit-item';
    li.innerHTML = `
      <div class="habit-info">
        <div class="habit-name">${escHtml(h.name)}</div>
        <div class="habit-meta">${escHtml(h.description || '')} · ${h.frequency === 'daily' ? 'Diario' : 'Semanal'}${h.reminder_time ? ' · ⏰ ' + h.reminder_time : ''}</div>
      </div>
      <div class="habit-actions">
        <button title="Editar" data-id="${h.id}" class="edit-btn">✏️</button>
        <button title="Eliminar" data-id="${h.id}" class="delete-btn">🗑️</button>
      </div>
    `;
    li.querySelector('.edit-btn').addEventListener('click', () => openModal(h));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteHabit(h.id));
    habitsList.appendChild(li);
  }
}

function openModal(habit = null) {
  document.getElementById('habit-id').value = habit ? habit.id : '';
  document.getElementById('habit-name').value = habit ? habit.name : '';
  document.getElementById('habit-desc').value = habit ? habit.description : '';
  document.getElementById('habit-freq').value = habit ? habit.frequency : 'daily';
  document.getElementById('habit-time').value = habit ? habit.reminder_time : '';
  document.getElementById('modal-title').textContent = habit ? 'Editar habito' : 'Nuevo habito';
  modal.classList.remove('hidden');
  document.getElementById('habit-name').focus();
}

function closeModal() {
  modal.classList.add('hidden');
  habitForm.reset();
}

async function saveHabit(e) {
  e.preventDefault();
  const id = document.getElementById('habit-id').value;
  const body = {
    name: document.getElementById('habit-name').value.trim(),
    description: document.getElementById('habit-desc').value.trim(),
    frequency: document.getElementById('habit-freq').value,
    reminder_time: document.getElementById('habit-time').value,
  };
  if (id) {
    await fetch(`/api/habits/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } else {
    await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }
  closeModal();
  loadToday();
  loadHabits();
}

async function deleteHabit(id) {
  if (!confirm('Seguro que quieres eliminar este habito?')) return;
  await fetch(`/api/habits/${id}`, { method: 'DELETE' });
  loadToday();
  loadHabits();
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadToday();
loadHabits();
