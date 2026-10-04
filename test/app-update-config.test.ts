import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

// js-yaml is what electron-updater itself parses app-update.yml with.
const require = createRequire(import.meta.url)
const { load } = require('js-yaml')

const ROOT = path.resolve(__dirname, '..')
const readYaml = (rel: string) => load(fs.readFileSync(path.join(ROOT, rel), 'utf8'))

describe('app-update.yml shipped with the app', () => {
  const builder = readYaml('electron-builder.yml')
  const appUpdate = readYaml('resources/app-update.yml')

  it('is copied into the app Resources folder, where electron-updater looks', () => {
    expect(builder.extraResources).toContainEqual({
      from: 'resources/app-update.yml',
      to: 'app-update.yml'
    })
  })

  it('points at the same feed as the electron-builder publish config', () => {
    expect(appUpdate).toMatchObject(builder.publish)
  })

  // Same value electron-builder's AppInfo.updaterCacheDirName would write.
  // Without it electron-updater logs an error and caches under the app name.
  it('names the updater cache dir after the package', () => {
    const { name } = require('../package.json')
    expect(appUpdate.updaterCacheDirName).toBe(`${name.toLowerCase()}-updater`)
  })
})
