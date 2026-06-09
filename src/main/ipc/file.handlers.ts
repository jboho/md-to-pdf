import { ipcMain, dialog } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileRepository } from '../db/repositories/file.repository'
import { versionRepository } from '../db/repositories/version.repository'
import type { CreateFileInput, UpdateFileInput, FileStatus } from '../../preload/types'

export function registerFileHandlers(): void {
  ipcMain.handle('file:list-by-task', async (_event, taskId: string) => {
    return fileRepository.findByTask(taskId)
  })

  ipcMain.handle('file:get', async (_event, id: string) => {
    return fileRepository.findById(id)
  })

  ipcMain.handle('file:create', async (_event, input: CreateFileInput) => {
    const file = fileRepository.create(input)
    // Create initial version
    versionRepository.create(file.id, file.content, 'Initial')
    return file
  })

  ipcMain.handle('file:create-many', async (_event, inputs: CreateFileInput[]) => {
    const files = fileRepository.createMany(inputs)
    for (const file of files) {
      versionRepository.create(file.id, file.content, 'Initial')
    }
    return files
  })

  ipcMain.handle('file:update', async (_event, id: string, input: UpdateFileInput) => {
    const file = fileRepository.update(id, input)

    // Create version if content changed
    if (input.content !== undefined) {
      const latest = versionRepository.getLatest(id)
      // Only create version if content actually differs from last version
      if (!latest || latest.content !== input.content) {
        versionRepository.create(id, input.content)
      }
    }

    return file
  })

  ipcMain.handle('file:delete', async (_event, id: string) => {
    fileRepository.delete(id)
  })

  ipcMain.handle('file:import-from-disk', async (_event, taskId: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return []
    }

    const inputs: CreateFileInput[] = result.filePaths.map((filePath) => ({
      taskId,
      filename: path.basename(filePath),
      content: fs.readFileSync(filePath, 'utf-8')
    }))

    const files = fileRepository.createMany(inputs)
    for (const file of files) {
      versionRepository.create(file.id, file.content, 'Initial')
    }
    return files
  })

  ipcMain.handle('file:set-status', async (_event, id: string, status: FileStatus) => {
    return fileRepository.setStatus(id, status)
  })
}
