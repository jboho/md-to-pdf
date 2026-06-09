import crypto from 'node:crypto'
import { getDb } from '../database'
import type { TaskFile, CreateFileInput, UpdateFileInput, FileStatus } from '../../../preload/types'

interface FileRow {
  id: string
  task_id: string
  filename: string
  content: string
  status: string
  sort_order: number
  created_at: string
  updated_at: string
}

function rowToFile(row: FileRow): TaskFile {
  return {
    id: row.id,
    taskId: row.task_id,
    filename: row.filename,
    content: row.content,
    status: row.status as TaskFile['status'],
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const fileRepository = {
  findByTask(taskId: string): TaskFile[] {
    const db = getDb()
    const rows = db
      .prepare('SELECT * FROM files WHERE task_id = ? ORDER BY sort_order ASC, created_at ASC')
      .all(taskId) as FileRow[]
    return rows.map(rowToFile)
  },

  findById(id: string): TaskFile | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileRow | undefined
    return row ? rowToFile(row) : null
  },

  create(input: CreateFileInput): TaskFile {
    const db = getDb()
    const id = crypto.randomUUID()
    const maxOrder = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM files WHERE task_id = ?')
      .get(input.taskId) as { next: number }

    db.prepare(
      `INSERT INTO files (id, task_id, filename, content, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, input.taskId, input.filename, input.content, maxOrder.next)

    return this.findById(id)!
  },

  createMany(inputs: CreateFileInput[]): TaskFile[] {
    const db = getDb()
    const results: TaskFile[] = []
    const insertMany = db.transaction(() => {
      for (const input of inputs) {
        results.push(this.create(input))
      }
    })
    insertMany()
    return results
  },

  update(id: string, input: UpdateFileInput): TaskFile {
    const db = getDb()
    const sets: string[] = []
    const values: unknown[] = []

    if (input.content !== undefined) {
      sets.push('content = ?')
      values.push(input.content)
    }
    if (input.filename !== undefined) {
      sets.push('filename = ?')
      values.push(input.filename)
    }
    if (input.status !== undefined) {
      sets.push('status = ?')
      values.push(input.status)
    }
    if (input.sortOrder !== undefined) {
      sets.push('sort_order = ?')
      values.push(input.sortOrder)
    }

    if (sets.length > 0) {
      sets.push("updated_at = datetime('now')")
      values.push(id)
      db.prepare(`UPDATE files SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    }

    return this.findById(id)!
  },

  delete(id: string): void {
    const db = getDb()
    db.prepare('DELETE FROM files WHERE id = ?').run(id)
  },

  setStatus(id: string, status: FileStatus): TaskFile {
    return this.update(id, { status })
  },

  setStatusBatch(taskId: string, fromStatus: FileStatus, toStatus: FileStatus): void {
    const db = getDb()
    db.prepare('UPDATE files SET status = ?, updated_at = datetime(\'now\') WHERE task_id = ? AND status = ?').run(
      toStatus,
      taskId,
      fromStatus
    )
  }
}
