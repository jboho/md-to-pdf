# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Generic engineering standards live in the global `~/.claude/CLAUDE.md`.

## What it is

Electron desktop app (macOS-focused) that converts Markdown to PDF: batch conversion (one file or a folder), CodeMirror editor with live preview, CSS-based PDF themes, per-document version history in SQLite. Fully offline/on-device.

**How conversion works** (load-bearing): `marked` parses Markdown → HTML, wrapped with theme CSS + user custom CSS (`src/main/pdf/html-builder.ts`), written to a temp file, loaded into a hidden offscreen `BrowserWindow`, rendered via Chromium's `webContents.printToPDF()` (`src/main/pdf/generator.ts`). No puppeteer/wkhtmltopdf/LaTeX — reuses Electron's bundled Chromium. Margins mm→inches (`/25.4`).

## Commands

**npm** (`package-lock.json`; no pnpm/yarn). Node >=22.12 (`engines`; Electron 44 tooling requires it), 22 in CI.

- `npm run dev` — `electron-vite dev` (`predev` runs `install-electron`: since Electron 42 the package no longer downloads its binary on install, and electron-vite needs it)
- `npm run build` — `electron-vite build` (no installer)
- `npm run dist` — build + `electron-builder --mac dir` + `node scripts/make-dmg.js` (`.dmg`; macOS host)
- `npm test` — Vitest (`npm run test:watch` for watch)
- `npm run typecheck` — `typecheck:node` then `typecheck:web`
- `npm run rebuild` — `electron-rebuild -f -w better-sqlite3` (Electron ABI)
- `npm run rebuild:node` — `npm rebuild better-sqlite3` (plain-Node ABI)
- `postinstall` — rebuilds better-sqlite3 for Electron ABI, then `electron-vite build`. No lint script.

**Critical test gotcha:** `postinstall`/`rebuild` build `better-sqlite3` against Electron's Node ABI, but Vitest runs under plain Node. DB-backed tests fail with `NODE_MODULE_VERSION` mismatch unless you run `npm run rebuild:node && npm test`, then `npm run rebuild` to switch back before `npm run dev`. CI does this automatically.

## Stack

TypeScript throughout; electron-vite; Electron ^44 (main/preload/renderer). Renderer: React 19, react-router-dom 7 (`createHashRouter`), Tailwind v4, shadcn/ui + Radix, lucide-react, sonner. Editor: CodeMirror 6; preview also react-markdown + remark-gfm + rehype-*. PDF: `marked` ^18 (ESM-only, so bundled into main via `externalizeDepsPlugin({ exclude })` in `electron.vite.config.ts`; every other dep is required from `node_modules` at runtime) + Electron `printToPDF`. Storage: `better-sqlite3` ^12; diffs via `diff` ^9. Auto-update: `electron-updater` against this repo's GitHub Releases.

## Architecture

- `src/main/` — Electron main process:
  - `pdf/` — `generator.ts` (offscreen window + printToPDF in an offline `pdf-render` session that cancels non-`file:`/`data:` requests, batch cancellation via `activeBatches`), `output-path.ts` (PDF names and task folders reduced to one path segment; `openOutputDir` only opens real, non-bundle folders), `html-builder.ts` (MD→HTML+CSS, strict CSP `script-src 'none'` — inline scripts won't run in generated PDFs), `themes/index.ts`
  - `db/` — `database.ts` (singleton, WAL, `userData/md-to-pdf.db`, numbered migrations tracked in `_migrations`, run on first `getDb()`; tests inject in-memory via `setDbInstance()`), `migrations/00{1,2,3}_*.ts`, `repositories/*.repository.ts`
  - `ipc/index.ts` — `registerAllHandlers()` wires per-domain handlers (task/file/version/style/dialog/pdf/feedback)
  - `security.ts` — app-wide guards: no navigation off the loaded page, no `window.open`, no `<webview>`, all permission requests denied. The preload bridge attaches to any page a window reaches, so keep these. The main window opts in to sending http(s)/mailto links to the browser via `openLinksExternally`.
  - `index.ts` — app entry (`main` → `./out/main/index.js`)
- `src/preload/` — typed `contextBridge` API over `ipcRenderer.invoke`; `types.ts` is the shared type source of truth
- `src/renderer/src/` — React frontend: `router.tsx`, `pages/` (Dashboard, TaskDetail, EditorPage, VersionsPage, StylesPage, QuickConvertPage), `components/`, `hooks/`. Alias `@` → `src/renderer/src`; tests alias `electron` → `test/mocks/electron.ts`.

## Conventions / gotchas

- DB ABI dance — see Commands; the biggest local-dev footgun.
- better-sqlite3 stays on 12.x: 13.0.3 segfaults on `new Database()` under Node 22 on darwin-arm64 (WiseLibs/better-sqlite3#1514). 12.x ships no Electron 44 prebuilds, so `rebuild` compiles from source (Xcode CLT); a GNU `libtool` ahead of `/usr/bin/libtool` on PATH fails it with `unrecognized option -static`.
- `electronFuses` in `electron-builder.yml` disables RunAsNode, NODE_OPTIONS and `--inspect` and enforces asar-only loading with integrity validation; entitlements are `allow-jit` only.
- Env: `FEEDBACK_GITHUB_REPO` (default `jboho/md-to-pdf`, `src/main/config.ts`) routes in-app feedback issues. macOS signing/notarization: `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` (+ CI `APPLE_CERTIFICATE_P12_BASE64`, `APPLE_CERTIFICATE_PASSWORD`, electron-builder `CSC_LINK`/`CSC_KEY_PASSWORD`). No `.env.example`.
- macOS 13+ only (Electron 44; `mac.minimumSystemVersion`). Open dialogs pass a `defaultPath` (last folder this session, else Documents) because Electron 43+ otherwise opens Downloads.
- macOS-only builds: `dist` uses `--mac`; `scripts/notarize.js` (afterSign, no-ops when Apple vars unset); entitlements `resources/entitlements.mac.plist`; config `electron-builder.yml`.
- Releases/auto-update: push `vX.Y.Z` tag → `.github/workflows/release.yml` builds/signs/notarizes and attaches both `.dmg` and `dist/latest-mac.yml` (omitting the yml silently breaks auto-update).
- Tests colocated as `*.test.ts` under `src/**` plus `test/**`; Vitest `environment: node`, `globals: true`. `.gitignore` excludes `*.db`, `out/`, `dist/`, `.claude/`.
