import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export default function CreateTaskDialog({ open, onOpenChange, onCreated }: Props): React.ReactElement {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async (): Promise<void> => {
    if (!name.trim()) return
    setCreating(true)
    try {
      await window.electronAPI.task.create({ name: name.trim() })
      setName('')
      onOpenChange(false)
      onCreated()
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>
            Create a new batch conversion task. You can upload markdown files after creating it.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Task name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
