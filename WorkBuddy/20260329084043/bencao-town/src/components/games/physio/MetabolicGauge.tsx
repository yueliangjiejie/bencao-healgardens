'use client'

import { motion } from 'framer-motion'
import { PhysiologyState } from '@/lib/physio-types'

interface Props {
  physiology: PhysiologyState
}

export default function MetabolicGauge({ physiology }: Props) {
  const m = physiology.metabolic
  const glucoseQuality = m.glucoseStability > 70 ? 'green' : m.glucoseStability > 45 ? 'yellow' : 'red'
  const glucoseLabel = m.glucoseStability > 70 ? '稳定' : m.glucoseStability > 45 ? '波动大' : '过山车'
  const glucoseVal = (5.0 + (100 - m.glucoseStability) * 0.03).toFixed(1)
  const ketoneVal = (0.1 + m.mitochondrialHealth * 0.005).toFixed(1)
  const lactateLevel = m.mitochondrialHealth > 60 ? '正常' : m.mitochondrialHealth > 35 ? '升高' : '⚠️高'
  const flexibility = m.insulinSensitivity > 50 && m.mitochondrialHealth > 50
  const flexibilityStatus = flexibility ? '正常切换' : m.insulinSensitivity > 30 ? '迟钝' : '卡住'
  const flexColor = flexibility ? '#22c55e' : m.insulinSensitivity > 30 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white">⛽ 代谢燃料表</span>
        <span className="text-[9px] text-gray-500">燃料质量&gt;数量</span>
      </div>

      {/* 燃料指标 */}
      <div className="space-y-2">
        {/* 血糖 */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 w-14 shrink-0">血糖</span>
          <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${m.glucoseStability}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full"
              style={{ background: glucoseQuality === 'green' ? '#22c55e' : glucoseQuality === 'yellow' ? '#f59e0b' : '#ef4444' }}
            />
          </div>
          <span className="text-[10px] font-mono w-16 text-right" style={{ color: glucoseQuality === 'green' ? '#22c55e' : glucoseQuality === 'yellow' ? '#f59e0b' : '#ef4444' }}>
            {glucoseVal} mmol/L
          </span>
          <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
            background: glucoseQuality === 'green' ? 'rgba(34,197,94,0.15)' : glucoseQuality === 'yellow' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
            color: glucoseQuality === 'green' ? '#22c55e' : glucoseQuality === 'yellow' ? '#f59e0b' : '#ef4444'
          }}>
            {glucoseLabel}
          </span>
        </div>

        {/* 酮体 */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 w-14 shrink-0">酮体</span>
          <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${m.mitochondrialHealth * 0.5}%` }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="h-full rounded-full bg-gray-500"
            />
          </div>
          <span className="text-[10px] font-mono text-gray-500 w-16 text-right">{ketoneVal} mmol/L</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500">{m.mitochondrialHealth > 50 ? '微量活性' : '无活性'}</span>
        </div>

        {/* 乳酸 */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 w-14 shrink-0">乳酸</span>
          <div className="flex-1" />
          <span className="text-[10px] font-mono w-16 text-right" style={{ color: lactateLevel === '正常' ? '#22c55e' : '#f59e0b' }}>
            {lactateLevel}
          </span>
          {lactateLevel !== '正常' && (
            <span className="text-[8px] text-red-400">线粒体功能障碍</span>
          )}
        </div>
      </div>

      {/* 代谢灵活性指示器 */}
      <div className="mt-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400">代谢灵活性</span>
          <span className="text-[10px] font-bold" style={{ color: flexColor }}>{flexibilityStatus}</span>
        </div>
        {/* 双向开关动画 */}
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-[9px] text-gray-500">燃糖</span>
          <div className="relative w-16 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              className="absolute top-0.5 w-4 h-4 rounded-full"
              style={{ background: flexColor }}
              animate={{ left: flexibility ? '2px' : m.insulinSensitivity > 30 ? '24px' : '42px' }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
          </div>
          <span className="text-[9px] text-gray-500">燃脂</span>
        </div>
        {!flexibility && (
          <p className="text-[8px] text-gray-500 text-center mt-1">
            {m.insulinSensitivity < 30 ? '卡住 — 无法有效利用任何燃料，持续疲劳' : '迟钝 — 燃料切换速度变慢，恢复期延长'}
          </p>
        )}
      </div>
    </motion.div>
  )
}
