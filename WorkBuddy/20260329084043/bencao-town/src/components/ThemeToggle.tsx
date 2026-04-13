'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR 防止不匹配
  if (!mounted) {
    return (
      <button
        className="fixed top-20 right-4 z-50 p-2 rounded-full bg-gray-800 text-white shadow-lg"
        aria-label="切换主题"
      >
        <Sun className="w-6 h-6" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-20 right-4 z-50 p-2 rounded-full bg-gray-800 dark:bg-gray-700 text-white shadow-lg hover:scale-110 transition-transform"
      aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      {theme === 'dark' ? (
        <Sun className="w-6 h-6" />
      ) : (
        <Moon className="w-6 h-6" />
      )}
    </button>
  )
}
