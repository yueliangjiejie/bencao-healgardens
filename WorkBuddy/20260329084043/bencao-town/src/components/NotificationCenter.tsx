'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Plus, Trash2, Clock, Droplets, Pill, Moon, Dumbbell, Coffee } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export interface Reminder {
  id: string
  label: string
  emoji: string
  hour: number
  minute: number
  enabled: boolean
}

// 动态模板（从i18n获取）— 在组件内使用t来构建

const STORAGE_KEY = 'bencao-reminders'

function loadReminders(): Reminder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : getDefaultReminders()
  } catch {
    return getDefaultReminders()
  }
}

function saveReminders(reminders: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders))
}

function getDefaultReminders(t?: any): Reminder[] {
  return [
    { id: 'water-1', label: t?.notification?.defaultReminders?.[0]?.label || '喝水', emoji: '💧', hour: 9, minute: 0, enabled: true },
    { id: 'water-2', label: t?.notification?.defaultReminders?.[1]?.label || '喝水', emoji: '💧', hour: 11, minute: 0, enabled: true },
    { id: 'water-3', label: t?.notification?.defaultReminders?.[2]?.label || '喝水', emoji: '💧', hour: 14, minute: 0, enabled: true },
    { id: 'water-4', label: t?.notification?.defaultReminders?.[3]?.label || '喝水', emoji: '💧', hour: 16, minute: 0, enabled: true },
    { id: 'exercise', label: t?.notification?.defaultReminders?.[4]?.label || '运动', emoji: '🏃', hour: 18, minute: 0, enabled: true },
    { id: 'sleep', label: t?.notification?.defaultReminders?.[5]?.label || '睡觉', emoji: '😴', hour: 22, minute: 30, enabled: true },
  ]
}

// 检查是否有触发的提醒
function checkTriggeredReminders(reminders: Reminder[], formatFn?: (emoji: string, label: string) => string): string | null {
  const now = new Date()
  const currentMin = now.getHours() * 60 + now.getMinutes()

  for (const r of reminders) {
    if (!r.enabled) continue
    const rMin = r.hour * 60 + r.minute
    // 在目标时间前后5分钟内触发
    if (Math.abs(currentMin - rMin) <= 5) {
      return formatFn ? formatFn(r.emoji, r.label) : `${r.emoji} ${r.label}时间到了！`
    }
  }
  return null
}

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
  onBellClick?: () => void
}

