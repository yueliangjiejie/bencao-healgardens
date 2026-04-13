'use client'

// ═══════════════════════════════════════════════════════════
// DailySettlement - 每日结算仪式
// 3步流程：生理审计回放 → 债务结算 → 明日预测
// 让玩家感受"选择的累积后果"
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import type { DailySettlementData } from './FeedbackSystem'
import { getStatLabel, getStatIcon } from './FeedbackSystem'

interface DailySettlementProps {
  data: DailySettlementData
  onAcknowledge: () => void
}

type SettlementStep = 'audit' | 'debts' | 'prediction'

export default function DailySettlement({ data, onAcknowledge }: DailySettlementProps) {
  const [step, setStep] = useState<SettlementStep>('audit')
  const [animatingDelta, setAnimatingDelta] = useState(0)

  // 审计回放动画：逐步展示每个变化
  useEffect(() => {
    if (step === 'audit') {
      const timer = setInterval(() => {
        setAnimatingDelta(prev => {
          if (prev >= data.deltas.length - 1) {
            clearInterval(timer)
            return prev
          }
          return prev + 1
        })
      }, 600)
      return () => clearInterval(timer)
    }
  }, [step, data.deltas.length])

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.95)' }}>
      <div className="w-full max-w-[380px] animate-fade-in">
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['audit', 'debts', 'prediction'] as SettlementStep[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full transition-all ${
                  step === s ? 'bg-cyan-400 scale-125' :
                  i < ['audit', 'debts', 'prediction'].indexOf(step) ? 'bg-cyan-400' : 'bg-gray-700'
                }`} />
                <span className={`text-[9px] font-bold ${
                  step === s ? 'text-cyan-400' : 'text-gray-600'
                }`}>
                  {s === 'audit' ? '审计' : s === 'debts' ? '债务' : '预测'}
                </span>
              </div>
              {i < 2 && <div className="w-6 h-px bg-gray-700" />}
            </React.Fragment>
          ))}
        </div>

        {/* 内容区 */}
        {step === 'audit' && <AuditStep data={data} visibleCount={animatingDelta + 1} />}
        {step === 'debts' && <DebtsStep data={data} />}
        {step === 'prediction' && <PredictionStep data={data} />}

        {/* 操作按钮 */}
        <div className="mt-6 space-y-2">
          {step === 'audit' && (
            <button onClick={() => setStep('debts')} className="btn-gold w-full py-3 text-sm font-bold">
              查看今日代价 →
            </button>
          )}
          {step === 'debts' && (
            <button onClick={() => setStep('prediction')} className="btn-gold w-full py-3 text-sm font-bold">
              预测明天 →
            </button>
          )}
          {step === 'prediction' && (
            <button onClick={onAcknowledge} className="btn-gold w-full py-3 text-sm font-bold">
              我知道了，继续
            </button>
          )}
        </div>

        {/* Day标记 */}
        <p className="text-center text-[10px] text-gray-600 mt-3">
          Day {data.day} · 日终结算
        </p>
      </div>
    </div>
  )
}

// ─── 第1步：生理审计回放 ───
function AuditStep({ data, visibleCount }: { data: DailySettlementData; visibleCount: number }) {
  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">🔬</div>
        <h3 className="text-base font-black text-white">今日生理审计</h3>
        <p className="text-[10px] text-gray-500">你的身体发生了这些变化</p>
      </div>

      <div className="space-y-2">
        {data.deltas.slice(0, visibleCount).map((d, i) => {
          const isBad = d.stat.includes('allostatic') || d.stat.includes('inflammation') || d.stat.includes('debt') || d.stat.includes('stress')
            ? d.delta > 0 : d.delta < 0
          const color = isBad ? '#ef4444' : '#22c55e'
          const barWidth = Math.min(Math.abs(d.delta) * 3, 100)

          return (
            <div key={i} className="p-2.5 rounded-lg animate-slide-up" style={{
              background: isBad ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
              border: `1px solid ${isBad ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}`,
              animationDelay: `${i * 100}ms`,
            }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300">
                  {d.icon} {d.label}
                </span>
                <span className="text-xs font-black" style={{ color }}>
                  {d.delta > 0 ? '+' : ''}{d.delta}
                  <span className="text-[9px] text-gray-500 font-normal ml-1">
                    ({d.before}→{d.after})
                  </span>
                </span>
              </div>
              {/* 变化条 */}
              <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${barWidth}%`,
                  background: color,
                  transition: 'width 0.5s ease-out',
                }} />
              </div>
            </div>
          )
        })}

        {data.deltas.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">今日无明显生理变化</p>
        )}
      </div>
    </div>
  )
}

