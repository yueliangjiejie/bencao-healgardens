// ═══════════════════════════════════════════════════════════
// 《生理极限》 - 慢性生存引擎
// 从"避免急性死亡"转向"与不可逆身体共处"的长期管理
// ═══════════════════════════════════════════════════════════

import {
  GameState, PhysiologyState, ChronicState, Medication, Appointment,
  ChronicResources, ChronicChoice, ChronicMonthSettlement, ChronicEndgame,
  IdentityStage, DeepPartial
} from './physio-types'

// ─── 工具函数 ───
function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val))
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// ═══════════════════════════════════════════════════════════
// 一、药物系统
// ═══════════════════════════════════════════════════════════

// 默认药物清单（根据原型scar决定）
export function getDefaultMedications(scars: { id: string }[]): Medication[] {
  const meds: Medication[] = []

  // 基础药物：几乎所有幸存者都需要
  meds.push({
    id: 'metformin', name: '二甲双胍', schedule: 'with_meal', dose: '500mg bid',
    adherenceEffect: '血糖稳定，但胃肠道不适',
    sideEffects: {
      immediate: '食欲抑制（热量-200kcal/日，自动）',
      cumulative: '维生素B12缺乏（3月后影响认知）',
      interaction: '与咖啡因冲突（心悸风险+20%）'
    },
    skipConsequence: '次日血糖波动，微血管损伤累积+1%',
    physiologyDelta: {
      metabolic: { glucoseStability: 3, insulinSensitivity: 2 },
      chronic: { allostaticLoad: -1 }
    },
    willpowerDelta: 0,
    adherence: 100
  })

  // 如果有精神类疤痕 → SSRI
  if (scars.find(s => s.id === 'cognitive_decline') || scars.length >= 2) {
    meds.push({
      id: 'ssri', name: 'SSRI抗抑郁药', schedule: 'morning', dose: '20mg qd',
      adherenceEffect: '情绪稳定，但情感钝化',
      sideEffects: {
        immediate: '性欲消失（关系压力+）',
        cumulative: '体重增加（代谢负担+）',
        withdrawal: '停药后"脑震荡"感（必须tapering）'
      },
      skipConsequence: '情绪波动，停药综合征风险',
      physiologyDelta: {
        neural: { hpaRegulation: 3, cognitiveReserve: 1 },
        metabolic: { adiposity: 1 },
        chronic: { allostaticLoad: -1 }
      },
      willpowerDelta: 2,
      adherence: 100
    })
  }

  // 如果有心脏疤痕 → β受体阻滞剂
  if (scars.find(s => s.id === 'cardiac_hypertrophy')) {
    meds.push({
      id: 'beta_blocker', name: 'β受体阻滞剂', schedule: 'bid', dose: '25mg bid',
      adherenceEffect: '心率控制，但体能下降',
      sideEffects: {
        immediate: '运动耐量-30%（无法高强度锻炼）',
        hidden: '掩盖低血糖症状（危险）'
      },
      skipConsequence: '心率反弹，血压波动',
      physiologyDelta: {
        cardio: { bloodPressureLoad: -5, autonomicBalance: 2, cardiacReserve: -2 }
      },
      willpowerDelta: -1,
      adherence: 100
    })
  }

  // 如果有免疫疤痕 → 免疫调节剂
  if (scars.find(s => s.id === 'autoimmune_shift' || s.id === 'gut_leak')) {
    meds.push({
      id: 'immune_modulator', name: '免疫调节剂', schedule: 'evening', dose: '规律服用',
      adherenceEffect: '炎症控制，但感染风险微增',
      sideEffects: {
        immediate: '轻微胃肠道不适',
        cumulative: '免疫监视功能轻微下降'
      },
      skipConsequence: '自身免疫症状反弹',
      physiologyDelta: {
        immune: { inflammation: -3, autoimmunityRisk: -2, immuneCompetence: -1 }
      },
      willpowerDelta: 0,
      adherence: 100
    })
  }

  return meds
}

// 获取默认预约
export function getDefaultAppointments(): Appointment[] {
  return [
    { id: 'endo', dept: '内分泌科', frequency: 'monthly', conflict: '工作时间', missedCount: 0 },
    { id: 'cardio', dept: '心内科', frequency: 'quarterly', conflict: '需要家属陪同', missedCount: 0 },
    { id: 'psych', dept: '精神科', frequency: 'biweekly', conflict: '病耻感（需请假借口）', missedCount: 0 },
    { id: 'rheuma', dept: '风湿免疫', frequency: 'monthly', conflict: '检查前需停药48h', missedCount: 0 },
    { id: 'nutrition', dept: '营养科', frequency: 'quarterly', conflict: '建议与医保覆盖冲突', missedCount: 0 }
  ]
}

// ═══════════════════════════════════════════════════════════
// 二、初始化慢性状态
// ═══════════════════════════════════════════════════════════

