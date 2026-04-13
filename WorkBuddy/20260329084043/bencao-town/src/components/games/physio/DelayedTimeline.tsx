'use client'

import { motion } from 'framer-motion'
import { DelayedEffect, PhysiologyState } from '@/lib/physio-types'

interface Props {
  delayedStack: DelayedEffect[]
  currentDay: number
  physiology: PhysiologyState
}

export default function DelayedTimeline({ delayedStack, currentDay, physiology }: Props) {
  // 过去7天范围
  const startDay = Math.max(1, currentDay - 6)

  // 三层数据
  const layers = [
    { id: 'behavior', label: '行为层', color: '#3b82f6', items: delayedStack.filter(d => d.applied).slice(-8) },
    { id: 'physio', label: '生理层', color: '#ef4444', desc: '行为后24-48h', items: delayedStack.filter(d => d.applied).slice(-6) },
    { id: 'symptom', label: '症状层', color: '#f59e0b', desc: '生理后12-36h', items: delayedStack.filter(d => d.applied).slice(-4) },
  ]

  // 待触发的延迟效应
  const pending = delayedStack.filter(d => !d.applied && d.triggerDay > currentDay)

  // 预测：基于当前趋势
  const predictText = () => {
    const al = physiology.chronic.allostaticLoad
    if (al > 75) return `基于当前轨迹，预计${Math.max(2, 7 - Math.floor(al / 15))}天后进入炎症高峰`
    if (al > 50) return '当前处于亚健康区间，若无干预将在1-2周内进入危险区'
    return '当前状态可控，继续保持健康选择可逐步恢复'
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white">⏳ 延迟效应追踪</span>
        <span className="text-[9px] text-gray-500">因果链可视化</span>
      </div>

      {/* 三层时间轴 */}
      <div className="space-y-2">
        {layers.map((layer, li) => (
          <div key={layer.id}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: layer.color }} />
              <span className="text-[9px] font-bold" style={{ color: layer.color }}>{layer.label}</span>
              {layer.desc && <span className="text-[7px] text-gray-600">({layer.desc})</span>}
            </div>
            <div className="relative h-6 ml-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
              {/* 时间刻度 */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="flex-1 border-r border-white/5 flex items-end justify-center">
                    <span className="text-[6px] text-gray-700">{startDay + i}</span>
                  </div>
                ))}
              </div>
              {/* 事件点 */}
              {layer.items.slice(-5).map((item, ii) => {
                const dayOffset = Math.min(6, Math.max(0, item.triggerDay - startDay))
                const leftPct = (dayOffset / 6) * 100
                return (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 w-1.5 h-4 rounded-sm cursor-pointer"
                    style={{ left: `${leftPct}%`, background: layer.color, opacity: 0.7 }}
                    title={`${item.cause}: ${item.notification}`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 待触发效应 */}
      {pending.length > 0 && (
        <div className="mt-3 p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <span className="text-[9px] font-bold text-yellow-400">⏳ {pending.length}个待触发效应</span>
          <div className="mt-1 space-y-1">
            {pending.slice(0, 3).map(d => (
              <div key={d.id} className="flex items-center gap-2">
                <span className="text-[8px] text-gray-600">Day {d.triggerDay}</span>
                <span className="text-[9px] text-gray-400">{d.cause}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 预测 */}
      <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
        <span className="text-[9px] text-gray-400">🔮 趋势预测</span>
        <p className="text-[10px] text-gray-300 mt-0.5">{predictText()}</p>
      </div>
    </motion.div>
  )
}
