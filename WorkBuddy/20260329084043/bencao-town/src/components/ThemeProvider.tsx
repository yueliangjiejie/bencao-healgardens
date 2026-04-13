'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  // 初始化主题：从 localStorage 读取或使用系统偏好
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme') as Theme | null
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light')
      setTheme(initialTheme)

      // 应用主题到 document
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', initialTheme === 'dark')
      }
    } catch (e) {
      // localStorage 可能在某些环境下不可用
      console.warn('Theme initialization failed:', e)
    } finally {
      setMounted(true)
    }
  }, [])

  // 主题变化时更新 localStorage 和 document class
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('theme', theme)
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark')
        }
      } catch (e) {
        console.warn('Theme update failed:', e)
      }
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // SSR 期间返回默认值
    return { theme: 'dark' as Theme, toggleTheme: () => {} }
  }
  return context
}
