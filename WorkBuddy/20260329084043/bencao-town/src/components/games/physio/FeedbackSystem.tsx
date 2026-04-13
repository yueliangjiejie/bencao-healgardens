'use client'

// ═══════════════════════════════════════════════════════════
// 即时反馈+延迟揭示 双层反馈系统
// 让玩家每一次选择都清晰看到"生理资源的流动"
// ═══════════════════════════════════════════════════════════

import React, {
  createContext, useContext, useState, useCallback, useRef, useEffect
} from 'react'
import type { GameState, PhysiologyState, DelayedEffect, GameChoice, Scar } from '@/lib/physio-types'

// ─── 数值感知阈值（第5节：数值平衡表） ───
export const PERCEPTION_THRESHOLDS = {
  health:      { small: 3, medium: 8, large: 15 },
  stress:      { small: 5, medium: 12, large: 25 },
  sleepDebt:   { small: 1, medium: 3, large: 6 },
  inflammation:{ small: 2, medium: 8, large: 20 },
  willpower:   { small: 5, medium: 15, large: 30 },
  allostatic:  { small: 3, medium: 8, large: 15 },
  cognitive:   { small: 5, medium: 10, large: 20 },
  physical:    { small: 5, medium: 10, large: 20 },
} as const

// ─── 反馈优先级规则 ───
export type FeedbackPriority = 'immediate' | 'delayed' | 'suppressed'

export function classifyDelta(stat: string, delta: number): FeedbackPriority {
  const absDelta = Math.abs(delta)
  const threshold = PERCEPTION_THRESHOLDS[stat as keyof typeof PERCEPTION_THRESHOLDS]
  if (!threshold) return absDelta >= 5 ? 'immediate' : 'suppressed'
  if (absDelta >= threshold.large) return 'immediate'
  if (absDelta >= threshold.medium) return 'delayed'
  return 'suppressed'
}

// ─── 浮动数值动画配置（第4节） ───
export interface NumberDeltaConfig {
  stat: string
  delta: number
  label: string
  icon: string
  color: string
  bgColor: string
  trajectory: 'up' | 'down' | 'left' | 'right' | 'arc-left' | 'arc-right'
  duration: number
  delay: number
}

// ─── 延迟效果徽章数据 ───
export interface DelayedBadgeData {
  id: string
  cause: string
  triggerDay: number
  currentDay: number
  effects: Record<string, number>
  notification: string
  visualState: 'fresh' | 'approaching' | 'triggered' | 'settled'
}

// ─── 生理涟漪效果 ───
export interface RippleEffect {
  type: 'heartbeat' | 'tunnel-vision' | 'stress-darken' | 'adrenaline-flash' | 'inflammation-glow'
  intensity: number  // 0-1
  duration: number   // ms
  color?: string
}

// ─── 因果叙述 ───
export interface CausalNarration {
  id: string
  cause: string       // "Day 5 深夜加班"
  effect: string      // "血糖骤降触发肾上腺素释放"
  mechanism: string   // 生理机制解释
  day: number
  relatedStats: string[]
  showCount: number   // 前三次强制显示
}

// ─── 斩杀线警告阶段 ───
export type KillLineStage = 'safe' | 'amber' | 'red' | 'critical'

export function getKillLineStage(allostaticLoad: number): KillLineStage {
  if (allostaticLoad < 75) return 'safe'
  if (allostaticLoad < 85) return 'amber'
  if (allostaticLoad < 90) return 'red'
  return 'critical'
}

