import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Auto-update is intentionally disabled until distribution is settled. The
// repo is private, so electron-updater 404s against the GitHub Releases feed
// with no token; 1.0.1 ships as a manually distributed DMG. Re-enable by
// removing this guard once the repo is public or the feed is authenticated.
const AUTO_UPDATE_ENABLED = false

export function initAutoUpdater(): void {
  if (!AUTO_UPDATE_ENABLED) return
  if (!app.isPackaged) return

  autoUpdater.on('update-available', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update available',
        message: `A new version (${info.version}) of MD to PDF is available.`,
        detail: 'Download it now? It will install the next time you quit the app.',
        buttons: ['Download', 'Not now'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate().catch((err) => {
            console.error('[updater] download failed:', err)
          })
        }
      })
  })

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: 'The update has been downloaded.',
        detail: 'Restart now to install it, or it will install automatically on quit.',
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] error checking for updates:', err)
  })

  checkForUpdates()
}

export function checkForUpdates(): void {
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[updater] checkForUpdates failed:', err)
  })
}