export function initChronicState(prevState: GameState): ChronicState {
  const medications = getDefaultMedications(prevState.scars)
  const appointments = getDefaultAppointments()

  // 初始医疗债务（基于前28天的损伤程度）
  const scarCount = prevState.scars.length
  const baseDebt = 24630 + scarCount * 8000

  return {
    month: 1,
    weekInMonth: 1,
    identityStage: 'denial',
    medications,
    appointments,
    resources: {
      medicalDebt: baseDebt,
      monthlyIncome: 15000,
      relationshipCapital: 70 - scarCount * 5,
      socialDays: 8,
      meaningScore: 50 - scarCount * 5,
      workPerformance: 75 - scarCount * 8,
      disclosureLevel: 'hidden'
    },
    medicalDebtHistory: [{ month: 0, amount: baseDebt }],
    crisisCount: 0,
    cumulativeAdherence: 100,
    expertPatientLevel: 0
  }
}

// ═══════════════════════════════════════════════════════════
// 三、药物管理（每日微操作）
// ═══════════════════════════════════════════════════════════

export interface MedAdherenceResult {
  took: string[]       // 已服药物ID
  skipped: string[]    // 跳过药物ID
  notifications: string[]
}

export function processDailyMedications(
  state: GameState,
  takeIds: string[]     // 玩家选择服用的药物
): GameState {
  if (!state.chronic) return state
  const s = deepClone(state)
  const chronic = s.chronic!
  const result: MedAdherenceResult = { took: [], skipped: [], notifications: [] }

  for (const med of chronic.medications) {
    if (takeIds.includes(med.id)) {
      // 服用 → 应用正面效果
      result.took.push(med.id)
      applyPartialPhysio(s.physiology, med.physiologyDelta)
      s.willpower = clamp(s.willpower + med.willpowerDelta)
    } else {
      // 跳过 → 负面效果
      result.skipped.push(med.id)
      med.adherence = clamp(med.adherence - 8)
      result.notifications.push(`⚠️ 跳过${med.name}：${med.skipConsequence}`)
      // 跳过的负面效果
      if (med.id === 'metformin') {
        s.physiology.metabolic.glucoseStability = clamp(s.physiology.metabolic.glucoseStability - 5)
        s.physiology.chronic.glycationEndProducts = clamp(s.physiology.chronic.glycationEndProducts + 2)
      } else if (med.id === 'ssri') {
        s.physiology.neural.hpaRegulation = clamp(s.physiology.neural.hpaRegulation - 4)
        chronic.crisisCount += (Math.random() < 0.2 ? 1 : 0)
      } else if (med.id === 'beta_blocker') {
        s.physiology.cardio.bloodPressureLoad = clamp(s.physiology.cardio.bloodPressureLoad + 5)
      } else if (med.id === 'immune_modulator') {
        s.physiology.immune.inflammation = clamp(s.physiology.immune.inflammation + 4)
      }
    }
  }

  // 更新总体依从率
  const totalAdherence = chronic.medications.reduce((sum, m) => sum + m.adherence, 0)
  chronic.cumulativeAdherence = Math.round(totalAdherence / chronic.medications.length)

  s.journal.push(`慢性月${chronic.month}周${chronic.weekInMonth}：服用${result.took.length}种，跳过${result.skipped.length}种`)

  return s
}

// ═══════════════════════════════════════════════════════════
// 四、身份认知系统
// ═══════════════════════════════════════════════════════════

const IDENTITY_TRANSITIONS: Record<IdentityStage, { next: IdentityStage; threshold: number }> = {
  denial:     { next: 'anger',         threshold: 2 },   // 2个月
  anger:      { next: 'bargaining',    threshold: 3 },
  bargaining: { next: 'depression',    threshold: 5 },
  depression: { next: 'acceptance',    threshold: 7 },
  acceptance: { next: 'acceptance',    threshold: 99 }   // 终态
}

export function checkIdentityTransition(chronic: ChronicState): IdentityStage {
  const current = IDENTITY_TRANSITIONS[chronic.identityStage]
  if (chronic.month >= current.threshold) {
    return current.next
  }
  return chronic.identityStage
}

// 身份阶段对游戏机制的影响
export function getIdentityEffects(stage: IdentityStage): {
  willpowerMod: number
  adherenceMod: number
  socialMod: number
  desc: string
} {
  switch (stage) {
    case 'denial':
      return { willpowerMod: 0, adherenceMod: -30, socialMod: 0, desc: '拒绝服用长期药物，每月生理指标-15%' }
    case 'anger':
      return { willpowerMod: -20, adherenceMod: -15, socialMod: -20, desc: '冲动行为增加，社交冲突风险+50%' }
    case 'bargaining':
      return { willpowerMod: -10, adherenceMod: 10, socialMod: -10, desc: '过度尝试替代疗法，经济压力+300%' }
    case 'depression':
      return { willpowerMod: -40, adherenceMod: -20, socialMod: -30, desc: '意志力池锁定为60%，持续低落' }
    case 'acceptance':
      return { willpowerMod: 10, adherenceMod: 40, socialMod: 15, desc: '解锁"长期管理"技能，治疗依从性+40%' }
  }
}

