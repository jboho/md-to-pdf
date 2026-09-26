import os from 'node:os'

type IpcHandler = (event: unknown, ...args: unknown[]) => unknown

const handlers = new Map<string, IpcHandler>()

export const ipcMain = {
  handle(channel: string, handler: IpcHandler): void {
    handlers.set(channel, handler)
  },
  removeHandler(channel: string): void {
    handlers.delete(channel)
  }
}

export async function invokeHandler<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  const handler = handlers.get(channel)
  if (!handler) throw new Error(`No IPC handler registered for channel: ${channel}`)
  return (await handler({}, ...args)) as T
}

export function clearHandlers(): void {
  handlers.clear()
}

export const app = {
  getPath: (): string => os.tmpdir(),
  getAppPath: (): string => process.cwd(),
  isPackaged: false
}

export const dialog = {
  showOpenDialog: async (): Promise<{ canceled: boolean; filePaths: string[] }> => ({
    canceled: true,
    filePaths: []
  }),
  showSaveDialog: async (): Promise<{ canceled: boolean; filePath?: string }> => ({
    canceled: true
  })
}

export const shell = {
  openPath: async (_path: string): Promise<string> => '',
  openExternal: async (_url: string): Promise<void> => undefined
}

export const session = {
  defaultSession: {
    setPermissionRequestHandler: (): void => undefined
  },
  fromPartition: () => ({
    webRequest: { onBeforeRequest: (): void => undefined },
    setPermissionRequestHandler: (): void => undefined
  })
}

export class BrowserWindow {
  static getAllWindows(): BrowserWindow[] {
    return []
  }
  isDestroyed(): boolean {
    return false
  }
}

export const contextBridge = {
  exposeInMainWorld: (): void => undefined
}

export const ipcRenderer = {
  invoke: async (): Promise<void> => undefined,
  on: (): void => undefined,
  removeListener: (): void => undefined
}

export default { app, ipcMain, dialog, shell, session, BrowserWindow, contextBridge, ipcRenderer }
