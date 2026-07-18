import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { createTestDb, closeTestDb } from './helpers/db'
import { invokeHandler, clearHandlers } from './mocks/electron'
import { registerFileHandlers } from '../src/main/ipc/file.handlers'
import { registerVersionHandlers } from '../src/main/ipc/version.handlers'
import { taskRepository } from '../src/main/db/repositories/task.repository'
import type { TaskFile, FileVersion, VersionDiff } from '../src/preload/types'

let db: Database.Database
let taskId: string

beforeEach(() => {
  db = createTestDb()
  clearHandlers()
  registerFileHandlers()
  registerVersionHandlers()
  taskId = taskRepository.create({ name: 'T' }).id
})

afterEach(() => {
  closeTestDb(db)
})

describe('version tracking flow', () => {
  it('creates an Initial version when a file is created', async () => {
    const file = await invokeHandler<TaskFile>('file:create', {
      taskId,
      filename: 'a.md',
      content: '# Hello'
    })
    const versions = await invokeHandler<FileVersion[]>('version:list-by-file', file.id)
    expect(versions).toHaveLength(1)
    expect(versions[0].label).toBe('Initial')
    expect(versions[0].content).toBe('# Hello')
  })

  it('creates a new version only when content actually changes', async () => {
    const file = await invokeHandler<TaskFile>('file:create', {
      taskId,
      filename: 'a.md',
      content: 'v1'
    })

    await invokeHandler('file:update', file.id, { content: 'v2' })
    await invokeHandler('file:update', file.id, { content: 'v2' }) // no-op, same content
    await invokeHandler('file:update', file.id, { content: 'v3' })

    const versions = await invokeHandler<FileVersion[]>('version:list-by-file', file.id)
    expect(versions.map((v) => v.content)).toEqual(['v3', 'v2', 'v1'])
  })

  it('does not create a version when only status changes', async () => {
    const file = await invokeHandler<TaskFile>('file:create', {
      taskId,
      filename: 'a.md',
      content: 'v1'
    })
    await invokeHandler('file:update', file.id, { status: 'ready' })
    const versions = await invokeHandler<FileVersion[]>('version:list-by-file', file.id)
    expect(versions).toHaveLength(1)
  })

  it('diffs two versions into add/remove/context lines', async () => {
    const file = await invokeHandler<TaskFile>('file:create', {
      taskId,
      filename: 'a.md',
      content: 'line one\nline two\n'
    })
    await invokeHandler('file:update', file.id, { content: 'line one\nline changed\n' })

    const versions = await invokeHandler<FileVersion[]>('version:list-by-file', file.id)
    const [newer, older] = versions
    const diff = await invokeHandler<VersionDiff>('version:diff', older.id, newer.id)

    const types = diff.hunks.flatMap((h) => h.lines.map((l) => l.type))
    expect(types).toContain('add')
    expect(types).toContain('remove')
    expect(types).toContain('context')
  })

  it('restores an older version and records the restore as a new version', async () => {
    const file = await invokeHandler<TaskFile>('file:create', {
      taskId,
      filename: 'a.md',
      content: 'original'
    })
    await invokeHandler('file:update', file.id, { content: 'edited' })

    const before = await invokeHandler<FileVersion[]>('version:list-by-file', file.id)
    const initial = before.find((v) => v.label === 'Initial')!

    const restored = await invokeHandler<TaskFile>('version:restore', initial.id)
    expect(restored.content).toBe('original')

    const after = await invokeHandler<FileVersion[]>('version:list-by-file', file.id)
    expect(after.length).toBe(before.length + 1)
    expect(after[0].content).toBe('original')
    expect(after[0].label).toContain('Restored')
  })
})
