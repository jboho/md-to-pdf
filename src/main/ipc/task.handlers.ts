import { ipcMain } from 'electron'
import path from 'node:path'
import { taskRepository } from '../db/repositories/task.repository'
import type { CreateTaskInput, UpdateTaskInput } from '../../preload/types'

export function registerTaskHandlers(): void {
  ipcMain.handle('task:list', async () => {
    return taskRepository.findAll()
  })

  ipcMain.handle('task:get', async (_event, id: string) => {
    return taskRepository.findById(id)
  })

  ipcMain.handle('task:create', async (_event, input: CreateTaskInput) => {
    return taskRepository.create(input)
  })

  ipcMain.handle('task:update', async (_event, id: string, input: UpdateTaskInput) => {
    if (input.outputDir && !path.isAbsolute(input.outputDir)) {
      throw new Error('Output folder must be an absolute path')
    }
    return taskRepository.update(id, input)
  })

  ipcMain.handle('task:delete', async (_event, id: string) => {
    taskRepository.delete(id)
  })

  ipcMain.handle('task:set-complete', async (_event, id: string) => {
    return taskRepository.setComplete(id)
  })
}
