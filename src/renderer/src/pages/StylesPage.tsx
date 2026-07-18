import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Save, Loader2, Bookmark, BookmarkPlus, Store, Trash2 } from 'lucide-react'
import MarkdownPreview from '@/components/editor/MarkdownPreview'
import CssEditor from '@/components/editor/CssEditor'
import { useThemeContext } from '@/components/ThemeProvider'
import { useTask } from '@/hooks/useTask'
import { toast } from 'sonner'
import type { ThemeName, PageSize, CssTheme, MarketplaceTheme } from '../../../preload/types'

const sampleMarkdown = `# Sample Document

This is a **preview** of your PDF styling. It includes various markdown elements.

## Code Block

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Table

| Name | Value |
|------|-------|
| Alpha | 1 |
| Beta | 2 |
| Gamma | 3 |

## Blockquote

> This is a blockquote. It should be styled according to your theme.

## List

- First item
- Second item
  - Nested item
- Third item

---

*This is italic* and this is \`inline code\`.
`

export default function StylesPage(): React.ReactElement {
  const { taskId } = useParams<{ taskId: string }>()
  const { task, loading, refresh } = useTask(taskId)
  const { isDark } = useThemeContext()
  const [theme, setTheme] = useState<ThemeName>('github')
  const [pageSize, setPageSize] = useState<PageSize>('A4')
  const [marginTop, setMarginTop] = useState(20)
  const [marginRight, setMarginRight] = useState(20)
  const [marginBottom, setMarginBottom] = useState(20)
  const [marginLeft, setMarginLeft] = useState(20)
  const [customCss, setCustomCss] = useState('')
  const [themeCss, setThemeCss] = useState('')
  const [saving, setSaving] = useState(false)

  const [cssPresets, setCssPresets] = useState<CssTheme[]>([])
  const [savePresetName, setSavePresetName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [savingPreset, setSavingPreset] = useState(false)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [marketplaceThemes, setMarketplaceThemes] = useState<MarketplaceTheme[]>([])

  // Load task settings
  useEffect(() => {
    if (!task) return
    setTheme(task.theme)
    setPageSize(task.pageSize)
    setMarginTop(task.marginTop)
    setMarginRight(task.marginRight)
    setMarginBottom(task.marginBottom)
    setMarginLeft(task.marginLeft)
    setCustomCss(task.customCss)
  }, [task])

  // Load theme CSS
  useEffect(() => {
    window.electronAPI.style.getThemeCss(theme).then(setThemeCss)
  }, [theme])

  // Load saved CSS presets
  useEffect(() => {
    window.electronAPI.style.listCssThemes().then(setCssPresets)
  }, [])

  const handleSave = useCallback(async () => {
    if (!taskId) return
    setSaving(true)
    try {
      await window.electronAPI.task.update(taskId, {
        theme,
        pageSize,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        customCss
      })
      toast.success('Styles saved')
      refresh()
    } catch (err) {
      toast.error('Failed to save styles')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }, [taskId, theme, pageSize, marginTop, marginRight, marginBottom, marginLeft, customCss, refresh])

  const handleSelectOutputDir = async (): Promise<void> => {
    if (!taskId) return
    const dir = await window.electronAPI.dialog.selectOutputDir()
    if (dir) {
      await window.electronAPI.task.update(taskId, { outputDir: dir })
      toast.success('Output directory set')
      refresh()
    }
  }

  const handleLoadPreset = (css: string): void => {
    setCustomCss(css)
  }

  const handleSavePreset = async (): Promise<void> => {
    if (!savePresetName.trim()) return
    setSavingPreset(true)
    try {
      const created = await window.electronAPI.style.createCssTheme(
        savePresetName.trim(),
        customCss
      )
      setCssPresets((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setSavePresetName('')
      setShowSaveInput(false)
      toast.success(`Preset "${created.name}" saved`)
    } catch (err) {
      toast.error('Failed to save preset — a preset with this name may already exist')
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

  if (loading || !task) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const combinedCss = themeCss + '\n' + customCss

  return (
    <div className="flex h-full">
      {/* Settings panel */}
      <div className="w-80 border-r border-border overflow-auto shrink-0 p-4 space-y-6">
        <div>
          <h2 className="text-sm font-semibold mb-4">PDF Settings</h2>

          {/* Theme */}
          <div className="space-y-2 mb-4">
            <label className="text-xs font-medium text-muted-foreground">Theme</label>
            <Select value={theme} onValueChange={(v) => setTheme(v as ThemeName)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="manuscript">Manuscript</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page Size */}
          <div className="space-y-2 mb-4">
            <label className="text-xs font-medium text-muted-foreground">Page Size</label>
            <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="A3">A3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Margins */}
          <div className="space-y-2 mb-4">
            <label className="text-xs font-medium text-muted-foreground">Margins (mm)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Top</label>
                <Input
                  type="number"
                  value={marginTop}
                  onChange={(e) => setMarginTop(Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Right</label>
                <Input
                  type="number"
                  value={marginRight}
                  onChange={(e) => setMarginRight(Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bottom</label>
                <Input
                  type="number"
                  value={marginBottom}
                  onChange={(e) => setMarginBottom(Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Left</label>
                <Input
                  type="number"
                  value={marginLeft}
                  onChange={(e) => setMarginLeft(Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* Output Directory */}
          <div className="space-y-2 mb-4">
            <label className="text-xs font-medium text-muted-foreground">Output Directory</label>
            <div className="flex gap-2">
              <Input
                value={task.outputDir || 'Default (Documents)'}
                readOnly
                className="text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleSelectOutputDir}>
                Browse
              </Button>
            </div>
          </div>
        </div>

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePreset()
                }}
                autoFocus
              />
              <Button
                size="sm"
                className="h-7 px-2"
                onClick={handleSavePreset}
                disabled={!savePresetName.trim() || savingPreset}
              >
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
                    title="Delete preset"
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom CSS */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Custom CSS</label>
          <div className="mt-2">
            <CssEditor value={customCss} onChange={setCustomCss} darkMode={isDark} minHeight="12rem" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Styles
        </Button>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto bg-white">
        <MarkdownPreview content={sampleMarkdown} customCss={combinedCss} pdfPreview />
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
                title="Close"
              >
                <span aria-hidden>×</span>
              </button>
            </div>
            <div className="overflow-auto p-4 space-y-3">
              {marketplaceThemes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No community themes available.
                </p>
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
    </div>
  )
}