export default function NotificationCenter({ open, onClose, onBellClick }: NotificationCenterProps) {
  const { t } = useTranslation()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('⏰')
  const [newHour, setNewHour] = useState(12)
  const [newMinute, setNewMinute] = useState(0)
  const [activeReminder, setActiveReminder] = useState<string | null>(null)

  useEffect(() => {
    setReminders(loadReminders())
  }, [])

  // 动态模板
  const templates = [
    { label: t.notification.templates[0].label, emoji: '💧', icon: Droplets, defaultHour: 9, desc: t.notification.templates[0].desc },
    { label: t.notification.templates[1].label, emoji: '🏃', icon: Dumbbell, defaultHour: 18, desc: t.notification.templates[1].desc },
    { label: t.notification.templates[2].label, emoji: '💊', icon: Pill, defaultHour: 8, desc: t.notification.templates[2].desc },
    { label: t.notification.templates[3].label, emoji: '😴', icon: Moon, defaultHour: 22, desc: t.notification.templates[3].desc },
    { label: t.notification.templates[4].label, emoji: '🍵', icon: Coffee, defaultHour: 15, desc: t.notification.templates[4].desc },
    { label: '吃药提醒', emoji: '💊', icon: Pill, defaultHour: 8 },
    { label: '疫苗提醒', emoji: '💉', icon: Pill, defaultHour: 9 },
  ]

  const persist = useCallback((updated: Reminder[]) => {
    setReminders(updated)
    saveReminders(updated)
  }, [])

  const addReminder = () => {
    if (!newLabel.trim()) return
    const newR: Reminder = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      emoji: newEmoji,
      hour: newHour,
      minute: newMinute,
      enabled: true,
    }
    persist([...reminders, newR])
    setNewLabel(''); setNewEmoji('⏰'); setNewHour(12); setNewMinute(0)
    setShowAdd(false)
  }

  const toggleReminder = (id: string) => {
    persist(reminders.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ))
  }

  const deleteReminder = (id: string) => {
    persist(reminders.filter(r => r.id !== id))
  }

  const addTemplate = (template: typeof templates[0]) => {
    const exists = reminders.some(
      r => r.label === template.label && r.hour === template.defaultHour
    )
    if (exists) return

    const newR: Reminder = {
      id: `tpl-${template.label}-${Date.now()}`,
      label: template.label,
      emoji: template.emoji,
      hour: template.defaultHour,
      minute: 0,
      enabled: true,
    }
    persist([...reminders, newR])
  }

  const enabledCount = reminders.filter(r => r.enabled).length

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* 面板 */}
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-[340px] bg-[var(--bg-primary)] shadow-2xl flex flex-col"
        style={{ borderLeft: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>
        {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.notification.title}</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t.notification.enabledCount.replace('{count}', String(enabledCount))}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-card)]">
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* 快捷添加模板 */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>{t.notification.quickAdd}</p>
          <div className="flex gap-2 flex-wrap">
            {templates.map(tmpl => (
              <button key={tmpl.label}
                onClick={() => addTemplate(tmpl)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--gold)] active:scale-95 transition-all"
              >
                <span>{tmpl.emoji}</span>
                <span style={{ color: 'var(--text-primary)' }}>{tmpl.label}</span>
              </button>
            ))}
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--gold)] text-[#1A1A1A] active:scale-95 transition-transform"
            >
              <Plus size={14} />
              {t.notification.custom}
            </button>
          </div>
        </div>

        {/* 自定义添加表单 */}
        {showAdd && (
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)] animate-fade-in space-y-3">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder={t.notification.placeholder}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--gold)]"
            />
            <div className="flex gap-2">
              <select
                value={newEmoji}
                onChange={e => setNewEmoji(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm focus:outline-none"
              >
                {['⏰','💧','🏃','💊','😴','🍵','🥗','💪','🌿','🧘','💉','🩺','🏥'].map(em => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </select>
              <input type="number" min={0} max={23} value={newHour}
                onChange={e => setNewHour(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm text-center"
              />
              <span className="self-center text-xs" style={{ color: 'var(--text-secondary)' }}>:</span>
              <input type="number" min={0} max={59} value={newMinute}
                onChange={e => setNewMinute(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm text-center"
              />
            </div>
            <button onClick={addReminder}
              disabled={!newLabel.trim()}
              className="btn-gold w-full py-2 text-sm disabled:opacity-40">{t.notification.confirmAdd}</button>
          </div>
        )}

        {/* 提醒列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {reminders.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={40} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.notification.empty}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{t.notification.emptyHint}</p>
            </div>
          ) : (
            reminders.map(r => (
              <div key={r.id}
                className={`card flex items-center gap-3 ${!r.enabled ? 'opacity-50' : ''}`}>
                <span className="text-xl">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{r.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {String(r.hour).padStart(2, '0')}:{String(r.minute).padStart(2, '0')}
                  </p>
                </div>
                {/* 开关 */}
                <button
                  onClick={() => toggleReminder(r.id)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${
                    r.enabled ? 'bg-[var(--green)]' : 'bg-[var(--border)]'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    r.enabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
                {/* 删除 */}
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="p-1.5 rounded-lg hover:bg-[var(--red)]/10"
                >
                  <Trash2 size={14} style={{ color: 'var(--red)' }} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
            {t.notification.bottomTip}
          </p>
        </div>
      </div>
    </div>
  )
}

// 导出钩子用于首页检测触发提醒
export function useActiveReminder(): { reminder: string | null; dismiss: () => void } {
  const { t } = useTranslation()
  const [reminder, setReminder] = useState<string | null>(null)
  const dismissed = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (dismissed.current) return
      const rs = loadReminders()
      const msg = checkTriggeredReminders(rs, (emoji, label) =>
        t.notification.triggeredMsg.replace('{emoji}', emoji).replace('{label}', label)
      )
      if (msg) {
        setReminder(msg)
        // 通知声音（如果支持）
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(t.app.name, { body: msg })
        }
      }
    }, 30000) // 每30秒检查

    return () => clearInterval(interval)
  }, [])

  return {
    reminder,
    dismiss: () => { setReminder(null); dismissed.current = true; setTimeout(() => { dismissed.current = false }, 60000) }
  }
}
