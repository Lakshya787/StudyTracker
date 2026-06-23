import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { schema } from './schema.js'

let db = null

export function initDB() {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'studytracker.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  
  // Initialize schema
  db.exec(schema)

  // Migrations — safe to run multiple times
  try { db.exec(`ALTER TABLE sessions ADD COLUMN label TEXT DEFAULT ''`) } catch (_) {}
  try { db.exec(`ALTER TABLE sessions ADD COLUMN mood INTEGER DEFAULT NULL`) } catch (_) {}
  try { db.exec(`ALTER TABLE todos ADD COLUMN tag TEXT NOT NULL DEFAULT 'General'`) } catch (_) {}
  try { db.exec(`ALTER TABLE todos ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`) } catch (_) {}
  try { db.exec(`ALTER TABLE todos ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0`) } catch (_) {}
  try { db.exec(`ALTER TABLE todos ADD COLUMN studied_seconds INTEGER NOT NULL DEFAULT 0`) } catch (_) {}
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`)
  } catch (_) {}
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS badges (
      key TEXT PRIMARY KEY,
      earned_at TEXT NOT NULL
    )`)
  } catch (_) {}

  console.log('Database initialized at', dbPath)
  return db
}

export function getDB() {
  if (!db) throw new Error('Database not initialized')
  return db
}

// --- CRUD Functions ---

// Sessions
export function getSessions() {
  return getDB().prepare('SELECT * FROM sessions ORDER BY created_at DESC').all()
}
export function addSession(date, duration_seconds, type, label = '') {
  const stmt = getDB().prepare('INSERT INTO sessions (date, duration_seconds, type, label, created_at) VALUES (?, ?, ?, ?, ?)')
  const now = new Date().toISOString()
  const result = stmt.run(date, duration_seconds, type, label, now)
  return { lastInsertRowid: result.lastInsertRowid }
}
export function updateSessionMood(id, mood) {
  return getDB().prepare('UPDATE sessions SET mood = ? WHERE id = ?').run(mood, id)
}
export function getTodaySummary() {
  const db = getDB()
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const rows = db.prepare("SELECT * FROM sessions WHERE date = ? AND type = 'pomodoro' ORDER BY created_at ASC").all(dateStr)
  const totalSeconds = rows.reduce((a, s) => a + s.duration_seconds, 0)
  return { date: dateStr, sessions: rows, totalSeconds, sessionCount: rows.length }
}

// Settings
export function getSetting(key) {
  const row = getDB().prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : null
}
export function setSetting(key, value) {
  return getDB().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value))
}

// XP — stored in settings table as 'total_xp'
export function getXP() {
  const row = getDB().prepare("SELECT value FROM settings WHERE key = 'total_xp'").get()
  return row ? parseInt(row.value, 10) : 0
}
export function addXP(amount) {
  const current = getXP()
  return getDB().prepare('INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2').run('total_xp', String(current + amount))
}

// Badges
export function getBadges() {
  return getDB().prepare('SELECT * FROM badges ORDER BY earned_at ASC').all()
}
export function earnBadge(key) {
  // Returns true if newly earned, false if already had it
  const existing = getDB().prepare('SELECT key FROM badges WHERE key = ?').get(key)
  if (existing) return false
  getDB().prepare('INSERT INTO badges (key, earned_at) VALUES (?, ?)').run(key, new Date().toISOString())
  return true
}

// Personal Bests
export function getPersonalBests() {
  const db = getDB()
  const longestSession = db.prepare('SELECT MAX(duration_seconds) as val FROM sessions WHERE type = ?').get('pomodoro')
  const bestDay = db.prepare('SELECT MAX(total_seconds) as val FROM streaks').get()
  const totalHours = db.prepare('SELECT SUM(duration_seconds) as val FROM sessions WHERE type = ?').get('pomodoro')
  const sessionCount = db.prepare('SELECT COUNT(*) as val FROM sessions WHERE type = ?').get('pomodoro')
  const bestDayDate = db.prepare('SELECT date FROM streaks ORDER BY total_seconds DESC LIMIT 1').get()
  return {
    longestSessionSeconds: longestSession?.val ?? 0,
    bestDaySeconds: bestDay?.val ?? 0,
    bestDayDate: bestDayDate?.date ?? null,
    totalSeconds: totalHours?.val ?? 0,
    totalSessions: sessionCount?.val ?? 0,
  }
}

// Todos
export function getTodos() {
  return getDB().prepare('SELECT * FROM todos WHERE archived = 0 ORDER BY order_index ASC, created_at DESC').all()
}
export function getArchivedTodos() {
  return getDB().prepare('SELECT * FROM todos WHERE archived = 1 ORDER BY created_at DESC').all()
}
export function addTodo(title, tag = 'General') {
  const db = getDB()
  const maxOrderRow = db.prepare('SELECT MAX(order_index) as max_idx FROM todos WHERE archived = 0').get()
  const nextOrder = (maxOrderRow?.max_idx ?? -1) + 1
  const stmt = db.prepare('INSERT INTO todos (title, tag, done, archived, order_index, studied_seconds, created_at) VALUES (?, ?, 0, 0, ?, 0, ?)')
  return stmt.run(title, tag, nextOrder, new Date().toISOString())
}
export function updateTodo(id, done) {
  return getDB().prepare('UPDATE todos SET done = ? WHERE id = ?').run(done, id)
}
export function updateTodoTag(id, tag) {
  return getDB().prepare('UPDATE todos SET tag = ? WHERE id = ?').run(tag, id)
}
export function updateTodoOrder(orderedIds) {
  const stmt = getDB().prepare('UPDATE todos SET order_index = ? WHERE id = ?')
  const updateMany = getDB().transaction((ids) => {
    ids.forEach((id, idx) => stmt.run(idx, id))
  })
  updateMany(orderedIds)
}
export function addStudiedSeconds(id, seconds) {
  return getDB().prepare('UPDATE todos SET studied_seconds = studied_seconds + ? WHERE id = ?').run(seconds, id)
}
export function archiveTodo(id) {
  return getDB().prepare('UPDATE todos SET archived = 1 WHERE id = ?').run(id)
}
export function deleteTodo(id) {
  return getDB().prepare('DELETE FROM todos WHERE id = ?').run(id)
}

// Rules
export function getRules() {
  return getDB().prepare('SELECT * FROM rules').all()
}
export function addRule(title, description) {
  const stmt = getDB().prepare('INSERT INTO rules (title, description) VALUES (?, ?)')
  return stmt.run(title, description)
}
export function updateRule(id, title, description) {
  const stmt = getDB().prepare('UPDATE rules SET title = ?, description = ? WHERE id = ?')
  return stmt.run(title, description, id)
}
export function deleteRule(id) {
  const stmt = getDB().prepare('DELETE FROM rules WHERE id = ?')
  return stmt.run(id)
}

// Streaks
export function getStreaks() {
  return getDB().prepare('SELECT * FROM streaks ORDER BY date DESC').all()
}
export function addOrUpdateStreak(date, duration_seconds) {
  const db = getDB()
  const existing = db.prepare('SELECT * FROM streaks WHERE date = ?').get(date)
  if (existing) {
    const stmt = db.prepare('UPDATE streaks SET total_seconds = total_seconds + ? WHERE date = ?')
    return stmt.run(duration_seconds, date)
  } else {
    const stmt = db.prepare('INSERT INTO streaks (date, total_seconds) VALUES (?, ?)')
    return stmt.run(date, duration_seconds)
  }
}
