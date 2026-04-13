'use client'

import { Globe } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { locale, toggleLocale, isZh } = useTranslation()

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
        bg-white/5 hover:bg-white/10 border border-white/10
        transition-all duration-200 text-xs font-bold
        hover:border-[var(--gold)]/40 active:scale-95"
      title={isZh ? 'Switch to English' : '切换到中文'}
    >
      <Globe size={14} />
      <span className={locale === 'zh' ? 'text-[var(--gold)]' : ''}>中</span>
      <span className="text-[var(--text-secondary)]">/</span>
      <span className={locale === 'en' ? 'text-[var(--gold)]' : ''}>EN</span>
    </button>
  )
}