// ─── 选择预览数据 ───
export interface ChoicePreview {
  immediate: NumberDeltaConfig[]
  delayed: { daysUntil: number; badge: DelayedBadgeData }[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskWarnings: string[]
  willpowerSufficient: boolean
}

// ─── 每日结算数据 ───
export interface DailySettlementData {
  day: number
  deltas: { stat: string; before: number; after: number; delta: number; label: string; icon: string }[]
  newDelayedEffects: DelayedBadgeData[]
  scars: Scar[]
  predictions: { stat: string; trend: 'up' | 'down' | 'stable'; confidence: number; description: string }[]
}

// ═══════════════════════════════════════════════════════════
// 反馈状态管理器（Observer + 批量更新 + Delta检测）
// ═══════════════════════════════════════════════════════════

export interface FeedbackState {
  // 活跃的浮动数值动画队列
  activeDeltas: NumberDeltaConfig[]
  // 活跃的生理涟漪
  activeRipples: RippleEffect[]
  // 延迟效果徽章列表
  delayedBadges: DelayedBadgeData[]
  // 因果叙述队列
  narrations: CausalNarration[]
  // 斩杀线阶段
  killLineStage: KillLineStage
  // 选择预览（悬停时）
  activePreview: ChoicePreview | null
  // 每日结算数据
  pendingSettlement: DailySettlementData | null
}

interface FeedbackContextType {
  feedback: FeedbackState
  // 触发一组数值变化动画
  triggerDeltas: (deltas: NumberDeltaConfig[]) => void
  // 触发生理涟漪
  triggerRipple: (ripple: RippleEffect) => void
  // 更新延迟徽章
  updateDelayedBadges: (stack: DelayedEffect[], currentDay: number) => void
  // 设置选择预览
  setPreview: (preview: ChoicePreview | null) => void
  // 添加因果叙述
  addNarration: (narration: CausalNarration) => void
  // 清除已完成的动画
  clearCompletedDelta: (index: number) => void
  // 清除已完成的涟漪
  clearCompletedRipple: (index: number) => void
  // 设置每日结算
  setSettlement: (data: DailySettlementData | null) => void
  // 从选择生成预览数据
  generatePreview: (choice: GameChoice, state: GameState) => ChoicePreview
  // 从选择效果生成浮动数值
  generateDeltasFromChoice: (choice: GameChoice, state: GameState) => NumberDeltaConfig[]
  // 生成斩杀线升级时需要的涟漪
  generateKillLineRipple: (stage: KillLineStage) => RippleEffect[]
}

const FeedbackContext = createContext<FeedbackContextType | null>(null)

export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider')
  return ctx
}

// ─── 数值提取工具 ───
function extractPhysiologyDeltas(
  before: PhysiologyState, after: PhysiologyState
): { path: string; delta: number; label: string; icon: string }[] {
  const deltas: { path: string; delta: number; label: string; icon: string }[] = []
  const paths: [string, string, string][] = [
    ['metabolic.insulinSensitivity', '胰岛素敏感性', '🔬'],
    ['metabolic.mitochondrialHealth', '线粒体健康', '⚡'],
    ['metabolic.glucoseStability', '血糖稳定性', '🍬'],
    ['cardio.vascularElasticity', '血管弹性', '❤️'],
    ['cardio.cardiacReserve', '心脏储备', '💓'],
    ['cardio.autonomicBalance', '自主神经平衡', '⚖️'],
    ['immune.inflammation', '炎症水平', '🔥'],
    ['immune.immuneCompetence', '免疫力', '🛡️'],
    ['neural.hpaRegulation', 'HPA轴调节', '🧠'],
    ['neural.circadianStrength', '昼夜节律', '🌙'],
    ['neural.cognitiveReserve', '认知储备', '💡'],
    ['chronic.allostaticLoad', '稳态负荷', '📊'],
    ['chronic.sleepDebt', '睡眠负债', '😴'],
    ['chronic.oxidativeStress', '氧化应激', '⚡'],
  ]
  for (const [path, label, icon] of paths) {
    const parts = path.split('.')
    const bVal = (before as any)[parts[0]][parts[1]]
    const aVal = (after as any)[parts[0]][parts[1]]
    const delta = Math.round(aVal - bVal)
    if (Math.abs(delta) >= 2) {
      deltas.push({ path, delta, label, icon })
    }
  }
  return deltas
}

// ─── 选择效果预览生成 ───
function getStatColor(stat: string, delta: number): string {
  if (stat.includes('inflammation') || stat.includes('allostatic') || stat.includes('stress') || stat.includes('debt') || stat.includes('adiposity') || stat.includes('autoimmunity') || stat.includes('pressure')) {
    return delta > 0 ? '#ef4444' : '#22c55e'
  }
  return delta > 0 ? '#22c55e' : '#ef4444'
}

function getStatBgColor(stat: string, delta: number): string {
  if (stat.includes('inflammation') || stat.includes('allostatic') || stat.includes('stress') || stat.includes('debt') || stat.includes('adiposity') || stat.includes('autoimmunity') || stat.includes('pressure')) {
    return delta > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'
  }
  return delta > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'
}

