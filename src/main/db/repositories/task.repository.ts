import crypto from 'node:crypto'
import { getDb } from '../database'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../../preload/types'

interface TaskRow {
  id: string
  name: string
  description: string
  status: string
  custom_css: string
  theme: string
  page_size: string
  margin_top: number
  margin_right: number
  margin_bottom: number
  margin_left: number
  output_dir: string
  created_at: string
  updated_at: string
  file_count?: number
  converted_count?: number
  ready_count?: number
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as Task['status'],
    customCss: row.custom_css,
    theme: row.theme as Task['theme'],
    pageSize: row.page_size as Task['pageSize'],
    marginTop: row.margin_top,
    marginRight: row.margin_right,
    marginBottom: row.margin_bottom,
    marginLeft: row.margin_left,
    outputDir: row.output_dir,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fileCount: row.file_count ?? 0,
    convertedCount: row.converted_count ?? 0,
    readyCount: row.ready_count ?? 0
  }
}

export const taskRepository = {
  findAll(): Task[] {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT t.*,
          COUNT(f.id) AS file_count,
          SUM(CASE WHEN f.status = 'converted' THEN 1 ELSE 0 END) AS converted_count,
          SUM(CASE WHEN f.status = 'ready' THEN 1 ELSE 0 END) AS ready_count
        FROM tasks t
        LEFT JOIN files f ON f.task_id = t.id
        GROUP BY t.id
        ORDER BY t.updated_at DESC`
      )
      .all() as TaskRow[]
    return rows.map(rowToTask)
  },

  findById(id: string): Task | null {
    const db = getDb()
    const row = db
      .prepare(
        `SELECT t.*,
          COUNT(f.id) AS file_count,
          SUM(CASE WHEN f.status = 'converted' THEN 1 ELSE 0 END) AS converted_count,
          SUM(CASE WHEN f.status = 'ready' THEN 1 ELSE 0 END) AS ready_count
        FROM tasks t
        LEFT JOIN files f ON f.task_id = t.id
        WHERE t.id = ?
        GROUP BY t.id`
      )
      .get(id) as TaskRow | undefined
    return row ? rowToTask(row) : null
  },

  create(input: CreateTaskInput): Task {
    const db = getDb()
    const id = crypto.randomUUID()
    db.prepare(
      `INSERT INTO tasks (id, name, description, theme, page_size)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, input.name, input.description ?? '', input.theme ?? 'github', input.pageSize ?? 'A4')
    return this.findById(id)!
  },

  update(id: string, input: UpdateTaskInput): Task {
    const db = getDb()
    const sets: string[] = []
    const values: unknown[] = []

    if (input.name !== undefined) {
      sets.push('name = ?')
      values.push(input.name)
    }
    if (input.description !== undefined) {
      sets.push('description = ?')
      values.push(input.description)
    }
    if (input.status !== undefined) {
      sets.push('status = ?')
      values.push(input.status)
    }
    if (input.customCss !== undefined) {
      sets.push('custom_css = ?')
      values.push(input.customCss)
    }
    if (input.theme !== undefined) {
      sets.push('theme = ?')
      values.push(input.theme)
    }
    if (input.pageSize !== undefined) {
      sets.push('page_size = ?')
      values.push(input.pageSize)
    }
    if (input.marginTop !== undefined) {
      sets.push('margin_top = ?')
      values.push(input.marginTop)
    }
    if (input.marginRight !== undefined) {
      sets.push('margin_right = ?')
      values.push(input.marginRight)
    }
    if (input.marginBottom !== undefined) {
      sets.push('margin_bottom = ?')
      values.push(input.marginBottom)
    }
    if (input.marginLeft !== undefined) {
      sets.push('margin_left = ?')
      values.push(input.marginLeft)
    }
    if (input.outputDir !== undefined) {
      sets.push('output_dir = ?')
      values.push(input.outputDir)
    }

    if (sets.length > 0) {
      sets.push("updated_at = datetime('now')")
      values.push(id)
      db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    }

    return this.findById(id)!
  },

  delete(id: string): void {
    const db = getDb()
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  },

  setComplete(id: string): Task {
    return this.update(id, { status: 'completed' })
  }
}
