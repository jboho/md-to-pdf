# MD to PDF — Roadmap Implementation Plan

> **Execution:** hand off to the `run-plan` skill to implement this task-by-task (fresh subagent per task + spec/quality review). Steps use `- [ ]` checkboxes for tracking.

**Goal:** Complete all three milestones in ROADMAP.md — Themes editor (M0), Batch + history end-to-end tested (M1), and Distribution + polish (M2).

**Architecture:** Electron + React + SQLite (better-sqlite3). Main process handles all persistence and PDF generation via Chromium's `printToPDF`; renderer communicates via contextBridge IPC. All IPC channels follow `domain:verb` naming; repositories are plain objects calling `getDb()`. New features add to existing layers without restructuring.

**Tech stack:** Electron 35, React 19, TypeScript, CodeMirror 6, better-sqlite3, electron-vite, Tailwind 4, Radix UI, Vitest (added in M1), `@electron/notarize` (added in M2).

---

## File Map

**Created:**
- `src/renderer/src/components/editor/CssEditor.tsx` — CodeMirror CSS editor component
- `src/main/db/migrations/002_css_themes.ts` — SQLite migration for css_themes table
- `src/main/db/repositories/cssTheme.repository.ts` — CRUD for named CSS presets
- `src/main/db/__tests__/helpers.ts` — in-memory SQLite test database factory
- `src/main/db/__tests__/task.repository.test.ts`
- `src/main/db/__tests__/file.repository.test.ts`
- `src/main/db/__tests__/version.repository.test.ts`
- `src/main/db/__tests__/cssTheme.repository.test.ts`
- `src/main/pdf/__tests__/html-builder.test.ts`
- `src/main/ipc/shell.handlers.ts` — `shell:open-external` IPC handler
- `resources/marketplace-themes.json` — static bundled community themes
- `build/notarize.mjs` — afterSign notarization hook
- `vitest.config.ts` — vitest configuration

**Modified:**
- `src/main/db/database.ts` — add migration 002
- `src/main/db/repositories/file.repository.ts` — no functional change, covered by tests
- `src/main/db/repositories/version.repository.ts` — no functional change, covered by tests
- `src/main/ipc/style.handlers.ts` — add css_theme CRUD + marketplace handlers
- `src/main/ipc/index.ts` — register shell handlers
- `src/preload/types.ts` — add `CssTheme`, `MarketplaceTheme`, extend `ElectronAPI`
- `src/preload/index.ts` — wire new IPC calls
- `src/renderer/src/pages/StylesPage.tsx` — CssEditor + named presets UI
- `src/renderer/src/pages/QuickConvertPage.tsx` — CssEditor + load preset
- `src/renderer/src/components/layout/Header.tsx` — Feedback button
- `electron-builder.yml` — add signing + notarization config
- `package.json` — add vitest, @electron/notarize; add test scripts

---

## M0 — Themes Editor

---

### Task 1: CssEditor component + replace textareas

**Files:**
- Create: `src/renderer/src/components/editor/CssEditor.tsx`
- Modify: `src/renderer/src/pages/StylesPage.tsx`
- Modify: `src/renderer/src/pages/QuickConvertPage.tsx`

No unit test for this task — CodeMirror components require a DOM environment with canvas mocks that are out of scope. Correctness is verified by running the app. (MarkdownEditor.tsx, the existing CodeMirror component, has the same pattern and no test.)

- [ ] **Step 1: Create CssEditor.tsx**

```tsx
// src/renderer/src/components/editor/CssEditor.tsx
import { useEffect, useRef } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { css } from '@codemirror/lang-css'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching
} from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'

interface Props {
  value: string
  onChange: (value: string) => void
  darkMode?: boolean
  minHeight?: string
}

export default function CssEditor({
  value,
  onChange,
  darkMode = false,
  minHeight = '12rem'
}: Props): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle),
      css(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
        }
      }),
      EditorView.theme({
        '&': { minHeight, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: '13px' },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': { padding: '8px 0' }
      }),
      EditorView.lineWrapping
    ]

    if (darkMode) extensions.push(oneDark)

    const state = EditorState.create({ doc: value, extensions })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkMode, minHeight])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring overflow-hidden"
    />
  )
}
```

- [ ] **Step 2: Replace textarea in StylesPage.tsx**

In `src/renderer/src/pages/StylesPage.tsx`:

Add import at the top (after existing imports):
```tsx
import CssEditor from '@/components/editor/CssEditor'
import { useThemeContext } from '@/components/ThemeProvider'
```

Add `isDark` to component body (after existing state declarations):
```tsx
const { isDark } = useThemeContext()
```

Remove the `cssTextareaRef` declaration and `<textarea>` element. Replace the entire Custom CSS section (the `<div>` with `<textarea>`) with:
```tsx
{/* Custom CSS */}
<div>
  <label className="text-xs font-medium text-muted-foreground">Custom CSS</label>
  <div className="mt-2">
    <CssEditor
      value={customCss}
      onChange={setCustomCss}
      darkMode={isDark}
      minHeight="12rem"
    />
  </div>
</div>
```

Also remove the `useRef` import for `cssTextareaRef` if it becomes unused (check — `useRef` is still used for `saveTimeoutRef` in EditorPage but not in StylesPage after this change; remove `useRef` from the StylesPage import).

- [ ] **Step 3: Replace textarea in QuickConvertPage.tsx**

In `src/renderer/src/pages/QuickConvertPage.tsx`, add import:
```tsx
import CssEditor from '@/components/editor/CssEditor'
```

Replace the `<textarea>` in the collapsible settings section with:
```tsx
<div className="flex-1">
  <label className="text-xs text-muted-foreground">Custom CSS</label>
  <div className="mt-1">
    <CssEditor
      value={customCss}
      onChange={setCustomCss}
      darkMode={isDark}
      minHeight="5rem"
    />
  </div>
</div>
```

- [ ] **Step 4: Run the app and verify**

```bash
npm run dev
```

Expected: StylesPage shows a CodeMirror CSS editor with syntax highlighting. QuickConvert's "More" panel shows the same. Both update the preview live as you type.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/editor/CssEditor.tsx \
        src/renderer/src/pages/StylesPage.tsx \
        src/renderer/src/pages/QuickConvertPage.tsx
