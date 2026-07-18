import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import type { BrowserWindow } from 'electron'
import { createTestDb, closeTestDb } from '../../../test/helpers/db'
import { generateBatch, cancelBatch } from './generator'
import { taskRepository } from '../db/repositories/task.repository'
import { fileRepository } from '../db/repositories/file.repository'
import type { Task, TaskFile, BatchProgress } from '../../preload/types'

let db: Database.Database

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

function seedReadyTask(fileCount: number): { task: Task; readyFiles: TaskFile[] } {
  const task = taskRepository.create({ name: 'Batch' })
  const files: TaskFile[] = []
  for (let i = 0; i < fileCount; i++) {
    const f = fileRepository.create({ taskId: task.id, filename: `doc${i}.md`, content: `# ${i}` })
    files.push(fileRepository.setStatus(f.id, 'ready'))
  }
  return { task: taskRepository.findById(task.id)!, readyFiles: files }
}

function makeWindow(events: BatchProgress[]): BrowserWindow {
  return {
    isDestroyed: () => false,
    webContents: {
      send: (_channel: string, progress: BatchProgress) => {
        events.push(structuredClone(progress))
      }
    }
  } as unknown as BrowserWindow
}

describe('generateBatch', () => {
  it('converts every ready file and completes the task', async () => {
    const { task, readyFiles } = seedReadyTask(3)
    const events: BatchProgress[] = []
    const rendered: string[] = []
    const renderer = async (file: TaskFile): Promise<string> => {
      rendered.push(file.id)
      return `/out/${file.filename}.pdf`
    }

    await generateBatch(task, readyFiles, '', makeWindow(events), renderer)

    expect(rendered).toHaveLength(3)
    const files = fileRepository.findByTask(task.id)
    expect(files.every((f) => f.status === 'converted')).toBe(true)
    expect(taskRepository.findById(task.id)?.status).toBe('completed')
    expect(taskRepository.findById(task.id)?.outputDir).not.toBe('')
  })

  it('emits progress with a monotonic completed count ending at total', async () => {
    const { task, readyFiles } = seedReadyTask(3)
    const events: BatchProgress[] = []
    const renderer = async (f: TaskFile): Promise<string> => `/out/${f.filename}`

    await generateBatch(task, readyFiles, '', makeWindow(events), renderer)

    expect(events.length).toBeGreaterThan(0)
    const completed = events.map((e) => e.completed)
    for (let i = 1; i < completed.length; i++) {
      expect(completed[i]).toBeGreaterThanOrEqual(completed[i - 1])
    }
    const last = events[events.length - 1]
    expect(last.total).toBe(3)
    expect(last.completed).toBe(3)
  })

  it('marks a failed file as error without completing the task', async () => {
    const { task, readyFiles } = seedReadyTask(3)
    const events: BatchProgress[] = []
    const renderer = async (file: TaskFile): Promise<string> => {
      if (file.filename === 'doc1.md') throw new Error('render boom')
      return `/out/${file.filename}`
    }

    await generateBatch(task, readyFiles, '', makeWindow(events), renderer)

    const byName = Object.fromEntries(
      fileRepository.findByTask(task.id).map((f) => [f.filename, f.status])
    )
    expect(byName['doc0.md']).toBe('converted')
    expect(byName['doc1.md']).toBe('error')
    expect(byName['doc2.md']).toBe('converted')
    expect(taskRepository.findById(task.id)?.status).not.toBe('completed')

    const last = events[events.length - 1]
    expect(last.files.find((f) => f.filename === 'doc1.md')?.error).toContain('render boom')
  })

  it('stops processing remaining files once cancelled', async () => {
    const { task, readyFiles } = seedReadyTask(3)
    const events: BatchProgress[] = []
    const rendered: string[] = []
    const renderer = async (file: TaskFile): Promise<string> => {
      rendered.push(file.id)
      cancelBatch(task.id)
      return `/out/${file.filename}`
    }

    await generateBatch(task, readyFiles, '', makeWindow(events), renderer)

    expect(rendered).toHaveLength(1)
    const statuses = fileRepository.findByTask(task.id).map((f) => f.status)
    expect(statuses.filter((s) => s === 'converted')).toHaveLength(1)
    expect(statuses.filter((s) => s === 'ready')).toHaveLength(2)
    expect(taskRepository.findById(task.id)?.status).not.toBe('completed')
  })
})
