import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { taskRepository } from './task.repository'
import { fileRepository } from './file.repository'
import { versionRepository } from './version.repository'

let db: Database.Database
let taskId: string

beforeEach(() => {
  db = createTestDb()
  taskId = taskRepository.create({ name: 'Batch' }).id
})

afterEach(() => {
  closeTestDb(db)
})

describe('fileRepository', () => {
  it('creates a file with draft status and incrementing sort order', () => {
    const a = fileRepository.create({ taskId, filename: 'a.md', content: 'A' })
    const b = fileRepository.create({ taskId, filename: 'b.md', content: 'B' })
    expect(a.status).toBe('draft')
    expect(a.sortOrder).toBe(0)
    expect(b.sortOrder).toBe(1)
  })

  it('createMany inserts multiple files preserving order', () => {
    const files = fileRepository.createMany([
      { taskId, filename: 'one.md', content: '1' },
      { taskId, filename: 'two.md', content: '2' },
      { taskId, filename: 'three.md', content: '3' }
    ])
    expect(files).toHaveLength(3)

    const listed = fileRepository.findByTask(taskId)
    expect(listed.map((f) => f.filename)).toEqual(['one.md', 'two.md', 'three.md'])
    expect(listed.map((f) => f.sortOrder)).toEqual([0, 1, 2])
  })

  it('findByTask returns only files for that task', () => {
    const otherTask = taskRepository.create({ name: 'Other' }).id
    fileRepository.create({ taskId, filename: 'mine.md', content: '' })
    fileRepository.create({ taskId: otherTask, filename: 'theirs.md', content: '' })
    expect(fileRepository.findByTask(taskId).map((f) => f.filename)).toEqual(['mine.md'])
  })

  it('updates content and filename', () => {
    const file = fileRepository.create({ taskId, filename: 'a.md', content: 'old' })
    const updated = fileRepository.update(file.id, { content: 'new', filename: 'b.md' })
    expect(updated.content).toBe('new')
    expect(updated.filename).toBe('b.md')
  })

  it('setStatus and setStatusBatch transition statuses', () => {
    const a = fileRepository.create({ taskId, filename: 'a.md', content: '' })
    const b = fileRepository.create({ taskId, filename: 'b.md', content: '' })
    fileRepository.setStatus(a.id, 'ready')
    expect(fileRepository.findById(a.id)?.status).toBe('ready')

    fileRepository.setStatus(b.id, 'ready')
    fileRepository.setStatusBatch(taskId, 'ready', 'converted')
    const listed = fileRepository.findByTask(taskId)
    expect(listed.every((f) => f.status === 'converted')).toBe(true)
  })

  it('cascade-deletes versions when a file is deleted', () => {
    const file = fileRepository.create({ taskId, filename: 'a.md', content: 'v1' })
    versionRepository.create(file.id, 'v1', 'Initial')
    fileRepository.delete(file.id)
    expect(fileRepository.findById(file.id)).toBeNull()
    expect(versionRepository.findByFile(file.id)).toHaveLength(0)
  })
})
