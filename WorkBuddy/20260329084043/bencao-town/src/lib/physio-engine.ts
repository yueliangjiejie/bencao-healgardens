// ═══════════════════════════════════════════════════════════
// 《生理极限》 - 生理模拟引擎（v2 支持4周完整流程）
// ═══════════════════════════════════════════════════════════

import { GameState, PhysiologyState, GameChoice, DelayedEffect, Archetype, DeepPartial, DayEvent, Scar } from './physio-types'
import { WEEK1_EVENTS } from './physio-data'
import { WEEK2_EVENTS } from './physio-data-week2'
import { WEEK3_EVENTS } from './physio-data-week3'
import { WEEK4_EVENTS } from './physio-data-week4'

// ─── 深拷贝工具 ───
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// ─── 限制范围 ───
function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val))
}

// ─── 计算稳态负荷（核心"斩杀线"指标） ───
export function calcAllostaticLoad(p: PhysiologyState): number {
  return clamp(Math.round(
    ((100 - p.metabolic.insulinSensitivity) * 0.25 +
     (100 - p.cardio.vascularElasticity) * 0.25 +
     p.immune.inflammation * 0.2 +
     (100 - p.neural.hpaRegulation) * 0.3 +
     p.chronic.sleepPressure * 0.5 +
     p.chronic.oxidativeStress * 0.3) / 3.5
  ))
}

// ─── 计算意志力 ───
export function calcWillpower(p: PhysiologyState): number {
  let base = 50
  if (p.metabolic.glucoseStability < 70) base *= 0.7
  if (p.neural.hpaRegulation < 50) base *= 0.7
  if (p.chronic.sleepDebt > 10) base *= 0.6
  return clamp(Math.round(base))
}

// ─── 计算认知能量 ───
export function calcCognitiveEnergy(p: PhysiologyState): number {
  return clamp(Math.round(
    p.neural.circadianStrength * 0.4 +
    p.metabolic.glucoseStability * 0.3 +
    p.cardio.autonomicBalance * 0.3 -
    p.chronic.sleepPressure * 0.5
  ))
}

// ─── 计算体力能量 ───
export function calcPhysicalEnergy(p: PhysiologyState): number {
  return clamp(Math.round(
    p.metabolic.mitochondrialHealth * 0.5 +
    p.cardio.cardiacReserve * 0.3 -
    p.chronic.allostaticLoad * 0.4
  ))
}

// ─── 获取负荷等级 ───
export function getLoadLevel(al: number): { label: string; color: string; emoji: string } {
  if (al < 30) return { label: '健康', color: 'text-green-400', emoji: '💚' }
  if (al < 50) return { label: '亚健康', color: 'text-yellow-400', emoji: '💛' }
  if (al < 65) return { label: '高危区', color: 'text-orange-400', emoji: '🧡' }
  if (al < 75) return { label: '危险区', color: 'text-red-400', emoji: '❤️' }
  if (al < 90) return { label: '临界线', color: 'text-red-500', emoji: '🔴' }
  return { label: '斩杀线', color: 'text-red-600', emoji: '💀' }
}

// ─── 获取系统状态 ───
export function getSystemStatus(score: number, inverse = false): { label: string; color: string } {
  const v = inverse ? 100 - score : score
  if (v >= 70) return { label: '良好', color: 'text-green-400' }
  if (v >= 50) return { label: '一般', color: 'text-yellow-400' }
  if (v >= 30) return { label: '较差', color: 'text-orange-400' }
  return { label: '危险', color: 'text-red-400' }
}

// ─── 创建初始游戏状态 ───
export function createGameState(archetype: Archetype): GameState {
  return {
    archetype,
    currentDay: 1,
    currentEventIdx: 0,
    willpower: calcWillpower(archetype.stats),
    cognitiveEnergy: calcCognitiveEnergy(archetype.stats),
    physicalEnergy: calcPhysicalEnergy(archetype.stats),
    physiology: deepClone(archetype.stats),
    delayedStack: [],
    scars: [],
    journal: [],
    isGameOver: false,
    gameOverReason: null,
    healthyDays: 0,
    unlockedSystems: ['watch_data'],
    isChronicPhase: false,
    chronic: undefined
  }
}

