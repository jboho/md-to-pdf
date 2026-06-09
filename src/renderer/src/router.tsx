import { createHashRouter } from 'react-router-dom'
import App from './App'
import Dashboard from './pages/Dashboard'
import TaskDetail from './pages/TaskDetail'
import EditorPage from './pages/EditorPage'
import VersionsPage from './pages/VersionsPage'
import StylesPage from './pages/StylesPage'
import QuickConvertPage from './pages/QuickConvertPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'tasks/:taskId',
        element: <TaskDetail />
      },
      {
        path: 'tasks/:taskId/files/:fileId/edit',
        element: <EditorPage />
      },
      {
        path: 'tasks/:taskId/files/:fileId/versions',
        element: <VersionsPage />
      },
      {
        path: 'tasks/:taskId/styles',
        element: <StylesPage />
      },
      {
        path: 'quick',
        element: <QuickConvertPage />
      }
    ]
  }
])
