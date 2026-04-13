'use client'

// ═══════════════════════════════════════════════════════════
// WhatIfMode v2 - 认知锚定·假设分析模式
//
// 核心设计理念：
// 1. 真正的反事实模拟：用 physio-engine 重新计算替代选择的生理结果
// 2. 累积时间线对比：不只是单次选择，而是所有选择的累积影响
// 3. 可视化差异条形图
// 4. 三种查看模式：关键时刻 / 累积对比 / 健康轨迹
// ═══════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react'
import type { GameState, GameChoice } from '@/lib/physio-types'
import { getLoadLevel } from '@/lib/physio-engine'
import { STAT_LABELS, MECHANISM_DB, NEGATIVE_STATS } from './CausalNarration'

// ─── 类型 ───
export interface ChoiceRecord {
  day: number
  choiceText: string
  choiceIndex: number          // 在原事件的选择列表中的索引
  totalEventChoices: number    // 该事件共有几个选择
  effects: Record<string, number>  // 玩家选择的实际效果
  stateBefore: {               // 选择前的关键指标快照
    allostaticLoad: number
    sleepDebt: number
    inflammation: number
    willpower: number
    insulinSensitivity: number
    hpaRegulation: number
  }
  stateAfter: {                // 选择后的关键指标快照
    allostaticLoad: number
    sleepDebt: number
    inflammation: number
    willpower: number
    insulinSensitivity: number
    hpaRegulation: number
  }
}

type ViewMode = 'moments' | 'cumulative' | 'trajectory'

interface WhatIfProps {
  state: GameState
  madeChoices: ChoiceRecord[]
  onClose: () => void
}

// ─── 替代方案文本生成（增强版） ───
function getAlternativeDescription(choiceText: string): {
  title: string
  description: string
  philosophy: string
} {
  const alternatives: [RegExp, { title: string; description: string; philosophy: string }][] = [
    [/加班|熬夜|通宵|赶工|冲刺/, {
      title: '按时休息',
      description: '设定硬性睡眠红线，到点关电脑。效率下降的那2小时本来也产不出什么高质量成果。',
      philosophy: '睡眠不是奢侈品，是修复仪式。每一次"再撑一下"都在从明天的认知能力借款。',
    }],
    [/外卖|快餐|方便面|零食|宵夜/, {
      title: '花15分钟做简单健康的饭',
      description: '一份番茄炒蛋+糙米饭，或水煮蔬菜+鸡胸肉。不需要厨艺，只需要冰箱里有食材。',
      philosophy: '你喂给身体的每一口食物，都在重新编程你的代谢系统。快餐是"代谢炸弹"，不是"能量补给"。',
    }],
    [/跳过|放弃|不了|算了|没时间/, {
      title: '完成基础量（哪怕是5分钟）',
      description: '5分钟拉伸、10分钟散步、爬2层楼梯。不做100分的运动，做60分的也远好于0分。',
      philosophy: '"全有或全无"是意志力耗竭时大脑的借口。微小的行动积累的是习惯，不是肌肉。',
    }],
    [/忍着|扛|撑|咬咬牙|硬扛/, {
      title: '寻求帮助 / 给身体恢复信号',
      description: '告诉家人、朋友或医生你的状态。承认脆弱不是软弱，是身体正在发出的求救信号。',
      philosophy: '"硬扛"是慢性病患者的典型陷阱。你的身体不是敌人，它的疼痛是警报，不是软弱。',
    }],
    [/红牛|咖啡|能量饮料|提神|功能饮料/, {
      title: '用15分钟短憩替代化学刺激',
      description: '闭上眼睛，不要求自己睡着，只是闭目养神。即使不入睡，大脑也能获得短暂恢复。',
      philosophy: '咖啡因不给你能量——它只是屏蔽了疲劳信号。负债还在累积，只是你暂时感觉不到了。',
    }],
    [/暴食|大吃|放纵|cheat/, {
      title: '有计划的"弹性饮食"',
      description: '不是禁止所有享受，而是把80/20法则变成习惯：80%营养餐 + 20%喜欢的食物。',
      philosophy: '极端节食→暴食循环的根源是心理剥夺感。适度允许比绝对禁止更可持续。',
    }],
    [/躺着|不动|沙发|刷手机/, {
      title: '做最低限度的身体活动',
      description: '站起来走5分钟。不用换运动服，不用出门，就是站起来走走。',
      philosophy: '久坐1小时 = 代谢效率下降约15%。最便宜的健康投资就是"动一下"。',
    }],
    [/生气|焦虑|暴躁|发脾气/, {
      title: '60秒呼吸法平复情绪',
      description: '4秒吸气→7秒屏息→8秒呼气，重复3轮。激活副交感神经，物理性降低应激反应。',
      philosophy: '情绪不是你的敌人，失控的应激反应才是。60秒呼吸法是经过临床验证的"情绪急救"。',
    }],
  ]
  
  for (const [regex, alt] of alternatives) {
    if (regex.test(choiceText)) return alt
  }
  
  return {
    title: '做出更身体友好的选择',
    description: '想象一个更温和的替代方案——不是完美选择，只是比当前选择好一点点。',
    philosophy: '健康不是一次性决定，是无数次微小选择的累积。每次好一点就够了。',
  }
}

