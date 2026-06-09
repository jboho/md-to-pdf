import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Zap } from 'lucide-react'
import CreateTaskDialog from '@/components/dashboard/CreateTaskDialog'
import TaskCard from '@/components/dashboard/TaskCard'
import { useTasks } from '@/hooks/useTasks'
import { toast } from 'sonner'

export default function Dashboard(): React.ReactElement {
  const navigate = useNavigate()
  const { tasks, loading, refresh } = useTasks()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await window.electronAPI.task.delete(id)
      toast.success('Task deleted')
      refresh()
    } catch (err) {
      toast.error('Failed to delete task')
      console.error(err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your markdown-to-PDF conversion batches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/quick')}>
            <Zap className="w-4 h-4" />
            Quick Convert
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No tasks yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create a task to start converting markdown files to PDF.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Your First Task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={refresh}
      />
    </div>
  )
}
