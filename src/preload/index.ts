import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, BatchProgress } from './types'

const api: ElectronAPI = {
  task: {
    list: () => ipcRenderer.invoke('task:list'),
    get: (id) => ipcRenderer.invoke('task:get', id),
    create: (input) => ipcRenderer.invoke('task:create', input),
    update: (id, input) => ipcRenderer.invoke('task:update', id, input),
    delete: (id) => ipcRenderer.invoke('task:delete', id),
    setComplete: (id) => ipcRenderer.invoke('task:set-complete', id)
  },

  file: {
    listByTask: (taskId) => ipcRenderer.invoke('file:list-by-task', taskId),
    get: (id) => ipcRenderer.invoke('file:get', id),
    create: (input) => ipcRenderer.invoke('file:create', input),
    createMany: (inputs) => ipcRenderer.invoke('file:create-many', inputs),
    update: (id, input) => ipcRenderer.invoke('file:update', id, input),
    delete: (id) => ipcRenderer.invoke('file:delete', id),
    importFromDisk: (taskId) => ipcRenderer.invoke('file:import-from-disk', taskId),
    setStatus: (id, status) => ipcRenderer.invoke('file:set-status', id, status)
  },

  version: {
    listByFile: (fileId) => ipcRenderer.invoke('version:list-by-file', fileId),
    get: (id) => ipcRenderer.invoke('version:get', id),
    create: (fileId, label) => ipcRenderer.invoke('version:create', fileId, label),
    diff: (fromId, toId) => ipcRenderer.invoke('version:diff', fromId, toId),
    restore: (versionId) => ipcRenderer.invoke('version:restore', versionId)
  },

  style: {
    getThemeCss: (theme) => ipcRenderer.invoke('style:get-theme-css', theme),
    listThemes: () => ipcRenderer.invoke('style:list-themes'),
    listCssThemes: () => ipcRenderer.invoke('style:list-css-themes'),
    createCssTheme: (name, css) => ipcRenderer.invoke('style:create-css-theme', name, css),
    updateCssTheme: (id, name, css) =>
      ipcRenderer.invoke('style:update-css-theme', id, name, css),
    deleteCssTheme: (id) => ipcRenderer.invoke('style:delete-css-theme', id),
    listMarketplaceThemes: () => ipcRenderer.invoke('style:list-marketplace-themes')
  },

  pdf: {
    generateSingle: (fileId) => ipcRenderer.invoke('pdf:generate-single', fileId),
    generateBatch: (taskId) => ipcRenderer.invoke('pdf:generate-batch', taskId),
    onBatchProgress: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: BatchProgress): void => {
        callback(progress)
      }
      ipcRenderer.on('pdf:batch-progress', handler)
      return () => {
        ipcRenderer.removeListener('pdf:batch-progress', handler)
      }
    },
    cancelBatch: (taskId) => ipcRenderer.invoke('pdf:cancel-batch', taskId),
    openOutputDir: (taskId) => ipcRenderer.invoke('pdf:open-output-dir', taskId),
    quickConvert: (input) => ipcRenderer.invoke('pdf:quick-convert', input)
  },

  dialog: {
    selectOutputDir: () => ipcRenderer.invoke('dialog:select-output-dir')
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)
