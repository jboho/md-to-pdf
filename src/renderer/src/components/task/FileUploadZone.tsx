import { useCallback } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  taskId: string
  onFilesAdded: () => void
}

export default function FileUploadZone({ taskId, onFilesAdded }: Props): React.ReactElement {
  const handleImport = useCallback(async () => {
    try {
      const files = await window.electronAPI.file.importFromDisk(taskId)
      if (files.length > 0) {
        onFilesAdded()
      }
    } catch (err) {
      console.error('Failed to import files:', err)
    }
  }, [taskId, onFilesAdded])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const items = Array.from(e.dataTransfer.files)
      const mdFiles = items.filter(
        (f) => f.name.endsWith('.md') || f.name.endsWith('.markdown') || f.name.endsWith('.txt')
      )

      if (mdFiles.length === 0) return

      const inputs = await Promise.all(
        mdFiles.map(async (file) => ({
          taskId,
          filename: file.name,
          content: await file.text()
        }))
      )

      try {
        await window.electronAPI.file.createMany(inputs)
        onFilesAdded()
      } catch (err) {
        console.error('Failed to create files:', err)
      }
    },
    [taskId, onFilesAdded]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 hover:bg-accent/50 transition-colors"
    >
      <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
      <p className="text-sm text-muted-foreground mb-3">
        Drag & drop <code>.md</code> files here
      </p>
      <Button variant="outline" size="sm" onClick={handleImport}>
        Browse Files
      </Button>
    </div>
  )
}
