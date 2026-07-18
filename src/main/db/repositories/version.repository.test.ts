import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { taskRepository } from './task.repository'
import { fileRepository } from './file.repository'
import { versionRepository } from './version.repository'

let db: Database.Database
let fileId: string

beforeEach(() => {
  db = createTestDb()
  const taskId = taskRepository.create({ name: 'T' }).id
  fileId = fileRepository.create({ taskId, filename: 'a.md', content: 'v1' }).id
})

afterEach(() => {
  closeTestDb(db)
})

describe('versionRepository', () => {
  it('auto-labels sequential versions vN when no label given', () => {
    expect(versionRepository.create(fileId, 'a').label).toBe('v1')
    expect(versionRepository.create(fileId, 'b').label).toBe('v2')
    expect(versionRepository.create(fileId, 'c').label).toBe('v3')
  })

  it('respects an explicit label', () => {
    expect(versionRepository.create(fileId, 'a', 'Initial').label).toBe('Initial')
  })

  it('orders newest-first even when created within the same second', () => {
    versionRepository.create(fileId, 'first', 'first')
    versionRepository.create(fileId, 'second', 'second')
    versionRepository.create(fileId, 'third', 'third')

    const versions = versionRepository.findByFile(fileId)
    expect(versions.map((v) => v.label)).toEqual(['third', 'second', 'first'])
  })

  it('getLatest returns the most recent version', () => {
    versionRepository.create(fileId, 'old', 'old')
    versionRepository.create(fileId, 'new', 'new')
    expect(versionRepository.getLatest(fileId)?.label).toBe('new')
  })

  it('getLatest returns null when a file has no versions', () => {
    const taskId = taskRepository.create({ name: 'T2' }).id
    const empty = fileRepository.create({ taskId, filename: 'e.md', content: '' }).id
    expect(versionRepository.getLatest(empty)).toBeNull()
  })
})