// ─── Provider 组件 ───
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackState>({
    activeDeltas: [],
    activeRipples: [],
    delayedBadges: [],
    narrations: [],
    killLineStage: 'safe',
    activePreview: null,
    pendingSettlement: null,
  })
  const deltaIdRef = useRef(0)

  // 触发数值动画
  const triggerDeltas = useCallback((deltas: NumberDeltaConfig[]) => {
    setFeedback(prev => ({
      ...prev,
      activeDeltas: [...prev.activeDeltas, ...deltas]
    }))
    // 自动清除（按各自duration）
    deltas.forEach((d, i) => {
      setTimeout(() => {
        setFeedback(prev => ({
          ...prev,
          activeDeltas: prev.activeDeltas.filter((_, idx) => idx !== i)
        }))
      }, d.duration + d.delay)
    })
  }, [])

  // 触发涟漪
  const triggerRipple = useCallback((ripple: RippleEffect) => {
    setFeedback(prev => ({
      ...prev,
      activeRipples: [...prev.activeRipples, ripple]
    }))
    setTimeout(() => {
      setFeedback(prev => ({
        ...prev,
        activeRipples: prev.activeRipples.slice(1)
      }))
    }, ripple.duration)
  }, [])

  // 更新延迟徽章
  const updateDelayedBadges = useCallback((stack: DelayedEffect[], currentDay: number) => {
    const badges: DelayedBadgeData[] = stack.map(d => {
      const daysUntil = d.triggerDay - currentDay
      const visualState: DelayedBadgeData['visualState'] =
        d.applied ? 'settled' :
        daysUntil <= 0 ? 'triggered' :
        daysUntil <= 3 ? 'approaching' : 'fresh'
      return {
        id: d.id,
        cause: d.cause,
        triggerDay: d.triggerDay,
        currentDay,
        effects: d.effects,
        notification: d.notification,
        visualState,
      }
    })
    setFeedback(prev => ({ ...prev, delayedBadges: badges }))
  }, [])

  // 设置预览
  const setPreview = useCallback((preview: ChoicePreview | null) => {
    setFeedback(prev => ({ ...prev, activePreview: preview }))
  }, [])

  // 添加因果叙述
  const addNarration = useCallback((narration: CausalNarration) => {
    setFeedback(prev => ({ ...prev, narrations: [...prev.narrations, narration] }))
  }, [])

  // 清除完成的delta
  const clearCompletedDelta = useCallback((index: number) => {
    setFeedback(prev => ({
      ...prev,
      activeDeltas: prev.activeDeltas.filter((_, i) => i !== index)
    }))
  }, [])

  const clearCompletedRipple = useCallback((index: number) => {
    setFeedback(prev => ({
      ...prev,
      activeRipples: prev.activeRipples.filter((_, i) => i !== index)
    }))
  }, [])

  // 设置结算
  const setSettlement = useCallback((data: DailySettlementData | null) => {
    setFeedback(prev => ({ ...prev, pendingSettlement: data }))
  }, [])

  // 生成选择预览
  const generatePreview = useCallback((choice: GameChoice, state: GameState): ChoicePreview => {
    const eff = choice.effects
    const immediate: NumberDeltaConfig[] = []
    const riskWarnings: string[] = []
    let riskLevel: ChoicePreview['riskLevel'] = 'low'

    // 意志力消耗
    if (eff.willpowerCost > 0) {
      const wpDelta = -eff.willpowerCost
      immediate.push({
        stat: 'willpower', delta: wpDelta, label: '意志力', icon: '🎯',
        color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.15)',
        trajectory: 'down', duration: 1200, delay: 100
      })
      if (state.willpower - eff.willpowerCost <= 0) {
        riskWarnings.push('⚠️ 意志力将耗尽！选择可能被强制取消')
        riskLevel = 'critical'
      } else if (state.willpower - eff.willpowerCost <= 15) {
        riskWarnings.push('意志力将接近枯竭')
        riskLevel = 'medium'
      }
    }

    // 认知能量
    if (eff.cognitiveCost > 0) {
      immediate.push({
        stat: 'cognitive', delta: -eff.cognitiveCost, label: '认知能量', icon: '🧠',
        color: '#06b6d4', bgColor: 'rgba(6,182,212,0.15)',
        trajectory: 'down', duration: 1200, delay: 150
      })
    }

    // 体力
    if (eff.physicalCost > 0) {
      immediate.push({
        stat: 'physical', delta: -eff.physicalCost, label: '体力', icon: '💪',
        color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)',
        trajectory: 'down', duration: 1200, delay: 200
      })
    }

    // 直接生理效应
    const imm = eff.immediate as any
    if (imm.chronic?.allostaticLoad) {
      const delta = imm.chronic.allostaticLoad
      immediate.push({
        stat: 'allostatic', delta, label: '稳态负荷', icon: '📊',
        color: delta > 0 ? '#ef4444' : '#22c55e',
        bgColor: delta > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
        trajectory: delta > 0 ? 'up' : 'down', duration: 1200, delay: 300
      })
      if (state.physiology.chronic.allostaticLoad + delta >= 85) {
        riskWarnings.push('💀 接近斩杀线！此选择可能导致不可逆后果')
        riskLevel = 'critical'
      } else if (state.physiology.chronic.allostaticLoad + delta >= 75) {
        riskWarnings.push('⚠️ 将进入危险区域')
        if (riskLevel === 'low') riskLevel = 'high'
      }
    }

    // 延迟效果
    const delayed: ChoicePreview['delayed'] = []
    if (eff.delayed && eff.delayed.length > 0) {
      for (const d of eff.delayed) {
        const daysUntil = d.triggerDay - state.currentDay
        delayed.push({
          daysUntil,
          badge: {
            id: d.id,
            cause: d.cause,
            triggerDay: d.triggerDay,
            currentDay: state.currentDay,
            effects: d.effects,
            notification: d.notification,
            visualState: 'fresh'
          }
        })
        if (daysUntil <= 1) {
          riskWarnings.push('⏳ 延迟效应将在明天触发')
          if (riskLevel === 'low') riskLevel = 'medium'
        }
      }
    }

    return {
      immediate,
      delayed,
      riskLevel,
      riskWarnings,
      willpowerSufficient: state.willpower >= eff.willpowerCost
    }
  }, [])

  // 从选择效果生成浮动数值
  const generateDeltasFromChoice = useCallback((choice: GameChoice, state: GameState): NumberDeltaConfig[] => {
    const configs: NumberDeltaConfig[] = []
    const eff = choice.effects
    let delayOffset = 0

    // 意志力
    if (eff.willpowerCost > 0) {
      configs.push({
        stat: 'willpower', delta: -eff.willpowerCost, label: '意志力', icon: '🎯',
        color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.15)',
        trajectory: 'down', duration: 1500, delay: delayOffset
      })
      delayOffset += 50
    }

    // 认知
    if (eff.cognitiveCost > 0) {
      configs.push({
        stat: 'cognitive', delta: -eff.cognitiveCost, label: '认知能量', icon: '🧠',
        color: '#06b6d4', bgColor: 'rgba(6,182,212,0.15)',
        trajectory: 'down', duration: 1500, delay: delayOffset
      })
      delayOffset += 50
    }

    // 体力
    if (eff.physicalCost > 0) {
      configs.push({
        stat: 'physical', delta: -eff.physicalCost, label: '体力', icon: '💪',
        color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)',
        trajectory: 'down', duration: 1500, delay: delayOffset
      })
      delayOffset += 50
    }

    // 稳态负荷变化
    const imm = eff.immediate as any
    if (imm.chronic?.allostaticLoad) {
      const d = imm.chronic.allostaticLoad
      configs.push({
        stat: 'allostatic', delta: d, label: '稳态负荷', icon: '📊',
        color: d > 0 ? '#ef4444' : '#22c55e',
        bgColor: d > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
        trajectory: d > 0 ? 'up' : 'down', duration: 1500, delay: delayOffset
      })
      delayOffset += 100
    }

    // 其他生理变化
    const beforePhysiology = state.physiology
    for (const [key, subObj] of Object.entries(imm)) {
      if (key === 'chronic') continue
      if (typeof subObj === 'object' && subObj !== null) {
        for (const [subKey, val] of Object.entries(subObj as Record<string, number>)) {
          if (typeof val === 'number' && val !== 0) {
            const statPath = `${key}.${subKey}`
            const isInverse = ['inflammation', 'adiposity', 'autoimmunityRisk', 'bloodPressureLoad', 'sleepPressure', 'sleepDebt', 'oxidativeStress', 'glycationEndProducts'].includes(subKey)
            const displayDelta = isInverse ? -val : val // 对"越高越差"的指标取反显示
            if (Math.abs(val) >= 3) {
              configs.push({
                stat: statPath,
                delta: val,
                label: getStatLabel(statPath),
                icon: getStatIcon(statPath),
                color: getStatColor(statPath, displayDelta),
                bgColor: getStatBgColor(statPath, displayDelta),
                trajectory: val > 0 ? 'arc-right' : 'arc-left',
                duration: 1500,
                delay: delayOffset
              })
              delayOffset += 50
            }
          }
        }
      }
    }

    return configs
  }, [])

  // 斩杀线涟漪
  const generateKillLineRipple = useCallback((stage: KillLineStage): RippleEffect[] => {
    switch (stage) {
      case 'amber':
        return [{ type: 'stress-darken', intensity: 0.15, duration: 800, color: '#f59e0b' }]
      case 'red':
        return [
          { type: 'heartbeat', intensity: 0.4, duration: 600 },
          { type: 'stress-darken', intensity: 0.3, duration: 1000, color: '#ef4444' },
        ]
      case 'critical':
        return [
          { type: 'heartbeat', intensity: 0.7, duration: 800 },
          { type: 'tunnel-vision', intensity: 0.5, duration: 1200 },
          { type: 'stress-darken', intensity: 0.5, duration: 1500, color: '#7c2d12' },
        ]
      default:
        return []
    }
  }, [])

  return (
    <FeedbackContext.Provider value={{
      feedback,
      triggerDeltas,
      triggerRipple,
      updateDelayedBadges,
      setPreview,
      addNarration,
      clearCompletedDelta,
      clearCompletedRipple,
      setSettlement,
      generatePreview,
      generateDeltasFromChoice,
      generateKillLineRipple,
    }}>
      {children}
    </FeedbackContext.Provider>
  )
}

