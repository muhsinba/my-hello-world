import 'server-only'

import Database from 'better-sqlite3'
import path from 'node:path'

// A single SQLite connection, reused across hot-reloads in dev.
// (Next.js re-evaluates modules on every change, so we cache on globalThis.)
const globalForDb = globalThis as unknown as { db?: Database.Database }

function createDb() {
  const db = new Database(path.join(process.cwd(), 'app.db'))
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS login_history (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      logged_in_at  TEXT    NOT NULL DEFAULT (datetime('now'),
      logged_out_at TEXT)
    );
  `)

  return db
}

export const db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== 'production') globalForDb.db = db

export type UserRow = {
  id: number
  name: string
  email: string
  password: string
  created_at: string
}

export type LoginHistoryRow = {
  id: number
  user_id: number
  logged_in_at: string
  logged_out_at: string | null
}
