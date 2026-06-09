import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Save, CheckCircle2, Loader2 } from 'lucide-react'
import MarkdownEditor from '@/components/editor/MarkdownEditor'
import MarkdownPreview from '@/components/editor/MarkdownPreview'
import FileStatusBadge from '@/components/task/FileStatusBadge'
import { useThemeContext } from '@/components/ThemeProvider'
import { toast } from 'sonner'
import type { TaskFile, Task } from '../../../preload/types'

export default function EditorPage(): React.ReactElement {
  const { taskId, fileId } = useParams<{ taskId: string; fileId: string }>()
  const { isDark } = useThemeContext()
  const [file, setFile] = useState<TaskFile | null>(null)
  const [task, setTask] = useState<Task | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [themeCss, setThemeCss] = useState('')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(content)

  // Keep ref in sync
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Load file and task
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!fileId || !taskId) return
      const [f, t] = await Promise.all([
        window.electronAPI.file.get(fileId),
        window.electronAPI.task.get(taskId)
      ])
      if (f) {
        setFile(f)
        setContent(f.content)
      }
      if (t) {
        setTask(t)
        const css = await window.electronAPI.style.getThemeCss(t.theme)
        setThemeCss(css + '\n' + t.customCss)
      }
    }
    load()
  }, [fileId, taskId])

  const save = useCallback(async () => {
    if (!fileId) return
    setSaving(true)
    try {
      const updated = await window.electronAPI.file.update(fileId, {
        content: contentRef.current,
        status: 'editing'
      })
      setFile(updated)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (err) {
      toast.error('Failed to save')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }, [fileId])

  // Auto-save with debounce
  const handleChange = useCallback(
    (newContent: string) => {
      setContent(newContent)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        save()
      }, 1500)
    },
    [save]
  )

  // Manual save
  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    save()
  }, [save])

  const handleMarkReady = async (): Promise<void> => {
    if (!fileId) return
    try {
      // Save first
      await save()
      const updated = await window.electronAPI.file.setStatus(fileId, 'ready')
      setFile(updated)
      toast.success('File marked as ready')
    } catch (err) {
      toast.error('Failed to mark as ready')
      console.error(err)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-10 border-b border-border flex items-center px-4 gap-3 shrink-0">
        <span className="text-sm font-medium truncate">{file.filename}</span>
        <FileStatusBadge status={file.status} />
        <div className="flex-1" />
        {lastSaved && (
          <span className="text-xs text-muted-foreground">
            {saving ? 'Saving...' : `Saved ${lastSaved}`}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={handleManualSave} disabled={saving}>
          <Save className="w-3.5 h-3.5" />
          Save
        </Button>
        <Button size="sm" onClick={handleMarkReady}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Mark Ready
        </Button>
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-border overflow-hidden">
          <MarkdownEditor value={content} onChange={handleChange} darkMode={isDark} />
        </div>
        <div className="w-1/2 overflow-hidden bg-white">
          <MarkdownPreview content={content} customCss={themeCss} pdfPreview />
        </div>
      </div>
    </div>
  )
}
