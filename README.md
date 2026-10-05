<!-- markdownlint-disable MD033 MD041 -->

<h1 align="center">md-to-pdf</h1>

<p align="center">
  <strong>Desktop app for converting Markdown to PDF — batch, live preview, custom themes</strong>
</p>

<p align="center">
  <a href="https://github.com/jboho/md-to-pdf/actions/workflows/ci.yml"><img src="https://github.com/jboho/md-to-pdf/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="https://github.com/jboho/md-to-pdf/releases/latest"><img src="https://img.shields.io/github/v/release/jboho/md-to-pdf" alt="Latest release" /></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white" alt="Electron 44" /></a>
  <img src="https://img.shields.io/badge/platform-macOS-lightgrey.svg" alt="Platform: macOS" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="License: MIT" /></a>
</p>

<p align="center">
  <sub>In-product name: <em>MD to PDF</em> · batch conversion · offline · themes</sub>
</p>

---

## Overview

**md-to-pdf** is an [Electron](https://www.electronjs.org/) desktop app that turns Markdown files into PDFs. Convert one file or a whole folder, edit with a live PDF preview, restyle the output with CSS themes, and keep a conversion history for every document. It runs entirely on-device and needs no network.

| Topic            | Links                                                              |
| ---------------- | ------------------------------------------------------------------ |
| **License**      | [MIT](LICENSE)                                                     |
| **Security**     | [SECURITY.md](SECURITY.md)                                         |
| **Roadmap**      | [ROADMAP.md](ROADMAP.md)                                           |
| **Releases**     | [GitHub Releases](https://github.com/jboho/md-to-pdf/releases)    |
| **Requirements** | macOS 13+, Apple silicon · build from source needs Node.js 22.12+  |

## Features

- **Batch conversion** — Convert one file or a whole folder in one pass.
- **Quick Convert** — Single-document workflow from the dashboard.
- **Editor** — CodeMirror-based Markdown editor with live PDF preview.
- **Themes** — CSS-based PDF themes, editable in-app, with a bundled community-theme marketplace.
- **Version history** — Per-document conversion history stored in SQLite.
- **Auto-update** — Checks this repo's GitHub Releases through `electron-updater` and installs signed updates.
- **Feedback** — In-app feedback that files a prefilled GitHub issue (also stored locally).
- **Offline** — No network required to convert; the app runs entirely on-device.

## Install (macOS)

Download the latest `.dmg` from the [Releases page](https://github.com/jboho/md-to-pdf/releases) and drag the app into Applications. Releases are signed with a Developer ID certificate and notarized by Apple, so the app opens without a Gatekeeper workaround.

- macOS 13 (Ventura) or later. Electron 44 dropped macOS 12, and the app's `Info.plist` declares the minimum so Finder won't launch it on older systems.
- Apple silicon. Release builds are arm64 only.

## Requirements (to build from source)

- **[Node.js](https://nodejs.org/)** 22.12 or later
- **Xcode Command Line Tools** — `better-sqlite3` compiles from source
- **macOS** for the `--mac` build target

## Quick start

```bash
git clone https://github.com/jboho/md-to-pdf.git
cd md-to-pdf
npm install
npm run dev
```

## Project scripts

| Script                 | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `npm run dev`          | Run the app with hot reload                                              |
| `npm run build`        | Compiled output only (no installer)                                      |
| `npm run dist`         | Build the macOS `.dmg` (signed and notarized when credentials are set)   |
| `npm run typecheck`    | Typecheck the main and renderer projects                                 |
| `npm test`             | Unit tests ([Vitest](https://vitest.dev/)), under plain Node             |
| `npm run test:watch`   | Vitest watch mode                                                        |
| `npm run rebuild`      | Rebuild `better-sqlite3` for Electron's ABI                              |
| `npm run rebuild:node` | Rebuild `better-sqlite3` for plain Node's ABI                            |

`postinstall` rebuilds `better-sqlite3` for Electron's Node ABI, which is what `dev`/`dist` need. `npm test` runs under plain Node, a different ABI, so every DB-backed test fails with a `NODE_MODULE_VERSION` mismatch unless you rebuild for Node first:

```bash
npm run rebuild:node && npm test   # switches better-sqlite3 to plain-Node ABI
npm run rebuild                    # switch back to Electron's ABI before npm run dev
```

CI (`ci.yml`) does this automatically; it's only a manual step when testing locally.

## Configuration

Optional: set `FEEDBACK_GITHUB_REPO="owner/repo"` to route in-app feedback to a different GitHub repository (defaults to `jboho/md-to-pdf`).

## Tech stack

| Layer    | Details                                                              |
| -------- | -------------------------------------------------------------------- |
| Shell    | Electron, electron-vite                                              |
| Frontend | React 19, React Router, Tailwind CSS v4, shadcn/ui (Radix)           |
| Editor   | CodeMirror 6                                                         |
| Pipeline | `marked` + `rehype` (Markdown → HTML → PDF)                          |
| Storage  | `better-sqlite3` (local)                                             |
| Testing  | Vitest                                                               |
| CI       | GitHub Actions — `ci.yml` on PRs and main; `release.yml` on `v*` tags         |

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

## Releasing

### Code signing & notarization

`npm run dist` produces a signed, notarized `.dmg` when Apple Developer credentials are present in the environment; without them it still produces an unsigned `.dmg` for local testing (Gatekeeper will warn on launch).

To sign and notarize, export these before running `npm run dist`:

```bash
export APPLE_ID="you@example.com"                 # Apple Developer account
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # appleid.apple.com → App-Specific Passwords
export APPLE_TEAM_ID="ABCDE12345"                 # 10-char Team ID
```

Signing also requires a "Developer ID Application" certificate in your login keychain (electron-builder discovers it automatically). Notarization runs via the `afterSign` hook in `scripts/notarize.js`, which no-ops when the variables above are unset. Hardened-runtime entitlements live in `resources/entitlements.mac.plist`.

### Publishing a release (auto-update)

The app checks for updates via `electron-updater` against this repo's GitHub Releases (`electron-builder.yml`'s `publish` block). Besides the `.dmg`, `npm run dist` writes `dist/MD-to-PDF-<version>-<arch>.zip` (the signed app, which is what `electron-updater` installs on macOS) and `dist/latest-mac.yml`, the manifest `electron-updater` reads to detect new versions. File names use dashes, not spaces: GitHub renames spaces in uploaded assets to dots, which the updater can't match.

**`.github/workflows/release.yml` builds, signs, notarizes and publishes on a version tag.** It reads these secrets from the `release` environment (**Settings → Environments → release**), which only `v*` tags can deploy to. If a secret is missing or the result isn't Developer ID signed, the workflow fails instead of publishing an unsigned build.

| Secret                         | Value                                                                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APPLE_CERTIFICATE_P12_BASE64` | Your `Developer ID Application` cert, exported from Keychain Access as a `.p12` (File → Export Items, set an export password), then `base64 -i cert.p12 \| pbcopy`                      |
| `APPLE_CERTIFICATE_PASSWORD`   | The export password you set above                                                                                                                                                      |
| `APPLE_ID`                     | Apple Developer account email                                                                                                                                                          |
| `APPLE_APP_SPECIFIC_PASSWORD`  | Generated at [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords                                                                            |
| `APPLE_TEAM_ID`                | 10-char Team ID                                                                                                                                                                        |

The workflow imports the certificate into its own keychain and lets electron-builder find the identity there, rather than passing `CSC_LINK` (electron-builder's keychain import fails on current macOS runners). The other three are read by `scripts/notarize.js` and `scripts/make-dmg.js`, same as a local signed build. To set one: `gh secret set APPLE_TEAM_ID --env release`.

To publish:

```bash
# bump "version" in package.json first, commit it, then:
git tag v0.2.0
git push origin v0.2.0
```

CI builds, signs and notarizes the app and DMG, checks that every file `latest-mac.yml` lists exists, and attaches the `.dmg`, `.zip` and `latest-mac.yml` to the GitHub Release for that tag. Leaving out the `.zip` or `latest-mac.yml` silently breaks auto-update for everyone on an older version (they see no error; updates just never appear), which is why the workflow uploads all three together.

Without those secrets, cut a **signed + notarized** artifact locally instead: export the three `APPLE_*` vars from "Code signing & notarization" above, `npm run dist`, then create the GitHub Release and upload `dist/*.dmg`, `dist/*.zip` and `dist/latest-mac.yml` by hand.

## Platform support

macOS only (13+, Apple silicon). Release builds are arm64.

## Security

Please report vulnerabilities privately through [GitHub's security advisory form](https://github.com/jboho/md-to-pdf/security/advisories/new). See [SECURITY.md](SECURITY.md) for what counts.

## License

Published under the [MIT License](LICENSE) © Jonathan Boho.
