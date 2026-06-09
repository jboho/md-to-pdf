import { ipcMain } from 'electron'
import type { ThemeName } from '../../preload/types'
import { getThemeCss, getThemeNames } from '../pdf/themes'

export function registerStyleHandlers(): void {
  ipcMain.handle('style:get-theme-css', async (_event, theme: ThemeName) => {
    return getThemeCss(theme)
  })

  ipcMain.handle('style:list-themes', async () => {
    return getThemeNames()
  })
}