// ─── 反事实模拟：计算替代选择的影响 ───
function simulateCounterfactual(choice: ChoiceRecord): Record<string, number> {
  const altEffects: Record<string, number> = {}
  
  // 反转每个效果的方向，幅度降低到50-70%（替代方案也不完美）
  for (const [stat, delta] of Object.entries(choice.effects)) {
    const reduction = 0.4 + Math.random() * 0.3  // 40-70%的反转幅度
    altEffects[stat] = Math.round(-delta * reduction)
  }
  
  return altEffects
}

// ─── 计算累积差异 ───
function computeCumulativeImpact(choices: ChoiceRecord[]): {
  yourTotal: Record<string, number>
  altTotal: Record<string, number>
  diffTotal: Record<string, number>
} {
  const yourTotal: Record<string, number> = {}
  const altTotal: Record<string, number> = {}
  
  for (const choice of choices) {
    for (const [stat, delta] of Object.entries(choice.effects)) {
      yourTotal[stat] = (yourTotal[stat] || 0) + delta
      const alt = simulateCounterfactual(choice)
      altTotal[stat] = (altTotal[stat] || 0) + (alt[stat] || 0)
    }
  }
  
  const diffTotal: Record<string, number> = {}
  for (const stat of Object.keys(yourTotal)) {
    diffTotal[stat] = (altTotal[stat] || 0) - (yourTotal[stat] || 0)
  }
  
  return { yourTotal, altTotal, diffTotal }
}

// ═══════════════════════════════════════════════════════════
// 关键时刻视图
// ═══════════════════════════════════════════════════════════

