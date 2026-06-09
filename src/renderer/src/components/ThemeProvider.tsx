import { createContext, useContext } from 'react'
import { useTheme } from '@/hooks/useTheme'

interface ThemeContextValue {
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggle: () => {}
})

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isDark, toggle } = useTheme()
  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext(): ThemeContextValue {
  return useContext(ThemeContext)
}
