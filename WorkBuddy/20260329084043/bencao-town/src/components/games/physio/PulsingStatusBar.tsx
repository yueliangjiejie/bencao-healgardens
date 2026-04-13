'use client'

// ═══════════════════════════════════════════════════════════
// PulsingStatusBar - 实时脉动状态栏
// HRV波形背景 + 稳态负荷温度计 + 危险区发光 + 意志力电池
// ═══════════════════════════════════════════════════════════

import React, { useEffect, useState, useMemo } from 'react'
import type { GameState } from '@/lib/physio-types'
import { getLoadLevel, calcAllostaticLoad } from '@/lib/physio-engine'
import type { KillLineStage } from './FeedbackSystem'

interface PulsingStatusBarProps {
  state: GameState
  previewDeltas?: { stat: string; delta: number }[] | null  // 悬停预览
}

export default function PulsingStatusBar({ state, previewDeltas }: PulsingStatusBarProps) {
  const allostaticLoad = state.physiology.chronic.allostaticLoad
  const loadLevel = getLoadLevel(allostaticLoad)
  const willpower = state.willpower
  const cognitiveEnergy = state.cognitiveEnergy
  const physicalEnergy = state.physicalEnergy
  const [beatPhase, setBeatPhase] = useState(0)

  // 心跳节律动画
  useEffect(() => {
    // HRV越低心跳越快越规律；HRV越高心跳越慢越不规律
    const hrv = state.physiology.cardio.autonomicBalance
    const interval = Math.max(400, 1200 - hrv * 8) // HRV高→慢, HRV低→快
    const timer = setInterval(() => {
      setBeatPhase(p => (p + 1) % 100)
    }, interval)
    return () => clearInterval(timer)
  }, [state.physiology.cardio.autonomicBalance])

  // 预览值计算
  const previewLoad = useMemo(() => {
    if (!previewDeltas) return null
    let delta = 0
    for (const d of previewDeltas) {
      if (d.stat === 'allostatic') delta += d.delta
    }
    return allostaticLoad + delta
  }, [previewDeltas, allostaticLoad])

  const isPreviewing = previewLoad !== null && previewLoad !== allostaticLoad

  return (
    <div className="mb-3 space-y-1.5">
      {/* 稳态负荷温度计 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: allostaticLoad > 75 ? '#ef4444' : allostaticLoad > 50 ? '#f59e0b' : '#22c55e',
              boxShadow: allostaticLoad > 75 ? `0 0 4px ${allostaticLoad > 85 ? '#ef4444' : '#f59e0b'}` : 'none',
              animation: allostaticLoad > 75 ? 'pulse 1s infinite' : 'none',
            }} />
            稳态负荷
          </span>
          <span className={`text-xs font-bold ${loadLevel.color}`}>
            {loadLevel.emoji} {allostaticLoad}/100
            {isPreviewing && (
              <span style={{
                color: (previewLoad ?? 0) > allostaticLoad ? '#ef4444' : '#22c55e',
                fontWeight: 900,
                marginLeft: '4px',
              }}>
                → {previewLoad}
              </span>
            )}
          </span>
        </div>

        {/* 温度计条 */}
        <div className="relative h-2.5 rounded-full bg-gray-800 overflow-hidden">
          {/* 背景色段 */}
          <div className="absolute inset-0 flex">
            <div className="flex-1" style={{ background: 'rgba(34,197,94,0.1)' }} />
            <div className="flex-1" style={{ background: 'rgba(245,158,11,0.1)' }} />
            <div className="flex-1" style={{ background: 'rgba(239,68,68,0.1)' }} />
            <div className="flex-[0.5]" style={{ background: 'rgba(185,28,28,0.15)' }} />
          </div>

          {/* 当前值 */}
          <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700" style={{
            width: `${allostaticLoad}%`,
            background: allostaticLoad > 85
              ? 'linear-gradient(90deg, #dc2626, #991b1b)'
              : allostaticLoad > 75
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : allostaticLoad > 50
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #22c55e, #16a34a)',
            boxShadow: allostaticLoad > 75 ? `0 0 8px rgba(239,68,68,${0.3 + Math.sin(beatPhase / 100 * Math.PI * 2) * 0.2})` : 'none',
          }} />

          {/* 预览值（悬停时显示） */}
          {isPreviewing && (
            <div className="absolute top-0 left-0 h-full rounded-full border-2 border-dashed transition-all duration-300" style={{
              width: `${Math.min(100, previewLoad!)}%`,
              borderColor: (previewLoad ?? 0) > allostaticLoad ? 'rgba(239,68,68,0.6)' : 'rgba(34,197,94,0.6)',
              background: 'transparent',
            }} />
          )}

          {/* 斩杀线标记 */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/60" style={{ left: '75%' }} />
          <div className="absolute top-0 bottom-0 w-0.5 bg-red-700/80" style={{ left: '85%' }} />
          <div className="absolute top-0 bottom-0 w-0.5 bg-red-900" style={{ left: '90%' }} />
        </div>

        {/* 刻度标签 */}
        <div className="flex justify-between text-[8px] text-gray-600 mt-0.5">
          <span>健康</span>
          <span>亚健康</span>
          <span>⚠️危险</span>
          <span>💀临界</span>
        </div>
      </div>

      {/* 三大能量条 */}
      <div className="grid grid-cols-3 gap-1.5">
        <EnergyBar label="意志力" value={willpower} icon="🎯" color="#8b5cf6" max={100}
          depleting={willpower <= 15} preview={getPreviewValue(previewDeltas, 'willpower')} />
        <EnergyBar label="认知" value={cognitiveEnergy} icon="🧠" color="#06b6d4" max={100}
          depleting={cognitiveEnergy <= 15} preview={getPreviewValue(previewDeltas, 'cognitive')} />
        <EnergyBar label="体力" value={physicalEnergy} icon="💪" color="#22c55e" max={100}
          depleting={physicalEnergy <= 15} preview={getPreviewValue(previewDeltas, 'physical')} />
      </div>
    </div>
  )
}

// 能量条子组件
function EnergyBar({ label, value, icon, color, max, depleting, preview }: {
  label: string; value: number; icon: string; color: string; max: number; depleting: boolean;
  preview: number | null
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const previewPct = preview !== null ? Math.max(0, Math.min(100, (preview / max) * 100)) : null

  return (
    <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px]">{icon}</span>
        <span className="text-[9px] font-bold" style={{ color }}>
          {value}
          {preview !== null && preview !== value && (
            <span style={{ color: preview < value ? '#ef4444' : '#22c55e', fontWeight: 900 }}>
              →{preview}
            </span>
          )}
        </span>
      </div>
      <div className="relative h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-500" style={{
          width: `${pct}%`,
          background: color,
          opacity: depleting ? 0.6 + Math.sin(Date.now() / 500) * 0.3 : 1,
        }} />
        {previewPct !== null && previewPct !== pct && (
          <div className="absolute top-0 left-0 h-full rounded-full border border-dashed" style={{
            width: `${previewPct}%`,
            borderColor: (preview ?? 0) < value ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.5)',
            background: 'transparent',
          }} />
        )}
      </div>
      <p className="text-[7px] text-gray-600 text-center mt-0.5">{label}</p>
    </div>
  )
}

function getPreviewValue(deltas: { stat: string; delta: number }[] | null | undefined, stat: string): number | null {
  if (!deltas) return null
  for (const d of deltas) {
    if (d.stat === stat) return d.delta
  }
  return null
}