// ─── 第2步：债务结算 ───
function DebtsStep({ data }: { data: DailySettlementData }) {
  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">📋</div>
        <h3 className="text-base font-black text-white">今日代价</h3>
        <p className="text-[10px] text-gray-500">延迟效应和不可逆损伤</p>
      </div>

      {/* 新增延迟效果 */}
      {data.newDelayedEffects.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-yellow-400 mb-2">⏳ 新增延迟效应</p>
          {data.newDelayedEffects.map((badge, i) => (
            <div key={i} className="p-2 rounded-lg mb-1.5" style={{
              background: 'rgba(234,179,8,0.06)',
              border: '1px solid rgba(234,179,8,0.15)',
            }}>
              <p className="text-[10px] text-gray-300">{badge.cause}</p>
              <p className="text-[9px] text-yellow-500">将在 Day {badge.triggerDay} 触发</p>
            </div>
          ))}
        </div>
      )}

      {/* 疤痕 */}
      {data.scars.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-red-400 mb-2">💀 不可逆损伤</p>
          {data.scars.map((scar, i) => (
            <div key={i} className="p-2 rounded-lg mb-1.5" style={{
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
            }}>
              <p className="text-xs font-bold text-red-400">{scar.name}</p>
              <p className="text-[9px] text-gray-400">{scar.description}</p>
            </div>
          ))}
        </div>
      )}

      {data.newDelayedEffects.length === 0 && data.scars.length === 0 && (
        <div className="p-4 rounded-lg text-center" style={{
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.15)',
        }}>
          <p className="text-sm text-green-400">✅ 今日无新增代价</p>
          <p className="text-[10px] text-gray-500 mt-1">身体暂时没有积累新的债务</p>
        </div>
      )}
    </div>
  )
}

// ─── 第3步：明日预测 ───
function PredictionStep({ data }: { data: DailySettlementData }) {
  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">🔮</div>
        <h3 className="text-base font-black text-white">明日预测</h3>
        <p className="text-[10px] text-gray-500">根据当前状态，明天可能发生</p>
      </div>

      <div className="space-y-2">
        {data.predictions.map((pred, i) => {
          const trendIcon = pred.trend === 'up' ? '📈' : pred.trend === 'down' ? '📉' : '➡️'
          const trendColor = pred.trend === 'up'
            ? (pred.stat.includes('allostatic') || pred.stat.includes('inflammation') ? '#ef4444' : '#22c55e')
            : pred.trend === 'down'
              ? (pred.stat.includes('allostatic') || pred.stat.includes('inflammation') ? '#22c55e' : '#ef4444')
              : '#fbbf24'

          return (
            <div key={i} className="p-2.5 rounded-lg" style={{
              background: 'rgba(6,182,212,0.06)',
              border: '1px solid rgba(6,182,212,0.15)',
            }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-300">{getStatLabel(pred.stat)}</span>
                <span className="text-xs" style={{ color: trendColor }}>
                  {trendIcon} {pred.trend === 'up' ? '上升' : pred.trend === 'down' ? '下降' : '稳定'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400">{pred.description}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[8px] text-gray-600">置信度</span>
                <div className="flex-1 h-0.5 rounded-full bg-gray-800">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${pred.confidence}%` }} />
                </div>
                <span className="text-[8px] text-gray-500">{pred.confidence}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
