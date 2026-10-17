'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem('theme')
    return (stored as Theme) ?? 'dark'
  })
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
    setResolved(resolvedTheme)
    root.classList.toggle('dark', resolvedTheme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        const systemDark = mq.matches
        const resolvedTheme = systemDark ? 'dark' : 'light'
        setResolved(resolvedTheme)
        document.documentElement.classList.toggle('dark', systemDark)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}