// ═══════════════════════════════════════════════════════════
// 五、慢性选择处理
// ═══════════════════════════════════════════════════════════

export function applyChronicChoice(state: GameState, choice: ChronicChoice): GameState {
  const s = deepClone(state)
  if (!s.chronic) return s
  const chronic = s.chronic
  const eff = choice.effects

  // 资源变化
  if (eff.resources) {
    const r = eff.resources
    if (r.medicalDebt !== undefined) chronic.resources.medicalDebt += r.medicalDebt
    if (r.monthlyIncome !== undefined) chronic.resources.monthlyIncome += r.monthlyIncome
    if (r.relationshipCapital !== undefined) chronic.resources.relationshipCapital = clamp(chronic.resources.relationshipCapital + r.relationshipCapital)
    if (r.socialDays !== undefined) chronic.resources.socialDays += r.socialDays
    if (r.meaningScore !== undefined) chronic.resources.meaningScore = clamp(chronic.resources.meaningScore + r.meaningScore)
    if (r.workPerformance !== undefined) chronic.resources.workPerformance = clamp(chronic.resources.workPerformance + r.workPerformance)
    if (r.disclosureLevel !== undefined) chronic.resources.disclosureLevel = r.disclosureLevel
  }

  // 生理变化
  if (eff.physiology) {
    applyPartialPhysio(s.physiology, eff.physiology)
  }

  // 身份阶段变化
  if (eff.identityStage) {
    chronic.identityStage = eff.identityStage
  }

  // 药物效果
  if (eff.medicationEffect) {
    const med = chronic.medications.find(m => m.id === eff.medicationEffect!.medId)
    if (med) {
      med.adherence = clamp(med.adherence + eff.medicationEffect.adherenceDelta)
    }
  }

  // 意志力
  s.willpower = clamp(s.willpower - eff.willpowerCost)

  // 重算负荷
  s.physiology.chronic.allostaticLoad = calcAllostatic(s.physiology)

  // 日志
  s.journal.push(`慢性月${chronic.month}：${choice.text}`)

  return s
}

// ═══════════════════════════════════════════════════════════
// 六、月度推进
// ═══════════════════════════════════════════════════════════

export function advanceChronicWeek(state: GameState): GameState {
  const s = deepClone(state)
  if (!s.chronic) return s
  const c = s.chronic

  c.weekInMonth = (c.weekInMonth % 4 + 1) as 1 | 2 | 3 | 4

  // 月末推进
  if (c.weekInMonth === 1 && c.month >= 1) {
    c.month++

    // 月度医疗支出
    const monthlyMedCost = c.medications.length * 800
    const monthlyCheckCost = 1200
    c.resources.medicalDebt += monthlyMedCost + monthlyCheckCost

    // 收入扣除
    if (c.resources.workPerformance < 50) {
      c.resources.medicalDebt += c.resources.monthlyIncome * 0.2
    }

    // 记录债务历史
    c.medicalDebtHistory.push({ month: c.month, amount: c.resources.medicalDebt })

    // 身份阶段检查
    c.identityStage = checkIdentityTransition(c)

    // 专家病人等级提升
    if (c.month >= 3) c.expertPatientLevel = Math.min(3, Math.floor(c.month / 3))

    // 关系资本自然衰减
    c.resources.relationshipCapital = clamp(c.resources.relationshipCapital - 3)
    c.resources.socialDays = Math.max(0, c.resources.socialDays - 1)

    // 依从率影响生理
    if (c.cumulativeAdherence < 70) {
      s.physiology.chronic.allostaticLoad = clamp(s.physiology.chronic.allostaticLoad + 5)
      c.crisisCount++
    }
  }

  // 自然恢复（微量）
  s.physiology.neural.circadianStrength = clamp(s.physiology.neural.circadianStrength + 0.5)

  // 重算
  s.physiology.chronic.allostaticLoad = calcAllostatic(s.physiology)

  return s
}

// ═══════════════════════════════════════════════════════════
// 七、月度审计
// ═══════════════════════════════════════════════════════════

