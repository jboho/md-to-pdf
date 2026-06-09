import crypto from 'node:crypto'
import { getDb } from '../database'
import type { FileVersion } from '../../../preload/types'

interface VersionRow {
  id: string
  file_id: string
  content: string
  label: string
  created_at: string
}

function rowToVersion(row: VersionRow): FileVersion {
  return {
    id: row.id,
    fileId: row.file_id,
    content: row.content,
    label: row.label,
    createdAt: row.created_at
  }
}

export const versionRepository = {
  findByFile(fileId: string): FileVersion[] {
    const db = getDb()
    const rows = db
      .prepare('SELECT * FROM file_versions WHERE file_id = ? ORDER BY created_at DESC')
      .all(fileId) as VersionRow[]
    return rows.map(rowToVersion)
  },

  findById(id: string): FileVersion | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM file_versions WHERE id = ?').get(id) as
      | VersionRow
      | undefined
    return row ? rowToVersion(row) : null
  },

  create(fileId: string, content: string, label?: string): FileVersion {
    const db = getDb()
    const id = crypto.randomUUID()

    const count = db
      .prepare('SELECT COUNT(*) AS count FROM file_versions WHERE file_id = ?')
      .get(fileId) as { count: number }

    const autoLabel = label ?? `v${count.count + 1}`

    db.prepare(
      `INSERT INTO file_versions (id, file_id, content, label)
       VALUES (?, ?, ?, ?)`
    ).run(id, fileId, content, autoLabel)

    return this.findById(id)!
  },

  getLatest(fileId: string): FileVersion | null {
    const db = getDb()
    const row = db
      .prepare('SELECT * FROM file_versions WHERE file_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(fileId) as VersionRow | undefined
    return row ? rowToVersion(row) : null
  }
}
