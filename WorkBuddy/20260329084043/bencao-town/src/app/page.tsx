'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Horse from '@/components/Horse'
import NotificationCenter, { useActiveReminder } from '@/components/NotificationCenter'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useStore, Constitution } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { Flame, Scale, Calendar, Coins, ChevronRight, Bell, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ─── 飘字动画数据结构 ───
interface FloatingPoint {
  id: number
  amount: number
  label: string
}

export default function HomePage() {
  const router = useRouter()
  const { horse, constitution, points, coins, streak, todayCalories, currentWeight } = useStore()
  const { t, isZh } = useTranslation()
  const [greeting, setGreeting] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const { reminder: activeReminder, dismiss: dismissReminder } = useActiveReminder()

  // ─── 飘字动画状态 ───
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([])
  const prevPointsRef = useRef(points)
  const floatIdRef = useRef(0)

  // 监听积分变化，自动触发飘字
  useEffect(() => {
    const diff = points - prevPointsRef.current
    if (diff > 0 && prevPointsRef.current !== points) {
      const newFloat: FloatingPoint = {
        id: ++floatIdRef.current,
        amount: diff,
        label: '积分',
      }
      setFloatingPoints(prev => [...prev.slice(-4), newFloat]) // 最多保留5个
      // 2秒后移除
      setTimeout(() => {
        setFloatingPoints(prev => prev.filter(f => f.id !== newFloat.id))
      }, 2000)
    }
    prevPointsRef.current = points
  }, [points])

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 6) setGreeting(t.home.greetingNight)
    else if (h < 9) setGreeting(t.home.greetingMorning)
    else if (h < 12) setGreeting(t.home.greetingForenoon)
    else if (h < 14) setGreeting(t.home.greetingNoon)
    else if (h < 18) setGreeting(t.home.greetingAfternoon)
    else if (h < 22) setGreeting(t.home.greetingEvening)
    else setGreeting(t.home.greetingLateNight)
  }, [t])

  // 动态构建快捷入口
  const quickEntries = [
    { label: t.home.dietRecord, icon: '📝', path: '/record', color: 'from-orange-500/20 to-orange-600/5' },
    { label: t.home.weightRecord, icon: '⚖️', path: '/record', color: 'from-purple-500/20 to-purple-600/5' },
    { label: t.home.tcmHall, icon: '🏯', path: '/tcm', color: 'from-emerald-500/20 to-emerald-600/5' },
    { label: t.home.miniGames, icon: '🎮', path: '/games', color: 'from-blue-500/20 to-blue-600/5' },
    { label: '药箱管理', icon: '💊', path: '/record', color: 'from-teal-500/20 to-teal-600/5' },
    { label: '产检记录', icon: '🤰', path: '/record', color: 'from-pink-500/20 to-pink-600/5' },
  ]

  const healthCards = [
    { label: t.home.todayCalories, value: todayCalories || 0, unit: t.record.kcal, icon: Flame, color: '#EF4444', bg: 'from-red-500/10 to-red-600/5' },
    { label: t.home.currentWeight, value: currentWeight || '--', unit: t.record.kg, icon: Scale, color: '#8B5CF6', bg: 'from-purple-500/10 to-purple-600/5' },
    { label: t.home.streakDays, value: streak, unit: isZh ? '天' : t.common.unitDay, icon: Calendar, color: '#10B981', bg: 'from-emerald-500/10 to-emerald-600/5' },
    { label: t.home.horseCoins, value: coins, unit: isZh ? '个' : t.common.unitPiece, icon: Coins, color: '#F59E0B', bg: 'from-amber-500/10 to-amber-600/5' },
  ]

  // 没有马时，引导去领养
  if (!horse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="text-8xl mb-6 animate-bounce">🐴</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t.app.name}</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          {greeting}<br />{t.home.noHorseDesc2}
        </p>
        <button
          onClick={() => router.push('/onboard')}
          className="btn-gold flex items-center gap-2 text-lg px-8 py-3"
        >
          <Sparkles size={20} />
          {t.home.startAdoption}
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.app.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {constitution && (
              <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">
                {isZh ? constitution : (constitution as string)}
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{greeting}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            className="relative p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]"
            onClick={() => setShowNotifications(true)}
          >
            <Bell size={20} style={{ color: 'var(--text-secondary)' }} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--red)] rounded-full" />
          </button>
        </div>
      </div>

      {/* 马匹展示区 - 占屏幕60%+ */}
      <div className="card flex flex-col items-center py-6">
        <Horse size="lg" showActions={true} showSpeech={true} />
      </div>

      {/* 健康数据卡片 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {healthCards.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className={`card bg-gradient-to-br ${item.bg} cursor-pointer`}
              onClick={() => {
                if (item.label === '今日热量' || item.label === '当前体重') router.push('/record')
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: item.color }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {item.value}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.unit}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 积分条 + 飘字动画 */}
      <div className="card relative overflow-visible">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 relative">
            <div className="w-8 h-8 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
              <span className="text-sm">🏅</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.home.wellnessPoints}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--gold)' }}>{points}</p>
            </div>
            {/* 🎯 飘字动画容器 */}
            {floatingPoints.map(fp => (
              <span
                key={fp.id}
                className="absolute left-6 -top-2 text-sm font-bold text-green-400 pointer-events-none animate-float-up"
                style={{
                  textShadow: '0 0 8px rgba(74,222,128,0.5)',
                }}
              >
                +{fp.amount} {fp.label} ✨
              </span>
            ))}
          </div>
          {/* 今日积分汇总提示 */}
          {points > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 font-medium">
                💰 马粮币 {coins}
              </span>
              <button
                onClick={() => router.push('/games')}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--gold)]/10 text-[var(--gold)] font-medium"
              >
                {t.home.earnPoints} <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
        {/* 积分获取快捷提示 */}
        <div className="mt-2 pt-2 border-t border-[var(--border)]/50 flex flex-wrap gap-x-4 gap-y-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          <span>📸 AI识别 +3</span><span>🍽️ 记录饮食 +1</span>
          <span>⚖️ 记录体重 +2</span><span>🧠 翻牌通关 +15</span>
          <span>✅ 每日打卡 +5~10</span><span>🐴 喂马/清洁 +5</span>
        </div>
      </div>

      {/* 快捷入口 */}
      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{t.home.quickEntry}</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickEntries.map((entry) => (
            <button
              key={entry.label}
              onClick={() => router.push(entry.path)}
              className={`card flex flex-col items-center gap-2 py-4 bg-gradient-to-br ${entry.color} hover:scale-[1.02] active:scale-95 transition-transform`}
            >
              <span className="text-2xl">{entry.icon}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{entry.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 通知中心侧边栏 */}
      <NotificationCenter
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* 活跃提醒弹窗 */}
      {activeReminder && (
        <div className="fixed top-16 left-4 right-4 z-[90] card flex items-center gap-3 py-3 px-4 animate-fade-in"
          style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(74,124,89,0.15))' }}>
          <span className="text-xl animate-bounce">🔔</span>
          <p className="text-sm font-bold flex-1" style={{ color: 'var(--text-primary)' }}>{activeReminder}</p>
          <button onClick={dismissReminder}
            className="text-xs px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
            {t.home.gotIt}
          </button>
        </div>
      )}
    </div>
  )
}
