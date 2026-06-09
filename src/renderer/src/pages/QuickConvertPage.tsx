import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import MarkdownEditor from '@/components/editor/MarkdownEditor'
import MarkdownPreview from '@/components/editor/MarkdownPreview'
import { useThemeContext } from '@/components/ThemeProvider'
import { toast } from 'sonner'
import type { ThemeName, PageSize } from '../../../preload/types'

const defaultMarkdown = `# Hello World

Start typing or paste your markdown here...

## Features

- **Bold** and *italic* text
- [Links](https://example.com)
- Code blocks with syntax highlighting

\`\`\`javascript
console.log("Hello, PDF!");
\`\`\`

> Blockquotes work too.

| Column 1 | Column 2 |
|----------|----------|
| Cell A   | Cell B   |
`

export default function QuickConvertPage(): React.ReactElement {
  const { isDark } = useThemeContext()
  const [markdown, setMarkdown] = useState(defaultMarkdown)
  const [theme, setTheme] = useState<ThemeName>('github')
  const [pageSize, setPageSize] = useState<PageSize>('A4')
  const [marginTop, setMarginTop] = useState(20)
  const [marginRight, setMarginRight] = useState(20)
  const [marginBottom, setMarginBottom] = useState(20)
  const [marginLeft, setMarginLeft] = useState(20)
  const [customCss, setCustomCss] = useState('')
  const [themeCss, setThemeCss] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    window.electronAPI.style.getThemeCss(theme).then(setThemeCss)
  }, [theme])

  const combinedCss = themeCss + '\n' + customCss

  const handleGenerate = useCallback(async () => {
    if (!markdown.trim()) {
      toast.error('Nothing to convert — paste some markdown first')
      return
    }
    setGenerating(true)
    try {
      const result = await window.electronAPI.pdf.quickConvert({
        markdown,
        theme,
        customCss,
        pageSize,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft
      })
      if (result) {
        toast.success(`PDF saved to ${result}`)
      }
    } catch (err) {
      toast.error('Failed to generate PDF')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }, [markdown, theme, customCss, pageSize, marginTop, marginRight, marginBottom, marginLeft])

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="border-b border-border px-4 py-2 flex items-center gap-3 shrink-0">
        <h1 className="text-sm font-semibold">Quick Convert</h1>
        <div className="flex-1" />

        {/* Inline style controls */}
        <Select value={theme} onValueChange={(v) => setTheme(v as ThemeName)}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="github">GitHub</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="manuscript">Manuscript</SelectItem>
          </SelectContent>
        </Select>

        <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)}>
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4</SelectItem>
            <SelectItem value="Letter">Letter</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="A3">A3</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
          More
        </Button>

        <Button size="sm" className="h-8" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Generate PDF
        </Button>
      </div>

      {/* Collapsible settings */}
      {showSettings && (
        <div className="border-b border-border px-4 py-3 flex items-start gap-6 shrink-0 bg-muted/50">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Margins (mm)</label>
            <div className="flex gap-1.5">
              {[
                { label: 'T', value: marginTop, set: setMarginTop },
                { label: 'R', value: marginRight, set: setMarginRight },
                { label: 'B', value: marginBottom, set: setMarginBottom },
                { label: 'L', value: marginLeft, set: setMarginLeft }
              ].map(({ label, value, set }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-14 h-7 text-xs text-center"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Custom CSS</label>
            <textarea
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              className="mt-1 w-full h-16 rounded-md border border-input bg-transparent px-2 py-1 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              placeholder=".markdown-body { font-size: 14px; }"
            />
          </div>
        </div>
      )}

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-border overflow-hidden">
          <MarkdownEditor value={markdown} onChange={setMarkdown} darkMode={isDark} />
        </div>
        <div className="w-1/2 overflow-hidden bg-white">
          <MarkdownPreview content={markdown} customCss={combinedCss} pdfPreview />
        </div>
      </div>
    </div>
  )
}