export function generateMonthAudit(state: GameState): ChronicMonthSettlement {
  if (!state.chronic) {
    return { month: 1, title: '', narrative: '', auditItems: [], strategyOptions: [] }
  }
  const c = state.chronic
  const p = state.physiology

  const al = p.chronic.allostaticLoad
  const physioTrend: 'improving' | 'stable' | 'declining' = al < 45 ? 'improving' : al < 60 ? 'stable' : 'declining'
  const debtRatio = c.resources.medicalDebt / (c.resources.monthlyIncome * 12)
  const financialTrend: 'improving' | 'stable' | 'declining' = debtRatio < 0.5 ? 'improving' : debtRatio < 1.0 ? 'stable' : 'declining'
  const socialTrend: 'improving' | 'stable' | 'declining' = c.resources.relationshipCapital > 60 ? 'improving' : c.resources.relationshipCapital > 40 ? 'stable' : 'declining'
  const existentialTrend: 'improving' | 'stable' | 'declining' = c.resources.meaningScore > 50 ? 'improving' : c.resources.meaningScore > 30 ? 'stable' : 'declining'

  const quarterlyNarratives: Record<number, string> = {
    1: `第一个月。你开始学会读药品说明书，比医生还认真。
你发现了一个真相：**没有人会替你管理你的身体。**
它是你的，连同那些诊断代码、药物副作用和每月的账单。`,
    2: `你开始在Excel里追踪17种指标。
你比全科医生更懂你的病。
你成为了**自己的项目经理**，而项目是：活着。`,
    3: `慢性病从不单独存在。
每种药物带来新的监测需求，每个解决方案创造新的问题。
这是**医源性伤害**的温柔版本。`,
    6: `半年了。你已经不记得"正常"是什么感觉。
但你在"不正常"中找到了新的节奏。
这不是接受，这是**适应**。`,
    12: `一年。
你没有被治愈。但你在某些方面比健康时更强。
你理解了其他人永远不会理解的东西：
**健康不是默认设置，而是每天的选择。**`
  }

  const month = c.month
  const narrative = quarterlyNarratives[month] ||
    `第${month}个月。药物管理已成为日常。` +
    (physioTrend === 'declining' ? '\n指标在缓慢恶化——但至少速度变慢了。' : '\n身体似乎找到了新的平衡。虽然不是你想的那种平衡。')

  return {
    month,
    title: month <= 3 ? '学习管理期' : month <= 6 ? '并发症管理期' : '新基线',
    narrative,
    auditItems: [
      {
        category: 'physiological', label: '生理节律稳定性',
        value: `${al}/100（${physioTrend === 'improving' ? '改善中' : physioTrend === 'stable' ? '平稳' : '恶化中'}）`,
        trend: physioTrend,
        comment: al < 40 ? '稳态负荷可控，但疤痕不可逆' : al < 60 ? '维持当前方案，避免波动' : '需要调整治疗策略'
      },
      {
        category: 'financial', label: '医疗债务',
        value: `¥${c.resources.medicalDebt.toLocaleString()}（占年收入${Math.round(debtRatio * 100)}%）`,
        trend: financialTrend,
        comment: debtRatio > 1.0 ? '⚠️ 超过1年收入，进入危险区' : '可控范围'
      },
      {
        category: 'social', label: '关系资本',
        value: `${c.resources.relationshipCapital}/100，可社交日${c.resources.socialDays}天/月`,
        trend: socialTrend,
        comment: c.resources.socialDays < 4 ? '⚠️ 低于4天/月，抑郁风险临界' : '维持社交对恢复有益'
      },
      {
        category: 'existential', label: '意义感',
        value: `${c.resources.meaningScore}/100`,
        trend: existentialTrend,
        comment: c.resources.meaningScore < 25 ? '⚠️ 意义感过低，可能触发抑郁事件' : '在疾病中找到价值'
      }
    ],
    strategyOptions: [
      { name: '维持当前方案', desc: '如果趋势平稳，不折腾', cost: '无额外成本', effect: '维持现状' },
      { name: '激进调整', desc: '换药/增药/增加检查频率', cost: '医疗支出+50%，副作用风险', effect: '可能改善，也可能恶化' },
      {
        name: c.month >= 6 ? '姑息转向' : '减少复查',
        desc: c.month >= 6 ? '从治疗转向生活质量' : '省钱，但失去早期预警',
        cost: c.month >= 6 ? '放弃治愈可能' : '遗漏风险',
        effect: c.month >= 6 ? '生活品质↑，指标可能缓降' : '经济压力↓，风险↑'
      }
    ]
  }
}

// ═══════════════════════════════════════════════════════════
// 八、终局判定
// ═══════════════════════════════════════════════════════════

