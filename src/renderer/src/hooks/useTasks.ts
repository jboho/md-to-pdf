import { useState, useEffect, useCallback } from 'react'
import type { Task } from '../../../preload/types'

export function useTasks(): {
  tasks: Task[]
  loading: boolean
  refresh: () => Promise<void>
} {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await window.electronAPI.task.list()
      setTasks(result)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { tasks, loading, refresh }
}
