import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Trash2 } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import type { Task } from '../../../../preload/types'

interface Props {
  task: Task
  onDelete: (id: string) => void
}

const statusColors: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

export default function TaskCard({ task, onDelete }: Props): React.ReactElement {
  const navigate = useNavigate()

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{task.name}</CardTitle>
          <Badge variant="secondary" className={statusColors[task.status]}>
            {task.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>
              {task.fileCount ?? 0} file{(task.fileCount ?? 0) !== 1 ? 's' : ''}
            </span>
            {(task.convertedCount ?? 0) > 0 && (
              <span className="text-green-600">
                ({task.convertedCount} converted)
              </span>
            )}
          </div>
          <span>{formatRelativeDate(task.updatedAt)}</span>
        </div>
        <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