// ─── 应用选择效果 ───
export function applyChoice(state: GameState, choice: GameChoice): GameState {
  const s = deepClone(state)
  const e = choice.effects

  // 1. 扣除意志力/认知/体力
  s.willpower = clamp(s.willpower - e.willpowerCost)
  s.cognitiveEnergy = clamp(s.cognitiveEnergy - e.cognitiveCost)
  s.physicalEnergy = clamp(s.physicalEnergy - e.physicalCost)

  // 2. 应用即时效果
  const imm = e.immediate
  if (imm.metabolic) applyPartial(s.physiology.metabolic, imm.metabolic)
  if (imm.cardio) applyPartial(s.physiology.cardio, imm.cardio)
  if (imm.immune) applyPartial(s.physiology.immune, imm.immune)
  if (imm.neural) applyPartial(s.physiology.neural, imm.neural)
  if (imm.chronic) applyPartial(s.physiology.chronic, imm.chronic)

  // 3. 重新计算稳态负荷
  s.physiology.chronic.allostaticLoad = calcAllostaticLoad(s.physiology)

  // 4. 添加延迟效果
  if (e.delayed) {
    for (const d of e.delayed) {
      s.delayedStack.push({
        ...d,
        triggerDay: s.currentDay + d.triggerDay,
        applied: false
      })
    }
  }

  // 5. 记录日志
  s.journal.push(`Day ${s.currentDay}：${choice.text}`)

  // 6. 判断是否是健康选择（用于连续健康天数）
  const isHealthy = e.category === 'selfcare' || 
    (e.category === 'food' && e.willpowerCost >= 10) ||
    (e.category === 'exercise')
  if (isHealthy) {
    s.healthyDays++
  } else {
    s.healthyDays = 0
  }

  // 7. 检查游戏结束
  const al = s.physiology.chronic.allostaticLoad
  if (al >= 95) {
    s.isGameOver = true
    s.gameOverReason = '稳态负荷突破极限，身体全面崩溃。'
  }

  return s
}

// ─── 推进到下一天 ───
export function advanceDay(state: GameState): GameState {
  const s = deepClone(state)
  s.currentDay++

  // 处理延迟效果
  const triggered: string[] = []
  for (const d of s.delayedStack) {
    if (!d.applied && d.triggerDay <= s.currentDay) {
      d.applied = true
      triggered.push(d.notification)
      // 应用延迟效果
      for (const [path, val] of Object.entries(d.effects)) {
        applyPath(s.physiology, path, val as number)
      }
    }
  }

  // 自然恢复（每天微量）
  s.physiology.neural.circadianStrength = clamp(s.physiology.neural.circadianStrength + 1)
  s.physiology.chronic.sleepPressure = clamp(s.physiology.chronic.sleepPressure - 2)

  // 连续健康天数奖励
  if (s.healthyDays >= 3) {
    s.physiology.metabolic.mitochondrialHealth = clamp(s.physiology.metabolic.mitochondrialHealth + 2)
    s.physiology.neural.neuroplasticity = clamp(s.physiology.neural.neuroplasticity + 1)
  }

  // 重新计算负荷和能量
  s.physiology.chronic.allostaticLoad = calcAllostaticLoad(s.physiology)
  s.willpower = calcWillpower(s.physiology)
  s.cognitiveEnergy = calcCognitiveEnergy(s.physiology)
  s.physicalEnergy = calcPhysicalEnergy(s.physiology)

  return s
}

// ─── 工具函数 ───

function applyPartial(target: Record<string, any>, partial: Record<string, any>) {
  for (const [key, val] of Object.entries(partial)) {
    if (!(key in target)) continue
    if (typeof val === 'number' && typeof target[key] === 'number') {
      target[key] = clamp(target[key] + val)
    } else if (typeof val === 'string' && typeof target[key] === 'string') {
      // 支持字符串字段直接赋值（如 cortisolPattern）
      target[key] = val
    }
  }
}

function applyPath(physio: PhysiologyState, path: string, val: number) {
  const parts = path.split('.')
  if (parts.length !== 2) return
  const [system, key] = parts
  const sys = physio[system as keyof PhysiologyState] as any
  if (sys && typeof sys[key] === 'number') {
    sys[key] = clamp(sys[key] + val)
  }
}

// ─── 获取当周事件列表 ───
export function getEventsForWeek(week: number): DayEvent[] {
  switch (week) {
    case 1: return WEEK1_EVENTS
    case 2: return WEEK2_EVENTS
    case 3: return WEEK3_EVENTS
    case 4: return WEEK4_EVENTS
    default: return WEEK1_EVENTS
  }
}

// ─── 获取当前周数 ───
export function getCurrentWeek(day: number): number {
  if (day <= 7) return 1
  if (day <= 14) return 2
  if (day <= 21) return 3
  return 4
}