export function evaluateEndgame(state: GameState): ChronicEndgame | null {
  if (!state.chronic) return null
  const c = state.chronic
  const p = state.physiology

  // 至少6个月后才评估终局
  if (c.month < 6) return null

  // 稳定带
  if (p.chronic.allostaticLoad < 45 && c.cumulativeAdherence > 80 && c.crisisCount < 2) {
    return {
      name: '稳定带（Stable Zone）',
      condition: '找到可维持的药物组合+生活方式+社会支持',
      description: '每天吃药，定期检查，带着限制生活，但活着。',
      metric: `急性发作${c.crisisCount}次/年，依从率${c.cumulativeAdherence}%`,
      narrative: `你找到了一种节奏。
不是健康时的节奏，但属于你的新节奏。
每天早上7点：二甲双胍+β阻滞剂。
每月第三个周二：内分泌复查。
每季度：全面体检+药物调整。

这不是你想要的生活。
但这是你可以维持的生活。
而在慢性病的世界里，"可以维持"就是最大的胜利。`
    }
  }

  // 转化
  if (c.resources.meaningScore > 70 && c.identityStage === 'acceptance') {
    return {
      name: '转化（Transformation）',
      condition: '完全接受新身份，成为倡导者/教育者',
      description: '疾病不再是负担，而是存在方式。',
      metric: `意义感${c.resources.meaningScore}，已到达"接受"阶段`,
      narrative: `你开始写博客。
不是关于"如何战胜疾病"——那太假了。
你写的是"如何与疾病共存"。

有人读到你的文字，给你留言：
"谢谢你让我知道，我不是一个人。"

你突然意识到：
**疾病没有带走你的价值。它只是改变了价值的形态。**

你不再是那个健康时的自己。
你是经历过破碎后重建的自己。
而重建的东西，永远比原来的更结实。`
    }
  }

  // 渐进衰退
  if (p.chronic.allostaticLoad > 65 || c.crisisCount >= 4) {
    return {
      name: '渐进衰退（Progressive Decline）',
      condition: '并发症累积，多器官功能下降',
      description: '进入残疾评估，考虑提前退休，准备长期护理。',
      metric: `急性发作${c.crisisCount}次，稳态负荷${p.chronic.allostaticLoad}`,
      narrative: `身体的账单到了。
不是一次付清的那种——是分期付款，永远付不完。

你的药盒从3格变成了7格。
你的日历上，医疗预约比工作会议还多。
你的银行卡，每月自动扣款比工资还快。

但你还活着。
在"活着"和"活得好"之间，
你找到了一条窄窄的路。
路很窄，但你还在走。`
    }
  }

  // 优化陷阱
  if (c.expertPatientLevel >= 3 && p.chronic.allostaticLoad < 40 && c.resources.meaningScore < 30) {
    return {
      name: '优化陷阱（Medicalization）',
      condition: '陷入生物黑客式的无尽优化',
      description: '过度监测导致焦虑，过度干预导致伤害。',
      metric: `专家病人Lv${c.expertPatientLevel}，意义感仅${c.resources.meaningScore}`,
      narrative: `你追踪了一切。
17种指标，每天更新。
可穿戴设备24小时监测。
你比任何医生都了解你的身体。

但你不快乐。
因为你已经不是在"活着"了——
你在"管理一具身体"。

吃饭不是吃饭，是"宏量营养素配比"。
睡觉不是睡觉，是"昼夜节律优化"。
社交不是社交，是"社会支持网络维护"。

你赢了数据。
但你输了生活。`
    }
  }

  return null
}

// ═══════════════════════════════════════════════════════════
// 九、辅助函数
// ═══════════════════════════════════════════════════════════

function calcAllostatic(p: PhysiologyState): number {
  return clamp(Math.round(
    ((100 - p.metabolic.insulinSensitivity) * 0.25 +
     (100 - p.cardio.vascularElasticity) * 0.25 +
     p.immune.inflammation * 0.2 +
     (100 - p.neural.hpaRegulation) * 0.3 +
     p.chronic.sleepPressure * 0.5 +
     p.chronic.oxidativeStress * 0.3) / 3.5
  ))
}

function applyPartialPhysio(target: PhysiologyState, partial: DeepPartial<PhysiologyState>) {
  if (partial.metabolic) applyObj(target.metabolic, partial.metabolic)
  if (partial.cardio) applyObj(target.cardio, partial.cardio)
  if (partial.immune) applyObj(target.immune, partial.immune)
  if (partial.neural) applyObj(target.neural, partial.neural)
  if (partial.chronic) applyObj(target.chronic, partial.chronic)
}

function applyObj(target: Record<string, any>, partial: Record<string, any>) {
  for (const [key, val] of Object.entries(partial)) {
    if (key in target && typeof val === 'number' && typeof target[key] === 'number') {
      target[key] = clamp(target[key] + val)
    } else if (typeof val === 'string') {
      target[key] = val
    }
  }
}

// 获取慢性阶段主题
export function getChronicTheme(month: number): { title: string; emoji: string; quarter: string } {
  if (month <= 3) return { title: '学习管理', emoji: '📚', quarter: 'Q1' }
  if (month <= 6) return { title: '并发症管理', emoji: '🔄', quarter: 'Q2' }
  if (month <= 9) return { title: '新基线', emoji: '⚖️', quarter: 'Q3' }
  return { title: '长期共处', emoji: '🌅', quarter: 'Q4+' }
}

// 获取月内周次主题
export function getChronicWeekTheme(weekInMonth: number): { title: string; focus: string } {
  switch (weekInMonth) {
    case 1: return { title: '稳定期管理', focus: '维持routine，监测基线' }
    case 2: return { title: '累积效应', focus: '处理副作用累积' }
    case 3: return { title: '危机窗口', focus: '随机波动与选择博弈' }
    case 4: return { title: '审计调整', focus: '月度审计与策略调整' }
    default: return { title: '', focus: '' }
  }
}

// 判断是否可以触发终局
export function canEndgame(state: GameState): boolean {
  return !!state.chronic && state.chronic.month >= 6
}

