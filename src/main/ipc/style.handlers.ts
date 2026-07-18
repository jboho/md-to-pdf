import { ipcMain, app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import type { ThemeName } from '../../preload/types'
import { getThemeCss, getThemeNames } from '../pdf/themes'
import { cssThemeRepository } from '../db/repositories/cssTheme.repository'

export function registerStyleHandlers(): void {
  ipcMain.handle('style:get-theme-css', async (_event, theme: ThemeName) => {
    return getThemeCss(theme)
  })

  ipcMain.handle('style:list-themes', async () => {
    return getThemeNames()
  })

  ipcMain.handle('style:list-css-themes', async () => {
    return cssThemeRepository.findAll()
  })

  ipcMain.handle('style:create-css-theme', async (_event, name: string, css: string) => {
    if (!name.trim()) throw new Error('Theme name is required')
    return cssThemeRepository.create(name.trim(), css)
  })

  ipcMain.handle('style:update-css-theme', async (_event, id: string, name: string, css: string) => {
    if (!name.trim()) throw new Error('Theme name is required')
    return cssThemeRepository.update(id, name.trim(), css)
  })

  ipcMain.handle('style:delete-css-theme', async (_event, id: string) => {
    cssThemeRepository.delete(id)
  })

  ipcMain.handle('style:list-marketplace-themes', async () => {
    const marketplacePath = app.isPackaged
      ? path.join(process.resourcesPath, 'marketplace-themes.json')
      : path.join(app.getAppPath(), 'resources', 'marketplace-themes.json')
    try {
      const raw = fs.readFileSync(marketplacePath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return []
    }
  })
}