// ─── 获取当天事件 ───
export function getEventsForDay(day: number): DayEvent[] {
  const week = getCurrentWeek(day)
  return getEventsForWeek(week).filter(e => e.day === day)
}

// ─── 判断是否到周结算点 ───
export function isWeekEnd(state: GameState): boolean {
  return [7, 14, 21, 28].includes(state.currentDay)
}

// ─── 判断是否游戏结束（Day 28 或稳态负荷过限）───
export function isGameEnd(state: GameState): boolean {
  return state.currentDay > 28 || state.isGameOver
}

// ─── 疤痕判定（不可逆损伤检测）───
export function checkScars(state: GameState): Scar[] {
  const newScars: Scar[] = []
  const p = state.physiology
  const day = state.currentDay

  // 肠屏障不可逆（炎症>40且持续>7天）
  if (p.immune.inflammation > 60 && p.immune.gutIntegrity < 35 && day >= 10) {
    if (!state.scars.find(s => s.id === 'gut_leak')) {
      newScars.push({
        id: 'gut_leak', name: '肠屏障永久损伤', description: '肠通透性已永久改变，慢性炎症成为新基线',
        day, debuff: { 'immune.gutIntegrity': -5, 'immune.inflammation': 3 }
      })
    }
  }

  // 心肌代偿肥大
  if (p.cardio.cardiacReserve < 35 && p.cardio.bloodPressureLoad > 60 && day >= 14) {
    if (!state.scars.find(s => s.id === 'cardiac_hypertrophy')) {
      newScars.push({
        id: 'cardiac_hypertrophy', name: '心肌代偿性肥大', description: '左室壁增厚，舒张功能永久受损',
        day, debuff: { 'cardio.cardiacReserve': -8, 'cardio.vascularElasticity': -5 }
      })
    }
  }

  // 认知储备永久下降
  if (p.neural.cognitiveReserve < 25 && p.chronic.sleepDebt > 15 && day >= 14) {
    if (!state.scars.find(s => s.id === 'cognitive_decline')) {
      newScars.push({
        id: 'cognitive_decline', name: '前额叶功能退化', description: '长期睡眠剥夺导致前额叶皮层神经元萎缩',
        day, debuff: { 'neural.cognitiveReserve': -5, 'neural.neuroplasticity': -3 }
      })
    }
  }

  // 自身免疫基线上移
  if (p.immune.autoimmunityRisk > 40 && day >= 15) {
    if (!state.scars.find(s => s.id === 'autoimmune_shift')) {
      newScars.push({
        id: 'autoimmune_shift', name: '免疫基线上移', description: '自身免疫风险永久升高，进入终身管理模式',
        day, debuff: { 'immune.autoimmunityRisk': 5, 'immune.inflammation': 3 }
      })
    }
  }

  // 线粒体DNA损伤
  if (p.metabolic.mitochondrialHealth < 30 && p.chronic.oxidativeStress > 50 && day >= 14) {
    if (!state.scars.find(s => s.id === 'mito_damage')) {
      newScars.push({
        id: 'mito_damage', name: '线粒体DNA损伤', description: '基础代谢率永久下降10%',
        day, debuff: { 'metabolic.mitochondrialHealth': -5, 'metabolic.adiposity': 3 }
      })
    }
  }

  return newScars
}

// ─── 应用疤痕（持续debuff）───
export function applyScars(state: GameState): GameState {
  const s = deepClone(state)
  const newScars = checkScars(s)
  
  for (const scar of newScars) {
    s.scars.push(scar)
    // 应用debuff
    for (const [path, val] of Object.entries(scar.debuff)) {
      applyPath(s.physiology, path, val)
    }
    s.journal.push(`Day ${s.currentDay}：💀 ${scar.name} — ${scar.description}`)
  }
  
  return s
}

// ─── 斩杀线事件触发判定 ───
export function checkKillLineTrigger(state: GameState): string | null {
  const p = state.physiology
  const al = p.chronic.allostaticLoad
  
  if (al < 75) return null
  
  // 代谢崩溃
  if (p.metabolic.insulinSensitivity < 30 && p.immune.inflammation > 60) {
    return 'metabolic_crisis'
  }
  // 心血管事件
  if (p.cardio.bloodPressureLoad > 70 && p.chronic.sleepDebt > 15 && al > 80) {
    return 'cardiac_event'
  }
  // 精神崩溃
  if (p.neural.hpaRegulation < 25 && p.neural.cognitiveReserve < 30) {
    return 'psychiatric_collapse'
  }
  // 免疫风暴
  if (p.immune.immuneCompetence < 35 && p.immune.inflammation > 65) {
    return 'immune_storm'
  }
  
  // 高负荷但无特定触发 → 随机
  if (al > 90) {
    const rand = Math.random()
    if (rand < 0.3) return 'metabolic_crisis'
    if (rand < 0.5) return 'cardiac_event'
    if (rand < 0.7) return 'psychiatric_collapse'
    return 'immune_storm'
  }
  
  return null
}