// ─── 工具函数：stat路径转中文标签 ───
export function getStatLabel(path: string): string {
  const labels: Record<string, string> = {
    'metabolic.insulinSensitivity': '胰岛素敏感性',
    'metabolic.mitochondrialHealth': '线粒体健康',
    'metabolic.glucoseStability': '血糖稳定性',
    'metabolic.adiposity': '脂肪堆积',
    'cardio.vascularElasticity': '血管弹性',
    'cardio.cardiacReserve': '心脏储备',
    'cardio.autonomicBalance': '自主神经',
    'cardio.bloodPressureLoad': '血压负荷',
    'immune.inflammation': '炎症',
    'immune.immuneCompetence': '免疫力',
    'immune.gutIntegrity': '肠道完整性',
    'immune.autoimmunityRisk': '自免疫风险',
    'neural.hpaRegulation': 'HPA轴',
    'neural.neuroplasticity': '神经可塑性',
    'neural.circadianStrength': '昼夜节律',
    'neural.cognitiveReserve': '认知储备',
    'chronic.allostaticLoad': '稳态负荷',
    'chronic.oxidativeStress': '氧化应激',
    'chronic.glycationEndProducts': '糖基化终产物',
    'chronic.sleepPressure': '睡眠压力',
    'chronic.sleepDebt': '睡眠负债',
  }
  return labels[path] || path
}

