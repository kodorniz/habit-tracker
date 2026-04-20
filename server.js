require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const db = require('./db');
const { sendReminderEmail } = require('./email');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// --- Habits CRUD ---

app.get('/api/habits', (req, res) => {
  res.json(db.getAllHabits());
});

app.post('/api/habits', (req, res) => {
  const { name, description, frequency, reminder_time } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  res.status(201).json(db.createHabit({ name, description, frequency, reminder_time }));
});

app.put('/api/habits/:id', (req, res) => {
  const habit = db.getHabitById(req.params.id);
  if (!habit) return res.status(404).json({ error: 'not found' });
  res.json(db.updateHabit(req.params.id, req.body));
});

app.delete('/api/habits/:id', (req, res) => {
  db.deleteHabit(req.params.id);
  res.sendStatus(204);
});

// --- Today's habits ---

app.get('/api/today', (req, res) => {
  const habits = db.getTodayHabits();
  res.json(habits);
});

app.post('/api/complete/:id', (req, res) => {
  db.completeHabit(req.params.id);
  res.sendStatus(204);
});

app.delete('/api/complete/:id', (req, res) => {
  db.uncompleteHabit(req.params.id);
  res.sendStatus(204);
});

// --- Stats ---

app.get('/api/stats/:id', (req, res) => {
  const habit = db.getHabitById(req.params.id);
  if (!habit) return res.status(404).json({ error: 'not found' });
  res.json({ streak: db.getStreak(req.params.id) });
});

// --- Cron: check reminders every minute ---

cron.schedule('* * * * *', async () => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const habits = db.getHabitsWithReminderAt(time);
  if (habits.length === 0) return;

  const pending = db.getPendingToday().filter(h => habits.some(r => r.id === h.id));
  if (pending.length === 0) return;

  try {
    await sendReminderEmail(pending);
    console.log(`[${time}] Email de recordatorio enviado (${pending.length} hábito(s))`);
  } catch (err) {
    console.error('Error enviando email:', err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Habit Tracker corriendo en http://localhost:${PORT}`));