// 判断是否游戏真正结束（12个月强制结束）
export function isChronicEnd(state: GameState): boolean {
  return !!state.chronic && state.chronic.month >= 12
}

// ═══════════════════════════════════════════════════════════
// 十、医疗导航系统
// ═══════════════════════════════════════════════════════════

export interface AppointmentResult {
  resolved: string[]       // 已完成的预约
  missed: string[]         // 错过的预约
  notifications: string[]  // 结果通知
  resourceCost: number     // 花费（元）
  healthImpact: number     // 对稳态负荷的影响（正=恶化）
}

/** 处理月度预约管理 — 玩家选择去/不去哪些科室 */
export function processAppointments(
  state: GameState,
  attendIds: string[]      // 玩家选择去的科室ID
): GameState {
  if (!state.chronic) return state
  const s = deepClone(state)
  const c = s.chronic!
  const result: AppointmentResult = { resolved: [], missed: [], notifications: [], resourceCost: 0, healthImpact: 0 }

  for (const appt of c.appointments) {
    if (attendIds.includes(appt.id)) {
      // 去了 → 完成检查，花钱
      result.resolved.push(appt.id)
      const cost = appt.id === 'psych' ? 400 : appt.id === 'nutrition' ? 200 : 600
      result.resourceCost += cost
      appt.missedCount = 0
      // 正面效果
      if (appt.id === 'endo') {
        s.physiology.metabolic.glucoseStability = clamp(s.physiology.metabolic.glucoseStability + 3)
        s.physiology.metabolic.insulinSensitivity = clamp(s.physiology.metabolic.insulinSensitivity + 1)
      } else if (appt.id === 'cardio') {
        s.physiology.cardio.bloodPressureLoad = clamp(s.physiology.cardio.bloodPressureLoad - 3)
        s.physiology.cardio.autonomicBalance = clamp(s.physiology.cardio.autonomicBalance + 2)
      } else if (appt.id === 'psych') {
        s.physiology.neural.hpaRegulation = clamp(s.physiology.neural.hpaRegulation + 3)
        s.willpower = clamp(s.willpower + 5)
      } else if (appt.id === 'rheuma') {
        s.physiology.immune.inflammation = clamp(s.physiology.immune.inflammation - 2)
        s.physiology.immune.autoimmunityRisk = clamp(s.physiology.immune.autoimmunityRisk - 1)
      } else if (appt.id === 'nutrition') {
        s.physiology.metabolic.mitochondrialHealth = clamp(s.physiology.metabolic.mitochondrialHealth + 2)
        s.physiology.immune.immuneCompetence = clamp(s.physiology.immune.immuneCompetence + 1)
      }
      // 去检查需要请假/花时间
      c.resources.workPerformance = clamp(c.resources.workPerformance - 2)
      c.resources.socialDays = Math.max(0, c.resources.socialDays - 1)
    } else {
      // 没去 → 累积 missedCount
      result.missed.push(appt.id)
      appt.missedCount++
      if (appt.missedCount >= 2) {
        result.notifications.push(`⚠️ ${appt.dept}连续${appt.missedCount}次未复查，病情可能失控`)
        result.healthImpact += 3
      }
      result.notifications.push(`${appt.dept}已跳过 — ${appt.conflict}`)
    }
  }

  // 资源扣除
  c.resources.medicalDebt += result.resourceCost

  // 健康影响
  if (result.healthImpact > 0) {
    s.physiology.chronic.allostaticLoad = clamp(s.physiology.chronic.allostaticLoad + result.healthImpact)
  }

  // 重算
  s.physiology.chronic.allostaticLoad = calcAllostatic(s.physiology)
  s.journal.push(`月${c.month}预约管理：完成${result.resolved.length}科，错过${result.missed.length}科，花费¥${result.resourceCost}`)

  return s
}

/** 医保决策 — 灰色地带选择 */
export interface InsuranceDecision {
  type: 'generic_first' | 'imported' | 'trial' | 'reduce_check'
  label: string
  costSave: number     // 每月省多少
  riskLevel: number    // 风险值 1-10
  description: string
}

export function getInsuranceOptions(month: number): InsuranceDecision[] {
  const base: InsuranceDecision[] = [
    { type: 'generic_first', label: '先试用3种医保内药物', costSave: 200, riskLevel: 3, description: '副作用更大的便宜药，但医保覆盖' },
    { type: 'imported', label: '海外代购仿制药', costSave: 800, riskLevel: 7, description: '便宜80%，但假药风险/法律风险' },
    { type: 'trial', label: '参加临床试验', costSave: 1500, riskLevel: 5, description: '免费药物，但随机分组可能分到安慰剂' },
    { type: 'reduce_check', label: '减少复查频率', costSave: 600, riskLevel: 4, description: '省钱，但失去早期预警' },
  ]
  // 月数越久，解锁越多选项
  if (month < 3) return base.slice(0, 2)
  if (month < 6) return base.slice(0, 3)
  return base
}