export function getStatIcon(path: string): string {
  const icons: Record<string, string> = {
    'metabolic.insulinSensitivity': '🔬',
    'metabolic.mitochondrialHealth': '⚡',
    'metabolic.glucoseStability': '🍬',
    'metabolic.adiposity': '🫃',
    'cardio.vascularElasticity': '❤️',
    'cardio.cardiacReserve': '💓',
    'cardio.autonomicBalance': '⚖️',
    'cardio.bloodPressureLoad': '🩺',
    'immune.inflammation': '🔥',
    'immune.immuneCompetence': '🛡️',
    'immune.gutIntegrity': '🦠',
    'immune.autoimmunityRisk': '⚠️',
    'neural.hpaRegulation': '🧠',
    'neural.neuroplasticity': '🌱',
    'neural.circadianStrength': '🌙',
    'neural.cognitiveReserve': '💡',
    'chronic.allostaticLoad': '📊',
    'chronic.oxidativeStress': '⚡',
    'chronic.glycationEndProducts': '🧪',
    'chronic.sleepPressure': '😴',
    'chronic.sleepDebt': '💤',
  }
  return icons[path] || '📉'
}

export function extractPhysiologyDeltas_(before: PhysiologyState, after: PhysiologyState) {
  return extractPhysiologyDeltas(before, after)
}