// ─── 获取周主题 ───
export function getWeekTheme(week: number): { title: string; subtitle: string; emoji: string } {
  switch (week) {
    case 1: return { title: '觉醒', subtitle: '不安的清醒', emoji: '🌅' }
    case 2: return { title: '代偿期', subtitle: '危险的舒适', emoji: '🎭' }
    case 3: return { title: '失代偿', subtitle: '失控的恐惧', emoji: '⚡' }
    case 4: return { title: '斩杀线', subtitle: '终局的重量', emoji: '💀' }
    default: return { title: '觉醒', subtitle: '', emoji: '🌅' }
  }
}

// ─── 获取生理摘要（UI用） ───
export function getPhysiologySummary(p: PhysiologyState) {
  const al = p.chronic.allostaticLoad
  return {
    allostaticLoad: al,
    loadLevel: getLoadLevel(al),
    systems: {
      metabolic: {
        label: '代谢系统',
        emoji: '🔥',
        score: Math.round((p.metabolic.insulinSensitivity + p.metabolic.mitochondrialHealth + p.metabolic.glucoseStability - p.metabolic.adiposity) / 4),
        details: [
          { name: '胰岛素敏感性', value: p.metabolic.insulinSensitivity, inverse: false },
          { name: '线粒体功能', value: p.metabolic.mitochondrialHealth, inverse: false },
          { name: '体脂压力', value: p.metabolic.adiposity, inverse: true },
          { name: '血糖稳定性', value: p.metabolic.glucoseStability, inverse: false }
        ]
      },
      cardio: {
        label: '心血管系统',
        emoji: '❤️',
        score: Math.round((p.cardio.vascularElasticity + p.cardio.cardiacReserve + p.cardio.autonomicBalance - p.cardio.bloodPressureLoad) / 4),
        details: [
          { name: '血管弹性', value: p.cardio.vascularElasticity, inverse: false },
          { name: '心脏储备', value: p.cardio.cardiacReserve, inverse: false },
          { name: '自主神经平衡', value: p.cardio.autonomicBalance, inverse: false },
          { name: '血压负荷', value: p.cardio.bloodPressureLoad, inverse: true }
        ]
      },
      immune: {
        label: '免疫系统',
        emoji: '🛡️',
        score: Math.round((p.immune.immuneCompetence + p.immune.gutIntegrity + 100 - p.immune.inflammation - p.immune.autoimmunityRisk) / 4),
        details: [
          { name: '免疫能力', value: p.immune.immuneCompetence, inverse: false },
          { name: '肠屏障完整性', value: p.immune.gutIntegrity, inverse: false },
          { name: '系统性炎症', value: p.immune.inflammation, inverse: true },
          { name: '自身免疫风险', value: p.immune.autoimmunityRisk, inverse: true }
        ]
      },
      neural: {
        label: '神经系统',
        emoji: '🧠',
        score: Math.round((p.neural.hpaRegulation + p.neural.neuroplasticity + p.neural.circadianStrength + p.neural.cognitiveReserve) / 4),
        details: [
          { name: 'HPA轴调节', value: p.neural.hpaRegulation, inverse: false },
          { name: '神经可塑性', value: p.neural.neuroplasticity, inverse: false },
          { name: '昼夜节律', value: p.neural.circadianStrength, inverse: false },
          { name: '认知储备', value: p.neural.cognitiveReserve, inverse: false }
        ]
      }
    },
    chronic: [
      { name: '氧化应激', value: p.chronic.oxidativeStress },
      { name: '糖化终产物', value: p.chronic.glycationEndProducts },
      { name: '皮质醇节律', value: p.chronic.cortisolPattern === 'normal' ? 20 : p.chronic.cortisolPattern === 'elevated' ? 50 : p.chronic.cortisolPattern === 'flat' ? 75 : 90, display: p.chronic.cortisolPattern },
      { name: '睡眠债', value: p.chronic.sleepDebt, unit: 'h' }
    ]
  }
}
