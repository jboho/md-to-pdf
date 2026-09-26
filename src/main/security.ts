import { app, session, shell, type WebContents } from 'electron'

// Markdown links reach openExternal, and macOS hands file:, smb:, and custom
// schemes to whatever app claims them, so only web and mail links leave the app.
const EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

export function isSafeExternalUrl(url: string): boolean {
  try {
    return EXTERNAL_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

export function openExternalSafely(url: string): void {
  if (isSafeExternalUrl(url)) {
    shell.openExternal(url).catch((err) => console.error('[security] openExternal failed:', err))
  }
}

/** True when `url` is the page at `currentUrl`, ignoring the hash the router navigates with. */
export function isSameDocument(url: string, currentUrl: string): boolean {
  try {
    const target = new URL(url)
    const current = new URL(currentUrl)
    target.hash = ''
    current.hash = ''
    return target.href === current.href
  } catch {
    return false
  }
}

/**
 * The preload bridge is attached to every page a window loads, so a link in
 * previewed markdown that navigated the window would hand the linked page the
 * full IPC API. Every window stays on the page it was loaded with; windows
 * that should send links to the browser opt in with `openLinksExternally`.
 */
export function installSecurityGuards(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, url) => {
      if (!isSameDocument(url, contents.getURL())) event.preventDefault()
    })
    contents.on('will-attach-webview', (event) => event.preventDefault())
    contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  })

  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(false)
  })
}

export function openLinksExternally(contents: WebContents): void {
  contents.on('will-navigate', (_event, url) => {
    if (!isSameDocument(url, contents.getURL())) openExternalSafely(url)
  })
  contents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url)
    return { action: 'deny' }
  })
}
