import Database from 'better-sqlite3'
import { setDbInstance, runMigrations } from '../../src/main/db/database'

export function createTestDb(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  setDbInstance(db)
  return db
}

export function closeTestDb(db: Database.Database): void {
  setDbInstance(null)
  db.close()
}
