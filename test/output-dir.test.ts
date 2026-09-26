import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Database from 'better-sqlite3'
import { createTestDb, closeTestDb } from './helpers/db'
import { invokeHandler, clearHandlers, shell } from './mocks/electron'
import { registerTaskHandlers } from '../src/main/ipc/task.handlers'
import { registerPdfHandlers } from '../src/main/ipc/pdf.handlers'
import { taskRepository } from '../src/main/db/repositories/task.repository'

let db: Database.Database
let root: string
let taskId: string

beforeEach(() => {
  db = createTestDb()
  clearHandlers()
  registerTaskHandlers()
  registerPdfHandlers()
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'md-to-pdf-ipc-'))
  taskId = taskRepository.create({ name: 'T' }).id
})

afterEach(() => {
  closeTestDb(db)
  fs.rmSync(root, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('output folder IPC', () => {
  it('rejects a relative output folder', async () => {
    await expect(invokeHandler('task:update', taskId, { outputDir: '../elsewhere' })).rejects.toThrow(
      /absolute/
    )
  })

  it('accepts an absolute output folder and clearing it', async () => {
    await invokeHandler('task:update', taskId, { outputDir: root })
    expect(taskRepository.findById(taskId)!.outputDir).toBe(root)
    await invokeHandler('task:update', taskId, { outputDir: '' })
    expect(taskRepository.findById(taskId)!.outputDir).toBe('')
  })

  it('opens a real folder', async () => {
    const openPath = vi.spyOn(shell, 'openPath')
    taskRepository.update(taskId, { outputDir: root })
    await invokeHandler('pdf:open-output-dir', taskId)
    expect(openPath).toHaveBeenCalledWith(root)
  })

  it('never hands an app bundle to openPath', async () => {
    const openPath = vi.spyOn(shell, 'openPath')
    const bundle = path.join(root, 'Calculator.app')
    fs.mkdirSync(bundle)
    taskRepository.update(taskId, { outputDir: bundle })
    await expect(invokeHandler('pdf:open-output-dir', taskId)).rejects.toThrow(/not a folder/)
    expect(openPath).not.toHaveBeenCalled()
  })
})
