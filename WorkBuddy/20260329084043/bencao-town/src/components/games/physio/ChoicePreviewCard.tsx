'use client'

// ═══════════════════════════════════════════════════════════
// ChoicePreviewCard - 选择预览卡
// 悬停时显示：即时效果 + 延迟效应 + 风险警告
// 类似 Slay the Spire 的卡牌预览
// ═══════════════════════════════════════════════════════════

import React from 'react'
import type { ChoicePreview } from './FeedbackSystem'

interface ChoicePreviewCardProps {
  preview: ChoicePreview
  choiceText: string
}

export default function ChoicePreviewCard({ preview, choiceText }: ChoicePreviewCardProps) {
  const riskConfig = getRiskConfig(preview.riskLevel)

  return (
    <div className="fixed z-50 pointer-events-none animate-fade-in"
      style={{
        left: '50%',
        top: '40%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '320px',
        width: '90vw',
      }}>
      <div className="rounded-xl overflow-hidden" style={{
        background: 'rgba(15,15,25,0.97)',
        border: `1px solid ${riskConfig.borderColor}`,
        boxShadow: `0 0 20px ${riskConfig.glowColor}, 0 4px 20px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(10px)',
      }}>
        {/* 标题栏 */}
        <div className="px-3 py-2" style={{ background: riskConfig.headerBg }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white truncate max-w-[200px]">{choiceText}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{
              background: riskConfig.badgeBg,
              color: riskConfig.badgeColor,
            }}>
              {riskConfig.label}
            </span>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {/* 即时效果 */}
          {preview.immediate.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-gray-500 mb-1">⚡ 即时效果</p>
              <div className="flex flex-wrap gap-1">
                {preview.immediate.map((delta, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: delta.bgColor, color: delta.color }}>
                    {delta.icon} {delta.delta > 0 ? '+' : ''}{delta.delta} {delta.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 延迟效应 */}
          {preview.delayed.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-gray-500 mb-1">⏳ 延迟效应</p>
              {preview.delayed.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="text-yellow-400">⏳</span>
                  <span className="truncate">{d.badge.cause}</span>
                  <span className="text-yellow-500 font-bold shrink-0">
                    {d.daysUntil <= 0 ? '今天' : `${d.daysUntil}天后`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 风险警告 */}
          {preview.riskWarnings.length > 0 && (
            <div className="p-2 rounded-lg" style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}>
              {preview.riskWarnings.map((w, i) => (
                <p key={i} className="text-[10px] text-red-400 leading-relaxed">{w}</p>
              ))}
            </div>
          )}

          {/* 意志力不足提示 */}
          {!preview.willpowerSufficient && (
            <div className="p-2 rounded-lg" style={{
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <p className="text-[10px] text-violet-400">🚫 意志力不足，此选择可能无法执行</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getRiskConfig(level: ChoicePreview['riskLevel']) {
  switch (level) {
    case 'low':
      return {
        label: '低风险',
        borderColor: 'rgba(34,197,94,0.3)',
        glowColor: 'rgba(34,197,94,0.1)',
        headerBg: 'rgba(34,197,94,0.08)',
        badgeBg: 'rgba(34,197,94,0.15)',
        badgeColor: '#4ade80',
      }
    case 'medium':
      return {
        label: '中风险',
        borderColor: 'rgba(245,158,11,0.3)',
        glowColor: 'rgba(245,158,11,0.15)',
        headerBg: 'rgba(245,158,11,0.08)',
        badgeBg: 'rgba(245,158,11,0.15)',
        badgeColor: '#fbbf24',
      }
    case 'high':
      return {
        label: '高风险',
        borderColor: 'rgba(239,68,68,0.4)',
        glowColor: 'rgba(239,68,68,0.2)',
        headerBg: 'rgba(239,68,68,0.1)',
        badgeBg: 'rgba(239,68,68,0.15)',
        badgeColor: '#f87171',
      }
    case 'critical':
      return {
        label: '💀 危险',
        borderColor: 'rgba(185,28,28,0.5)',
        glowColor: 'rgba(185,28,28,0.3)',
        headerBg: 'rgba(185,28,28,0.15)',
        badgeBg: 'rgba(185,28,28,0.2)',
        badgeColor: '#fca5a5',
      }
  }
}
