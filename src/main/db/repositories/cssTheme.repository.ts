import crypto from 'node:crypto'
import { getDb } from '../database'
import type { CssTheme } from '../../../preload/types'

interface CssThemeRow {
  id: string
  name: string
  css: string
  created_at: string
  updated_at: string
}

function rowToTheme(row: CssThemeRow): CssTheme {
  return {
    id: row.id,
    name: row.name,
    css: row.css,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const cssThemeRepository = {
  findAll(): CssTheme[] {
    const db = getDb()
    const rows = db
      .prepare('SELECT * FROM css_themes ORDER BY name ASC')
      .all() as CssThemeRow[]
    return rows.map(rowToTheme)
  },

  findById(id: string): CssTheme | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM css_themes WHERE id = ?').get(id) as
      | CssThemeRow
      | undefined
    return row ? rowToTheme(row) : null
  },

  create(name: string, css: string): CssTheme {
    const db = getDb()
    const id = crypto.randomUUID()
    db.prepare('INSERT INTO css_themes (id, name, css) VALUES (?, ?, ?)').run(id, name, css)
    return this.findById(id)!
  },

  update(id: string, name: string, css: string): CssTheme {
    const db = getDb()
    db.prepare(
      "UPDATE css_themes SET name = ?, css = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(name, css, id)
    return this.findById(id)!
  },

  delete(id: string): void {
    const db = getDb()
    db.prepare('DELETE FROM css_themes WHERE id = ?').run(id)
  }
}