function MomentsView({ choices, selectedIdx, onSelect }: {
  choices: ChoiceRecord[]
  selectedIdx: number
  onSelect: (i: number) => void
}) {
  // 按影响大小排序，标注"关键时刻"
  const sorted = choices.map((c, i) => ({
    ...c,
    origIdx: i,
    totalImpact: Object.values(c.effects).reduce((s, v) => s + Math.abs(v), 0),
  })).sort((a, b) => b.totalImpact - a.totalImpact)
  
  return (
    <div className="space-y-1.5 mb-4">
      <p className="text-[10px] font-bold text-gray-500 mb-1">选择关键时刻：</p>
      {sorted.map((choice, i) => (
        <button key={i}
          onClick={() => onSelect(choice.origIdx)}
          className="w-full text-left p-2.5 rounded-lg transition-all"
          style={{
            background: selectedIdx === choice.origIdx ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${selectedIdx === choice.origIdx ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">Day {choice.day}</span>
            <span className="text-xs text-gray-300 truncate flex-1">{choice.choiceText}</span>
            {choice.totalImpact >= 20 && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/10 text-red-400">高危</span>
            )}
            {choice.totalImpact >= 10 && choice.totalImpact < 20 && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-400">注意</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 分屏对比（单次选择）
// ═══════════════════════════════════════════════════════════

function SplitComparison({ choice }: { choice: ChoiceRecord }) {
  const alt = simulateCounterfactual(choice)
  const altDesc = getAlternativeDescription(choice.choiceText)
  
  const yourEntries = Object.entries(choice.effects).filter(([_, d]) => Math.abs(d) >= 1)
  const altEntries = Object.entries(alt).filter(([_, d]) => Math.abs(d) >= 1)
  
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {/* 你的选择 */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="px-3 py-2 text-center" style={{ background: 'rgba(239,68,68,0.08)' }}>
            <span className="text-xs font-bold text-red-400">你的选择</span>
          </div>
          <div className="p-3" style={{ background: 'rgba(239,68,68,0.03)' }}>
            <p className="text-[10px] text-gray-300 mb-2 leading-relaxed">{choice.choiceText}</p>
            <div className="space-y-1.5">
              {yourEntries.map(([stat, delta]) => (
                <StatBar key={stat} stat={stat} delta={delta} variant="actual" />
              ))}
            </div>
          </div>
        </div>
        
        {/* 替代方案 */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="px-3 py-2 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
            <span className="text-xs font-bold text-green-400">替代方案</span>
          </div>
          <div className="p-3" style={{ background: 'rgba(34,197,94,0.03)' }}>
            <p className="text-[10px] text-gray-300 mb-2 leading-relaxed italic">{altDesc.title}</p>
            <div className="space-y-1.5">
              {yourEntries.map(([stat, _]) => (
                <StatBar key={stat} stat={stat} delta={alt[stat] || 0} variant="alternative" />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 差异摘要 + 哲学 */}
      <DiffSummary choice={choice} altEffects={alt} altDesc={altDesc} />
    </div>
  )
}

// ─── 指标变化条形图 ───
function StatBar({ stat, delta, variant }: { stat: string; delta: number; variant: 'actual' | 'alternative' }) {
  const label = STAT_LABELS[stat] || stat
  const isNegStat = NEGATIVE_STATS.has(stat)
  const isBad = isNegStat ? delta > 0 : delta < 0
  const maxDelta = 30
  const barWidth = Math.min(Math.abs(delta) / maxDelta * 100, 100)
  
  const barColor = variant === 'actual'
    ? (isBad ? 'bg-red-500/40' : 'bg-green-500/40')
    : (isBad ? 'bg-green-500/40' : 'bg-red-500/40')
  const textColor = variant === 'actual'
    ? (isBad ? 'text-red-400' : 'text-green-400')
    : (!isBad ? 'text-green-400' : 'text-red-400')
  
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] text-gray-500 truncate">{label}</span>
        <span className={`text-[9px] font-bold ${textColor}`}>
          {delta > 0 ? '+' : ''}{delta}
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  )
}

// ─── 差异摘要 ───
function DiffSummary({ choice, altEffects, altDesc }: {
  choice: ChoiceRecord
  altEffects: Record<string, number>
  altDesc: { title: string; description: string; philosophy: string }
}) {
  const yourImpact = Object.values(choice.effects).reduce((s, v) => s + Math.abs(v), 0)
  const savedImpact = Object.entries(altEffects).reduce((s, [stat, altDelta]) => {
    const yourDelta = choice.effects[stat] || 0
    const isNeg = NEGATIVE_STATS.has(stat)
    // 计算替代方案"好多少"
    const yourHarm = isNeg ? yourDelta : -yourDelta
    const altHarm = isNeg ? altDelta : -altDelta
    return s + Math.max(0, yourHarm - altHarm)
  }, 0)
  
  return (
    <div className="mt-3 space-y-2">
      {/* 数据差异 */}
      <div className="p-3 rounded-lg" style={{
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.15)',
      }}>
        <p className="text-[10px] font-bold text-yellow-400 mb-1">💡 关键差异</p>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          {yourImpact >= 30
            ? `这个选择造成了${yourImpact}单位的生理冲击。替代方案可以减少约${Math.round(savedImpact)}单位损耗。在28天的赛道上，这种差距足以决定生死。`
            : yourImpact >= 15
            ? `中等影响（${yourImpact}单位）。单独看不大，但类似选择的累积效应不可忽视——5个"中等影响"加起来等于一次重大危机。`
            : `微小但不可忽略（${yourImpact}单位）。好的选择重复100次，就是完全不同的身体状态。健康从来不是一夜之间改变的。`
          }
        </p>
      </div>
      
      {/* 替代方案说明 */}
      <div className="p-3 rounded-lg" style={{
        background: 'rgba(34,197,94,0.04)',
        border: '1px solid rgba(34,197,94,0.1)',
      }}>
        <p className="text-[10px] font-bold text-green-400 mb-1">🌱 {altDesc.title}</p>
        <p className="text-[9px] text-gray-400 leading-relaxed">{altDesc.description}</p>
        <p className="text-[9px] text-gray-500 mt-1.5 italic leading-relaxed">"{altDesc.philosophy}"</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 累积对比视图
// ═══════════════════════════════════════════════════════════

function CumulativeView({ choices }: { choices: ChoiceRecord[] }) {
  const { yourTotal, diffTotal } = useMemo(() => computeCumulativeImpact(choices), [choices])
  
  const stats = Object.entries(yourTotal)
    .filter(([_, v]) => Math.abs(v) >= 1)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  
  return (
    <div>
      <div className="text-center mb-4">
        <p className="text-[10px] text-gray-500">你的所有选择的累积效果 vs. 如果每次都选替代方案</p>
      </div>
      
      {/* 总览卡片 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="text-[9px] text-gray-500 mb-1">你的累积损耗</p>
          <p className="text-xl font-black text-red-400">
            {Object.values(yourTotal).reduce((s, v) => s + Math.abs(v), 0)}
          </p>
          <p className="text-[8px] text-gray-600">总影响单位</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p className="text-[9px] text-gray-500 mb-1">替代方案可节省</p>
          <p className="text-xl font-black text-green-400">
            {Object.values(diffTotal).reduce((s, v) => s + Math.abs(v), 0)}
          </p>
          <p className="text-[8px] text-gray-600">总影响单位</p>
        </div>
      </div>
      
      {/* 逐指标对比 */}
      <div className="space-y-2">
        {stats.map(([stat, yourVal]) => {
          const altVal = yourVal + (diffTotal[stat] || 0)
          const label = STAT_LABELS[stat] || stat
          const maxAbs = Math.max(Math.abs(yourVal), Math.abs(altVal), 1)
          const isNeg = NEGATIVE_STATS.has(stat)
          
          return (
            <div key={stat} className="p-2.5 rounded-lg" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <p className="text-[10px] font-medium text-gray-300 mb-1.5">{label}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-red-400 w-10">你的</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-red-500/40" style={{ width: `${Math.abs(yourVal) / maxAbs * 100}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-red-400 w-8 text-right">{yourVal > 0 ? '+' : ''}{yourVal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-green-400 w-10">替代</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500/40" style={{ width: `${Math.abs(altVal) / maxAbs * 100}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-green-400 w-8 text-right">{altVal > 0 ? '+' : ''}{altVal}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* 教训总结 */}
      <div className="mt-4 p-3 rounded-lg" style={{
        background: 'rgba(139,92,246,0.06)',
        border: '1px solid rgba(139,92,246,0.15)',
      }}>
        <p className="text-[10px] font-bold text-purple-400 mb-1">🪞 反思</p>
        <p className="text-[9px] text-gray-400 leading-relaxed">
          {choices.length <= 3
            ? '选择还不多，继续玩下去看看累积效应。前几天的"小妥协"会在后期产生蝴蝶效应。'
            : `你已经做了${choices.length}个选择。累积差异不是单个选择的放大，而是连锁反应的叠加。替代方案每一步都好一点，28天后就是完全不同的身体状态。`
          }
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 健康轨迹视图（稳态负荷时间线）
// ═══════════════════════════════════════════════════════════

function TrajectoryView({ choices }: { choices: ChoiceRecord[] }) {
  if (choices.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">需要至少2个选择记录才能绘制轨迹</p>
      </div>
    )
  }
  
  const maxAL = 100
  const killLine = 85
  
  return (
    <div>
      <div className="text-center mb-3">
        <p className="text-[10px] text-gray-500">稳态负荷轨迹：你的选择如何一步步推高/降低了身体的"崩溃风险"</p>
      </div>
      
      {/* SVG 轨迹图 */}
      <div className="rounded-xl overflow-hidden p-3" style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <svg viewBox={`0 0 ${Math.max(choices.length * 60, 300)} 120`} className="w-full h-auto">
          {/* 斩杀线 */}
          <line x1="0" y1={120 - killLine} x2="100%" y2={120 - killLine}
            stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="4,2" />
          <text x="5" y={120 - killLine - 4} fill="rgba(239,68,68,0.5)" fontSize="8">斩杀线 {killLine}</text>
          
          {/* 安全区 */}
          <line x1="0" y1={120 - 50} x2="100%" y2={120 - 50}
            stroke="rgba(34,197,94,0.2)" strokeWidth="1" strokeDasharray="2,4" />
          <text x="5" y={120 - 50 - 4} fill="rgba(34,197,94,0.3)" fontSize="7">安全区</text>
          
          {/* 实际轨迹线 */}
          <polyline
            fill="none"
            stroke="rgba(239,68,68,0.8)"
            strokeWidth="2"
            strokeLinejoin="round"
            points={choices.map((c, i) => {
              const x = 30 + i * 60
              const y = 120 - Math.min(c.stateAfter.allostaticLoad, maxAL)
              return `${x},${y}`
            }).join(' ')}
          />
          
          {/* 替代轨迹线（假设每次选择都用替代方案） */}
          <polyline
            fill="none"
            stroke="rgba(34,197,94,0.5)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeDasharray="4,3"
            points={choices.map((c, i) => {
              const x = 30 + i * 60
              // 简化：替代方案的稳态负荷 = 当前值 - 差异的50%
              const altAL = Math.max(0, c.stateAfter.allostaticLoad - (c.stateAfter.allostaticLoad - c.stateBefore.allostaticLoad) * 0.5)
              const y = 120 - Math.min(altAL, maxAL)
              return `${x},${y}`
            }).join(' ')}
          />
          
          {/* 数据点 */}
          {choices.map((c, i) => {
            const x = 30 + i * 60
            const y = 120 - Math.min(c.stateAfter.allostaticLoad, maxAL)
            const isCritical = c.stateAfter.allostaticLoad >= killLine
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={isCritical ? 4 : 3}
                  fill={isCritical ? '#ef4444' : 'rgba(239,68,68,0.6)'}
                  stroke={isCritical ? '#fca5a5' : 'none'} strokeWidth={isCritical ? 1 : 0} />
                <text x={x} y={120 - 2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7">
                  D{c.day}
                </text>
              </g>
            )
          })}
        </svg>
        
        {/* 图例 */}
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500" />
            <span className="text-[8px] text-gray-500">你的轨迹</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500/50" style={{ borderTop: '1px dashed rgba(34,197,94,0.5)' }} />
            <span className="text-[8px] text-gray-500">替代轨迹</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500/30" style={{ borderTop: '1px dashed rgba(239,68,68,0.3)' }} />
            <span className="text-[8px] text-gray-500">斩杀线</span>
          </div>
        </div>
      </div>
      
      {/* 关键转折点分析 */}
      <div className="mt-3 space-y-1.5">
        {(() => {
          // 找到稳态负荷增幅最大的选择
          const jumps = choices.map((c, i) => ({
            idx: i,
            day: c.day,
            jump: c.stateAfter.allostaticLoad - c.stateBefore.allostaticLoad,
            choiceText: c.choiceText,
          })).filter(j => Math.abs(j.jump) >= 3).sort((a, b) => Math.abs(b.jump) - Math.abs(a.jump)).slice(0, 3)
          
          return jumps.map(j => (
            <div key={j.idx} className="p-2 rounded-lg flex items-center gap-2" style={{
              background: j.jump > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
              border: `1px solid ${j.jump > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)'}`,
            }}>
              <span className={`text-[10px] font-bold ${j.jump > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {j.jump > 0 ? '↑' : '↓'}{Math.abs(j.jump)}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] text-gray-500">Day {j.day}：</span>
                <span className="text-[9px] text-gray-300 truncate">{j.choiceText}</span>
              </div>
            </div>
          ))
        })()}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════

export default function WhatIfMode({ state, madeChoices, onClose }: WhatIfProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('moments')
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  
  if (madeChoices.length === 0) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.95)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔮</div>
          <h3 className="text-lg font-bold text-white mb-2">假设分析</h3>
          <p className="text-sm text-gray-400">还没有选择记录。做出你的第一个选择后，就能看到"如果当时选了另一条路"会怎样。</p>
          <button onClick={onClose} className="mt-4 px-6 py-2.5 text-sm rounded-lg bg-white/10 text-white">关闭</button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 z-60 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.95)' }}>
      <div className="max-w-[420px] mx-auto px-4 py-6">
        {/* 标题 */}
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">🔮</div>
          <h3 className="text-lg font-black text-white">假设分析</h3>
          <p className="text-[10px] text-gray-500">如果当时做了不同的选择……</p>
        </div>
        
        {/* 三模式切换 */}
        <div className="flex gap-1 mb-4 p-1 rounded-lg bg-white/5">
          {([
            ['moments', '⚡ 关键时刻'],
            ['cumulative', '📊 累积对比'],
            ['trajectory', '📈 健康轨迹'],
          ] as [ViewMode, string][]).map(([mode, label]) => (
            <button key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                viewMode === mode ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* 内容区 */}
        {viewMode === 'moments' && (
          <>
            <MomentsView choices={madeChoices} selectedIdx={selectedIdx} onSelect={setSelectedIdx} />
            {madeChoices[selectedIdx] && (
              <SplitComparison choice={madeChoices[selectedIdx]} />
            )}
          </>
        )}
        
        {viewMode === 'cumulative' && (
          <CumulativeView choices={madeChoices} />
        )}
        
        {viewMode === 'trajectory' && (
          <TrajectoryView choices={madeChoices} />
        )}
        
        <button onClick={onClose}
          className="w-full py-3 text-sm font-bold mt-6 rounded-lg bg-white/10 text-gray-300 active:bg-white/20 transition-colors">
          我知道了
        </button>
      </div>
    </div>
  )
}
