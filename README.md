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
`electron-updater` reads to detect new versions. To publish a release:

1. Bump `version` in `package.json`.
2. `npm run dist` to produce `dist/<name>-<version>-<arch>.dmg` and
   `dist/latest-mac.yml`.
3. Create a GitHub Release tagged `v<version>` and upload **both** the
   `.dmg` and `latest-mac.yml` as release assets.

Skipping `latest-mac.yml` silently breaks auto-update for everyone on an
older version — they won't see an error, updates just never appear.

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
