import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, Loader2 } from 'lucide-react'
import { useVersions } from '@/hooks/useVersions'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { TaskFile, VersionDiff } from '../../../preload/types'

export default function VersionsPage(): React.ReactElement {
  const { fileId, taskId } = useParams<{ fileId: string; taskId: string }>()
  const { versions, loading, refresh } = useVersions(fileId)
  const [file, setFile] = useState<TaskFile | null>(null)
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null)
  const [selectedTo, setSelectedTo] = useState<string | null>(null)
  const [diff, setDiff] = useState<VersionDiff | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)

  useEffect(() => {
    if (!fileId) return
    window.electronAPI.file.get(fileId).then(setFile)
  }, [fileId])

  // Auto-select first two versions for comparison
  useEffect(() => {
    if (versions.length >= 2 && !selectedFrom && !selectedTo) {
      setSelectedTo(versions[0].id)
      setSelectedFrom(versions[1].id)
    }
  }, [versions, selectedFrom, selectedTo])

  // Load diff when selection changes
  useEffect(() => {
    if (!selectedFrom || !selectedTo) {
      setDiff(null)
      return
    }
    setLoadingDiff(true)
    window.electronAPI.version
      .diff(selectedFrom, selectedTo)
      .then(setDiff)
      .catch(console.error)
      .finally(() => setLoadingDiff(false))
  }, [selectedFrom, selectedTo])

  const handleRestore = async (versionId: string): Promise<void> => {
    try {
      await window.electronAPI.version.restore(versionId)
      toast.success('Version restored')
      refresh()
    } catch (err) {
      toast.error('Failed to restore version')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Version list sidebar */}
      <div className="w-72 border-r border-border overflow-auto shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Version History</h2>
          {file && (
            <p className="text-xs text-muted-foreground mt-1">{file.filename}</p>
          )}
        </div>
        <div className="divide-y">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                version.id === selectedFrom || version.id === selectedTo
                  ? 'bg-accent'
                  : ''
              }`}
              onClick={() => {
                if (!selectedFrom || (selectedFrom && selectedTo)) {
                  setSelectedFrom(version.id)
                  setSelectedTo(null)
                  setDiff(null)
                } else {
                  setSelectedTo(version.id)
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{version.label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Restore this version"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRestore(version.id)
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(version.createdAt)}
              </p>
              {version.id === selectedFrom && (
                <Badge variant="secondary" className="mt-1 text-xs">From</Badge>
              )}
              {version.id === selectedTo && (
                <Badge variant="secondary" className="mt-1 text-xs">To</Badge>
              )}
            </div>
          ))}
        </div>
        {versions.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No versions yet.</p>
        )}
      </div>

      {/* Diff view */}
      <div className="flex-1 overflow-auto p-4">
        {loadingDiff ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : diff ? (
          <div className="font-mono text-sm">
            {diff.hunks.length === 0 ? (
              <p className="text-muted-foreground">No differences found.</p>
            ) : (
              diff.hunks.map((hunk, i) => (
                <div key={i} className="mb-4">
                  <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-t border">
                    @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                  </div>
                  <div className="border border-t-0 rounded-b overflow-hidden">
                    {hunk.lines.map((line, j) => (
                      <div
                        key={j}
                        className={`px-3 py-0.5 whitespace-pre-wrap ${
                          line.type === 'add'
                            ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300'
                            : line.type === 'remove'
                              ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : ''
                        }`}
                      >
                        <span className="select-none text-muted-foreground mr-2">
                          {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                        </span>
                        {line.content}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">
              {versions.length < 2
                ? 'Need at least two versions to compare.'
                : 'Select two versions to compare.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
