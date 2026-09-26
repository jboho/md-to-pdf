import fs from 'node:fs'
import path from 'node:path'

// Directories macOS opens as apps or installers instead of showing as folders.
const PACKAGE_DIR = /\.(app|appex|bundle|framework|kext|mpkg|pkg|plugin|prefpane|qlgenerator|saver|workflow|xpc)$/i

/** The PDF name for a source file: its base name only, so `../` can't escape the output dir. */
export function pdfFilenameFor(filename: string): string {
  const stem = path.basename(filename).replace(/\.(md|markdown|txt)$/i, '')
  return `${stem && stem !== '.' && stem !== '..' ? stem : 'document'}.pdf`
}

/** A user-supplied name reduced to a single path segment. */
export function safePathSegment(name: string, fallback: string): string {
  const cleaned = name.replace(/[/\\:\0]/g, '-').replace(/^\.+/, '').trim()
  return cleaned || fallback
}

/** An existing, absolute, real folder that `shell.openPath` will show rather than launch. */
export function isOpenableDirectory(dir: string): boolean {
  if (!path.isAbsolute(dir)) return false
  try {
    const real = fs.realpathSync(dir)
    return !PACKAGE_DIR.test(path.basename(real)) && fs.statSync(real).isDirectory()
  } catch {
    return false
  }
}
