const Database = require('better-sqlite3');
const db = new Database('habits.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency TEXT DEFAULT 'daily',
    reminder_time TEXT DEFAULT '',
    created_at TEXT DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    completed_at TEXT NOT NULL,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE (habit_id, completed_at)
  );
`);

function getAllHabits() {
  return db.prepare('SELECT * FROM habits ORDER BY created_at DESC').all();
}

function getHabitById(id) {
  return db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
}

function createHabit({ name, description, frequency, reminder_time }) {
  const stmt = db.prepare(
    'INSERT INTO habits (name, description, frequency, reminder_time) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(name, description || '', frequency || 'daily', reminder_time || '');
  return getHabitById(result.lastInsertRowid);
}

function updateHabit(id, { name, description, frequency, reminder_time }) {
  db.prepare(
    'UPDATE habits SET name=?, description=?, frequency=?, reminder_time=? WHERE id=?'
  ).run(name, description || '', frequency || 'daily', reminder_time || '', id);
  return getHabitById(id);
}

function deleteHabit(id) {
  db.prepare('DELETE FROM habits WHERE id = ?').run(id);
}

function getTodayHabits() {
  const today = new Date().toISOString().slice(0, 10);
  return db.prepare(`
    SELECT h.*, CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END AS completed
    FROM habits h
    LEFT JOIN completions c ON c.habit_id = h.id AND c.completed_at = ?
    ORDER BY h.created_at DESC
  `).all(today);
}

function completeHabit(id) {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(
    'INSERT OR IGNORE INTO completions (habit_id, completed_at) VALUES (?, ?)'
  ).run(id, today);
}

function uncompleteHabit(id) {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare('DELETE FROM completions WHERE habit_id = ? AND completed_at = ?').run(id, today);
}

function getStreak(id) {
  const rows = db.prepare(
    "SELECT completed_at FROM completions WHERE habit_id = ? ORDER BY completed_at DESC"
  ).all(id);

  if (rows.length === 0) return 0;

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const row of rows) {
    const d = new Date(row.completed_at + 'T00:00:00');
    const diff = Math.round((cursor - d) / 86400000);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

function getHabitsWithReminderAt(time) {
  return db.prepare('SELECT * FROM habits WHERE reminder_time = ?').all(time);
}

function getPendingToday() {
  const today = new Date().toISOString().slice(0, 10);
  return db.prepare(`
    SELECT h.* FROM habits h
    WHERE NOT EXISTS (
      SELECT 1 FROM completions c WHERE c.habit_id = h.id AND c.completed_at = ?
    )
  `).all(today);
}

module.exports = {
  getAllHabits, getHabitById, createHabit, updateHabit, deleteHabit,
  getTodayHabits, completeHabit, uncompleteHabit, getStreak,
  getHabitsWithReminderAt, getPendingToday
};
