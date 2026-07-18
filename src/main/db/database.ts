import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'
import { migration001 } from './migrations/001_initial'
import { migration002 } from './migrations/002_css_themes'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'md-to-pdf.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    runMigrations(db)
  }
  return db
}

/**
 * Overrides the active database instance. Used by tests to inject an in-memory
 * database; production code never calls this.
 */
export function setDbInstance(instance: Database.Database | null): void {
  db = instance
}

export function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const applied = new Set(
    (database.prepare('SELECT name FROM _migrations').all() as { name: string }[]).map(
      (r) => r.name
    )
  )

  const migrations = [
    { name: '001_initial', sql: migration001 },
    { name: '002_css_themes', sql: migration002 }
  ]

  for (const m of migrations) {
    if (!applied.has(m.name)) {
      database.exec(m.sql)
      database.prepare('INSERT INTO _migrations (name) VALUES (?)').run(m.name)
    }
  }
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
