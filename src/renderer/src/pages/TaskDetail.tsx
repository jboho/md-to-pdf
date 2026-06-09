import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Settings,
  Download,
  CheckCircle2,
  FolderOpen,
  Loader2,
  XCircle
} from 'lucide-react'
import FileUploadZone from '@/components/task/FileUploadZone'
import FileList from '@/components/task/FileList'
import { useTask } from '@/hooks/useTask'
import { useFiles } from '@/hooks/useFiles'
import { usePdfGeneration } from '@/hooks/usePdfGeneration'
import { toast } from 'sonner'

export default function TaskDetail(): React.ReactElement {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { task, loading: taskLoading, refresh: refreshTask } = useTask(taskId)
  const { files, loading: filesLoading, refresh: refreshFiles } = useFiles(taskId)
  const { progress, generating, generate, cancel } = usePdfGeneration()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleFilesAdded = useCallback(() => {
    refreshFiles()
    refreshTask()
  }, [refreshFiles, refreshTask])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleMarkAllReady = async (): Promise<void> => {
    try {
      const toMark = files.filter(
        (f) => f.status === 'draft' || f.status === 'editing'
      )
      for (const file of toMark) {
        await window.electronAPI.file.setStatus(file.id, 'ready')
      }
      toast.success(`${toMark.length} files marked as ready`)
      refreshFiles()
      refreshTask()
    } catch (err) {
      toast.error('Failed to mark files')
      console.error(err)
    }
  }

  const handleGenerate = async (): Promise<void> => {
    if (!taskId) return
    try {
      await generate(taskId)
      toast.success('PDF generation complete')
      refreshFiles()
      refreshTask()
    } catch (err) {
      toast.error('PDF generation failed')
      console.error(err)
    }
  }

  const handleOpenOutput = async (): Promise<void> => {
    if (!taskId) return
    try {
      await window.electronAPI.pdf.openOutputDir(taskId)
    } catch (err) {
      console.error(err)
    }
  }

  if (taskLoading || !task) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  const readyCount = files.filter((f) => f.status === 'ready').length
  const convertedCount = files.filter((f) => f.status === 'converted').length

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{task.name}</h1>
            <Badge
              variant="secondary"
              className={
                task.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              }
            >
              {task.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {files.length} file{files.length !== 1 ? 's' : ''}
            {convertedCount > 0 && ` \u00b7 ${convertedCount} converted`}
            {readyCount > 0 && ` \u00b7 ${readyCount} ready`}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/tasks/${taskId}/styles`)}>
          <Settings className="w-4 h-4" />
          Styles
        </Button>
      </div>

      {/* Upload Zone */}
      <div className="mb-6">
        <FileUploadZone taskId={taskId!} onFilesAdded={handleFilesAdded} />
      </div>

      {/* Batch Actions */}
      {files.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleMarkAllReady}>
            <CheckCircle2 className="w-4 h-4" />
            Mark All Ready
          </Button>

          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={readyCount === 0 || generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Generate PDFs ({readyCount})
          </Button>

          {generating && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cancel(taskId!)}
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
          )}

          {task.outputDir && (
            <Button variant="outline" size="sm" onClick={handleOpenOutput}>
              <FolderOpen className="w-4 h-4" />
              Open Output
            </Button>
          )}
        </div>
      )}

      {/* Progress */}
      {progress && generating && (
        <div className="mb-4 p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>
              Converting: <strong>{progress.currentFile}</strong>
            </span>
            <span>
              {progress.completed}/{progress.total}
            </span>
          </div>
          <Progress value={(progress.completed / progress.total) * 100} />
        </div>
      )}

      {/* File List */}
      {!filesLoading && (
        <FileList
          files={files}
          taskId={taskId!}
          onUpdate={() => {
            refreshFiles()
            refreshTask()
          }}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}
    </div>
  )
}
