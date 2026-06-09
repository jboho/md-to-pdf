import { useState, useEffect, useCallback } from 'react'
import type { BatchProgress } from '../../../preload/types'

export function usePdfGeneration(): {
  progress: BatchProgress | null
  generating: boolean
  generate: (taskId: string) => Promise<void>
  cancel: (taskId: string) => Promise<void>
} {
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const unsubscribe = window.electronAPI.pdf.onBatchProgress((p) => {
      setProgress(p)
      const allDone = p.files.every((f) => f.status === 'done' || f.status === 'error')
      if (allDone) {
        setGenerating(false)
      }
    })
    return unsubscribe
  }, [])

  const generate = useCallback(async (taskId: string) => {
    setGenerating(true)
    setProgress(null)
    try {
      await window.electronAPI.pdf.generateBatch(taskId)
    } catch (err) {
      console.error('Batch generation failed:', err)
      setGenerating(false)
    }
  }, [])

  const cancel = useCallback(async (taskId: string) => {
    try {
      await window.electronAPI.pdf.cancelBatch(taskId)
    } catch (err) {
      console.error('Failed to cancel batch:', err)
    }
    setGenerating(false)
  }, [])

  return { progress, generating, generate, cancel }
}
