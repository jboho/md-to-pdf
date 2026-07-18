const path = require('node:path')
const { notarize } = require('@electron/notarize')

/**
 * electron-builder afterSign hook. Notarizes the signed .app when Apple
 * credentials are present in the environment; otherwise no-ops so unsigned
 * local/CI builds still succeed.
 *
 * Required env vars to actually notarize:
 *   APPLE_ID                     Apple Developer account email
 *   APPLE_APP_SPECIFIC_PASSWORD  app-specific password (appleid.apple.com)
 *   APPLE_TEAM_ID                10-char Team ID
 */
exports.default = async function notarizeApp(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return

  const appleId = process.env.APPLE_ID
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD
  const teamId = process.env.APPLE_TEAM_ID

  if (!appleId || !appleIdPassword || !teamId) {
    console.log(
      '[notarize] Skipping — set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD and APPLE_TEAM_ID to notarize.'
    )
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(appOutDir, `${appName}.app`)

  console.log(`[notarize] Submitting ${appName}.app to Apple — this can take several minutes...`)
  await notarize({ appPath, appleId, appleIdPassword, teamId })
  console.log('[notarize] Notarization complete.')
}
