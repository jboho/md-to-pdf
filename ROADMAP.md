# Roadmap — md-to-pdf

> Goal: An Electron desktop app for batch Markdown→PDF conversion with a built-in editor, live preview, CSS theme customization, and per-document version history.

## Current next action
- [ ] Ship a real signed + notarized `.dmg` (M2 follow-up — needs Apple Developer credentials)
  - [ ] Export `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` and a "Developer ID Application" cert, then run `npm run dist`
  - [ ] Verify `better-sqlite3` loads in the packaged, notarized app (Electron ABI, unpacked from asar) — the main packaging risk

## Milestones
- [x] M0 — Themes editor: in-app CSS editor (CodeMirror), named preset persistence to SQLite (css_themes), live-preview sync; all pages (Dashboard, Editor, QuickConvert, Styles, Versions) functional
- [x] M1 — Batch + history: multi-file input, per-document version tracking in the UI, quick-convert from dashboard, end-to-end tested (vitest, 36 tests)
- [x] M2 — Distribution + polish: notarization pipeline (env-gated), in-app feedback loop, bundled theme-marketplace polish. Follow-up: signed/notarized build with Apple creds (see Current next action)

## Notes
- M2 shipped (PR #3): notarization pipeline (hardened runtime + `resources/entitlements.mac.plist` + env-gated `afterSign` hook `scripts/notarize.js` using `@electron/notarize`; unsigned builds still succeed — add `APPLE_ID`/`APPLE_APP_SPECIFIC_PASSWORD`/`APPLE_TEAM_ID` to notarize). Feedback loop: `feedback` table (migration 003) + `feedbackRepository`, `feedback:submit`/`feedback:list` IPC, `FeedbackDialog` opened from the Header — stores locally and opens a prefilled GitHub issue (`FEEDBACK_GITHUB_REPO`, default `jboho/md-to-pdf`). Marketplace polish (bundled-only): StylesPage community-theme modal gained search, per-theme Preview, and installed-state dedupe. Only follow-up: producing/verifying an actual signed+notarized build once Apple creds are provided.
- M0 shipped: `CssEditor` (CodeMirror CSS) replaces the plain textareas in Styles + QuickConvert; `css_themes` table (migration 002) + `cssThemeRepository` persist named CSS presets; StylesPage can save/load/delete presets and install bundled community themes from `resources/marketplace-themes.json`. Presets are custom-CSS layers applied on top of the selected base theme.
- Native `better-sqlite3` must be rebuilt for Electron before `npm run dev` (`npm run rebuild`). Note: `electron-rebuild` is referenced by the `rebuild`/`postinstall` scripts but is not a declared devDependency — install `@electron/rebuild` or run `npx @electron/rebuild -f -w better-sqlite3`.
- M1 shipped: vitest suite (`npm test`, 36 tests) covering the task/file/version/cssTheme repositories, the version-tracking IPC flow (create → auto-version, edit → version-on-change-only, diff, restore), and multi-file batch orchestration (`generateBatch`) — status transitions, progress events, task completion, per-file errors, and cancellation. Testability seams: `setDbInstance`/`runMigrations` inject an in-memory DB (`test/helpers/db.ts`); `electron` is aliased to a mock in `vitest.config.ts` (`test/mocks/electron.ts`) whose `invokeHandler` drives real IPC handlers; `generateBatch` accepts an injectable `renderFile` so the batch loop is testable without a real PDF engine. Fixed a same-second ordering bug in `versionRepository.findByFile` (added `rowid DESC` tiebreaker).
- ABI dance for tests: `better-sqlite3` is a native module built for a single ABI. Tests run under Node — run `npm run rebuild:node` before `npm test`, and `npm run rebuild` (Electron ABI) before `npm run dev`. The two ABIs cannot coexist in one `node_modules`. This same native module is the main packaging risk for M2 — it must be rebuilt for Electron and correctly unpacked from the asar in the distributed app.
