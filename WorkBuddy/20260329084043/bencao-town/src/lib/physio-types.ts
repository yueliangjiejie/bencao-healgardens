// ═══════════════════════════════════════════════════════════
// 《生理极限》 - 类型定义
// ═══════════════════════════════════════════════════════════

export type ArchetypeId = 'A' | 'B' | 'C' | 'D'
export type CortisolPattern = 'normal' | 'elevated' | 'flat' | 'inverted'
export type ActionCategory = 'sleep' | 'food' | 'work' | 'exercise' | 'social' | 'selfcare'
export type GamePhase = 'awakening' | 'compensation' | 'decompensation' | 'kill_line'

export interface MetabolicSystem {
  insulinSensitivity: number
  mitochondrialHealth: number
  adiposity: number
  glucoseStability: number
}

export interface CardioSystem {
  vascularElasticity: number
  cardiacReserve: number
  autonomicBalance: number
  bloodPressureLoad: number
}

export interface ImmuneSystem {
  inflammation: number
  immuneCompetence: number
  gutIntegrity: number
  autoimmunityRisk: number
}

export interface NeuralSystem {
  hpaRegulation: number
  neuroplasticity: number
  circadianStrength: number
  cognitiveReserve: number
}

export interface ChronicLoad {
  allostaticLoad: number
  oxidativeStress: number
  glycationEndProducts: number
  cortisolPattern: CortisolPattern
  sleepPressure: number
  sleepDebt: number
}

export interface PhysiologyState {
  metabolic: MetabolicSystem
  cardio: CardioSystem
  immune: ImmuneSystem
  neural: NeuralSystem
  chronic: ChronicLoad
}

export interface DelayedEffect {
  id: string
  triggerDay: number
  cause: string
  applied: boolean
  effects: Record<string, number>
  notification: string
}

export interface Scar {
  id: string
  name: string
  description: string
  day: number
  debuff: Record<string, number>
}

// ─── 深层Partial（递归可选化） ───
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export interface GameChoice {
  text: string
  effects: {
    id: string
    category: ActionCategory
    willpowerCost: number
    cognitiveCost: number
    physicalCost: number
    immediate: DeepPartial<PhysiologyState>
    delayed?: DelayedEffect[]
  }
  narrative?: string
  tutorialTip?: string
}

export interface DayEvent {
  day: number
  title: string
  scene: string
  timeOfDay: string
  monologue: string
  choices: GameChoice[]
  phase: GamePhase
  isCrisis?: boolean
  crisisNarrative?: string
}

export interface Archetype {
  id: ArchetypeId
  name: string
  subtitle: string
  narrative: string
  emoji: string
  color: string
  bgClass: string
  stats: PhysiologyState
  hidden: string
  scenario: string
}

export interface GameState {
  archetype: Archetype | null
  currentDay: number
  currentEventIdx: number
  willpower: number
  cognitiveEnergy: number
  physicalEnergy: number
  physiology: PhysiologyState
  delayedStack: DelayedEffect[]
  scars: Scar[]
  journal: string[]
  isGameOver: boolean
  gameOverReason: string | null
  healthyDays: number
  unlockedSystems: string[]
  // 慢性生存扩展
  isChronicPhase: boolean
  chronic?: ChronicState
}

export interface WeekSettlement {
  week: number
  title: string
  narrative: string  // 触动人心的叙事旁白
  metrics: { name: string; value: string; context: string }[]
  status: string
  strategies: { name: string; desc: string; diff: string; effect: string }[]
}

// ═══════════════════════════════════════════════════════════
// 慢性生存（Chronic Survival）扩展类型
// ═══════════════════════════════════════════════════════════

export type IdentityStage = 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance'
export type MedicationSlot = 'morning' | 'with_meal' | 'evening' | 'bid'

export interface Medication {
  id: string
  name: string
  schedule: MedicationSlot
  dose: string
  adherenceEffect: string
  sideEffects: {
    immediate?: string
    cumulative?: string
    interaction?: string
    hidden?: string
    withdrawal?: string
  }
  skipConsequence: string
  physiologyDelta: DeepPartial<PhysiologyState>  // 每日服用效果
  willpowerDelta: number  // 服用/跳过的意志力变化
  adherence: number  // 0-100 依从率
}

export interface Appointment {
  id: string
  dept: string
  frequency: string  // 'monthly' | 'quarterly' | 'biweekly'
  conflict: string   // 与什么冲突
  lastVisit?: number // 上次就诊月
  missedCount: number
}

export interface ChronicResources {
  medicalDebt: number        // 医疗债务（元）
  monthlyIncome: number      // 月收入
  relationshipCapital: number // 关系资本 0-100
  socialDays: number         // 可社交日/月
  meaningScore: number       // 意义感 0-100
  workPerformance: number    // 职场表现 0-100
  disclosureLevel: 'hidden' | 'partial' | 'full'  // 病情公开程度
}

export interface ChronicState {
  month: number               // 慢性生存月数（从1开始）
  weekInMonth: 1 | 2 | 3 | 4  // 月内周次
  identityStage: IdentityStage
  medications: Medication[]
  appointments: Appointment[]
  resources: ChronicResources
  quarterlyBranch?: 'optimization' | 'palliative' | 'advocacy'  // 季度叙事分支
  medicalDebtHistory: { month: number; amount: number }[]
  crisisCount: number         // 急性发作次数
  cumulativeAdherence: number // 总体依从率
  expertPatientLevel: number  // 专家病人等级 0-3
}

export interface ChronicEvent {
  id: string
  month: number
  weekInMonth: number
  title: string
  scene: string
  narrative: string
  choices: ChronicChoice[]
  category: 'medication' | 'healthcare' | 'workplace' | 'social' | 'existential' | 'crisis' | 'quarterly'
}

export interface ChronicChoice {
  text: string
  effects: {
    resources?: Partial<ChronicResources>
    physiology?: DeepPartial<PhysiologyState>
    identityStage?: IdentityStage
    medicationEffect?: { medId: string; adherenceDelta: number }
    willpowerCost: number
    narrative?: string
  }
}

export interface ChronicMonthSettlement {
  month: number
  title: string
  narrative: string
  auditItems: {
    category: 'physiological' | 'financial' | 'social' | 'existential'
    label: string
    value: string
    trend: 'improving' | 'stable' | 'declining'
    comment: string
  }[]
  strategyOptions: { name: string; desc: string; cost: string; effect: string }[]
}

export interface ChronicEndgame {
  name: string
  condition: string
  description: string
  metric: string
  narrative: string
}
