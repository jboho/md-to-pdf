import { useState, useEffect, useCallback } from 'react'
import type { FileVersion } from '../../../preload/types'

export function useVersions(fileId: string | undefined): {
  versions: FileVersion[]
  loading: boolean
  refresh: () => Promise<void>
} {
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!fileId) return
    try {
      const result = await window.electronAPI.version.listByFile(fileId)
      setVersions(result)
    } catch (err) {
      console.error('Failed to load versions:', err)
    } finally {
      setLoading(false)
    }
  }, [fileId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { versions, loading, refresh }
}
