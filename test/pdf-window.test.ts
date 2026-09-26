import { describe, expect, it } from 'vitest'
import { BrowserWindow } from './mocks/electron'
import { getHiddenWindow } from '../src/main/pdf/generator'

describe('PDF render window', () => {
  it('renders offscreen at the primary display scale factor, not the 1.0 default', () => {
    getHiddenWindow()
    const options = BrowserWindow.lastOptions as {
      show: boolean
      webPreferences: { offscreen: unknown; sandbox: boolean }
    }
    expect(options.show).toBe(false)
    expect(options.webPreferences.offscreen).toEqual({ deviceScaleFactor: 2 })
    expect(options.webPreferences.sandbox).toBe(true)
  })
})
