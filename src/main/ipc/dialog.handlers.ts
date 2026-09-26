import { app, ipcMain, dialog } from 'electron'

// Since Electron 43 a dialog without defaultPath opens in Downloads and the OS
// no longer restores the last folder, so remember it for the session.
let lastOutputDir: string | undefined

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:select-output-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select PDF Output Directory',
      defaultPath: lastOutputDir ?? app.getPath('documents')
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    lastOutputDir = result.filePaths[0]
    return result.filePaths[0]
  })
}
