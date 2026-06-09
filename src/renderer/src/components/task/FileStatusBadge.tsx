import { Badge } from '@/components/ui/badge'
import type { FileStatus } from '../../../../preload/types'

const statusConfig: Record<FileStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  editing: { label: 'Editing', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  ready: { label: 'Ready', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  converting: { label: 'Converting', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 animate-pulse' },
  converted: { label: 'Converted', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  error: { label: 'Error', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
}

interface Props {
  status: FileStatus
}

export default function FileStatusBadge({ status }: Props): React.ReactElement {
  const config = statusConfig[status]
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  )
}
