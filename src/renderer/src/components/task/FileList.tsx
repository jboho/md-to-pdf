import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Pencil, History, Trash2, CheckCircle2 } from 'lucide-react'
import FileStatusBadge from './FileStatusBadge'
import type { TaskFile } from '../../../../preload/types'
import { toast } from 'sonner'

interface Props {
  files: TaskFile[]
  taskId: string
  onUpdate: () => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
}

export default function FileList({
  files,
  taskId,
  onUpdate,
  selectedIds,
  onToggleSelect
}: Props): React.ReactElement {
  const navigate = useNavigate()

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await window.electronAPI.file.delete(id)
      toast.success('File deleted')
      onUpdate()
    } catch (err) {
      toast.error('Failed to delete file')
      console.error(err)
    }
  }

  const handleMarkReady = async (id: string): Promise<void> => {
    try {
      await window.electronAPI.file.setStatus(id, 'ready')
      toast.success('File marked as ready')
      onUpdate()
    } catch (err) {
      toast.error('Failed to update status')
      console.error(err)
    }
  }

  if (files.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No files yet. Import some markdown files above.
      </p>
    )
  }

  return (
    <div className="border rounded-lg divide-y">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
        >
          <input
            type="checkbox"
            checked={selectedIds.has(file.id)}
            onChange={() => onToggleSelect(file.id)}
            className="rounded border-gray-300"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.filename}</p>
          </div>
          <FileStatusBadge status={file.status} />
          <div className="flex items-center gap-1">
            {file.status !== 'ready' && file.status !== 'converted' && file.status !== 'converting' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Mark as ready"
                onClick={() => handleMarkReady(file.id)}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Edit"
              onClick={() => navigate(`/tasks/${taskId}/files/${file.id}/edit`)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Version history"
              onClick={() => navigate(`/tasks/${taskId}/files/${file.id}/versions`)}
            >
              <History className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Delete"
              onClick={() => handleDelete(file.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
