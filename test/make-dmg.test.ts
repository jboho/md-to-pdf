import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

// Load both through Node's own require: make-dmg.js is a plain CommonJS
// script, and electron-updater's Provider helpers are what the shipped app
// uses to read latest-mac.yml and pick the file to download.
const require = createRequire(import.meta.url)
const { readProductName, artifactBaseName, fileEntry, buildUpdateManifest } =
  require('../scripts/make-dmg.js')
const { parseUpdateInfo, resolveFiles, findFile } = require(
  'electron-updater/out/providers/Provider'
)

const zip = { url: 'MD-to-PDF-1.2.3-arm64.zip', sha512: 'zipsha==', size: 111 }
const dmg = { url: 'MD-to-PDF-1.2.3-arm64.dmg', sha512: 'dmgsha==', size: 222 }

// Mirrors GitHubProvider.resolveFiles: spaces become dashes in the request.
function resolveLikeGitHub(yml: string) {
  const info = parseUpdateInfo(yml, 'latest-mac.yml', 'https://example.test/latest-mac.yml')
  return resolveFiles(
    info,
    new URL('https://github.com'),
    (p: string) => `/jboho/md-to-pdf/releases/download/v1.2.3/${p.replace(/ /g, '-')}`
  )
}

describe('make-dmg release artifacts', () => {
  it('names artifacts without whitespace for the real productName', () => {
    const base = artifactBaseName(readProductName())
    expect(base).toBe('MD-to-PDF')
    expect(base).not.toMatch(/\s/)
  })

  it('writes a manifest electron-updater resolves to the zip', () => {
    const yml = buildUpdateManifest('1.2.3', [zip, dmg], '2026-09-26T00:00:00.000Z')
    const files = resolveLikeGitHub(yml)
    const picked = findFile(files, 'zip', ['pkg', 'dmg'])

    expect(picked.url.pathname).toBe('/jboho/md-to-pdf/releases/download/v1.2.3/' + zip.url)
    expect(picked.info).toMatchObject(zip)
    expect(files.map((f: { info: { url: string } }) => f.info.url)).toEqual([zip.url, dmg.url])
  })

  it('refuses a manifest with no zip', () => {
    expect(() => buildUpdateManifest('1.2.3', [dmg], 'now')).toThrow(/\.zip/)
  })

  it('refuses a file name with whitespace', () => {
    const spaced = { ...zip, url: 'MD to PDF-1.2.3-arm64.zip' }
    expect(() => buildUpdateManifest('1.2.3', [spaced], 'now')).toThrow(/whitespace/)
  })

  it('records base64 sha512 and byte size', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-to-pdf-manifest-'))
    try {
      const file = path.join(dir, 'x.zip')
      fs.writeFileSync(file, 'abc')
      // FIPS 180-2 test vector: SHA-512("abc").
      const expected = Buffer.from(
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
          '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
        'hex'
      ).toString('base64')
      expect(fileEntry(file)).toEqual({ url: 'x.zip', sha512: expected, size: 3 })
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
