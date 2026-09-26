import { BrowserWindow, app, screen, session, type Session } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { buildHtml } from './html-builder'
import { pdfFilenameFor, safePathSegment } from './output-path'
import { fileRepository } from '../db/repositories/file.repository'
import { taskRepository } from '../db/repositories/task.repository'
import type { Task, TaskFile, BatchProgress, PdfFileProgress } from '../../preload/types'

let hiddenWindow: BrowserWindow | null = null
let renderSession: Session | null = null
const activeBatches = new Map<string, { cancelled: boolean }>()

// Converted markdown can carry raw HTML (e.g. a meta refresh). The renderer
// gets its own in-memory session that refuses every request that isn't a local
// file or inline data, so conversion stays offline whatever the document says.
function getRenderSession(): Session {
  if (!renderSession) {
    renderSession = session.fromPartition('pdf-render')
    renderSession.webRequest.onBeforeRequest((details, callback) => {
      callback({ cancel: !/^(file|data):/i.test(details.url) })
    })
    renderSession.setPermissionRequestHandler((_contents, _permission, callback) => {
      callback(false)
    })
  }
  return renderSession
}

export function getHiddenWindow(): BrowserWindow {
  if (!hiddenWindow || hiddenWindow.isDestroyed()) {
    hiddenWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        // Electron 42 changed the offscreen default from the primary display's
        // scale factor to a fixed 1.0. Pin the old value so PDFs render (images
        // and any resolution-dependent CSS) the same as before the upgrade.
        offscreen: { deviceScaleFactor: screen.getPrimaryDisplay().scaleFactor },
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true,
        session: getRenderSession()
      }
    })
  }
  return hiddenWindow
}

function getOutputDir(task: Task): string {
  if (task.outputDir) return task.outputDir
  return path.join(app.getPath('documents'), 'MD to PDF', safePathSegment(task.name, 'Untitled'))
}

async function generateSinglePdf(
  file: TaskFile,
  task: Task,
  themeCss: string
): Promise<string> {
  const win = getHiddenWindow()
  const html = buildHtml(file.content, themeCss, task.customCss)

  const tmpPath = path.join(app.getPath('temp'), `md-to-pdf-${file.id}.html`)
  fs.writeFileSync(tmpPath, html, 'utf-8')

  await win.loadFile(tmpPath)

  const pdfBuffer = await win.webContents.printToPDF({
    landscape: false,
    displayHeaderFooter: false,
    printBackground: true,
    pageSize: task.pageSize as Electron.PrintToPDFOptions['pageSize'],
    margins: {
      top: task.marginTop / 25.4,
      bottom: task.marginBottom / 25.4,
      left: task.marginLeft / 25.4,
      right: task.marginRight / 25.4
    }
  })

  // Clean up temp file
  try {
    fs.unlinkSync(tmpPath)
  } catch {
    // Ignore cleanup errors
  }

  const outputDir = getOutputDir(task)
  fs.mkdirSync(outputDir, { recursive: true })

  const outputPath = path.join(outputDir, pdfFilenameFor(file.filename))
  fs.writeFileSync(outputPath, pdfBuffer)

  return outputPath
}

export async function generatePdf(
  file: TaskFile,
  task: Task,
  themeCss: string
): Promise<string> {
  fileRepository.setStatus(file.id, 'converting')
  try {
    const outputPath = await generateSinglePdf(file, task, themeCss)
    fileRepository.setStatus(file.id, 'converted')
    if (!task.outputDir) {
      taskRepository.update(task.id, { outputDir: getOutputDir(task) })
    }
    return outputPath
  } catch (err) {
    fileRepository.setStatus(file.id, 'error')
    throw err
  }
}

export type FileRenderer = (file: TaskFile, task: Task, themeCss: string) => Promise<string>

export async function generateBatch(
  task: Task,
  readyFiles: TaskFile[],
  themeCss: string,
  mainWindow: BrowserWindow,
  renderFile: FileRenderer = generateSinglePdf
): Promise<void> {
  const batchState = { cancelled: false }
  activeBatches.set(task.id, batchState)

  const fileProgresses: PdfFileProgress[] = readyFiles.map((f) => ({
    fileId: f.id,
    filename: f.filename,
    status: 'pending' as const
  }))

  const sendProgress = (): void => {
    const progress: BatchProgress = {
      taskId: task.id,
      total: readyFiles.length,
      completed: fileProgresses.filter((p) => p.status === 'done').length,
      currentFile: fileProgresses.find((p) => p.status === 'generating')?.filename ?? '',
      files: fileProgresses
    }
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pdf:batch-progress', progress)
    }
  }

  for (let i = 0; i < readyFiles.length; i++) {
    if (batchState.cancelled) break

    fileProgresses[i].status = 'generating'
    sendProgress()

    try {
      fileRepository.setStatus(readyFiles[i].id, 'converting')
      await renderFile(readyFiles[i], task, themeCss)
      fileRepository.setStatus(readyFiles[i].id, 'converted')
      fileProgresses[i].status = 'done'
    } catch (err) {
      fileProgresses[i].status = 'error'
      fileProgresses[i].error = err instanceof Error ? err.message : String(err)
      fileRepository.setStatus(readyFiles[i].id, 'error')
    }

    sendProgress()
  }

  activeBatches.delete(task.id)

  if (!task.outputDir) {
    taskRepository.update(task.id, { outputDir: getOutputDir(task) })
  }

  // Check if all files in the task are converted
  const allFiles = fileRepository.findByTask(task.id)
  const allConverted = allFiles.every((f) => f.status === 'converted')
  if (allConverted && allFiles.length > 0) {
    taskRepository.setComplete(task.id)
  }

  // Send final progress
  sendProgress()
}

export function cancelBatch(taskId: string): void {
  const batch = activeBatches.get(taskId)
  if (batch) batch.cancelled = true
}

export function destroyHiddenWindow(): void {
  if (hiddenWindow && !hiddenWindow.isDestroyed()) {
    hiddenWindow.destroy()
    hiddenWindow = null
  }
}