export function applyInsuranceDecision(state: GameState, decision: InsuranceDecision): GameState {
  const s = deepClone(state)
  if (!s.chronic) return s
  const c = s.chronic

  c.resources.medicalDebt -= decision.costSave * 3 // 季度节省

  // 风险实现
  const unlucky = Math.random() * 10 < decision.riskLevel
  if (unlucky) {
    switch (decision.type) {
      case 'generic_first':
        s.physiology.immune.inflammation = clamp(s.physiology.immune.inflammation + 5)
        s.journal.push(`月${c.month}：便宜药副作用严重，炎症指标上升`)
        break
      case 'imported':
        s.physiology.chronic.oxidativeStress = clamp(s.physiology.chronic.oxidativeStress + 8)
        c.crisisCount++
        s.journal.push(`月${c.month}：代购药物质量存疑，急性发作+1`)
        break
      case 'trial':
        s.physiology.neural.cognitiveReserve = clamp(s.physiology.neural.cognitiveReserve - 5)
        s.journal.push(`月${c.month}：分到安慰剂组，病情无改善，认知下降`)
        break
      case 'reduce_check':
        s.physiology.chronic.allostaticLoad = clamp(s.physiology.chronic.allostaticLoad + 6)
        c.crisisCount++
        s.journal.push(`月${c.month}：错过早期预警，急性发作+1`)
        break
    }
  } else {
    s.journal.push(`月${c.month}：${decision.label} — 省下¥${decision.costSave * 3}，暂无不良反应`)
  }

  s.physiology.chronic.allostaticLoad = calcAllostatic(s.physiology)
  return s
}

// ═══════════════════════════════════════════════════════════
// 十一、职场管理系统
// ═══════════════════════════════════════════════════════════

export type AccommodationType = 'flexible_hours' | 'remote_work' | 'less_travel'

export interface WorkplaceDecision {
  type: 'disclose' | 'hide' | 'request_accommodation' | 'reduce_hours' | 'disability_leave'
  label: string
  willpowerCost: number
  effects: {
    workPerformance: number
    relationshipCapital: number
    monthlyIncome: number
    disclosureLevel?: 'hidden' | 'partial' | 'full'
  }
  narrative: string
}

export function getWorkplaceOptions(state: GameState): WorkplaceDecision[] {
  if (!state.chronic) return []
  const c = state.chronic
  const options: WorkplaceDecision[] = []

  // 始终可用
  options.push({
    type: 'hide', label: '继续隐瞒，假装一切正常',
    willpowerCost: 10,
    effects: { workPerformance: 3, relationshipCapital: -3, monthlyIncome: 0 },
    narrative: '你咬牙撑着。绩效略有回升，但每分钟都是煎熬。'
  })

  // 至少2个月且未完全公开
  if (c.month >= 2 && c.resources.disclosureLevel !== 'full') {
    options.push({
      type: 'disclose', label: '向HR和直属领导公开病情',
      willpowerCost: 20,
      effects: { workPerformance: -10, relationshipCapital: 5, monthlyIncome: 0, disclosureLevel: 'full' },
      narrative: '会议室里，你说出了那个词。沉默比任何回应都沉重。'
    })
  }

  // 已公开后解锁
  if (c.resources.disclosureLevel === 'full' || c.resources.disclosureLevel === 'partial') {
    options.push({
      type: 'request_accommodation', label: '申请合理便利（弹性工时）',
      willpowerCost: 8,
      effects: { workPerformance: -5, relationshipCapital: 0, monthlyIncome: 0 },
      narrative: 'HR批准了弹性工时。但你知道，季度评估时这会被记住。'
    })
    options.push({
      type: 'reduce_hours', label: '申请减至80%工时（收入-20%）',
      willpowerCost: 5,
      effects: { workPerformance: 5, relationshipCapital: 0, monthlyIncome: -3000 },
      narrative: '收入减少，但下午可以休息。值得吗？你不确定。'
    })
  }

  // 严重时解锁
  if (c.crisisCount >= 2 || state.physiology.chronic.allostaticLoad > 65) {
    options.push({
      type: 'disability_leave', label: '长期病假（领60%工资）',
      willpowerCost: 3,
      effects: { workPerformance: -30, relationshipCapital: -10, monthlyIncome: -6000 },
      narrative: '你签了病假单。同事们投来复杂的目光。职业连续性正式断裂。'
    })
  }

  return options
}

export function applyWorkplaceDecision(state: GameState, decision: WorkplaceDecision): GameState {
  const s = deepClone(state)
  if (!s.chronic) return s
  const c = s.chronic

  s.willpower = clamp(s.willpower - decision.willpowerCost)
  c.resources.workPerformance = clamp(c.resources.workPerformance + decision.effects.workPerformance)
  c.resources.relationshipCapital = clamp(c.resources.relationshipCapital + decision.effects.relationshipCapital)
  c.resources.monthlyIncome += decision.effects.monthlyIncome
  if (decision.effects.disclosureLevel) {
    c.resources.disclosureLevel = decision.effects.disclosureLevel
  }

  s.journal.push(`月${c.month}职场决策：${decision.label}`)
  return s
}

