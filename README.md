# md-to-pdf

Electron desktop app for converting Markdown files to PDF. Supports batch conversion, a built-in editor with live preview, CSS theme customization, and version tracking per document.

## Features

- **Batch conversion** — convert one file or a whole folder in one pass
- **Quick Convert** — single-document workflow from the dashboard
- **Editor** — CodeMirror-based Markdown editor with live PDF preview
- **Themes** — CSS-based PDF themes, editable in-app, with a bundled community-theme marketplace
- **Version history** — per-document conversion history stored in SQLite
- **Feedback** — in-app feedback that files a prefilled GitHub issue (also stored locally)
- **Offline** — no network required; runs entirely on-device

## Stack

- Electron + electron-vite
- React 19, React Router, Tailwind CSS v4, shadcn/ui (Radix)
- CodeMirror 6 (editor)
- `marked` + `rehype` (Markdown → HTML → PDF)
- `better-sqlite3` (local storage)

## Development

```bash
npm install
npm run dev
```

`postinstall` rebuilds `better-sqlite3` for Electron's Node ABI, which is
what `dev`/`dist` need — but `npm test` runs under plain Node, a different
ABI, so every DB-backed test fails with a `NODE_MODULE_VERSION` mismatch
unless you rebuild for Node first:

```bash
npm run rebuild:node && npm test   # switches better-sqlite3 to plain-Node ABI
npm run rebuild                    # switch back to Electron's ABI before npm run dev
```

CI (`ci.yml`) does this automatically; it's only a manual step when testing locally.

## Build

```bash
npm run dist        # macOS .dmg
npm run build       # compiled output only (no installer)
```

Requires macOS for the `--mac` build target.

### Code signing & notarization

`npm run dist` produces a signed, notarized `.dmg` when Apple Developer
credentials are present in the environment; without them it still produces an
unsigned `.dmg` for local testing (Gatekeeper will warn on launch).

To sign and notarize, export these before running `npm run dist`:

```bash
export APPLE_ID="you@example.com"                 # Apple Developer account
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # appleid.apple.com → App-Specific Passwords
export APPLE_TEAM_ID="ABCDE12345"                 # 10-char Team ID
```

Signing also requires a "Developer ID Application" certificate in your login
keychain (electron-builder discovers it automatically). Notarization runs via
the `afterSign` hook in `scripts/notarize.js`, which no-ops when the variables
above are unset. Hardened-runtime entitlements live in
`resources/entitlements.mac.plist`.

### Publishing a release (auto-update)

The app checks for updates via `electron-updater` against this repo's GitHub
Releases (`electron-builder.yml`'s `publish` block). `npm run dist` also
writes `dist/latest-mac.yml` — a manifest with the DMG's sha512/size that
`electron-updater` reads to detect new versions.

**`.github/workflows/release.yml` builds, signs, notarizes and publishes on a
version tag.** It reads these secrets from the `release` environment
(**Settings → Environments → release**), which only `v*` tags can deploy to.
If a secret is missing or the result isn't Developer ID signed, the workflow
fails instead of publishing an unsigned build.

| Secret | Value |
|---|---|
| `APPLE_CERTIFICATE_P12_BASE64` | Your `Developer ID Application` cert, exported from Keychain Access as a `.p12` (File → Export Items, set an export password), then `base64 -i cert.p12 \| pbcopy` |
| `APPLE_CERTIFICATE_PASSWORD` | The export password you set above |
| `APPLE_ID` | Apple Developer account email |
| `APPLE_APP_SPECIFIC_PASSWORD` | Generated at [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords |
| `APPLE_TEAM_ID` | 10-char Team ID |

The workflow imports the certificate into its own keychain and lets
electron-builder find the identity there, rather than passing `CSC_LINK`
(electron-builder's keychain import fails on current macOS runners). The
other three are read by `scripts/notarize.js` and `scripts/make-dmg.js`, same
as a local signed build. To set one: `gh secret set APPLE_TEAM_ID --env release`.

To publish:

```bash
# bump "version" in package.json first, commit it, then:
git tag v0.2.0
git push origin v0.2.0
```

CI builds, signs and notarizes the DMG, and
attaches both the `.dmg` and `latest-mac.yml` to the GitHub Release for that
tag. Skipping `latest-mac.yml` silently breaks auto-update for everyone on an
older version — they won't see an error, updates just never appear — but the
release workflow always uploads both together.

Without those secrets, cut a **signed + notarized** artifact locally instead:
export the three `APPLE_*` vars from "Code signing & notarization" above,
`npm run dist`, then create the GitHub Release and upload
`dist/*.dmg` + `dist/latest-mac.yml` by hand.

Optional: set `FEEDBACK_GITHUB_REPO="owner/repo"` to route in-app feedback to a
different GitHub repository (defaults to `jboho/md-to-pdf`).

## Project structure

```
src/
├── main/           # Electron main process
│   ├── pdf/        # Markdown → PDF pipeline
│   ├── db/         # SQLite schema and queries
│   └── ipc/        # IPC handlers
└── renderer/       # React frontend
    ├── pages/      # Dashboard, Editor, QuickConvert, Styles, Versions
    ├── components/
    └── hooks/
```

## License

[MIT](LICENSE) © Jonathan Boho
