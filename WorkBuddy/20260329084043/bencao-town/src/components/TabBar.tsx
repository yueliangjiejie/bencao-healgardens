'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, UtensilsCrossed, Flower2, Gamepad2, User } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

const tabKeys = ['home', 'record', 'tcm', 'games', 'settings'] as const
const tabIcons = [Home, UtensilsCrossed, Flower2, Gamepad2, User]
const tabPaths = ['/', '/record', '/tcm', '/games', '/settings']

export default function TabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()

  const tabs = tabKeys.map((key, i) => ({
    path: tabPaths[i],
    label: t.tab[key],
    icon: tabIcons[i],
  }))

  // 不在主页面时隐藏TabBar
  const showTab = tabs.some(t => t.path === pathname)
  if (!showTab) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-[430px] bg-[var(--bg-tab)] backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path
            const Icon = tab.icon
            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-200 ${
                  isActive
                    ? 'text-[var(--gold)] scale-105'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon
                  size={isActive ? 24 : 20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className="transition-all duration-200"
                />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 w-8 h-0.5 bg-[var(--gold)] rounded-full" />
                )}
              </button>
            )
          })}
        </div>
        {/* iOS safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  )
}