git commit -m "feat: replace CSS textarea with CodeMirror editor in StylesPage and QuickConvert"
```

---

### Task 2: Named CSS presets — migration + repository

**Files:**
- Create: `src/main/db/migrations/002_css_themes.ts`
- Create: `src/main/db/repositories/cssTheme.repository.ts`
- Modify: `src/main/db/database.ts`

Tests come in Task 7 after test infrastructure is set up. This task is scaffolding; functional correctness is covered by the repository test in Task 7.

- [ ] **Step 1: Write migration 002**

```ts
// src/main/db/migrations/002_css_themes.ts
export const migration002 = `
CREATE TABLE IF NOT EXISTS css_themes (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  css        TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_css_themes_name ON css_themes(name);
`
```

- [ ] **Step 2: Write cssTheme repository**

```ts
// src/main/db/repositories/cssTheme.repository.ts
import crypto from 'node:crypto'
import { getDb } from '../database'
import type { CssTheme } from '../../../preload/types'

interface CssThemeRow {
  id: string
  name: string
  css: string
  created_at: string
  updated_at: string
}

function rowToTheme(row: CssThemeRow): CssTheme {
  return {
    id: row.id,
    name: row.name,
    css: row.css,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const cssThemeRepository = {
  findAll(): CssTheme[] {
    const db = getDb()
    const rows = db
      .prepare('SELECT * FROM css_themes ORDER BY name ASC')
      .all() as CssThemeRow[]
    return rows.map(rowToTheme)
  },

  findById(id: string): CssTheme | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM css_themes WHERE id = ?').get(id) as CssThemeRow | undefined
    return row ? rowToTheme(row) : null
  },

  create(name: string, css: string): CssTheme {
    const db = getDb()
    const id = crypto.randomUUID()
    db.prepare(
      'INSERT INTO css_themes (id, name, css) VALUES (?, ?, ?)'
    ).run(id, name, css)
    return this.findById(id)!
  },

  update(id: string, name: string, css: string): CssTheme {
    const db = getDb()
    db.prepare(
      "UPDATE css_themes SET name = ?, css = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(name, css, id)
    return this.findById(id)!
  },

  delete(id: string): void {
    const db = getDb()
    db.prepare('DELETE FROM css_themes WHERE id = ?').run(id)
  }
}
```

- [ ] **Step 3: Register migration in database.ts**

In `src/main/db/database.ts`, add import and add to migrations array:

```ts
import { migration001 } from './migrations/001_initial'
import { migration002 } from './migrations/002_css_themes'
```

Change the migrations array:
```ts
const migrations = [
  { name: '001_initial', sql: migration001 },
  { name: '002_css_themes', sql: migration002 }
]
```

- [ ] **Step 4: Commit**

```bash
git add src/main/db/migrations/002_css_themes.ts \
        src/main/db/repositories/cssTheme.repository.ts \
        src/main/db/database.ts
git commit -m "feat: add css_themes table and repository for named CSS presets"
```

---

### Task 3: Named CSS presets — IPC handlers + preload types

**Files:**
- Modify: `src/preload/types.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/main/ipc/style.handlers.ts`

- [ ] **Step 1: Add CssTheme type and extend ElectronAPI in types.ts**

In `src/preload/types.ts`, add after the existing interfaces (before the `ElectronAPI` interface):

```ts
export interface CssTheme {
  id: string
  name: string
  css: string
  createdAt: string
  updatedAt: string
}

export interface MarketplaceTheme {
  id: string
  name: string
  author: string
  description: string
  css: string
}
```

In the `ElectronAPI` interface, extend the `style` property:

```ts
style: {
  getThemeCss(theme: ThemeName): Promise<string>
  listThemes(): Promise<ThemeName[]>
  listCssThemes(): Promise<CssTheme[]>
  createCssTheme(name: string, css: string): Promise<CssTheme>
  updateCssTheme(id: string, name: string, css: string): Promise<CssTheme>
  deleteCssTheme(id: string): Promise<void>
  listMarketplaceThemes(): Promise<MarketplaceTheme[]>
}
```

Also add a `shell` section to `ElectronAPI`:
```ts
shell: {
  openExternal(url: string): Promise<void>
}
```

- [ ] **Step 2: Wire new IPC calls in preload/index.ts**

Replace the `style` section:
```ts
style: {
  getThemeCss: (theme) => ipcRenderer.invoke('style:get-theme-css', theme),
  listThemes: () => ipcRenderer.invoke('style:list-themes'),
  listCssThemes: () => ipcRenderer.invoke('style:list-css-themes'),
  createCssTheme: (name, css) => ipcRenderer.invoke('style:create-css-theme', name, css),
  updateCssTheme: (id, name, css) => ipcRenderer.invoke('style:update-css-theme', id, name, css),
  deleteCssTheme: (id) => ipcRenderer.invoke('style:delete-css-theme', id),
  listMarketplaceThemes: () => ipcRenderer.invoke('style:list-marketplace-themes')
},
```

Add the `shell` section:
```ts
shell: {
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url)
}
```

- [ ] **Step 3: Add IPC handlers in style.handlers.ts**

In `src/main/ipc/style.handlers.ts`, add imports and handlers:

```ts
import { ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import type { ThemeName } from '../../preload/types'
import { getThemeCss, getThemeNames } from '../pdf/themes'
import { cssThemeRepository } from '../db/repositories/cssTheme.repository'

export function registerStyleHandlers(): void {
  ipcMain.handle('style:get-theme-css', async (_event, theme: ThemeName) => {
    return getThemeCss(theme)
  })

  ipcMain.handle('style:list-themes', async () => {
    return getThemeNames()
  })

  ipcMain.handle('style:list-css-themes', async () => {
    return cssThemeRepository.findAll()
  })

  ipcMain.handle('style:create-css-theme', async (_event, name: string, css: string) => {
    if (!name.trim()) throw new Error('Theme name is required')
    return cssThemeRepository.create(name.trim(), css)
  })

  ipcMain.handle('style:update-css-theme', async (_event, id: string, name: string, css: string) => {
    if (!name.trim()) throw new Error('Theme name is required')
    return cssThemeRepository.update(id, name.trim(), css)
  })

  ipcMain.handle('style:delete-css-theme', async (_event, id: string) => {
    cssThemeRepository.delete(id)
  })

  ipcMain.handle('style:list-marketplace-themes', async () => {
    const marketplacePath = app.isPackaged
      ? path.join(process.resourcesPath, 'marketplace-themes.json')
      : path.join(app.getAppPath(), 'resources', 'marketplace-themes.json')
    try {
      const raw = fs.readFileSync(marketplacePath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return []
    }
  })
}
```

- [ ] **Step 4: Create shell.handlers.ts and register it**

```ts
// src/main/ipc/shell.handlers.ts
import { ipcMain, shell } from 'electron'

export function registerShellHandlers(): void {
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    // Only open https/http URLs to prevent arbitrary protocol execution
    if (!url.startsWith('https://') && !url.startsWith('http://')) return
    await shell.openExternal(url)
  })
}
```

In `src/main/ipc/index.ts`, add:
```ts
import { registerShellHandlers } from './shell.handlers'

export function registerAllHandlers(): void {
  registerTaskHandlers()
  registerFileHandlers()
  registerVersionHandlers()
  registerStyleHandlers()
  registerDialogHandlers()
  registerPdfHandlers()
  registerShellHandlers()
}
```

- [ ] **Step 5: Commit**

```bash
git add src/preload/types.ts \
        src/preload/index.ts \
        src/main/ipc/style.handlers.ts \
        src/main/ipc/shell.handlers.ts \
        src/main/ipc/index.ts
git commit -m "feat: add css_theme and shell IPC handlers, extend ElectronAPI types"
```

---

### Task 4: Named CSS presets UI in StylesPage

**Files:**
- Modify: `src/renderer/src/pages/StylesPage.tsx`

This task adds a "Presets" section to the StylesPage sidebar that lets users load saved CSS presets and save the current CSS as a new preset.

- [ ] **Step 1: Add preset state and handlers to StylesPage.tsx**

Add imports (after existing imports):
```tsx
import { Bookmark, BookmarkPlus, Store, Trash2 } from 'lucide-react'
import type { CssTheme, MarketplaceTheme } from '../../../preload/types'
```

Add state after existing state declarations:
```tsx
const [cssPresets, setCssPresets] = useState<CssTheme[]>([])
const [savePresetName, setSavePresetName] = useState('')
const [showSaveInput, setShowSaveInput] = useState(false)
const [showMarketplace, setShowMarketplace] = useState(false)
const [marketplaceThemes, setMarketplaceThemes] = useState<MarketplaceTheme[]>([])
const [savingPreset, setSavingPreset] = useState(false)
```

Load presets on mount:
```tsx
useEffect(() => {
  window.electronAPI.style.listCssThemes().then(setCssPresets)
}, [])
```

Add handlers after `handleSelectOutputDir`:
```tsx
const handleLoadPreset = (css: string): void => {
  setCustomCss(css)
}

const handleSavePreset = async (): Promise<void> => {
  if (!savePresetName.trim()) return
  setSavingPreset(true)
  try {
    const created = await window.electronAPI.style.createCssTheme(savePresetName.trim(), customCss)
    setCssPresets((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    setSavePresetName('')
    setShowSaveInput(false)
    toast.success(`Preset "${created.name}" saved`)
  } catch (err) {
    toast.error('Failed to save preset')
    console.error(err)
  } finally {
    setSavingPreset(false)
  }
}

const handleDeletePreset = async (id: string, name: string): Promise<void> => {
  try {
    await window.electronAPI.style.deleteCssTheme(id)
    setCssPresets((prev) => prev.filter((p) => p.id !== id))
    toast.success(`Preset "${name}" deleted`)
  } catch (err) {
    toast.error('Failed to delete preset')
    console.error(err)
  }
}

const handleOpenMarketplace = async (): Promise<void> => {
  const themes = await window.electronAPI.style.listMarketplaceThemes()
  setMarketplaceThemes(themes)
  setShowMarketplace(true)
}

const handleInstallMarketplaceTheme = async (t: MarketplaceTheme): Promise<void> => {
  try {
    const created = await window.electronAPI.style.createCssTheme(t.name, t.css)
    setCssPresets((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    toast.success(`"${t.name}" installed`)
  } catch (err) {
    toast.error('Failed to install theme — a preset with this name may already exist')
    console.error(err)
  }
}
```

- [ ] **Step 2: Add Presets UI section to the sidebar**

In the return JSX, insert this block BEFORE the `{/* Custom CSS */}` section and AFTER the Output Directory section:

```tsx
{/* CSS Presets */}
<div>
  <div className="flex items-center justify-between mb-2">
    <label className="text-xs font-medium text-muted-foreground">CSS Presets</label>
    <div className="flex gap-1">
      <button
        onClick={handleOpenMarketplace}
        title="Browse community themes"
        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <Store className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setShowSaveInput(!showSaveInput)}
        title="Save current CSS as preset"
        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <BookmarkPlus className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>

  {showSaveInput && (
    <div className="flex gap-1.5 mb-2">
      <Input
        value={savePresetName}
        onChange={(e) => setSavePresetName(e.target.value)}
        placeholder="Preset name..."
        className="h-7 text-xs flex-1"
        onKeyDown={(e) => { if (e.key === 'Enter') handleSavePreset() }}
        autoFocus
      />
      <Button size="sm" className="h-7 px-2" onClick={handleSavePreset} disabled={!savePresetName.trim() || savingPreset}>
        Save
      </Button>
    </div>
  )}

  {cssPresets.length === 0 ? (
    <p className="text-xs text-muted-foreground italic">No presets saved yet.</p>
  ) : (
    <div className="space-y-1">
      {cssPresets.map((preset) => (
        <div key={preset.id} className="flex items-center gap-1 group">
          <button
            onClick={() => handleLoadPreset(preset.css)}
            className="flex-1 text-left text-xs px-2 py-1 rounded hover:bg-accent transition-colors truncate flex items-center gap-1.5"
          >
            <Bookmark className="w-3 h-3 shrink-0 text-muted-foreground" />
            {preset.name}
          </button>
          <button
            onClick={() => handleDeletePreset(preset.id, preset.name)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )}
</div>

{/* Marketplace modal */}
{showMarketplace && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-background border rounded-xl shadow-xl w-[480px] max-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h3 className="font-semibold text-sm">Community Themes</h3>
        <button
          onClick={() => setShowMarketplace(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="overflow-auto p-4 space-y-3">
        {marketplaceThemes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No community themes available.</p>
        ) : (
          marketplaceThemes.map((t) => (
            <div key={t.id} className="border rounded-lg p-3 space-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">by {t.author}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleInstallMarketplaceTheme(t)}
                >
                  Install
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Also add "Load Preset" to QuickConvertPage**

In `src/renderer/src/pages/QuickConvertPage.tsx`, add state and effect:
```tsx
const [cssPresets, setCssPresets] = useState<CssTheme[]>([])
```

Add import: `import type { CssTheme } from '../../../preload/types'`

Add effect:
```tsx
useEffect(() => {
  window.electronAPI.style.listCssThemes().then(setCssPresets)
}, [])
```

In the collapsible settings panel, add a preset selector before the CssEditor:
```tsx
{cssPresets.length > 0 && (
  <div className="flex items-center gap-2 mb-1">
    <label className="text-xs text-muted-foreground whitespace-nowrap">Load preset:</label>
    <select
      className="text-xs border border-input rounded px-2 py-1 bg-background flex-1"
      defaultValue=""
      onChange={(e) => {
        const preset = cssPresets.find((p) => p.id === e.target.value)
        if (preset) setCustomCss(preset.css)
        e.target.value = ''
      }}
    >
      <option value="" disabled>— select —</option>
      {cssPresets.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  </div>
)}
```

- [ ] **Step 4: Run the app and verify end-to-end**

```bash
npm run dev
```

Expected:
1. StylesPage sidebar shows "CSS Presets" section with a bookmark-plus icon and store icon
2. Clicking bookmark-plus shows a name input; entering a name and pressing Enter saves it
3. The saved preset appears in the list; clicking it loads its CSS into the CssEditor and updates the preview
4. Clicking the store icon opens the marketplace modal (empty until Task 11 adds the JSON file)
5. QuickConvertPage "More" panel shows the preset selector when presets exist

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/pages/StylesPage.tsx \
        src/renderer/src/pages/QuickConvertPage.tsx
git commit -m "feat: add named CSS preset save/load UI to StylesPage and QuickConvert"
```

---

## M1 — Batch + History: End-to-End Tested

---

### Task 5: Vitest setup + test database helper

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/main/db/__tests__/helpers.ts`

- [ ] **Step 1: Add vitest to package.json**

Add to `devDependencies` (run this command, then verify the entries appear):
```bash
npm install --save-dev vitest @vitest/coverage-v8
```

Add to `scripts`:
```json
"test": "vitest run --config vitest.config.ts",
"test:watch": "vitest --config vitest.config.ts",
"test:coverage": "vitest run --config vitest.config.ts --coverage"
```

- [ ] **Step 2: Write vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/main/**/*.test.ts'],
    globals: false
  }
})
```

- [ ] **Step 3: Write test database helper**

```ts
// src/main/db/__tests__/helpers.ts
import Database from 'better-sqlite3'
import { migration001 } from '../migrations/001_initial'
import { migration002 } from '../migrations/002_css_themes'

export function createTestDb(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(migration001)
  db.exec(migration002)
  return db
}
```

- [ ] **Step 4: Verify vitest runs (no tests yet, just confirm config is valid)**

```bash
npm test
```

Expected: exits with code 0, output says "No test files found".

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json src/main/db/__tests__/helpers.ts
git commit -m "test: add vitest config and test database helper"
```

---

### Task 6: taskRepository unit tests

**Files:**
- Create: `src/main/db/__tests__/task.repository.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/main/db/__tests__/task.repository.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDb } from './helpers'

let testDb: Database.Database

vi.mock('../database', () => ({
  getDb: () => testDb
}))

const { taskRepository } = await import('../repositories/task.repository')

beforeEach(() => {
  testDb = createTestDb()
})

afterEach(() => {
  testDb.close()
})

describe('taskRepository', () => {
  describe('create', () => {
    it('creates a task with defaults', () => {
      const task = taskRepository.create({ name: 'Test Task' })
      expect(task.id).toMatch(/^[0-9a-f-]{36}$/)
      expect(task.name).toBe('Test Task')
      expect(task.status).toBe('active')
      expect(task.theme).toBe('github')
      expect(task.pageSize).toBe('A4')
      expect(task.customCss).toBe('')
      expect(task.outputDir).toBe('')
      expect(task.marginTop).toBe(20)
      expect(task.fileCount).toBe(0)
    })

    it('creates a task with specified theme and pageSize', () => {
      const task = taskRepository.create({ name: 'T', theme: 'academic', pageSize: 'Letter' })
      expect(task.theme).toBe('academic')
      expect(task.pageSize).toBe('Letter')
    })
  })

  describe('findAll', () => {
    it('returns empty array when no tasks', () => {
      expect(taskRepository.findAll()).toEqual([])
    })

    it('returns tasks ordered by updated_at DESC', () => {
      const a = taskRepository.create({ name: 'A' })
      const b = taskRepository.create({ name: 'B' })
      const all = taskRepository.findAll()
      expect(all[0].id).toBe(b.id)
      expect(all[1].id).toBe(a.id)
    })
  })

  describe('findById', () => {
    it('returns null for unknown id', () => {
      expect(taskRepository.findById('nonexistent')).toBeNull()
    })

    it('returns the task for a known id', () => {
      const created = taskRepository.create({ name: 'X' })
      const found = taskRepository.findById(created.id)
      expect(found?.id).toBe(created.id)
      expect(found?.name).toBe('X')
    })
  })

  describe('update', () => {
    it('updates specified fields', () => {
      const task = taskRepository.create({ name: 'Old' })
      const updated = taskRepository.update(task.id, { name: 'New', customCss: 'body {}' })
      expect(updated.name).toBe('New')
      expect(updated.customCss).toBe('body {}')
      expect(updated.status).toBe('active')
    })

    it('does not change unspecified fields', () => {
      const task = taskRepository.create({ name: 'Keep', theme: 'minimal' })
      const updated = taskRepository.update(task.id, { customCss: 'h1 {}' })
      expect(updated.theme).toBe('minimal')
      expect(updated.name).toBe('Keep')
    })
  })

  describe('delete', () => {
    it('removes the task', () => {
      const task = taskRepository.create({ name: 'Del' })
      taskRepository.delete(task.id)
      expect(taskRepository.findById(task.id)).toBeNull()
    })
  })

  describe('setComplete', () => {
    it('sets task status to completed', () => {
      const task = taskRepository.create({ name: 'Done' })
      const completed = taskRepository.setComplete(task.id)
      expect(completed.status).toBe('completed')
    })
  })
})
```

- [ ] **Step 2: Run tests, watch them fail**

```bash
npm test
```

Expected: FAIL — because the dynamic import pattern (`await import(...)`) after `vi.mock` may need adjustment. If the tests fail due to module resolution, adjust the import to use `import { taskRepository } from '../repositories/task.repository'` at the top (vitest hoists `vi.mock` calls so the mock is in place before static imports).

Corrected pattern if needed:

```ts
// Replace the await import with a static import — vitest hoists vi.mock before all imports
import { taskRepository } from '../repositories/task.repository'
```

- [ ] **Step 3: Verify tests pass**

```bash
npm test
```

Expected: PASS — all 8 task repository tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/main/db/__tests__/task.repository.test.ts
git commit -m "test: add taskRepository unit tests"
```

---

### Task 7: fileRepository + versionRepository unit tests

**Files:**
- Create: `src/main/db/__tests__/file.repository.test.ts`
- Create: `src/main/db/__tests__/version.repository.test.ts`

- [ ] **Step 1: Write fileRepository tests**

```ts
// src/main/db/__tests__/file.repository.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDb } from './helpers'

let testDb: Database.Database

vi.mock('../database', () => ({
  getDb: () => testDb
}))

import { taskRepository } from '../repositories/task.repository'
import { fileRepository } from '../repositories/file.repository'

beforeEach(() => {
  testDb = createTestDb()
})

afterEach(() => {
  testDb.close()
})

function makeTask(): string {
  return taskRepository.create({ name: 'T' }).id
}

describe('fileRepository', () => {
  describe('create', () => {
    it('creates a file with draft status', () => {
      const taskId = makeTask()
      const file = fileRepository.create({ taskId, filename: 'a.md', content: '# Hello' })
      expect(file.id).toMatch(/^[0-9a-f-]{36}$/)
      expect(file.taskId).toBe(taskId)
      expect(file.filename).toBe('a.md')
      expect(file.content).toBe('# Hello')
      expect(file.status).toBe('draft')
      expect(file.sortOrder).toBe(0)
    })

    it('increments sort_order for subsequent files', () => {
      const taskId = makeTask()
      const a = fileRepository.create({ taskId, filename: 'a.md', content: '' })
      const b = fileRepository.create({ taskId, filename: 'b.md', content: '' })
      expect(a.sortOrder).toBe(0)
      expect(b.sortOrder).toBe(1)
    })
  })

  describe('findByTask', () => {
    it('returns files ordered by sort_order', () => {
      const taskId = makeTask()
      fileRepository.create({ taskId, filename: 'a.md', content: '' })
      fileRepository.create({ taskId, filename: 'b.md', content: '' })
      const files = fileRepository.findByTask(taskId)
      expect(files.map((f) => f.filename)).toEqual(['a.md', 'b.md'])
    })

    it('returns empty array for task with no files', () => {
      const taskId = makeTask()
      expect(fileRepository.findByTask(taskId)).toEqual([])
    })
  })

  describe('update', () => {
    it('updates content and status', () => {
      const taskId = makeTask()
      const file = fileRepository.create({ taskId, filename: 'x.md', content: 'old' })
      const updated = fileRepository.update(file.id, { content: 'new', status: 'ready' })
      expect(updated.content).toBe('new')
      expect(updated.status).toBe('ready')
    })
  })

  describe('setStatus', () => {
    it('sets the status field', () => {
      const taskId = makeTask()
      const file = fileRepository.create({ taskId, filename: 'f.md', content: '' })
      const updated = fileRepository.setStatus(file.id, 'converted')
      expect(updated.status).toBe('converted')
    })
  })

  describe('delete', () => {
    it('removes the file', () => {
      const taskId = makeTask()
      const file = fileRepository.create({ taskId, filename: 'del.md', content: '' })
      fileRepository.delete(file.id)
      expect(fileRepository.findById(file.id)).toBeNull()
    })
  })

  describe('createMany', () => {
    it('creates multiple files in a transaction', () => {
      const taskId = makeTask()
      const inputs = [
        { taskId, filename: 'one.md', content: '1' },
        { taskId, filename: 'two.md', content: '2' }
      ]
      const files = fileRepository.createMany(inputs)
      expect(files).toHaveLength(2)
      expect(fileRepository.findByTask(taskId)).toHaveLength(2)
    })
  })
})
```

- [ ] **Step 2: Write versionRepository tests**

```ts
// src/main/db/__tests__/version.repository.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDb } from './helpers'

let testDb: Database.Database

vi.mock('../database', () => ({
  getDb: () => testDb
}))

import { taskRepository } from '../repositories/task.repository'
import { fileRepository } from '../repositories/file.repository'
import { versionRepository } from '../repositories/version.repository'

beforeEach(() => {
  testDb = createTestDb()
})

afterEach(() => {
  testDb.close()
})

function makeFile(): string {
  const taskId = taskRepository.create({ name: 'T' }).id
  return fileRepository.create({ taskId, filename: 'f.md', content: 'v1' }).id
}

describe('versionRepository', () => {
  describe('create', () => {
    it('creates a version with auto label v1', () => {
      const fileId = makeFile()
      const v = versionRepository.create(fileId, 'content')
      expect(v.label).toBe('v1')
      expect(v.content).toBe('content')
      expect(v.fileId).toBe(fileId)
    })

    it('increments label for subsequent versions', () => {
      const fileId = makeFile()
      versionRepository.create(fileId, 'a')
      const v2 = versionRepository.create(fileId, 'b')
      expect(v2.label).toBe('v2')
    })

    it('uses provided label when given', () => {
      const fileId = makeFile()
      const v = versionRepository.create(fileId, 'x', 'Initial')
      expect(v.label).toBe('Initial')
    })
  })

  describe('findByFile', () => {
    it('returns versions ordered by created_at DESC', () => {
      const fileId = makeFile()
      versionRepository.create(fileId, 'first')
      versionRepository.create(fileId, 'second')
      const versions = versionRepository.findByFile(fileId)
      expect(versions[0].content).toBe('second')
      expect(versions[1].content).toBe('first')
    })
  })

  describe('getLatest', () => {
    it('returns null when no versions exist', () => {
      const fileId = makeFile()
      expect(versionRepository.getLatest(fileId)).toBeNull()
    })

    it('returns the most recent version', () => {
      const fileId = makeFile()
      versionRepository.create(fileId, 'old')
      versionRepository.create(fileId, 'new')
      const latest = versionRepository.getLatest(fileId)
      expect(latest?.content).toBe('new')
    })
  })
})
```

- [ ] **Step 3: Run tests, verify all pass**

```bash
npm test
```

Expected: All file and version repository tests pass alongside task repository tests.

- [ ] **Step 4: Commit**

```bash
git add src/main/db/__tests__/file.repository.test.ts \
        src/main/db/__tests__/version.repository.test.ts
git commit -m "test: add fileRepository and versionRepository unit tests"
```

---

### Task 8: cssThemeRepository + html-builder unit tests

**Files:**
- Create: `src/main/db/__tests__/cssTheme.repository.test.ts`
- Create: `src/main/pdf/__tests__/html-builder.test.ts`

- [ ] **Step 1: Write cssTheme repository tests**

```ts
// src/main/db/__tests__/cssTheme.repository.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDb } from './helpers'

let testDb: Database.Database

vi.mock('../database', () => ({
  getDb: () => testDb
}))

import { cssThemeRepository } from '../repositories/cssTheme.repository'

beforeEach(() => {
  testDb = createTestDb()
})

afterEach(() => {
  testDb.close()
})

describe('cssThemeRepository', () => {
  describe('create', () => {
    it('creates a theme with the given name and css', () => {
      const theme = cssThemeRepository.create('Dark Mode', 'body { background: #000 }')
      expect(theme.id).toMatch(/^[0-9a-f-]{36}$/)
      expect(theme.name).toBe('Dark Mode')
      expect(theme.css).toBe('body { background: #000 }')
    })
  })

  describe('findAll', () => {
    it('returns empty array when no themes', () => {
      expect(cssThemeRepository.findAll()).toEqual([])
    })

    it('returns themes ordered alphabetically by name', () => {
      cssThemeRepository.create('Zebra', '')
      cssThemeRepository.create('Apple', '')
      const all = cssThemeRepository.findAll()
      expect(all.map((t) => t.name)).toEqual(['Apple', 'Zebra'])
    })
  })

  describe('update', () => {
    it('updates name and css', () => {
      const theme = cssThemeRepository.create('Old', 'p {}')
      const updated = cssThemeRepository.update(theme.id, 'New', 'h1 {}')
      expect(updated.name).toBe('New')
      expect(updated.css).toBe('h1 {}')
    })
  })

  describe('delete', () => {
    it('removes the theme', () => {
      const theme = cssThemeRepository.create('Gone', '')
      cssThemeRepository.delete(theme.id)
      expect(cssThemeRepository.findById(theme.id)).toBeNull()
    })
  })
})
```

- [ ] **Step 2: Write html-builder tests**

First, create the directory:
```bash
mkdir -p src/main/pdf/__tests__
```

```ts
// src/main/pdf/__tests__/html-builder.test.ts
import { describe, it, expect } from 'vitest'
import { buildHtml } from '../html-builder'

describe('buildHtml', () => {
  it('produces a DOCTYPE html document', () => {
    const html = buildHtml('# Hello', '', '')
    expect(html).toMatch(/^<!DOCTYPE html>/)
    expect(html).toContain('<html>')
    expect(html).toContain('</html>')
  })

  it('wraps body in .markdown-body div', () => {
    const html = buildHtml('text', '', '')
    expect(html).toContain('<div class="markdown-body">')
  })

  it('includes theme CSS in a style block', () => {
    const html = buildHtml('', 'body { color: red; }', '')
    expect(html).toContain('body { color: red; }')
  })

  it('includes custom CSS after theme CSS', () => {
    const html = buildHtml('', 'body {}', 'h1 { font-size: 2em }')
    const themeIndex = html.indexOf('body {}')
    const customIndex = html.indexOf('h1 { font-size: 2em }')
    expect(themeIndex).toBeGreaterThan(-1)
    expect(customIndex).toBeGreaterThan(themeIndex)
  })

  it('converts markdown heading to h1 tag', () => {
    const html = buildHtml('# My Title', '', '')
    expect(html).toContain('<h1>My Title</h1>')
  })

  it('converts markdown bold to strong tag', () => {
    const html = buildHtml('**bold**', '', '')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('handles empty markdown without throwing', () => {
    expect(() => buildHtml('', '', '')).not.toThrow()
  })
})
```

- [ ] **Step 3: Run all tests, verify they pass**

```bash
npm test
```

Expected: All tests across all test files pass. Count: roughly 25–30 test cases total.

- [ ] **Step 4: Commit**

```bash
git add src/main/db/__tests__/cssTheme.repository.test.ts \
        src/main/pdf/__tests__/html-builder.test.ts
git commit -m "test: add cssThemeRepository and html-builder unit tests"
```

---

## M2 — Distribution + Polish

---

### Task 9: Feedback button in Header

**Files:**
- Modify: `src/renderer/src/components/layout/Header.tsx`

The `shell:open-external` IPC handler was added in Task 3. This task wires it to a button in the Header.

No unit test — this is a single-line UI change calling an IPC method.

- [ ] **Step 1: Add Feedback button to Header.tsx**

Add import (add `MessageSquare` to lucide imports):
```tsx
import { FileText, ChevronLeft, Moon, Sun, Zap, MessageSquare } from 'lucide-react'
```

Add feedback button before the dark mode toggle button (inside the header, after the Quick Convert button):
```tsx
<button
  onClick={() => window.electronAPI.shell.openExternal('https://github.com/your-org/md-to-pdf/issues/new?template=bug_report.md')}
  className="p-1.5 rounded-md hover:bg-accent transition-colors"
  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
  title="Send feedback"
>
  <MessageSquare className="w-4 h-4 text-muted-foreground" />
</button>
```

Replace `'https://github.com/your-org/md-to-pdf/issues/new?template=bug_report.md'` with the actual GitHub issues URL once the repo is public. For now the URL is a placeholder — the `shell:open-external` handler validates `https://` prefix so this will work correctly.

- [ ] **Step 2: Run the app and verify**

```bash
npm run dev
```

Expected: A message-square icon appears in the header. Clicking it opens the GitHub issues URL in the user's default browser.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/layout/Header.tsx
git commit -m "feat: add feedback button to header, opens GitHub issues in browser"
```

---

### Task 10: Notarization config

**Files:**
- Modify: `electron-builder.yml`
- Modify: `package.json` — update `dist` script
- Create: `build/notarize.mjs`

This task sets up the scaffold. Actual notarization requires Apple Developer credentials set as environment variables — those are not committed; the developer must set them.

- [ ] **Step 1: Install @electron/notarize**

```bash
npm install --save-dev @electron/notarize
```

- [ ] **Step 2: Create build/notarize.mjs**

```js
// build/notarize.mjs
import { notarize } from '@electron/notarize'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'))

export default async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename
  const appPath = join(appOutDir, `${appName}.app`)

  const appleId = process.env.APPLE_ID
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD
  const teamId = process.env.APPLE_TEAM_ID

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn('[notarize] Skipping — APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID not set')
    return
  }

  console.log(`[notarize] Notarizing ${pkg.name} (${appPath})`)
  await notarize({ appPath, appleId, appleIdPassword, teamId })
}
```

- [ ] **Step 3: Update electron-builder.yml**

Replace the contents of `electron-builder.yml` with:
```yaml
appId: com.md-to-pdf.app
productName: MD to PDF
directories:
  buildResources: resources
  output: dist
files:
  - out/**/*
  - resources/icon.png
  - resources/marketplace-themes.json
asarUnpack:
  - node_modules/better-sqlite3/**
mac:
  icon: resources/icon.icns
  category: public.app-category.productivity
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  target:
    - target: dmg
      arch:
        - arm64
        - x64
afterSign: build/notarize.mjs
```

- [ ] **Step 4: Create entitlements plist**

```bash
mkdir -p /Users/jboho/Code/md-to-pdf/build
```

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

Save that as `build/entitlements.mac.plist`.

- [ ] **Step 5: Update dist script in package.json**

Change the `dist` script to:
```json
"dist": "npm run build && electron-builder --mac --config electron-builder.yml"
```

This is unchanged from before. The notarization now happens automatically via the `afterSign` hook when `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` are set in the environment.

- [ ] **Step 6: Build without notarization to verify the pipeline works**

```bash
npm run dist
```

Expected: A `.dmg` file appears in `dist/`. The `[notarize] Skipping` warning appears in the build log (credentials not set in dev environment). If the build fails due to code signing issues on a non-Apple-developer machine, that is expected and acceptable — the scaffold is correct.

- [ ] **Step 7: Commit**

```bash
git add electron-builder.yml build/notarize.mjs build/entitlements.mac.plist package.json
git commit -m "feat: add notarization scaffold (afterSign hook, entitlements, dual-arch build)"
```

---

### Task 11: Theme marketplace JSON

**Files:**
- Create: `resources/marketplace-themes.json`

This provides the static bundled community themes that the StylesPage marketplace modal (Task 4) reads via IPC.

No unit test — this is a static data file; correctness is confirmed by loading it in the app.

- [ ] **Step 1: Create the JSON file**

```json
[
  {
    "id": "nord",
    "name": "Nord",
    "author": "Arctic Ice Studio",
    "description": "A cool, blue-tinted theme inspired by the Nordic wilderness.",
    "css": ".markdown-body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; line-height: 1.7; color: #2e3440; padding: 2em; } .markdown-body h1, .markdown-body h2 { color: #2e3440; border-bottom: 1px solid #d8dee9; padding-bottom: 0.3em; } .markdown-body h1 { font-size: 2em; } .markdown-body h2 { font-size: 1.5em; } .markdown-body h3 { color: #4c566a; font-size: 1.25em; } .markdown-body a { color: #5e81ac; } .markdown-body code { background: #eceff4; color: #bf616a; padding: 0.2em 0.4em; border-radius: 4px; font-size: 90%; } .markdown-body pre { background: #3b4252; color: #d8dee9; border-radius: 6px; padding: 1em; overflow: auto; } .markdown-body pre code { background: transparent; color: inherit; } .markdown-body blockquote { border-left: 4px solid #81a1c1; color: #4c566a; margin: 1em 0; padding: 0 1em; } .markdown-body table { border-collapse: collapse; width: 100%; } .markdown-body th, .markdown-body td { border: 1px solid #d8dee9; padding: 6px 12px; } .markdown-body th { background: #eceff4; } .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 1em 0; }"
  },
  {
    "id": "solarized",
    "name": "Solarized Light",
    "author": "Ethan Schoonover",
    "description": "The classic Solarized Light palette for a warm, low-contrast reading experience.",
    "css": ".markdown-body { font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.75; color: #586e75; background: #fdf6e3; padding: 2em; } .markdown-body h1, .markdown-body h2 { color: #073642; border-bottom: 1px solid #eee8d5; padding-bottom: 0.3em; } .markdown-body h1 { font-size: 2em; } .markdown-body h2 { font-size: 1.5em; } .markdown-body a { color: #268bd2; } .markdown-body code { background: #eee8d5; color: #dc322f; padding: 0.15em 0.4em; border-radius: 3px; font-size: 90%; } .markdown-body pre { background: #eee8d5; color: #657b83; border-radius: 4px; padding: 1em; overflow: auto; } .markdown-body pre code { background: transparent; color: inherit; } .markdown-body blockquote { border-left: 4px solid #93a1a1; color: #93a1a1; margin: 1em 0; padding: 0 1em; } .markdown-body table { border-collapse: collapse; width: 100%; } .markdown-body th, .markdown-body td { border: 1px solid #eee8d5; padding: 6px 12px; } .markdown-body th { background: #eee8d5; } .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 1em 0; }"
  },
  {
    "id": "tokyo-night",
    "name": "Tokyo Night",
    "author": "Community",
    "description": "Dark theme with deep blues and soft purples for night-time reading.",
    "css": ".markdown-body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; line-height: 1.7; color: #a9b1d6; background: #1a1b26; padding: 2em; } .markdown-body h1, .markdown-body h2 { color: #c0caf5; border-bottom: 1px solid #292e42; padding-bottom: 0.3em; } .markdown-body h1 { font-size: 2em; } .markdown-body h2 { font-size: 1.5em; } .markdown-body h3 { color: #bb9af7; font-size: 1.25em; } .markdown-body a { color: #7aa2f7; } .markdown-body code { background: #292e42; color: #e0af68; padding: 0.2em 0.4em; border-radius: 4px; font-size: 90%; } .markdown-body pre { background: #16161e; color: #a9b1d6; border-radius: 6px; padding: 1em; overflow: auto; } .markdown-body pre code { background: transparent; color: inherit; } .markdown-body blockquote { border-left: 4px solid #7aa2f7; color: #565f89; margin: 1em 0; padding: 0 1em; } .markdown-body table { border-collapse: collapse; width: 100%; } .markdown-body th, .markdown-body td { border: 1px solid #292e42; padding: 6px 12px; } .markdown-body th { background: #292e42; } .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 1em 0; }"
  },
  {
    "id": "legal",
    "name": "Legal Brief",
    "author": "Community",
    "description": "Times New Roman, double-spaced, centered headings — standard US legal document format.",
    "css": ".markdown-body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 2; color: #000; padding: 1in; } .markdown-body h1 { font-size: 14pt; text-transform: uppercase; text-align: center; margin: 2em 0 1em; letter-spacing: 0.05em; } .markdown-body h2 { font-size: 12pt; text-align: center; margin: 1.5em 0 1em; font-weight: bold; } .markdown-body h3 { font-size: 12pt; margin: 1.2em 0 0.5em; font-weight: bold; text-decoration: underline; } .markdown-body p { text-indent: 0.5in; margin: 0; } .markdown-body a { color: #000; text-decoration: underline; } .markdown-body code, .markdown-body pre { font-family: 'Courier New', Courier, monospace; font-size: 10pt; } .markdown-body table { border-collapse: collapse; width: 100%; } .markdown-body th, .markdown-body td { border: 1px solid #000; padding: 4px 8px; text-align: left; } .markdown-body ul, .markdown-body ol { padding-left: 1in; margin: 0.5em 0; }"
  },
  {
    "id": "technical-report",
    "name": "Technical Report",
    "author": "Community",
    "description": "Clean sans-serif with numbered-style headings and a subtle blue accent line.",
    "css": ".markdown-body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a2e; padding: 2em; } .markdown-body h1 { font-size: 20pt; color: #16213e; border-bottom: 3px solid #0f3460; padding-bottom: 0.4em; margin: 1em 0 0.5em; } .markdown-body h2 { font-size: 14pt; color: #0f3460; margin: 1.5em 0 0.5em; } .markdown-body h3 { font-size: 12pt; color: #533483; margin: 1.2em 0 0.4em; } .markdown-body p { margin: 0.75em 0; } .markdown-body a { color: #0f3460; } .markdown-body code { background: #f0f4f8; color: #c53030; padding: 0.15em 0.4em; border-radius: 3px; font-size: 90%; font-family: 'Courier New', monospace; } .markdown-body pre { background: #f0f4f8; border-left: 4px solid #0f3460; padding: 1em; overflow: auto; margin: 1.5em 0; } .markdown-body pre code { background: transparent; color: #2d3748; } .markdown-body table { border-collapse: collapse; width: 100%; margin: 1.5em 0; } .markdown-body th { background: #0f3460; color: #fff; padding: 8px 12px; text-align: left; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.05em; } .markdown-body td { border: 1px solid #e2e8f0; padding: 6px 12px; } .markdown-body tr:nth-child(even) { background: #f7fafc; } .markdown-body ul, .markdown-body ol { padding-left: 1.5em; margin: 0.75em 0; } .markdown-body blockquote { border-left: 4px solid #0f3460; background: #f7fafc; padding: 0.5em 1em; margin: 1.5em 0; color: #4a5568; }"
  }
]
```

- [ ] **Step 2: Run the app and verify**

```bash
npm run dev
```

Open StylesPage → click the store icon → Community Themes modal should show 5 themes. Click "Install" on one → it appears in the Presets list.

- [ ] **Step 3: Commit**

```bash
git add resources/marketplace-themes.json
git commit -m "feat: add 5 bundled community themes to marketplace JSON"
```

---

### Task 12: ROADMAP.md — mark M0 and M1 complete

**Files:**
- Modify: `ROADMAP.md`

- [ ] **Step 1: Update ROADMAP.md checkboxes**

Replace the current ROADMAP.md content:
```markdown
# Roadmap — md-to-pdf

> Goal: An Electron desktop app for batch Markdown→PDF conversion with a built-in editor, live preview, CSS theme customization, and per-document version history.

## Current next action
- [x] M0 shipped — Themes editor complete
- [ ] Publish to GitHub, set up CI, gather user feedback

## Milestones
- [x] M0 — Themes editor: in-app CSS editor, theme persistence, live-preview sync; all pages (Dashboard, Editor, QuickConvert, Styles, Versions) functional
- [x] M1 — Batch + history: multi-file input, per-document version tracking in the UI, quick-convert from dashboard, end-to-end tested
- [ ] M2 — Distribution + polish: notarized .dmg (or App Store), user feedback loop, optional theme-marketplace skeleton

## M2 status
- [x] Notarization scaffold (afterSign hook, entitlements, dual-arch)
- [x] Feedback button (Header → GitHub Issues)
- [x] Theme marketplace skeleton (5 bundled community themes, install to saved presets)
- [ ] Code signing certificate configured (requires Apple Developer account + Keychain setup)
- [ ] Published GitHub repo + Issues template
- [ ] App Store submission (optional — use dmg distribution for now)

## Notes
- Notarization requires: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID env vars at build time
- Marketplace themes are currently static (resources/marketplace-themes.json); can be extended to fetch from a remote URL
```

- [ ] **Step 2: Commit**

```bash
git add ROADMAP.md
git commit -m "docs: update ROADMAP — M0 and M1 complete, M2 scaffolded"
```

---

## Spec Coverage Check

| Requirement | Task(s) |
|-------------|---------|
| M0: in-app CSS editor | Task 1 (CssEditor component) |
| M0: theme persistence to SQLite | Tasks 2–3 (migration, repo, IPC) |
| M0: live-preview sync | Already working; Task 1 preserves it |
| M0: all pages functional | All pages existed; Tasks 1+4 complete StylesPage + QuickConvert |
| M1: multi-file input | Already working (FileUploadZone, importFromDisk) |
| M1: per-document version tracking in UI | Already working (VersionsPage + FileList link) |
| M1: quick-convert from dashboard | Already working (Dashboard "Quick Convert" button) |
| M1: end-to-end tested | Tasks 5–8 (vitest + 4 test files) |
| M2: notarized .dmg | Task 10 (scaffold; creds must be set separately) |
| M2: user feedback loop | Task 9 (feedback button → GitHub Issues) |
| M2: theme-marketplace skeleton | Tasks 11 + Task 4 marketplace modal |
