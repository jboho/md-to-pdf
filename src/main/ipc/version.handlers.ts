import { ipcMain } from 'electron'
import { createPatch, structuredPatch } from 'diff'
import { versionRepository } from '../db/repositories/version.repository'
import { fileRepository } from '../db/repositories/file.repository'
import type { VersionDiff, DiffHunk, DiffLine } from '../../preload/types'

export function registerVersionHandlers(): void {
  ipcMain.handle('version:list-by-file', async (_event, fileId: string) => {
    return versionRepository.findByFile(fileId)
  })

  ipcMain.handle('version:get', async (_event, id: string) => {
    return versionRepository.findById(id)
  })

  ipcMain.handle('version:create', async (_event, fileId: string, label?: string) => {
    const file = fileRepository.findById(fileId)
    if (!file) throw new Error(`File not found: ${fileId}`)
    return versionRepository.create(fileId, file.content, label)
  })

  ipcMain.handle('version:diff', async (_event, fromId: string, toId: string) => {
    const fromVersion = versionRepository.findById(fromId)
    const toVersion = versionRepository.findById(toId)

    if (!fromVersion) throw new Error(`Version not found: ${fromId}`)
    if (!toVersion) throw new Error(`Version not found: ${toId}`)

    const patch = structuredPatch(
      fromVersion.label,
      toVersion.label,
      fromVersion.content,
      toVersion.content,
      undefined,
      undefined,
      { context: 3 }
    )

    const hunks: DiffHunk[] = patch.hunks.map((h) => ({
      oldStart: h.oldStart,
      oldLines: h.oldLines,
      newStart: h.newStart,
      newLines: h.newLines,
      lines: h.lines.map(
        (line): DiffLine => ({
          type: line.startsWith('+') ? 'add' : line.startsWith('-') ? 'remove' : 'context',
          content: line.substring(1)
        })
      )
    }))

    const result: VersionDiff = {
      fromVersionId: fromId,
      toVersionId: toId,
      hunks
    }

    return result
  })

  ipcMain.handle('version:restore', async (_event, versionId: string) => {
    const version = versionRepository.findById(versionId)
    if (!version) throw new Error(`Version not found: ${versionId}`)

    const file = fileRepository.update(version.fileId, { content: version.content })
    versionRepository.create(version.fileId, version.content, `Restored from ${version.label}`)
    return file
  })
}
