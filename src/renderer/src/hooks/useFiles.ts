import { useState, useEffect, useCallback } from 'react'
import type { TaskFile } from '../../../preload/types'

export function useFiles(taskId: string | undefined): {
  files: TaskFile[]
  loading: boolean
  refresh: () => Promise<void>
} {
  const [files, setFiles] = useState<TaskFile[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!taskId) return
    try {
      const result = await window.electronAPI.file.listByTask(taskId)
      setFiles(result)
    } catch (err) {
      console.error('Failed to load files:', err)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { files, loading, refresh }
}
