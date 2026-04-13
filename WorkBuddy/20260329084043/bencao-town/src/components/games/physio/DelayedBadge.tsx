'use client'

// ═══════════════════════════════════════════════════════════
// DelayedBadge - 延迟效果倒计时徽章
// 右侧边栏小标签，追踪即将到来的延迟效果
// 4种视觉状态：fresh → approaching → triggered → settled
// ═══════════════════════════════════════════════════════════

import React from 'react'
import type { DelayedBadgeData } from './FeedbackSystem'

interface DelayedBadgeListProps {
  badges: DelayedBadgeData[]
  onBadgeClick?: (badge: DelayedBadgeData) => void
}

export default function DelayedBadgeList({ badges, onBadgeClick }: DelayedBadgeListProps) {
  // 只显示未结算的
  const activeBadges = badges.filter(b => b.visualState !== 'settled')
  if (activeBadges.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-bold text-gray-500">⏳ 延迟效应</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
          {activeBadges.length}
        </span>
      </div>
      {activeBadges.map(badge => (
        <DelayedBadgeItem
          key={badge.id}
          badge={badge}
          onClick={() => onBadgeClick?.(badge)}
        />
      ))}
    </div>
  )
}

function DelayedBadgeItem({ badge, onClick }: { badge: DelayedBadgeData; onClick: () => void }) {
  const daysUntil = badge.triggerDay - badge.currentDay
  const config = getBadgeVisualConfig(badge.visualState, daysUntil)

  // 倒计时进度环
  const maxDays = 5
  const progress = Math.max(0, Math.min(1, 1 - daysUntil / maxDays))
  const circumference = 2 * Math.PI * 8
  const dashOffset = circumference * (1 - progress)

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2 rounded-lg transition-all active:scale-[0.97]"
      style={{
        background: config.bg,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <div className="flex items-center gap-2">
        {/* 倒计时环 */}
        <div className="relative w-5 h-5 shrink-0">
          <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="8" fill="none"
              stroke={config.ringColor}
              strokeWidth="1.5"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold" style={{ color: config.textColor }}>
            {badge.visualState === 'triggered' ? '!' : daysUntil > 0 ? daysUntil : '0'}
          </span>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold truncate" style={{ color: config.textColor }}>
            {badge.cause}
          </p>
          <p className="text-[8px] text-gray-500 truncate">
            {badge.visualState === 'triggered' ? '⚡ 已触发' :
             daysUntil <= 1 ? '⚠️ 明天触发' :
             `${daysUntil}天后`}
          </p>
        </div>

        {/* 状态指示点 */}
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
          background: config.dotColor,
          boxShadow: badge.visualState === 'approaching' ? `0 0 4px ${config.dotColor}` : 'none',
        }} />
      </div>
    </button>
  )
}

function getBadgeVisualConfig(state: DelayedBadgeData['visualState'], daysUntil: number) {
  switch (state) {
    case 'fresh':
      return {
        bg: 'rgba(6,182,212,0.06)',
        borderColor: 'rgba(6,182,212,0.15)',
        ringColor: '#06b6d4',
        textColor: '#67e8f9',
        dotColor: '#06b6d4',
      }
    case 'approaching':
      return {
        bg: 'rgba(234,179,8,0.08)',
        borderColor: 'rgba(234,179,8,0.25)',
        ringColor: '#eab308',
        textColor: '#fbbf24',
        dotColor: '#eab308',
      }
    case 'triggered':
      return {
        bg: 'rgba(239,68,68,0.1)',
        borderColor: 'rgba(239,68,68,0.3)',
        ringColor: '#ef4444',
        textColor: '#f87171',
        dotColor: '#ef4444',
      }
    case 'settled':
    default:
      return {
        bg: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.06)',
        ringColor: '#525252',
        textColor: '#737373',
        dotColor: '#525252',
      }
  }
}
