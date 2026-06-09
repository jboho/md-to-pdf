import { useNavigate, useLocation } from 'react-router-dom'
import { FileText, ChevronLeft, Moon, Sun, Zap } from 'lucide-react'
import { useThemeContext } from '@/components/ThemeProvider'

export default function Header(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { isDark, toggle } = useThemeContext()

  return (
    <header className="h-12 border-b border-border flex items-center px-4 gap-3 shrink-0 bg-background/80 backdrop-blur-sm"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* macOS traffic light space */}
      <div className="w-16 shrink-0" />

      {!isHome && (
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded hover:bg-accent transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 font-semibold text-sm"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <FileText className="w-4 h-4 text-primary" />
        MD to PDF
      </button>

      <div className="flex-1" />

      <button
        onClick={() => navigate('/quick')}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Zap className="w-3.5 h-3.5" />
        Quick Convert
      </button>

      <button
        onClick={toggle}
        className="p-1.5 rounded-md hover:bg-accent transition-colors"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  )
}
