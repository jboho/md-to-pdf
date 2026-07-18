import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { taskRepository } from './task.repository'
import { fileRepository } from './file.repository'

let db: Database.Database

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('taskRepository', () => {
  it('creates a task with defaults', () => {
    const task = taskRepository.create({ name: 'Report' })
    expect(task.name).toBe('Report')
    expect(task.status).toBe('active')
    expect(task.theme).toBe('github')
    expect(task.pageSize).toBe('A4')
    expect(task.description).toBe('')
    expect(task.fileCount).toBe(0)
  })

  it('honors provided create input', () => {
    const task = taskRepository.create({
      name: 'Thesis',
      description: 'PhD',
      theme: 'academic',
      pageSize: 'Letter'
    })
    expect(task.description).toBe('PhD')
    expect(task.theme).toBe('academic')
    expect(task.pageSize).toBe('Letter')
  })

  it('finds by id and returns null for missing', () => {
    const task = taskRepository.create({ name: 'X' })
    expect(taskRepository.findById(task.id)?.name).toBe('X')
    expect(taskRepository.findById('nope')).toBeNull()
  })

  it('updates only supplied fields', () => {
    const task = taskRepository.create({ name: 'X' })
    const updated = taskRepository.update(task.id, { marginTop: 10, theme: 'minimal' })
    expect(updated.marginTop).toBe(10)
    expect(updated.theme).toBe('minimal')
    expect(updated.name).toBe('X')
  })

  it('aggregates file counts by status', () => {
    const task = taskRepository.create({ name: 'Batch' })
    const a = fileRepository.create({ taskId: task.id, filename: 'a.md', content: '' })
    const b = fileRepository.create({ taskId: task.id, filename: 'b.md', content: '' })
    fileRepository.create({ taskId: task.id, filename: 'c.md', content: '' })
    fileRepository.setStatus(a.id, 'converted')
    fileRepository.setStatus(b.id, 'ready')

    const found = taskRepository.findById(task.id)!
    expect(found.fileCount).toBe(3)
    expect(found.convertedCount).toBe(1)
    expect(found.readyCount).toBe(1)
  })

  it('lists tasks ordered by updated_at desc', () => {
    const older = taskRepository.create({ name: 'older' })
    const newer = taskRepository.create({ name: 'newer' })
    // datetime('now') is second-precision, so pin explicit timestamps to make
    // ordering deterministic rather than relying on sub-second creation gaps.
    db.prepare('UPDATE tasks SET updated_at = ? WHERE id = ?').run('2020-01-01 00:00:00', older.id)
    db.prepare('UPDATE tasks SET updated_at = ? WHERE id = ?').run('2020-06-01 00:00:00', newer.id)

    const all = taskRepository.findAll()
    expect(all).toHaveLength(2)
    expect(all[0].name).toBe('newer')
    expect(all[1].name).toBe('older')
  })

  it('setComplete marks status completed', () => {
    const task = taskRepository.create({ name: 'X' })
    expect(taskRepository.setComplete(task.id).status).toBe('completed')
  })

  it('cascade-deletes files when task is deleted', () => {
    const task = taskRepository.create({ name: 'X' })
    fileRepository.create({ taskId: task.id, filename: 'a.md', content: '' })
    taskRepository.delete(task.id)
    expect(taskRepository.findById(task.id)).toBeNull()
    expect(fileRepository.findByTask(task.id)).toHaveLength(0)
  })
})
