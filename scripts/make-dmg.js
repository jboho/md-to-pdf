const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

/**
 * Builds the distributable .dmg from the already signed + notarized .app that
 * `electron-builder --mac dir` produced in dist/mac-<arch>/.
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

  const dmgPath = path.join(ROOT, 'dist', `${productName}-${version}-${arch}.dmg`)
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
}

main()
