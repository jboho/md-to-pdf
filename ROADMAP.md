# Roadmap — md-to-pdf

> Goal: An Electron desktop app for batch Markdown→PDF conversion with a built-in editor, live preview, CSS theme customization, and per-document version history.

## Current next action
- [ ] M2 — Distribution + polish (notarized .dmg, user feedback loop, theme-marketplace skeleton)

## Milestones
- [x] M0 — Themes editor: in-app CSS editor (CodeMirror), named preset persistence to SQLite (css_themes), live-preview sync; all pages (Dashboard, Editor, QuickConvert, Styles, Versions) functional
- [x] M1 — Batch + history: multi-file input, per-document version tracking in the UI, quick-convert from dashboard, end-to-end tested (vitest, 36 tests)
- [ ] M2 — Distribution + polish: notarized .dmg (or App Store), user feedback loop, optional theme-marketplace skeleton

## Notes
- M0 shipped: `CssEditor` (CodeMirror CSS) replaces the plain textareas in Styles + QuickConvert; `css_themes` table (migration 002) + `cssThemeRepository` persist named CSS presets; StylesPage can save/load/delete presets and install bundled community themes from `resources/marketplace-themes.json`. Presets are custom-CSS layers applied on top of the selected base theme.
- Native `better-sqlite3` must be rebuilt for Electron before `npm run dev` (`npm run rebuild`). Note: `electron-rebuild` is referenced by the `rebuild`/`postinstall` scripts but is not a declared devDependency — install `@electron/rebuild` or run `npx @electron/rebuild -f -w better-sqlite3`.
- M1 shipped: vitest suite (`npm test`, 36 tests) covering the task/file/version/cssTheme repositories, the version-tracking IPC flow (create → auto-version, edit → version-on-change-only, diff, restore), and multi-file batch orchestration (`generateBatch`) — status transitions, progress events, task completion, per-file errors, and cancellation. Testability seams: `setDbInstance`/`runMigrations` inject an in-memory DB (`test/helpers/db.ts`); `electron` is aliased to a mock in `vitest.config.ts` (`test/mocks/electron.ts`) whose `invokeHandler` drives real IPC handlers; `generateBatch` accepts an injectable `renderFile` so the batch loop is testable without a real PDF engine. Fixed a same-second ordering bug in `versionRepository.findByFile` (added `rowid DESC` tiebreaker).
- ABI dance for tests: `better-sqlite3` is a native module built for a single ABI. Tests run under Node — run `npm run rebuild:node` before `npm test`, and `npm run rebuild` (Electron ABI) before `npm run dev`. The two ABIs cannot coexist in one `node_modules`.
