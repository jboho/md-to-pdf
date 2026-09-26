import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isOpenableDirectory, pdfFilenameFor, safePathSegment } from './output-path'

describe('pdfFilenameFor', () => {
  it.each([
    ['notes.md', 'notes.pdf'],
    ['Notes.MARKDOWN', 'Notes.pdf'],
    ['todo.txt', 'todo.pdf'],
    ['README', 'README.pdf'],
    ['v1.2.md', 'v1.2.pdf']
  ])('%s -> %s', (input, expected) => {
    expect(pdfFilenameFor(input)).toBe(expected)
  })

  it.each(['../../Library/LaunchAgents/evil.md', '/etc/evil.md', 'a/b/evil.md'])(
    'drops directory parts from %s',
    (input) => {
      expect(pdfFilenameFor(input)).toBe('evil.pdf')
    }
  )

  it.each(['..', '.', '', '.md', '/'])('falls back for %j', (input) => {
    expect(pdfFilenameFor(input)).toBe('document.pdf')
  })
})

describe('safePathSegment', () => {
  it('keeps an ordinary name', () => {
    expect(safePathSegment('Q3 Report', 'Untitled')).toBe('Q3 Report')
  })

  it('flattens separators so the name stays one folder', () => {
    expect(safePathSegment('../../Library/x', 'Untitled')).toBe('-..-Library-x')
    expect(safePathSegment('a\\b:c', 'Untitled')).toBe('a-b-c')
  })

  it.each(['..', '.', '   ', ''])('falls back for %j', (input) => {
    expect(safePathSegment(input, 'Untitled')).toBe('Untitled')
  })
})

describe('isOpenableDirectory', () => {
  let root: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'md-to-pdf-output-'))
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('accepts an existing folder', () => {
    expect(isOpenableDirectory(root)).toBe(true)
  })

  it('refuses a relative path', () => {
    expect(isOpenableDirectory('relative/dir')).toBe(false)
  })

  it('refuses a missing path', () => {
    expect(isOpenableDirectory(path.join(root, 'missing'))).toBe(false)
  })

  it('refuses a file', () => {
    const file = path.join(root, 'payload.command')
    fs.writeFileSync(file, '#!/bin/sh\n')
    expect(isOpenableDirectory(file)).toBe(false)
  })

  it.each(['Calculator.app', 'Installer.pkg', 'Thing.prefPane', 'Run.workflow'])(
    'refuses a %s bundle',
    (name) => {
      const bundle = path.join(root, name)
      fs.mkdirSync(bundle)
      expect(isOpenableDirectory(bundle)).toBe(false)
    }
  )

  it('refuses a folder-looking symlink to an app bundle', () => {
    const bundle = path.join(root, 'Calculator.app')
    fs.mkdirSync(bundle)
    const link = path.join(root, 'Output')
    fs.symlinkSync(bundle, link)
    expect(isOpenableDirectory(link)).toBe(false)
  })
})
