import crypto from 'node:crypto'
import { getDb } from '../database'
import type { Feedback, FeedbackCategory } from '../../../preload/types'

interface FeedbackRow {
  id: string
  category: FeedbackCategory
  message: string
  app_version: string
  platform: string
  submitted_to_github: number
  created_at: string
}

interface CreateFeedbackRow {
  category: FeedbackCategory
  message: string
  appVersion: string
  platform: string
}

function rowToFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    category: row.category,
    message: row.message,
    appVersion: row.app_version,
    platform: row.platform,
    submittedToGithub: row.submitted_to_github === 1,
    createdAt: row.created_at
  }
}

export const feedbackRepository = {
  findAll(): Feedback[] {
    const db = getDb()
    const rows = db
      .prepare('SELECT * FROM feedback ORDER BY created_at DESC')
      .all() as FeedbackRow[]
    return rows.map(rowToFeedback)
  },

  findById(id: string): Feedback | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id) as
      | FeedbackRow
      | undefined
    return row ? rowToFeedback(row) : null
  },

  create(input: CreateFeedbackRow): Feedback {
    const db = getDb()
    const id = crypto.randomUUID()
    db.prepare(
      'INSERT INTO feedback (id, category, message, app_version, platform) VALUES (?, ?, ?, ?, ?)'
    ).run(id, input.category, input.message, input.appVersion, input.platform)
    return this.findById(id)!
  },

  markSubmitted(id: string): Feedback {
    const db = getDb()
    db.prepare('UPDATE feedback SET submitted_to_github = 1 WHERE id = ?').run(id)
    return this.findById(id)!
  }
}
