import { describe, expect, it } from 'vitest'
import { isSafeExternalUrl, isSameDocument } from './security'

describe('isSafeExternalUrl', () => {
  it.each(['https://example.com/a?b=c', 'http://example.com', 'mailto:someone@example.com'])(
    'allows %s',
    (url) => {
      expect(isSafeExternalUrl(url)).toBe(true)
    }
  )

  it.each([
    'file:///System/Applications/Calculator.app',
    'smb://attacker.example/share/payload.app',
    'javascript:alert(1)',
    'x-apple.systempreferences:com.apple.preference.security',
    'vscode://file/etc/passwd',
    'not a url',
    ''
  ])('refuses %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(false)
  })
})

describe('isSameDocument', () => {
  const app = 'file:///Applications/MD%20to%20PDF.app/Contents/Resources/app.asar/out/renderer/index.html#/'

  it('treats router hash changes as the same document', () => {
    expect(isSameDocument(app.replace('#/', '#/tasks/1'), app)).toBe(true)
  })

  it('treats a remote page as a different document', () => {
    expect(isSameDocument('https://attacker.example/', app)).toBe(false)
  })

  it('treats a sibling local file as a different document', () => {
    expect(isSameDocument(app.replace('index.html#/', 'notes.html'), app)).toBe(false)
  })

  it('compares the dev server by origin and path', () => {
    expect(isSameDocument('http://localhost:5173/#/styles', 'http://localhost:5173/#/')).toBe(true)
    expect(isSameDocument('http://localhost:5174/', 'http://localhost:5173/')).toBe(false)
  })

  it('is false for unparseable input', () => {
    expect(isSameDocument('::', app)).toBe(false)
  })
})