// ═══════════════════════════════════════════════════════════
// 十二、季度叙事分支
// ═══════════════════════════════════════════════════════════

export type QuarterlyBranch = 'optimization' | 'palliative' | 'advocacy'

export interface BranchChoice {
  branch: QuarterlyBranch
  label: string
  desc: string
  requirement: string
  effects: {
    meaningScore: number
    allostaticDelta: number
    narrative: string
  }
}

export function getQuarterlyBranchOptions(state: GameState): BranchChoice[] {
  if (!state.chronic) return []
  const c = state.chronic
  // 仅在月6-8时出现分支选择
  if (c.month < 6 || c.month > 8) return []
  // 已经选了就不再出现
  if (c.quarterlyBranch) return []

  return [
    {
      branch: 'optimization', label: '🧬 生物黑客路线',
      desc: '追踪一切指标，用数据优化身体。但可能陷入医疗化生活。',
      requirement: '专家病人Lv.2+',
      effects: {
        meaningScore: -10,
        allostaticDelta: -5,
        narrative: '你买了可穿戴设备，追踪17种指标。数据不会说谎——但也不会让你快乐。'
      }
    },
    {
      branch: 'palliative', label: '🌿 姑息智慧路线',
      desc: '接受不可逆，追求生活质量而非指标完美。',
      requirement: '到达"抑郁"或"接受"阶段',
      effects: {
        meaningScore: 15,
        allostaticDelta: 3,
        narrative: '你停止追求完美指标。生活质量上升了，但身体会缓慢地记住这一切。'
      }
    },
    {
      branch: 'advocacy', label: '📢 倡导与连接',
      desc: '将个人痛苦转化为集体行动。加入病友组织，推动改变。',
      requirement: '意义感>40',
      effects: {
        meaningScore: 25,
        allostaticDelta: 0,
        narrative: '你开始写博客，参加病友聚会。痛苦没有消失，但它获得了叙事价值。'
      }
    }
  ]
}

export function applyQuarterlyBranch(state: GameState, branch: QuarterlyBranch): GameState {
  const s = deepClone(state)
  if (!s.chronic) return s
  const c = s.chronic
  const options = getQuarterlyBranchOptions(state)
  const chosen = options.find(o => o.branch === branch)
  if (!chosen) return s

  c.quarterlyBranch = branch
  c.resources.meaningScore = clamp(c.resources.meaningScore + chosen.effects.meaningScore)
  s.physiology.chronic.allostaticLoad = clamp(s.physiology.chronic.allostaticLoad + chosen.effects.allostaticDelta)
  s.physiology.chronic.allostaticLoad = calcAllostatic(s.physiology)

  s.journal.push(`月${c.month}选择叙事分支：${chosen.label}`)
  return s
}

// ═══════════════════════════════════════════════════════════
// 十三、第4种终局 — 医学突破
// ═══════════════════════════════════════════════════════════

/** 检查是否触发医学突破（极小概率事件） */
export function checkMedicalMiracle(state: GameState): boolean {
  if (!state.chronic) return false
  const c = state.chronic
  // 条件：月9+、参加临床试验、依从率>80、运气好（10%概率）
  if (c.month >= 9 && c.resources.disclosureLevel !== 'hidden' && c.cumulativeAdherence > 80) {
    return Math.random() < 0.10
  }
  return false
}

/** 升级 evaluateEndgame 增加第4种终局 */
export function evaluateEndgameFull(state: GameState): (import('./physio-types').ChronicEndgame & { isMiracle?: boolean }) | null {
  // 先检查原有的3种+优化陷阱
  const base = evaluateEndgame(state)
  if (base) return base

  // 医学突破（第4种终局）
  if (checkMedicalMiracle(state)) {
    return {
      name: '医学突破（Medical Miracle）',
      condition: '极小概率事件 — 新疗法逆转了部分病情',
      description: '不是"大团圆"，而是"幸存者的内疚"与"重新进入正常人世界的陌生感"。',
      metric: '部分生理指标恢复到急性期前水平',
      narrative: `你在新闻里看到一篇论文。\n标题你几乎看不懂，但关键词你认得：\n"逆转"。\n\n你联系了实验室。经历了3轮筛选。\n你被选上了。\n\n治疗持续了4个月。\n副作用比你想的严重。\n但你的一些指标——\n开始往回走了。\n\n医生说："这不叫治愈。这叫缓解。"\n你点了点头。\n\n你回到公司。同事们问你去哪了。\n"休了个长假。"你说。\n\n你看着药盒——从7格变回了3格。\n你不再是"健康人"。\n但你也不再是"慢性病人"。\n\n你是**幸存者**。\n而幸存者有一个独特的诅咒：\n**你会永远害怕回到那个世界。**`,
      isMiracle: true
    }
  }

  return null
}
