import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

let db: ReturnType<typeof Database> | null = null

export function initDB() {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'studytracker.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // Read schema.sql
  // In development, it's relative to src. In production, we might need to bundle it or read from app.getAppPath()
  // Since we use electron-vite, let's locate schema.sql relative to __dirname.
  // Actually, a simpler way is just to execute the statements directly.
  const schemaPath = path.join(__dirname, '../../src/db/schema.sql')
  
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8')
    db.exec(schema)
    console.log('Database initialized successfully at', dbPath)
  } catch (error) {
    console.error('Failed to read schema.sql', error)
    // Fallback if bundled path is different
    try {
      const fallbackPath = path.join(app.getAppPath(), 'src/db/schema.sql')
      const schema = fs.readFileSync(fallbackPath, 'utf8')
      db.exec(schema)
      console.log('Database initialized via fallback at', fallbackPath)
    } catch (e) {
      console.error('Database schema could not be loaded.')
    }
  }

  return db
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB first.')
  }
  return db
}
