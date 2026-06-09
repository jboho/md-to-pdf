import { useState, useEffect, useCallback, useRef } from 'react'
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
import { Save, Loader2 } from 'lucide-react'
import MarkdownPreview from '@/components/editor/MarkdownPreview'
import { useTask } from '@/hooks/useTask'
import { toast } from 'sonner'
import type { ThemeName, PageSize } from '../../../preload/types'

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
  const [theme, setTheme] = useState<ThemeName>('github')
  const [pageSize, setPageSize] = useState<PageSize>('A4')
  const [marginTop, setMarginTop] = useState(20)
  const [marginRight, setMarginRight] = useState(20)
  const [marginBottom, setMarginBottom] = useState(20)
  const [marginLeft, setMarginLeft] = useState(20)
  const [customCss, setCustomCss] = useState('')
  const [themeCss, setThemeCss] = useState('')
  const [saving, setSaving] = useState(false)
  const cssTextareaRef = useRef<HTMLTextAreaElement>(null)

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

        {/* Custom CSS */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Custom CSS</label>
          <textarea
            ref={cssTextareaRef}
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            className="mt-2 w-full h-48 rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            placeholder=".markdown-body { ... }"
          />
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
    </div>
  )
}
