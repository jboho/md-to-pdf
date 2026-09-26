import { ipcMain, BrowserWindow, shell, dialog, app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileRepository } from '../db/repositories/file.repository'
import { taskRepository } from '../db/repositories/task.repository'
import { getThemeCss } from '../pdf/themes'
import { generatePdf, generateBatch, cancelBatch, getHiddenWindow } from '../pdf/generator'
import { buildHtml } from '../pdf/html-builder'
import { isOpenableDirectory } from '../pdf/output-path'
import type { QuickConvertInput } from '../../preload/types'

export function registerPdfHandlers(): void {
  ipcMain.handle('pdf:generate-single', async (_event, fileId: string) => {
    const file = fileRepository.findById(fileId)
    if (!file) throw new Error(`File not found: ${fileId}`)

    const task = taskRepository.findById(file.taskId)
    if (!task) throw new Error(`Task not found: ${file.taskId}`)

    const themeCss = getThemeCss(task.theme)
    return generatePdf(file, task, themeCss)
  })

  ipcMain.handle('pdf:generate-batch', async (_event, taskId: string) => {
    const task = taskRepository.findById(taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)

    const files = fileRepository.findByTask(taskId)
    const readyFiles = files.filter((f) => f.status === 'ready')

    if (readyFiles.length === 0) {
      throw new Error('No files are ready for conversion')
    }

    const themeCss = getThemeCss(task.theme)
    const mainWindow = BrowserWindow.getAllWindows()[0]

    await generateBatch(task, readyFiles, themeCss, mainWindow)
  })

  ipcMain.handle('pdf:cancel-batch', async (_event, taskId: string) => {
    cancelBatch(taskId)
  })

  ipcMain.handle('pdf:open-output-dir', async (_event, taskId: string) => {
    const task = taskRepository.findById(taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)
    if (!task.outputDir) return
    // outputDir arrives from the renderer; never let openPath launch an app or file.
    if (!isOpenableDirectory(task.outputDir)) {
      throw new Error(`Output folder is missing or not a folder: ${task.outputDir}`)
    }
    const error = await shell.openPath(task.outputDir)
    if (error) throw new Error(error)
  })

  ipcMain.handle('pdf:quick-convert', async (_event, input: QuickConvertInput) => {
    const themeCss = getThemeCss(input.theme)
    const html = buildHtml(input.markdown, themeCss, input.customCss)

    const win = getHiddenWindow()
    const tmpPath = path.join(app.getPath('temp'), `md-to-pdf-quick-${Date.now()}.html`)
    fs.writeFileSync(tmpPath, html, 'utf-8')

    await win.loadFile(tmpPath)

    const pdfBuffer = await win.webContents.printToPDF({
      landscape: false,
      displayHeaderFooter: false,
      printBackground: true,
      pageSize: input.pageSize as Electron.PrintToPDFOptions['pageSize'],
      margins: {
        top: input.marginTop / 25.4,
        bottom: input.marginBottom / 25.4,
        left: input.marginLeft / 25.4,
        right: input.marginRight / 25.4
      }
    })

    try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }

    const result = await dialog.showSaveDialog({
      title: 'Save PDF',
      defaultPath: path.join(app.getPath('documents'), 'document.pdf'),
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    fs.writeFileSync(result.filePath, pdfBuffer)
    return result.filePath
  })
}
