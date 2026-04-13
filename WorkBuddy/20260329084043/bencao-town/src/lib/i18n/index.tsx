// ═══════════════════════════════════════════════
// 本草纲目健康小镇 - i18n 核心模块
// ═══════════════════════════════════════════════

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Locale, Translations } from './types'
import zh from './zh'
import en from './en'

const translations: Record<string, Translations> = { zh, en }

export type { Locale, Translations } from './types'

// ─── Context ───
interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Translations
  isZh: boolean
  toggleLocale: () => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'zh',
  setLocale: () => {},
  t: zh,
  isZh: true,
  toggleLocale: () => {},
})

// ─── Storage key ───
const LOCALE_KEY = 'bencao-locale'

function getSavedLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved === 'en' || saved === 'zh') return saved
  // 检测浏览器语言
  const lang = navigator.language?.toLowerCase?.() || ''
  if (lang.startsWith('en')) return 'en'
  return 'zh'
}

// ─── Provider ───
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = getSavedLocale()
    setLocaleState(saved)
    setMounted(true)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(LOCALE_KEY, l)
    // 更新 <html lang> 属性
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'zh' ? 'en' : 'zh')
  }, [locale])

  const value: I18nContextValue = {
    locale,
    setLocale,
    t: translations[locale],
    isZh: locale === 'zh',
    toggleLocale,
  }

  if (!mounted) {
    // SSR/首次渲染返回默认值（防止 hydration mismatch）
    return (
      <I18nContext.Provider value={{ locale: 'zh', setLocale: () => {}, t: zh, isZh: true, toggleLocale: () => {} }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// ─── Hook ───
export function useTranslation() {
  return useContext(I18nContext)
}
