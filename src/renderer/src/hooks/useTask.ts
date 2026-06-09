import { useState, useEffect, useCallback } from 'react'
import type { Task } from '../../../preload/types'

export function useTask(taskId: string | undefined): {
  task: Task | null
  loading: boolean
  refresh: () => Promise<void>
} {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!taskId) return
    try {
      const result = await window.electronAPI.task.get(taskId)
      setTask(result)
    } catch (err) {
      console.error('Failed to load task:', err)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { task, loading, refresh }
}
