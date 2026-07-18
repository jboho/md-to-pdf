# Roadmap — md-to-pdf

> Goal: An Electron desktop app for batch Markdown→PDF conversion with a built-in editor, live preview, CSS theme customization, and per-document version history.

## Current next action
- [ ] M1 — Batch + history end-to-end tested (vitest repo tests, multi-file batch run)

## Milestones
- [x] M0 — Themes editor: in-app CSS editor (CodeMirror), named preset persistence to SQLite (css_themes), live-preview sync; all pages (Dashboard, Editor, QuickConvert, Styles, Versions) functional
- [ ] M1 — Batch + history: multi-file input, per-document version tracking in the UI, quick-convert from dashboard, end-to-end tested
- [ ] M2 — Distribution + polish: notarized .dmg (or App Store), user feedback loop, optional theme-marketplace skeleton

## Notes
- M0 shipped: `CssEditor` (CodeMirror CSS) replaces the plain textareas in Styles + QuickConvert; `css_themes` table (migration 002) + `cssThemeRepository` persist named CSS presets; StylesPage can save/load/delete presets and install bundled community themes from `resources/marketplace-themes.json`. Presets are custom-CSS layers applied on top of the selected base theme.
- Native `better-sqlite3` must be rebuilt for Electron before `npm run dev` (`npm run rebuild`). Note: `electron-rebuild` is referenced by the `rebuild`/`postinstall` scripts but is not a declared devDependency — install `@electron/rebuild` or run `npx @electron/rebuild -f -w better-sqlite3`.
