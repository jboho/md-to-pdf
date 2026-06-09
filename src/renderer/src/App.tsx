import { Outlet } from 'react-router-dom'
import Header from './components/layout/Header'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from 'sonner'

export default function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <Toaster richColors position="bottom-right" />
      </div>
    </ThemeProvider>
  )
}
