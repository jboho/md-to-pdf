const { execFileSync } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

/**
 * Builds the distributable .dmg, the .zip electron-updater installs from, and
 * the latest-mac.yml update manifest, from the already signed + notarized .app
 * that `electron-builder --mac dir` produced in dist/mac-<arch>/.
 *
 * Why this exists instead of electron-builder's built-in `dmg` target:
 * electron-builder runs `hdiutil create -srcfolder <the live appOutDir>`, and
 * on this toolchain that consistently fails with "hdiutil: create failed -
 * Resource busy" because fsevents/Spotlight are still touching the freshly
 * built bundle. Creating the image from a clean `ditto` copy in a throwaway
 * temp dir sidesteps the contention reliably.
 *
 * The .app is notarized + stapled by the afterSign hook (scripts/notarize.js).
 * When Apple credentials are present this script additionally notarizes and
 * staples the .dmg itself so it passes Gatekeeper offline; without them it
 * still emits a usable image wrapping the (separately notarized) app.
 *
 * Required env vars to notarize the dmg (same as scripts/notarize.js):
 *   APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID
 */

const ROOT = path.resolve(__dirname, '..')

function readProductName() {
  const yml = fs.readFileSync(path.join(ROOT, 'electron-builder.yml'), 'utf8')
  const match = yml.match(/^productName:\s*(.+?)\s*$/m)
  if (!match) throw new Error('productName not found in electron-builder.yml')
  return match[1].replace(/^["']|["']$/g, '')
}

// electron-builder's mac output dir: x64 -> "mac", arm64 -> "mac-arm64", etc.
function appOutDirFor(arch) {
  return arch === 'x64' ? 'mac' : `mac-${arch}`
}

// Inherit stdout/stderr so hdiutil errors and notarytool's progress + terminal
// status (Accepted/Invalid) are visible; a non-zero exit throws and aborts.
function sh(cmd, args) {
  execFileSync(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] })
}

// GitHub stores an uploaded asset with spaces turned into dots, while
// electron-updater requests the manifest's url with spaces turned into dashes,
// so a name with a space can never be downloaded. Use dashes up front.
function artifactBaseName(productName) {
  return productName.trim().replace(/\s+/g, '-')
}

function fileEntry(filePath) {
  const buffer = fs.readFileSync(filePath)
  return {
    url: path.basename(filePath),
    sha512: crypto.createHash('sha512').update(buffer).digest('base64'),
    size: buffer.length
  }
}

// electron-updater's GitHub provider reads latest-mac.yml from the release to
// decide whether a newer version exists and what to download. MacUpdater only
// installs from a .zip (ERR_UPDATER_ZIP_FILE_NOT_FOUND otherwise), so the zip
// comes first and is the legacy top-level `path`; the dmg is listed for
// completeness. Both files and the manifest must be uploaded to every release.
function buildUpdateManifest(version, entries, releaseDate) {
  if (!entries.some((e) => e.url.endsWith('.zip'))) {
    throw new Error('latest-mac.yml needs a .zip entry: MacUpdater cannot install from a dmg')
  }
  for (const e of entries) {
    if (/\s/.test(e.url)) throw new Error(`Update file name contains whitespace: ${e.url}`)
  }
  const [primary] = entries
  return [
    `version: ${version}`,
    'files:',
    ...entries.flatMap((e) => [`  - url: ${e.url}`, `    sha512: ${e.sha512}`, `    size: ${e.size}`]),
    `path: ${primary.url}`,
    `sha512: ${primary.sha512}`,
    `releaseDate: '${releaseDate}'`,
    ''
  ].join('\n')
}

function writeUpdateManifest(distDir, version, filePaths) {
  const yml = buildUpdateManifest(version, filePaths.map(fileEntry), new Date().toISOString())
  const manifestPath = path.join(distDir, 'latest-mac.yml')
  fs.writeFileSync(manifestPath, yml, 'utf8')
  console.log(`[make-dmg] Wrote update manifest: ${manifestPath}`)
}

// The zip electron-updater installs from. Made with ditto (not `zip`) so the
// bundle's symlinks, extended attributes and stapled ticket survive, which
// Squirrel.Mac needs to accept the update's code signature.
function makeUpdateZip(appPath, zipPath) {
  console.log(`[make-dmg] Creating ${path.basename(zipPath)}...`)
  fs.rmSync(zipPath, { force: true })
  sh('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', appPath, zipPath])
}

function main() {
  const arch = process.arch
  const version = require(path.join(ROOT, 'package.json')).version
  const productName = readProductName()

  const appPath = path.join(ROOT, 'dist', appOutDirFor(arch), `${productName}.app`)
  if (!fs.existsSync(appPath)) {
    throw new Error(
      `Signed app not found at ${appPath}. Run "electron-builder --mac dir" first.`
    )
  }

  const distDir = path.join(ROOT, 'dist')
  const baseName = `${artifactBaseName(productName)}-${version}-${arch}`
  const dmgPath = path.join(distDir, `${baseName}.dmg`)
  const zipPath = path.join(distDir, `${baseName}.zip`)
  const volName = `${productName} ${version}-${arch}`

  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'md-to-pdf-dmg-'))
  try {
    console.log(`[make-dmg] Staging ${productName}.app into a clean copy...`)
    sh('ditto', [appPath, path.join(stage, `${productName}.app`)])
    fs.symlinkSync('/Applications', path.join(stage, 'Applications'))

    console.log(`[make-dmg] Creating ${path.basename(dmgPath)}...`)
    fs.rmSync(dmgPath, { force: true })
    sh('hdiutil', [
      'create',
      '-srcfolder', stage,
      '-volname', volName,
      '-fs', 'APFS',
      '-format', 'UDZO',
      '-ov',
      dmgPath
    ])
  } finally {
    fs.rmSync(stage, { recursive: true, force: true })
  }

  const appleId = process.env.APPLE_ID
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD
  const teamId = process.env.APPLE_TEAM_ID

  if (!appleId || !appleIdPassword || !teamId) {
    console.log(
      '[make-dmg] Created (not notarized) — set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD and APPLE_TEAM_ID to notarize the dmg.'
    )
    console.log(`[make-dmg] Output: ${dmgPath}`)
    makeUpdateZip(appPath, zipPath)
    writeUpdateManifest(distDir, version, [zipPath, dmgPath])
    return
  }

  console.log('[make-dmg] Submitting dmg to Apple — this can take several minutes...')
  sh('xcrun', [
    'notarytool', 'submit', dmgPath,
    '--apple-id', appleId,
    '--password', appleIdPassword,
    '--team-id', teamId,
    '--wait'
  ])
  sh('xcrun', ['stapler', 'staple', dmgPath])
  sh('xcrun', ['stapler', 'validate', dmgPath])
  console.log(`[make-dmg] Notarized + stapled. Output: ${dmgPath}`)
  makeUpdateZip(appPath, zipPath)
  writeUpdateManifest(distDir, version, [zipPath, dmgPath])
}

module.exports = { readProductName, artifactBaseName, fileEntry, buildUpdateManifest }

if (require.main === module) main()
