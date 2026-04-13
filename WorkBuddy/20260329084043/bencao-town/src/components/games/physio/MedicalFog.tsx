'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { PhysiologyState } from '@/lib/physio-types'

interface Props {
  physiology: PhysiologyState
  day: number
}

// 不确定性等级
type Certainty = 'certain' | 'uncertain' | 'unknown'

interface FogMetric {
  name: string
  certain: string
  uncertain: string
  unknownText: string
  certainty: Certainty
  staleDays?: number
}

export default function MedicalFog({ physiology, day }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  // 根据游戏进度确定信息不确定性
  const getFogMetrics = (): FogMetric[] => {
    const week = Math.ceil(day / 7)
    return [
      {
        name: '血糖',
        certain: (5.0 + (100 - physiology.metabolic.glucoseStability) * 0.03).toFixed(1) + ' mmol/L（指尖血）',
        uncertain: `${(4.8 + (100 - physiology.metabolic.glucoseStability) * 0.02).toFixed(1)}-${(6.0 + (100 - physiology.metabolic.glucoseStability) * 0.04).toFixed(1)}（CGM估计范围）`,
        unknownText: '餐后波动（未监测时段）— 显示为灰色迷雾',
        certainty: week >= 3 ? 'uncertain' : 'certain',
        staleDays: week >= 3 ? 2 : 0,
      },
      {
        name: 'C反应蛋白',
        certain: `CRP ${(physiology.immune.inflammation / 15).toFixed(1)} mg/L`,
        uncertain: '数据已过时，当前状态未知',
        unknownText: '炎症指标完全不可见',
        certainty: week >= 2 ? (day % 3 === 0 ? 'certain' : 'uncertain') : 'unknown',
        staleDays: week >= 2 ? Math.min(5, day - 14) : 0,
      },
      {
        name: '皮质醇节律',
        certain: physiology.chronic.cortisolPattern === 'normal' ? '正常节律' : `异常: ${physiology.chronic.cortisolPattern}`,
        uncertain: '节律可能改变，需复查确认',
        unknownText: '自主神经功能未知',
        certainty: week >= 2 ? 'uncertain' : 'certain',
      },
      {
        name: 'HPA轴状态',
        certain: `调节能力 ${physiology.neural.hpaRegulation}%`,
        uncertain: `估计 ${physiology.neural.hpaRegulation - 10}~${physiology.neural.hpaRegulation + 10}%（主观偏差）`,
        unknownText: '神经内分泌状态完全未知',
        certainty: physiology.neural.hpaRegulation < 40 ? 'uncertain' : 'certain',
      },
    ]
  }

  const metrics = getFogMetrics()

  // 获取信息获取行动
  const getInfoActions = () => [
    { action: '购买连续血糖监测(CGM)', cost: '¥400/月', clarity: '+40%', available: true },
    { action: '增加检测频率', cost: '静脉创伤+时间', clarity: '+30%', available: true },
    { action: '症状日记关联', cost: '认知负荷', clarity: '+20%', available: true },
  ]

  const getCertaintyStyle = (c: Certainty) => {
    switch (c) {
      case 'certain': return { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: '确定' }
      case 'uncertain': return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#f59e0b', label: '不确定' }
      case 'unknown': return { bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', color: '#6b7280', label: '未知' }
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-white">🌫️ 医学迷雾</span>
        <span className="text-[9px] text-gray-500">信息不完全性</span>
      </div>

      <div className="space-y-2">
        {metrics.map((metric) => {
          const style = getCertaintyStyle(metric.certainty)
          const isExpanded = expanded === metric.name

          return (
            <div
              key={metric.name}
              className="rounded-lg p-2.5 cursor-pointer transition-all"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
              onClick={() => setExpanded(isExpanded ? null : metric.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold" style={{ color: style.color }}>{metric.name}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: style.border, color: style.color }}>
                    {style.label}
                  </span>
                  {metric.staleDays && metric.staleDays > 0 && (
                    <span className="text-[7px] text-gray-500">过时{metric.staleDays}天</span>
                  )}
                </div>
                <span className="text-[8px] text-gray-600">{isExpanded ? '▲' : '▼'}</span>
              </div>

              {isExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1">
                  {/* 确定值 */}
                  {metric.certainty === 'certain' && (
                    <p className="text-[10px] text-gray-300">{metric.certain}</p>
                  )}
                  {/* 不确定值 */}
                  {metric.certainty === 'uncertain' && (
                    <div>
                      <p className="text-[10px] text-yellow-400/80">{metric.uncertain}</p>
                      <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{
                          width: '60%',
                          background: 'repeating-linear-gradient(90deg, #f59e0b 0px, #f59e0b 2px, transparent 2px, transparent 4px)',
                          filter: 'blur(0.5px)'
                        }} />
                      </div>
                    </div>
                  )}
                  {/* 未知值 */}
                  {metric.certainty === 'unknown' && (
                    <div className="h-3 rounded" style={{
                      background: 'linear-gradient(90deg, rgba(107,114,128,0.1), rgba(107,114,128,0.2), rgba(107,114,128,0.1))',
                      filter: 'blur(1px)'
                    }}>
                      <span className="text-[8px] text-gray-600 flex items-center justify-center h-full">??? 迷雾区域 ???</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* 信息获取行动 */}
      <div className="mt-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[9px] font-bold text-cyan-400">💰 主动获取信息（代价）</span>
        <div className="mt-1 space-y-1">
          {getInfoActions().map((action, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[9px] text-gray-400">{action.action}</span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-red-400">{action.cost}</span>
                <span className="text-[8px] text-green-400">清晰度{action.clarity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
