'use client'

// ═══════════════════════════════════════════════════════════
// 《生理极限》- 游戏主组件（v4 双层反馈系统）
// 即时反馈 + 延迟揭示，让每个选择都有温度
// ═══════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react'
import { ArrowLeft, ChevronRight, Activity, Heart, Brain, Shield, Flame, AlertTriangle, BookOpen, Skull } from 'lucide-react'
import { Archetype, GameState, GameChoice, DayEvent, DelayedEffect, WeekSettlement as WeekSettlementType, ChronicEvent, ChronicChoice } from '@/lib/physio-types'
import { ARCHETYPES, WEEK1_SETTLEMENT } from '@/lib/physio-data'
import { WEEK2_SETTLEMENT } from '@/lib/physio-data-week2'
import { WEEK3_SETTLEMENT } from '@/lib/physio-data-week3'
import { WEEK4_SETTLEMENT } from '@/lib/physio-data-week4'
import {
  createGameState, applyChoice, advanceDay,
  getPhysiologySummary, getLoadLevel, getSystemStatus, calcAllostaticLoad,
  getEventsForDay, getCurrentWeek, isWeekEnd, isGameEnd, checkKillLineTrigger,
  applyScars, getWeekTheme
} from '@/lib/physio-engine'
import {
  initChronicState, processDailyMedications, applyChronicChoice,
  advanceChronicWeek, generateMonthAudit, evaluateEndgame, evaluateEndgameFull,
  getChronicTheme, getChronicWeekTheme, isChronicEnd, canEndgame,
  getIdentityEffects,
  processAppointments, getInsuranceOptions, applyInsuranceDecision,
  getWorkplaceOptions, applyWorkplaceDecision,
  getQuarterlyBranchOptions, applyQuarterlyBranch,
  checkMedicalMiracle,
  type AppointmentResult, type InsuranceDecision, type WorkplaceDecision, type BranchChoice, type QuarterlyBranch
} from '@/lib/physio-chronic-engine'
import { TRANSITION_EVENTS, getChronicEventsForWeek } from '@/lib/physio-chronic-data'

// 可视化组件
import AllostaticRadar from './physio/AllostaticRadar'
import HrvWaveform from './physio/HrvWaveform'
import BodyHeatmap from './physio/BodyHeatmap'
import MetabolicGauge from './physio/MetabolicGauge'
import DelayedTimeline from './physio/DelayedTimeline'
import MedicalFog from './physio/MedicalFog'
import SomaticEffects from './physio/SomaticEffects'
import ChronicDashboard from './physio/ChronicDashboard'

// 双层反馈系统组件
import {
  FeedbackProvider, useFeedback,
  getKillLineStage, type KillLineStage,
  type NumberDeltaConfig, type ChoicePreview, type DailySettlementData,
  type CausalNarration, type DelayedBadgeData,
  getStatLabel, getStatIcon,
  extractPhysiologyDeltas_,
} from './physio/FeedbackSystem'
import NumberDeltaLayer from './physio/NumberDelta'
import PhysiologicalRippleLayer from './physio/PhysiologicalRipple'
import DelayedBadgeList from './physio/DelayedBadge'
import KillLineWarning from './physio/KillLineWarning'
import PulsingStatusBar from './physio/PulsingStatusBar'
import ChoicePreviewCard from './physio/ChoicePreviewCard'
import DailySettlement from './physio/DailySettlement'
import CausalityTimeline from './physio/CausalityTimeline'
import CausalNarrationOverlay, { generateNarrationsFromChoice } from './physio/CausalNarration'
import WhatIfMode, { type ChoiceRecord } from './physio/WhatIfMode'
import SceneBackground from '../SceneBackground'

type Phase = 'select' | 'playing' | 'settlement' | 'gameover'
  | 'chronic' | 'chronic_month_settlement' | 'chronic_endgame'
  | 'chronic_appointments' | 'chronic_insurance' | 'chronic_workplace' | 'chronic_branch'

// ─── 主组件（外层包装：FeedbackProvider） ───
export default function PhysioLimitGame({ onBack }: { onBack: () => void }) {
  return (
    <FeedbackProvider>
      <PhysioLimitGameInner onBack={onBack} />
    </FeedbackProvider>
  )
}

// ─── 主组件（内层：带反馈系统） ───
function PhysioLimitGameInner({ onBack }: { onBack: () => void }) {
  const fb = useFeedback()
  const [phase, setPhase] = useState<Phase>('select')
  const [state, setState] = useState<GameState | null>(null)
  const [showTip, setShowTip] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [narrativeText, setNarrativeText] = useState<string | null>(null)
  const [delayedNotifications, setDelayedNotifications] = useState<string[]>([])
  const [choiceResult, setChoiceResult] = useState<string | null>(null)
  const [physiologyHistory, setPhysiologyHistory] = useState<any[]>([])
  // 慢性生存状态
  const [chronicEventIdx, setChronicEventIdx] = useState(0)
  const [chronicNarrative, setChronicNarrative] = useState<string | null>(null)
  const [chronicShowMeds, setChronicShowMeds] = useState(false)
  const [chronicSubPanel, setChronicSubPanel] = useState<'none' | 'appointments' | 'insurance' | 'workplace' | 'branch'>('none')
  // 反馈系统扩展状态
  const [hoveredChoice, setHoveredChoice] = useState<number | null>(null)
  const [choicePreview, setChoicePreview] = useState<ChoicePreview | null>(null)
  const [pendingSettlement, setPendingSettlement] = useState<DailySettlementData | null>(null)
  const [showWhatIf, setShowWhatIf] = useState(false)
  const [choiceHistory, setChoiceHistory] = useState<ChoiceRecord[]>([])
  const prevKillLineStage = useRef<KillLineStage>('safe')

  // 选择原型
  const selectArchetype = useCallback((arch: Archetype) => {
    const gs = createGameState(arch)
    setState(gs)
    setPhase('playing')
  }, [])

  // 做选择（增强版：触发反馈动画）
  const makeChoice = useCallback((choice: GameChoice) => {
    if (!state) return

    // ─ 即时反馈层 ─
    // 1. 触发NumberDelta浮动动画
    const deltas = fb.generateDeltasFromChoice(choice, state)
    fb.triggerDeltas(deltas)

    // 2. 检测大幅变化，触发生理涟漪
    const eff = choice.effects
    const imm = eff.immediate as any
    const allostaticDelta = imm.chronic?.allostaticLoad || 0
    if (Math.abs(allostaticDelta) >= 10) {
      fb.triggerRipple({
        type: allostaticDelta > 0 ? 'stress-darken' : 'adrenaline-flash',
        intensity: Math.min(Math.abs(allostaticDelta) / 30, 1),
        duration: 800,
        color: allostaticDelta > 0 ? '#ef4444' : '#22c55e',
      })
    }
    // 意志力大消耗 → 心跳
    if (eff.willpowerCost >= 15) {
      fb.triggerRipple({ type: 'heartbeat', intensity: 0.5, duration: 600 })
    }

    // 3. 因果叙述（增强版：覆盖所有指标变化）
    // 先收集即时效果的所有变化量
    const immDeltas: { path: string; delta: number }[] = []
    for (const sys of ['metabolic', 'cardio', 'immune', 'neural', 'chronic'] as const) {
      const sysData = (imm as any)?.[sys]
      if (!sysData) continue
      for (const [key, val] of Object.entries(sysData)) {
        if (typeof val === 'number' && val !== 0) {
          immDeltas.push({ path: `${sys}.${key}`, delta: val })
        }
      }
    }
    const narrations = generateNarrationsFromChoice(
      choice.text, immDeltas, state.currentDay, eff.willpowerCost
    )
    for (const n of narrations) {
      fb.addNarration(n)
    }

    // ─ 原有逻辑 ─
    const beforePhysiology = { ...state.physiology }
    const afterChoice = applyChoice(state, choice)
    const withScars = applyScars(afterChoice)
    const newNotifications: string[] = []
    const completedDay = withScars.currentDay
    const currentDayEvents = getEventsForDay(withScars.currentDay)
    const nextIdx = withScars.currentEventIdx + 1
    let finalState: GameState

    if (nextIdx < currentDayEvents.length) {
      withScars.currentEventIdx = nextIdx
      finalState = withScars
    } else {
      finalState = advanceDay(withScars)
      finalState.currentEventIdx = 0

      for (const d of finalState.delayedStack) {
        if (d.applied) {
          const before = withScars.delayedStack.find(x => x.id === d.id)
          if (!before || !before.applied) {
            newNotifications.push(d.notification)
          }
        }
      }

      for (const scar of finalState.scars) {
        if (!withScars.scars.find(s => s.id === scar.id)) {
          newNotifications.push(`💀 不可逆损伤：${scar.name} — ${scar.description}`)
        }
      }

      const isCompletedWeekEnd = [7, 14, 21, 28].includes(completedDay)
      if (isCompletedWeekEnd || finalState.currentDay > 28) {
        setState(finalState)
        setPhase('settlement')
        return
      }

      let safetyCounter = 0
      while (getEventsForDay(finalState.currentDay).length === 0 && safetyCounter < 5) {
        finalState = advanceDay(finalState)
        finalState.currentEventIdx = 0
        safetyCounter++
      }

      // ─ 延迟揭示层：每日结算 ─
      if (finalState.currentDay !== state.currentDay) {
        const physioDeltas = extractPhysiologyDeltas_(beforePhysiology, finalState.physiology)
        if (physioDeltas.some(d => Math.abs(d.delta) >= 3)) {
          const settlementData: DailySettlementData = {
            day: completedDay,
            deltas: physioDeltas.map(d => ({
              stat: d.path,
              before: (beforePhysiology as any)[d.path.split('.')[0]]?.[d.path.split('.')[1]] ?? 0,
              after: (finalState.physiology as any)[d.path.split('.')[0]]?.[d.path.split('.')[1]] ?? 0,
              delta: d.delta,
              label: d.label,
              icon: d.icon,
            })),
            newDelayedEffects: choice.effects.delayed?.map(d => ({
              id: d.id,
              cause: d.cause,
              triggerDay: d.triggerDay,
              currentDay: finalState.currentDay,
              effects: d.effects,
              notification: d.notification,
              visualState: 'fresh' as const,
            })) || [],
            scars: finalState.scars.filter(s => !state.scars.find(os => os.id === s.id)),
            predictions: generatePredictions(finalState),
          }
          setPendingSettlement(settlementData)
        }
      }
    }

    // 斩杀线触发检查 + 阶段升级涟漪
    const killTrigger = checkKillLineTrigger(finalState)
    if (killTrigger && getCurrentWeek(finalState.currentDay) >= 3) {
      newNotifications.push('💀 斩杀线事件已触发！身体的账单到了...')
    }
    const newKillStage = getKillLineStage(finalState.physiology.chronic.allostaticLoad)
    if (newKillStage !== prevKillLineStage.current) {
      const ripples = fb.generateKillLineRipple(newKillStage)
      for (const r of ripples) fb.triggerRipple(r)
      prevKillLineStage.current = newKillStage
    }

    // 延迟效果通知
    if (newNotifications.length > 0) {
      setDelayedNotifications(prev => [...prev, ...newNotifications])
    }

    // 更新延迟徽章
    fb.updateDelayedBadges(finalState.delayedStack, finalState.currentDay)

    // 生成选择效果摘要（保留文字作为fallback）
    const effectLines: string[] = []
    if (eff.willpowerCost > 0) effectLines.push(`🎯 意志力 -${eff.willpowerCost}`)
    if (eff.cognitiveCost > 0) effectLines.push(`🧠 认知能量 -${eff.cognitiveCost}`)
    if (eff.physicalCost > 0) effectLines.push(`💪 体力 -${eff.physicalCost}`)
    if (imm.chronic?.allostaticLoad) {
      const delta = imm.chronic.allostaticLoad
      effectLines.push(delta > 0 ? `⚠️ 稳态负荷 +${delta}` : `✅ 稳态负荷 ${delta}`)
    }
    if (eff.delayed && eff.delayed.length > 0) {
      effectLines.push(`⏳ ${eff.delayed.length}个延迟效应已入栈`)
    }
    if (finalState.currentDay !== state.currentDay) {
      const week = getCurrentWeek(finalState.currentDay)
      const theme = getWeekTheme(week)
      effectLines.push(`\n📅 进入 Day ${finalState.currentDay} — ${theme.emoji} ${theme.title}`)
    }
    const newScars = finalState.scars.filter(s => !state.scars.find(os => os.id === s.id))
    if (newScars.length > 0) {
      for (const s of newScars) effectLines.push(`💀 不可逆损伤：${s.name}`)
    }

    if (choice.narrative) {
      setNarrativeText(choice.narrative)
    } else if (effectLines.length > 0) {
      setChoiceResult(effectLines.join('\n'))
    }

    // 记录选择历史（供What-if使用）—— 增强版：完整生理快照
    const effectsRecord: Record<string, number> = {}
    for (const d of immDeltas) effectsRecord[d.path] = d.delta
    if (eff.willpowerCost > 0) effectsRecord['willpower'] = -eff.willpowerCost

    const snapshotBefore = {
      allostaticLoad: state.physiology.chronic.allostaticLoad,
      sleepDebt: state.physiology.chronic.sleepDebt,
      inflammation: state.physiology.immune.inflammation,
      willpower: state.willpower,
      insulinSensitivity: state.physiology.metabolic.insulinSensitivity,
      hpaRegulation: state.physiology.neural.hpaRegulation,
    }

    setChoiceHistory(prev => {
      // finalState 还没算出来，先记 before，后面 setState 后补充 after
      return [...prev, {
        day: state.currentDay,
        choiceText: choice.text,
        choiceIndex: 0,
        totalEventChoices: 1,
        effects: effectsRecord,
        stateBefore: snapshotBefore,
        stateAfter: snapshotBefore, // 占位，后面 nextEvent 或下一次渲染时更新
      }]
    })

    setState(finalState)

    // 补充 choiceHistory 的 stateAfter 快照
    setChoiceHistory(prev => {
      const last = prev[prev.length - 1]
      if (!last || last.day !== state.currentDay) return prev
      return [...prev.slice(0, -1), {
        ...last,
        stateAfter: {
          allostaticLoad: finalState.physiology.chronic.allostaticLoad,
          sleepDebt: finalState.physiology.chronic.sleepDebt,
          inflammation: finalState.physiology.immune.inflammation,
          willpower: finalState.willpower,
          insulinSensitivity: finalState.physiology.metabolic.insulinSensitivity,
          hpaRegulation: finalState.physiology.neural.hpaRegulation,
        }
      }]
    })

    setShowDetails(false)
    setChoicePreview(null)
    setHoveredChoice(null)

    setPhysiologyHistory(prev => {
      const next = [...prev, { ...finalState.physiology }]
      return next.length > 7 ? next.slice(-7) : next
    })

    if (finalState.isGameOver) {
      setPhase('gameover')
    }
  }, [state, fb])

  // 下一个事件
  const nextEvent = useCallback(() => {
    setNarrativeText(null)
    setShowTip(null)
    setShowDetails(false)
    setChoiceResult(null)
    setChoicePreview(null)
    setHoveredChoice(null)
  }, [])

  // 处理选择hover（预览）
  const handleChoiceHover = useCallback((choice: GameChoice | null, idx: number | null) => {
    if (!state || !choice) {
      setChoicePreview(null)
      setHoveredChoice(null)
      return
    }
    setHoveredChoice(idx)
    setChoicePreview(fb.generatePreview(choice, state))
  }, [state, fb])

  // ─── 进入慢性生存模式 ───
  const enterChronicMode = useCallback(() => {
    if (!state) return
    const chronicState = initChronicState(state)
    const newState: GameState = {
      ...state,
      isChronicPhase: true,
      chronic: chronicState,
      currentDay: 29  // Day 29 = 慢性模式开始
    }
    setState(newState)
    setChronicEventIdx(0)
    setPhase('chronic')
  }, [state])

  // ─── 慢性选择处理 ───
  const makeChronicChoice = useCallback((choice: ChronicChoice) => {
    if (!state || !state.chronic) return
    let newState = applyChronicChoice(state, choice)

    // 推进慢性周次
    newState = advanceChronicWeek(newState)

    // 检查终局（含医学突破）
    const endgame = evaluateEndgameFull(newState)
    if (endgame) {
      setState(newState)
      setChronicNarrative(endgame.narrative)
      setPhase('chronic_endgame')
      return
    }

    // 检查是否强制结束（12个月）
    if (isChronicEnd(newState)) {
      setState(newState)
      setPhase('chronic_endgame')
      return
    }

    // 月末结算
    if (newState.chronic!.weekInMonth === 1 && newState.chronic!.month > (state.chronic?.month || 0)) {
      setState(newState)
      setPhase('chronic_month_settlement')
      return
    }

    // 继续下一事件
    setChronicEventIdx(prev => prev + 1)
    if (choice.effects.narrative) {
      setChronicNarrative(choice.effects.narrative)
    }
    setState(newState)
  }, [state])

  // ─── 慢性药物管理 ───
  const handleMedSelection = useCallback((takeIds: string[]) => {
    if (!state) return
    const newState = processDailyMedications(state, takeIds)
    setState(newState)
    setChronicShowMeds(false)
  }, [state])

  // ─── 医疗导航：预约管理 ───
  const handleAppointments = useCallback((attendIds: string[]) => {
    if (!state) return
    const newState = processAppointments(state, attendIds)
    setState(newState)
    setChronicSubPanel('none')
  }, [state])

  // ─── 医保决策 ───
  const handleInsurance = useCallback((decision: InsuranceDecision) => {
    if (!state) return
    const newState = applyInsuranceDecision(state, decision)
    setState(newState)
    setChronicSubPanel('none')
  }, [state])

  // ─── 职场决策 ───
  const handleWorkplace = useCallback((decision: WorkplaceDecision) => {
    if (!state) return
    const newState = applyWorkplaceDecision(state, decision)
    setState(newState)
    // 职场叙事显示
    setChronicNarrative(decision.narrative)
    setChronicSubPanel('none')
  }, [state])

  // ─── 季度叙事分支 ───
  const handleBranchChoice = useCallback((branch: QuarterlyBranch) => {
    if (!state) return
    const options = getQuarterlyBranchOptions(state)
    const chosen = options.find(o => o.branch === branch)
    const newState = applyQuarterlyBranch(state, branch)
    setState(newState)
    setChronicNarrative(chosen?.effects.narrative || `你选择了新的路线。`)
    setChronicSubPanel('none')
  }, [state])

  // getEventsForDay 已从 engine 导入使用

  // ─── 渲染 ───
  const killLineStage = state ? getKillLineStage(state.physiology.chronic.allostaticLoad) : 'safe'

  return (
    <SceneBackground scene="hospital">
      <div className="min-h-dvh flex flex-col relative">
        {/* 全局反馈层 */}
        <NumberDeltaLayer deltas={fb.feedback.activeDeltas} onClear={fb.clearCompletedDelta} />
        <PhysiologicalRippleLayer ripples={fb.feedback.activeRipples} />
        {state && <KillLineWarning stage={killLineStage} allostaticLoad={state.physiology.chronic.allostaticLoad} />}

      {/* 选择预览悬浮卡 */}
      {choicePreview && hoveredChoice !== null && (
        <ChoicePreviewCard preview={choicePreview} choiceText="" />
      )}

      {/* 每日结算仪式 */}
      {pendingSettlement && (
        <DailySettlement
          data={pendingSettlement}
          onAcknowledge={() => setPendingSettlement(null)}
        />
      )}

      {/* 因果叙述浮层 */}
      <CausalNarrationOverlay
        narrations={fb.feedback.narrations}
        onDismiss={(id: string) => {
          // 从叙述队列中移除已关闭的叙述
          // showCount 递增由 CausalNarration 内部管理
        }}
        onToggleAuto={() => {
          // 自动解释开关由 CausalNarration 内部管理
        }}
      />

      {/* 顶部导航 */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 sticky top-0 z-10"
        style={{ background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => { if (phase === 'playing') setPhase('select'); else onBack() }} className="p-1">
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">⚡ 生理极限</h1>
          <p className="text-[10px] text-gray-500">健康管理生存模拟</p>
        </div>
        {state && phase === 'playing' && (
          <div className="flex items-center gap-1">
            <button onClick={() => setShowWhatIf(true)} className="p-2 rounded-lg bg-white/5" title="假设分析">
              <Flame size={16} className="text-amber-400" />
            </button>
            <button onClick={() => setShowDetails(!showDetails)} className="p-2 rounded-lg bg-white/5">
              <Activity size={16} className="text-cyan-400" />
            </button>
          </div>
        )}
      </div>

      {phase === 'select' && <ArchetypeSelect onSelect={selectArchetype} />}
      {phase === 'playing' && state && (
        <SomaticEffects state={state}>
          <GamePlay
            state={state}
            showDetails={showDetails}
            showTip={showTip}
            narrativeText={narrativeText}
            delayedNotifications={delayedNotifications}
            choiceResult={choiceResult}
            physiologyHistory={physiologyHistory}
            onChoice={makeChoice}
            onNext={nextEvent}
            onShowTip={setShowTip}
            onShowDetails={setShowDetails}
            onClearNarrative={() => { setNarrativeText(null) }}
            onClearNotifications={() => setDelayedNotifications([])}
            onClearChoiceResult={() => setChoiceResult(null)}
            hoveredChoice={hoveredChoice}
            onHoverChoice={handleChoiceHover}
          />
        </SomaticEffects>
      )}
      {phase === 'settlement' && state && (
        <WeekSettlementView state={state} onContinue={() => {
          const week = getCurrentWeek(state.currentDay)
          const isFinal = week >= 4 || state.currentDay > 28
          if (isFinal) {
            setPhase('gameover')
          } else {
            setPhase('playing')
            setState({ ...state, currentDay: week * 7 + 1, currentEventIdx: 0 })
          }
        }} onBack={onBack} />
      )}
      {phase === 'gameover' && state && (
        <GameOverView state={state} onRestart={() => setPhase('select')} onBack={onBack} onEnterChronic={enterChronicMode} />
      )}
      {phase === 'chronic' && state && state.chronic && (
        <ChronicGamePlay
          state={state}
          eventIdx={chronicEventIdx}
          narrative={chronicNarrative}
          showMeds={chronicShowMeds}
          subPanel={chronicSubPanel}
          onChoice={makeChronicChoice}
          onMedSelect={handleMedSelection}
          onClearNarrative={() => setChronicNarrative(null)}
          onToggleMeds={() => setChronicShowMeds(!chronicShowMeds)}
          onSetSubPanel={setChronicSubPanel}
          onAppointments={handleAppointments}
          onInsurance={handleInsurance}
          onWorkplace={handleWorkplace}
          onBranch={handleBranchChoice}
          onShowDetails={setShowDetails}
        />
      )}
      {phase === 'chronic_month_settlement' && state && state.chronic && (
        <ChronicMonthSettlementView
          state={state}
          onContinue={() => {
            setChronicEventIdx(0)
            setPhase('chronic')
          }}
          onBack={onBack}
        />
      )}
      {phase === 'chronic_endgame' && state && (
        <ChronicEndgameView
          state={state}
          narrative={chronicNarrative}
          onRestart={() => { setPhase('select'); setChronicSubPanel('none') }}
          onBack={onBack}
        />
      )}

      {/* What-if 假设分析模式 */}
      {showWhatIf && state && (
        <WhatIfMode
          state={state}
          madeChoices={choiceHistory}
          onClose={() => setShowWhatIf(false)}
        />
      )}
      </div>
    </SceneBackground>
  )
}

// ─── 辅助函数：生成明日预测 ───
function generatePredictions(gs: GameState): DailySettlementData['predictions'] {
  const preds: DailySettlementData['predictions'] = []
  const al = gs.physiology.chronic.allostaticLoad
  const sleepDebt = gs.physiology.chronic.sleepDebt
  const inflammation = gs.physiology.immune.inflammation

  if (al > 60) {
    preds.push({ stat: 'chronic.allostaticLoad', trend: 'up', confidence: Math.min(90, 50 + al), description: '稳态负荷可能继续攀升，注意选择低消耗选项' })
  } else if (al < 40) {
    preds.push({ stat: 'chronic.allostaticLoad', trend: 'down', confidence: 60, description: '恢复趋势良好，继续保持' })
  }

  if (sleepDebt > 8) {
    preds.push({ stat: 'chronic.sleepDebt', trend: 'up', confidence: 80, description: '睡眠负债过高，认知和意志力将受影响' })
  }

  if (inflammation > 50) {
    preds.push({ stat: 'immune.inflammation', trend: 'up', confidence: 70, description: '炎症水平偏高，免疫系统正在消耗额外资源' })
  }

  if (preds.length === 0) {
    preds.push({ stat: 'chronic.allostaticLoad', trend: 'stable', confidence: 50, description: '各项指标暂时平稳' })
  }

  return preds
}

// ─── 原型选择 ───
function ArchetypeSelect({ onSelect }: { onSelect: (a: Archetype) => void }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="text-center py-6">
        <div className="text-5xl mb-3">⚡</div>
        <h2 className="text-xl font-black text-white mb-1">选择你的身体</h2>
        <p className="text-sm text-gray-400 max-w-[300px] mx-auto">
          每具身体都有自己的弱点。选择最像你的那份体检报告。
        </p>
      </div>

      <div className="space-y-3">
        {ARCHETYPES.map(arch => (
          <button key={arch.id} onClick={() => onSelect(arch)}
            className="w-full text-left card p-4 hover:border-white/20 transition-all group active:scale-[0.98]">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${arch.bgClass} flex items-center justify-center text-3xl shrink-0`}>
                {arch.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-bold">{arch.id}型</span>
                  <h3 className="font-bold text-white">{arch.name}</h3>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{arch.subtitle}</p>
                <p className="text-[11px] text-gray-500 mt-2 line-clamp-3 leading-relaxed whitespace-pre-line">{arch.narrative}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                    场景：{arch.scenario}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-gray-600 group-hover:text-gray-400 mt-1" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)' }}>
        <p className="text-xs text-gray-400 leading-relaxed">
          💡 <span className="text-yellow-400 font-bold">提示</span>：你的身体不会告诉你全部真相。
          信息是不完全的，延迟的，有时是欺骗性的。学会解读信号，才能在斩杀线前刹车。
        </p>
      </div>
    </div>
  )
}

// ─── 游戏主界面（增强版：双层反馈） ───
function GamePlay({
  state, showDetails, showTip, narrativeText, delayedNotifications, choiceResult,
  physiologyHistory, onChoice, onNext, onShowTip, onShowDetails, onClearNarrative, onClearNotifications, onClearChoiceResult,
  hoveredChoice, onHoverChoice
}: {
  state: GameState
  showDetails: boolean
  showTip: string | null
  narrativeText: string | null
  delayedNotifications: string[]
  choiceResult: string | null
  physiologyHistory: any[]
  onChoice: (c: GameChoice) => void
  onNext: () => void
  onShowTip: (t: string | null) => void
  onShowDetails: (d: boolean) => void
  onClearNarrative: () => void
  onClearNotifications: () => void
  onClearChoiceResult: () => void
  hoveredChoice: number | null
  onHoverChoice: (choice: GameChoice | null, idx: number | null) => void
}) {
  const events = getEventsForDay(state.currentDay)
  const event = events[state.currentEventIdx] || events[0]
  const summary = getPhysiologySummary(state.physiology)
  const loadLevel = getLoadLevel(state.physiology.chronic.allostaticLoad)
  const week = getCurrentWeek(state.currentDay)
  const theme = getWeekTheme(week)

  // 叙事弹窗
  if (narrativeText) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'rgba(0,0,0,0.95)' }}>
        <div className="max-w-[340px] animate-fade-in">
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mb-6">{narrativeText}</p>
          <button onClick={onClearNarrative} className="btn-gold px-6 py-2.5 text-sm">
            继续下一步 →
          </button>
        </div>
      </div>
    )
  }

  // 选择效果摘要弹窗
  if (choiceResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'rgba(0,0,0,0.95)' }}>
        <div className="max-w-[340px] animate-fade-in">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-base font-bold text-white mb-3">选择效果</h3>
          <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {choiceResult.split('\n').map((line, i) => (
              <p key={i} className={`text-sm leading-relaxed ${line.includes('⚠️') ? 'text-red-400' : line.includes('✅') ? 'text-green-400' : line.includes('⏳') ? 'text-yellow-400' : 'text-gray-300'}`}>
                {line}
              </p>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-4">
            当前稳态负荷：{loadLevel.emoji} {state.physiology.chronic.allostaticLoad}/100
          </p>
          <button onClick={onClearChoiceResult} className="btn-gold px-6 py-2.5 text-sm">
            继续下一步 →
          </button>
        </div>
      </div>
    )
  }

  // 延迟效果通知
  if (delayedNotifications.length > 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'rgba(0,0,0,0.95)' }}>
        <div className="max-w-[340px] animate-fade-in">
          <div className="text-4xl mb-4">⏰</div>
          <h3 className="text-lg font-bold text-white mb-3">延迟效应显现</h3>
          {delayedNotifications.map((n, i) => (
            <div key={i} className="mb-3 p-3 rounded-xl text-left" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-xs text-gray-300 leading-relaxed">{n}</p>
            </div>
          ))}
          <button onClick={onClearNotifications} className="btn-gold px-6 py-2.5 text-sm mt-4">
            我知道了
          </button>
        </div>
      </div>
    )
  }

  // 详情面板
  if (showDetails) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">📊 生理仪表盘</h2>
          <button onClick={() => onShowDetails(false)} className="text-xs text-gray-400">关闭</button>
        </div>

        {/* 六维雷达图 */}
        <div className="flex justify-center mb-4">
          <AllostaticRadar physiology={state.physiology} history={physiologyHistory} size={260} />
        </div>

        {/* 稳态负荷总览 */}
        <div className="card p-4 mb-3" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">稳态负荷（斩杀线指数）</span>
            <span className={`text-lg font-black ${loadLevel.color}`}>{loadLevel.emoji} {state.physiology.chronic.allostaticLoad}</span>
          </div>
          <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${state.physiology.chronic.allostaticLoad}%`,
              background: state.physiology.chronic.allostaticLoad > 75
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : state.physiology.chronic.allostaticLoad > 50
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #22c55e, #16a34a)'
            }} />
          </div>
          <div className="flex justify-between text-[10px] mt-1">
            <span className="text-green-400">健康</span>
            <span className="text-yellow-400">亚健康</span>
            <span className="text-orange-400">危险</span>
            <span className="text-red-500">💀斩杀线</span>
          </div>
        </div>

        {/* 能量条 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: '意志力', value: state.willpower, icon: '🎯', color: '#8b5cf6' },
            { label: '认知能量', value: state.cognitiveEnergy, icon: '🧠', color: '#06b6d4' },
            { label: '体力能量', value: state.physicalEnergy, icon: '💪', color: '#22c55e' }
          ].map(e => (
            <div key={e.label} className="card p-2.5 text-center">
              <span className="text-lg">{e.icon}</span>
              <p className="text-lg font-black mt-1" style={{ color: e.color }}>{e.value}</p>
              <p className="text-[10px] text-gray-500">{e.label}</p>
            </div>
          ))}
        </div>

        {/* HRV 波形 */}
        <div className="mb-3">
          <HrvWaveform physiology={state.physiology} day={state.currentDay} />
        </div>

        {/* 身体热力图 */}
        <div className="mb-3">
          <BodyHeatmap physiology={state.physiology} day={state.currentDay} />
        </div>

        {/* 代谢燃料表 */}
        <div className="mb-3">
          <MetabolicGauge physiology={state.physiology} />
        </div>

        {/* 四大系统详细指标 */}
        {Object.entries(summary.systems).map(([key, sys]) => (
          <div key={key} className="card p-3 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">{sys.emoji} {sys.label}</span>
              <span className={`text-sm font-black ${getSystemStatus(sys.score).color}`}>{sys.score}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {sys.details.map((d: any) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500 flex-1">{d.name}</span>
                  <span className={`text-[10px] font-bold ${getSystemStatus(d.value, d.inverse).color}`}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 延迟效应时间线 */}
        <div className="mb-3">
          <DelayedTimeline delayedStack={state.delayedStack} currentDay={state.currentDay} physiology={state.physiology} />
        </div>

        {/* 疤痕 */}
        {state.scars.length > 0 && (
          <div className="card p-3 mt-3" style={{ borderColor: 'rgba(220,38,38,0.3)' }}>
            <h4 className="text-xs font-bold text-red-400 mb-2">💀 不可逆损伤</h4>
            {state.scars.map(s => (
              <p key={s.id} className="text-xs text-gray-400">Day {s.day}：{s.name}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 事件界面
  if (!event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-gray-400">本周事件已结束</p>
        <button onClick={onNext} className="btn-gold mt-4 px-6 py-2.5 text-sm">查看结算</button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {/* 周标题 + Day 进度条 */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{theme.emoji}</span>
          <span className="text-xs font-bold text-white">第{week}周 · {theme.title}</span>
          <span className="text-[10px] text-gray-500">{theme.subtitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => {
          const dWeek = getCurrentWeek(d)
          const isCurrent = d === state.currentDay
          const isPast = d < state.currentDay
          return (
            <div key={d} className={`px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap ${
              isCurrent ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
              isPast ? 'bg-green-500/10 text-green-500/60' : 'bg-white/5 text-gray-700'
            }`}>
              {d}
            </div>
          )
        })}
      </div>

      {/* 脉动状态栏（替换静态进度条） */}
      <PulsingStatusBar state={state} previewDeltas={null} />

      {/* 事件卡片 */}
      <div className="card overflow-hidden mb-4" style={event.isCrisis ? { borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.04)' } : undefined}>
        {/* 头部 */}
        <div className="p-4" style={{ background: event.isCrisis ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-bold">
              Day {event.day} · {event.timeOfDay}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">
              {event.scene}
            </span>
            {event.isCrisis && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold animate-pulse">
                ⚠️ 危机
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white mb-3">{event.title}</h2>

          {/* 叙事文本 */}
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mb-2">
            {event.isCrisis && event.crisisNarrative ? event.crisisNarrative : event.monologue}
          </div>
        </div>

        {/* 医疗迷雾 — 信息不确定性提示 */}
        <div className="px-4 pt-2 pb-1">
          <MedicalFog physiology={state.physiology} day={state.currentDay} />
        </div>
      </div>

      {/* 选择列表（增强版：hover预览 + 即时反馈标记） */}
      <div className="space-y-2 mb-4">
        <h3 className="text-xs font-bold text-gray-400 mb-2">你的选择：</h3>
        {event.choices.map((choice, i) => {
          const isHovered = hoveredChoice === i
          const imm = choice.effects.immediate as any
          const allostaticDelta = imm.chronic?.allostaticLoad || 0
          const isHighRisk = (state.physiology.chronic.allostaticLoad + allostaticDelta) >= 75

          return (
            <button key={i}
              onClick={() => onChoice(choice)}
              onMouseEnter={() => onHoverChoice(choice, i)}
              onMouseLeave={() => onHoverChoice(null, null)}
              className="w-full text-left card p-3.5 hover:border-white/20 active:scale-[0.98] transition-all group"
              style={isHovered ? {
                borderColor: isHighRisk ? 'rgba(239,68,68,0.4)' : 'rgba(6,182,212,0.3)',
                background: isHighRisk ? 'rgba(239,68,68,0.04)' : 'rgba(6,182,212,0.03)',
              } : undefined}
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{
                    background: isHovered ? (isHighRisk ? 'rgba(239,68,68,0.2)' : 'rgba(6,182,212,0.2)') : 'rgba(255,255,255,0.1)',
                    color: isHovered ? (isHighRisk ? '#f87171' : '#67e8f9') : '#d1d5db',
                  }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{choice.text}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">
                      意志力 -{choice.effects.willpowerCost}
                    </span>
                    {choice.effects.physicalCost > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">
                        体力 -{choice.effects.physicalCost}
                      </span>
                    )}
                    {choice.effects.cognitiveCost > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                        认知 -{choice.effects.cognitiveCost}
                      </span>
                    )}
                    {allostaticDelta !== 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${allostaticDelta > 0 ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
                        稳态负荷 {allostaticDelta > 0 ? '+' : ''}{allostaticDelta}
                      </span>
                    )}
                    {choice.effects.delayed && choice.effects.delayed.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">
                        ⏳ 延迟效应({choice.effects.delayed.length})
                      </span>
                    )}
                  </div>
                  {/* hover时显示风险指示 */}
                  {isHovered && isHighRisk && (
                    <div className="mt-2 p-1.5 rounded-lg animate-fade-in" style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.15)',
                    }}>
                      <p className="text-[9px] text-red-400">⚠️ 此选择将使稳态负荷进入危险区域</p>
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="shrink-0 text-gray-600 group-hover:text-gray-400 mt-1" />
              </div>
            </button>
          )
        })}
      </div>

      {/* 教学提示 */}
      {showTip && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => onShowTip(null)}>
          <div className="card w-full max-w-[400px] p-4 animate-slide-up" style={{ borderColor: 'rgba(255,215,0,0.2)' }}>
            <h4 className="text-xs font-bold text-yellow-400 mb-2">💡 生理知识</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{showTip}</p>
            <button onClick={() => onShowTip(null)} className="text-xs text-gray-400 mt-3">关闭</button>
          </div>
        </div>
      )}

      {/* 快捷操作 */}
      <div className="flex items-center justify-between pb-4">
        <button onClick={() => onShowDetails(true)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
          <Activity size={12} /> 查看生理详情
        </button>
        <button onClick={() => onShowTip('💡 提示：每次选择都会影响你的四大生理系统。查看生理详情可以追踪稳态负荷变化。')} className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1">
          <BookOpen size={12} /> 游戏提示
        </button>
      </div>
    </div>
  )
}

// ─── 获取周结算数据 ───
function getSettlementData(week: number): WeekSettlementType {
  switch (week) {
    case 1: return WEEK1_SETTLEMENT
    case 2: return WEEK2_SETTLEMENT
    case 3: return WEEK3_SETTLEMENT
    case 4: return WEEK4_SETTLEMENT
    default: return WEEK1_SETTLEMENT
  }
}

// ─── 周结算 ───
function WeekSettlementView({ state, onContinue, onBack }: { state: GameState; onContinue: () => void; onBack: () => void }) {
  const week = Math.min(getCurrentWeek(state.currentDay), 4)
  const isFinal = week >= 4 || state.currentDay > 28
  const s = getSettlementData(isFinal ? 4 : week)
  const loadLevel = getLoadLevel(state.physiology.chronic.allostaticLoad)
  const theme = getWeekTheme(Math.min(week, 4))

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="text-center py-6">
        <div className="text-5xl mb-3">{isFinal ? '🏆' : theme.emoji}</div>
        <h2 className="text-xl font-black text-white">{s.title}</h2>
        <p className="text-sm text-gray-400 mt-1">{isFinal ? '你的28天旅程结束了' : `第${week}周结束 · ${theme.title}`}</p>
        {state.scars.length > 0 && (
          <div className="mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
              💀 不可逆损伤：{state.scars.length}项
            </span>
          </div>
        )}
      </div>

      {/* 叙事旁白 */}
      <div className="mb-4 p-4 rounded-xl" style={{
        background: isFinal
          ? 'rgba(255,215,0,0.05)'
          : week === 3
            ? 'rgba(239,68,68,0.06)'
            : 'rgba(255,255,255,0.03)',
        borderLeft: `3px solid ${isFinal ? 'rgba(255,215,0,0.4)' : week === 3 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`
      }}>
        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          {isFinal ? '🌅' : '📖'} {isFinal ? '终章' : '本周旁白'}
        </div>
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
          {s.narrative}
        </div>
      </div>

      {/* 负荷状态 */}
      <div className="card p-4 mb-4 text-center" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <p className="text-xs text-gray-400 mb-2">稳态负荷</p>
        <p className={`text-4xl font-black ${loadLevel.color}`}>{loadLevel.emoji} {state.physiology.chronic.allostaticLoad}</p>
        <p className={`text-sm font-bold mt-1 ${loadLevel.color}`}>{loadLevel.label}</p>
      </div>

      {/* 体检指标 */}
      <div className="space-y-2 mb-4">
        <h3 className="text-xs font-bold text-gray-400">📊 体检报告</h3>
        {s.metrics.map((m, i) => (
          <div key={i} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{m.name}</span>
              <span className="text-sm font-bold text-yellow-400">{m.value}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{m.context}</p>
          </div>
        ))}
      </div>

      {/* 身体状态（status 字段） */}
      <div className="mb-4 p-4 rounded-xl" style={{
        background: week >= 3 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${week >= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)'}`
      }}>
        <h3 className="text-xs font-bold text-gray-400 mb-2">🔬 身体状态评估</h3>
        <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{s.status}</div>
      </div>

      {/* 策略选择 */}
      {!isFinal && (
        <div className="space-y-2 mb-4">
          <h3 className="text-xs font-bold text-gray-400">⚡ 下周生存策略</h3>
          {s.strategies.map((strat, i) => (
            <div key={i} className="card p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">{strat.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{strat.diff}</span>
              </div>
              <p className="text-[11px] text-gray-400">{strat.desc}</p>
              <p className="text-[10px] text-yellow-400 mt-1">预期：{strat.effect}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <button onClick={onContinue} className="btn-gold w-full py-3 text-sm font-bold">
          {isFinal ? '查看结局 →' : `继续 Week ${week + 1} →`}
        </button>
        <button onClick={onBack} className="w-full py-2.5 text-sm text-gray-400 rounded-xl border border-white/10">
          返回游戏列表
        </button>
      </div>
    </div>
  )
}

// ─── 游戏结束 / 最终结局 ───
function GameOverView({ state, onRestart, onBack, onEnterChronic }: {
  state: GameState; onRestart: () => void; onBack: () => void; onEnterChronic: () => void
}) {
  const survived = state.currentDay >= 28 && !state.isGameOver
  const scars = state.scars
  const loadLevel = getLoadLevel(state.physiology.chronic.allostaticLoad)

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="text-center py-6">
        <div className="text-6xl mb-4">{survived ? '🌅' : '💀'}</div>
        <h2 className="text-2xl font-black mb-2" style={{ color: survived ? '#22c55e' : '#ef4444' }}>
          {survived ? '你活下来了' : '生理极限突破'}
        </h2>
        <p className="text-sm text-gray-400 max-w-[300px] mx-auto leading-relaxed">
          {state.gameOverReason || (survived
            ? '28天的旅程结束了。你的身体被永久改写，但你还在这里。'
            : '稳态负荷突破极限，身体全面崩溃。')}
        </p>
        <p className="text-xs text-gray-500 mt-2">存活天数：Day {state.currentDay}</p>
      </div>

      {/* 最终生理状态 */}
      <div className="card p-4 mb-3 text-center">
        <p className="text-xs text-gray-400 mb-1">最终稳态负荷</p>
        <p className={`text-3xl font-black ${loadLevel.color}`}>{loadLevel.emoji} {state.physiology.chronic.allostaticLoad}/100</p>
      </div>

      {/* 不可逆损伤 */}
      {scars.length > 0 && (
        <div className="card p-3 mb-3" style={{ borderColor: 'rgba(220,38,38,0.3)' }}>
          <h4 className="text-xs font-bold text-red-400 mb-2">💀 不可逆损伤（{scars.length}项）</h4>
          {scars.map(s => (
            <div key={s.id} className="mb-2">
              <p className="text-xs font-bold text-white">{s.name}</p>
              <p className="text-[10px] text-gray-400">{s.description}</p>
              <p className="text-[10px] text-gray-600">发生在 Day {s.day}</p>
            </div>
          ))}
        </div>
      )}

      {/* 教育意义 */}
      <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)' }}>
        <h4 className="text-xs font-bold text-yellow-400 mb-2">💡 你在游戏中学到的</h4>
        <div className="space-y-1.5">
          {[
            '健康不是状态，是选择的累积',
            '延迟效应意味着"现在没事≠真的没事"',
            '身体的"适应"可能是欺骗',
            '社会压力是最隐蔽的生理杀手',
            '最危险的时刻不是崩溃，而是你觉得"还行"的时候'
          ].map((tip, i) => (
            <p key={i} className="text-[11px] text-gray-300 leading-relaxed">• {tip}</p>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {survived && (
          <button onClick={onEnterChronic}
            className="w-full py-3 text-sm font-bold rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: '#fff',
              border: '1px solid rgba(124,58,237,0.5)'
            }}>
            🏥 进入慢性生存模式
          </button>
        )}
        <button onClick={onRestart} className="btn-gold w-full py-3 text-sm font-bold">
          🔄 用学到的知识重新挑战
        </button>
        <button onClick={onBack} className="w-full py-2.5 text-sm text-gray-400 rounded-xl border border-white/10">
          返回游戏列表
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 慢性生存主界面（含医疗导航/职场/季度分支）
// ═══════════════════════════════════════════════════════════
function ChronicGamePlay({
  state, eventIdx, narrative, showMeds, subPanel,
  onChoice, onMedSelect, onClearNarrative, onToggleMeds, onSetSubPanel,
  onAppointments, onInsurance, onWorkplace, onBranch, onShowDetails
}: {
  state: GameState
  eventIdx: number
  narrative: string | null
  showMeds: boolean
  subPanel: 'none' | 'appointments' | 'insurance' | 'workplace' | 'branch'
  onChoice: (c: ChronicChoice) => void
  onMedSelect: (ids: string[]) => void
  onClearNarrative: () => void
  onToggleMeds: () => void
  onSetSubPanel: (p: 'none' | 'appointments' | 'insurance' | 'workplace' | 'branch') => void
  onAppointments: (ids: string[]) => void
  onInsurance: (d: InsuranceDecision) => void
  onWorkplace: (d: WorkplaceDecision) => void
  onBranch: (b: QuarterlyBranch) => void
  onShowDetails: (d: boolean) => void
}) {
  const chronic = state.chronic!
  const theme = getChronicTheme(chronic.month)
  const weekTheme = getChronicWeekTheme(chronic.weekInMonth)
  const identityEffect = getIdentityEffects(chronic.identityStage)
  const loadLevel = getLoadLevel(state.physiology.chronic.allostaticLoad)

  const isTransition = chronic.month <= 0 || (chronic.month === 1 && chronic.weekInMonth <= 1 && eventIdx < TRANSITION_EVENTS.length)
  const allEvents = isTransition ? TRANSITION_EVENTS : getChronicEventsForWeek(chronic.weekInMonth)
  const event = allEvents[eventIdx % allEvents.length]

  if (narrative) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'rgba(0,0,0,0.95)' }}>
        <div className="max-w-[340px] animate-fade-in">
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mb-6">{narrative}</p>
          <button onClick={onClearNarrative} className="btn-gold px-6 py-2.5 text-sm">
            继续下一步 →
          </button>
        </div>
      </div>
    )
  }

  if (showMeds) {
    return <MedManagementPanel chronic={chronic} onSelect={onMedSelect} onClose={onToggleMeds} identityEffect={identityEffect} />
  }

  // ─── 子面板路由 ───
  if (subPanel === 'appointments') {
    return <AppointmentPanel chronic={chronic} onSubmit={onAppointments} onClose={() => onSetSubPanel('none')} />
  }
  if (subPanel === 'insurance') {
    return <InsurancePanel month={chronic.month} onSelect={onInsurance} onClose={() => onSetSubPanel('none')} />
  }
  if (subPanel === 'workplace') {
    return <WorkplacePanel state={state} onSelect={onWorkplace} onClose={() => onSetSubPanel('none')} />
  }
  if (subPanel === 'branch') {
    return <QuarterlyBranchPanel state={state} onSelect={onBranch} onClose={() => onSetSubPanel('none')} />
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{theme.emoji}</span>
          <span className="text-xs font-bold text-white">月{chronic.month} · {theme.title}</span>
          <span className="text-[10px] text-gray-500">{theme.quarter}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
            第{chronic.weekInMonth}周 · {weekTheme.title}
          </span>
          <span className="text-[10px] text-gray-500">{weekTheme.focus}</span>
        </div>
      </div>

      <ChronicDashboard state={state} compact />

      {/* 脉动状态栏（替换慢性模式的静态进度条） */}
      <PulsingStatusBar state={state} previewDeltas={null} />

      <div className="card p-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-violet-400">
            {chronic.identityStage === 'denial' ? '🙈 否认' :
             chronic.identityStage === 'anger' ? '😡 愤怒' :
             chronic.identityStage === 'bargaining' ? '🤝 讨价还价' :
             chronic.identityStage === 'depression' ? '🌧️ 抑郁' : '✅ 接受'}
          </span>
          <span className="text-[10px] text-gray-500">
            依从率 {chronic.cumulativeAdherence}% · 专家病人 Lv.{chronic.expertPatientLevel}
          </span>
        </div>
      </div>

      {event && (
        <div className="card overflow-hidden mb-4" style={{
          borderColor: event.category === 'crisis' ? 'rgba(239,68,68,0.4)' : 'rgba(124,58,237,0.2)',
          background: event.category === 'crisis' ? 'rgba(239,68,68,0.04)' : 'rgba(124,58,237,0.02)'
        }}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-bold">
                {event.category === 'medication' ? '💊 药物' :
                 event.category === 'healthcare' ? '🏥 医疗' :
                 event.category === 'workplace' ? '💼 职场' :
                 event.category === 'social' ? '👥 社交' :
                 event.category === 'existential' ? '💭 存在' :
                 event.category === 'crisis' ? '⚠️ 危机' : '📋'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{event.scene}</span>
              {event.category === 'crisis' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold animate-pulse">
                  ⚠️ 急性发作
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mb-3">{event.title}</h2>
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {event.narrative}
            </div>
          </div>
        </div>
      )}

      {event && (
        <div className="space-y-2 mb-4">
          <h3 className="text-xs font-bold text-gray-400 mb-2">你的选择：</h3>
          {event.choices.map((choice, i) => (
            <button key={i} onClick={() => onChoice(choice)}
              className="w-full text-left card p-3.5 hover:border-white/20 active:scale-[0.98] transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0 mt-0.5">
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">{choice.text}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 inline-block mt-1">
                    意志力 -{choice.effects.willpowerCost}
                  </span>
                </div>
                <ChevronRight size={16} className="shrink-0 text-gray-600 group-hover:text-gray-400 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 快捷操作栏 */}
      <div className="space-y-2 pb-4">
        {/* 第一行：药物 + 预约 */}
        <div className="flex gap-2">
          <button onClick={onToggleMeds} className="flex-1 text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center justify-center gap-1 py-2 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
            💊 药物
          </button>
          <button onClick={() => onSetSubPanel('appointments')} className="flex-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1 py-2 rounded-xl"
            style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
            🏥 预约
          </button>
          <button onClick={() => onSetSubPanel('insurance')} className="flex-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors flex items-center justify-center gap-1 py-2 rounded-xl"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
            💰 医保
          </button>
        </div>
        {/* 第二行：职场 + 季度分支 + 详情 */}
        <div className="flex gap-2">
          <button onClick={() => onSetSubPanel('workplace')} className="flex-1 text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1 py-2 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            💼 职场
          </button>
          {getQuarterlyBranchOptions(state).length > 0 && (
            <button onClick={() => onSetSubPanel('branch')} className="flex-1 text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-1 py-2 rounded-xl animate-pulse"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
              🔀 人生抉择
            </button>
          )}
          <button onClick={() => onShowDetails(true)} className="flex-1 text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center gap-1 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Activity size={12} /> 详情
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 药物管理面板 ───
function MedManagementPanel({ chronic, onSelect, onClose, identityEffect }: {
  chronic: any; onSelect: (ids: string[]) => void; onClose: () => void; identityEffect: { desc: string }
}) {
  const [selectedMeds, setSelectedMeds] = useState<string[]>(chronic.medications.map((m: any) => m.id))
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">💊 今日药物管理</h2>
        <button onClick={onClose} className="text-xs text-gray-400">关闭</button>
      </div>
      <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <p className="text-[10px] text-violet-400 mb-1">身份阶段影响</p>
        <p className="text-xs text-gray-300">{identityEffect.desc}</p>
      </div>
      {chronic.medications.map((med: any) => (
        <div key={med.id} className="card p-3 mb-2 cursor-pointer active:scale-[0.98] transition-all"
          style={{ borderColor: selectedMeds.includes(med.id) ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)' }}
          onClick={() => setSelectedMeds(prev => prev.includes(med.id) ? prev.filter(id => id !== med.id) : [...prev, med.id])}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-white">{selectedMeds.includes(med.id) ? '✅' : '❌'} {med.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{med.schedule}</span>
          </div>
          <p className="text-[10px] text-gray-400">{med.dose} · {med.adherenceEffect}</p>
          <p className="text-[10px] text-yellow-600 mt-1">跳过后果：{med.skipConsequence}</p>
          {med.sideEffects.immediate && <p className="text-[10px] text-orange-400 mt-0.5">副作用：{med.sideEffects.immediate}</p>}
        </div>
      ))}
      <button onClick={() => onSelect(selectedMeds)} className="btn-gold w-full py-3 text-sm font-bold mt-4">
        确认服药方案（{selectedMeds.length}/{chronic.medications.length}）
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 慢性月度结算
// ═══════════════════════════════════════════════════════════
function ChronicMonthSettlementView({ state, onContinue, onBack }: {
  state: GameState; onContinue: () => void; onBack: () => void
}) {
  const audit = generateMonthAudit(state)
  const chronic = state.chronic!
  const theme = getChronicTheme(chronic.month)
  const trendIcon = (t: string) => t === 'improving' ? '📈' : t === 'stable' ? '➡️' : '📉'
  const trendColor = (t: string) => t === 'improving' ? 'text-green-400' : t === 'stable' ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="text-center py-6">
        <div className="text-5xl mb-3">{theme.emoji}</div>
        <h2 className="text-xl font-black text-white">{audit.title}</h2>
        <p className="text-sm text-gray-400 mt-1">第{audit.month}个月结算</p>
      </div>

      <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.05)', borderLeft: '3px solid rgba(124,58,237,0.4)' }}>
        <div className="text-xs text-gray-500 mb-2">📖 月度旁白</div>
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{audit.narrative}</div>
      </div>

      <div className="space-y-2 mb-4">
        <h3 className="text-xs font-bold text-gray-400">📊 月度审计</h3>
        {audit.auditItems.map((item, i) => (
          <div key={i} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">
                {item.category === 'physiological' ? '🔬' : item.category === 'financial' ? '💰' : item.category === 'social' ? '👥' : '💭'} {item.label}
              </span>
              <span className={`text-xs font-bold ${trendColor(item.trend)}`}>{trendIcon(item.trend)} {item.trend === 'improving' ? '改善' : item.trend === 'stable' ? '平稳' : '恶化'}</span>
            </div>
            <p className="text-xs text-gray-300">{item.value}</p>
            <p className="text-[10px] text-gray-500 mt-1">{item.comment}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        <h3 className="text-xs font-bold text-gray-400">⚡ 下月策略</h3>
        {audit.strategyOptions.map((opt, i) => (
          <div key={i} className="card p-3">
            <span className="text-sm font-bold text-white">{opt.name}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
            <p className="text-[10px] text-violet-400 mt-1">成本：{opt.cost}</p>
            <p className="text-[10px] text-cyan-400">预期：{opt.effect}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <button onClick={onContinue} className="w-full py-3 text-sm font-bold rounded-xl"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff' }}>
          继续第{chronic.month}个月 →
        </button>
        <button onClick={onBack} className="w-full py-2.5 text-sm text-gray-400 rounded-xl border border-white/10">
          返回游戏列表
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 慢性终局
// ═══════════════════════════════════════════════════════════
function ChronicEndgameView({ state, narrative, onRestart, onBack }: {
  state: GameState; narrative: string | null; onRestart: () => void; onBack: () => void
}) {
  const endgame = state.chronic ? evaluateEndgameFull(state) : null
  const chronic = state.chronic!
  const isMiracle = endgame && 'isMiracle' in endgame && endgame.isMiracle

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="text-center py-6">
        <div className="text-6xl mb-4">{isMiracle ? '✨' : '🌅'}</div>
        <h2 className="text-2xl font-black text-white mb-2">{endgame?.name || '慢性生存 · 终章'}</h2>
        <p className="text-sm text-gray-400 max-w-[320px] mx-auto leading-relaxed">{endgame?.condition || `${chronic.month}个月的旅程`}</p>
        {isMiracle && (
          <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full animate-pulse"
            style={{ background: 'rgba(255,215,0,0.15)', color: '#fbbf24', border: '1px solid rgba(255,215,0,0.3)' }}>
            ✨ 极稀有结局 — 仅10%概率触发
          </span>
        )}
      </div>

      <div className="mb-4 p-4 rounded-xl" style={{
        background: isMiracle ? 'rgba(255,215,0,0.06)' : 'rgba(255,215,0,0.04)',
        border: `1px solid ${isMiracle ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.1)'}`
      }}>
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
          {narrative || endgame?.narrative || '你的慢性生存旅程结束了。'}
        </div>
      </div>

      {endgame && (
        <div className="card p-3 mb-3">
          <p className="text-xs text-gray-400 mb-1">终局指标</p>
          <p className="text-sm text-white">{endgame.metric}</p>
          <p className="text-[11px] text-gray-400 mt-1">{endgame.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="card p-2.5 text-center">
          <p className="text-lg font-black text-violet-400">{chronic.month}</p>
          <p className="text-[10px] text-gray-500">存活月数</p>
        </div>
        <div className="card p-2.5 text-center">
          <p className="text-lg font-black text-cyan-400">{chronic.cumulativeAdherence}%</p>
          <p className="text-[10px] text-gray-500">总依从率</p>
        </div>
        <div className="card p-2.5 text-center">
          <p className="text-lg font-black text-red-400">{chronic.crisisCount}</p>
          <p className="text-[10px] text-gray-500">急性发作</p>
        </div>
        <div className="card p-2.5 text-center">
          <p className="text-lg font-black text-yellow-400">¥{(chronic.resources.medicalDebt / 10000).toFixed(1)}万</p>
          <p className="text-[10px] text-gray-500">医疗债务</p>
        </div>
      </div>

      {/* 季度分支标识 */}
      {chronic.quarterlyBranch && (
        <div className="card p-3 mb-3" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
          <p className="text-xs text-amber-400 mb-1">🔀 叙事分支</p>
          <p className="text-sm text-white">
            {chronic.quarterlyBranch === 'optimization' ? '🧬 生物黑客' :
             chronic.quarterlyBranch === 'palliative' ? '🌿 姑息智慧' : '📢 倡导者之路'}
          </p>
        </div>
      )}

      <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <h4 className="text-xs font-bold text-violet-400 mb-2">💭 慢性生存教会你的</h4>
        <div className="space-y-1.5">
          {['慢性病不是"坏掉的机器"，是被重新定义的生活', '依从性不是服从，是与身体谈判的艺术', '医疗系统是碎片化的，你是唯一的整合者', '意义不是找到的，是在痛苦中建构的', '稳定不是终点，而是一种持续的、需要劳动的平衡'].map((tip, i) => (
            <p key={i} className="text-[11px] text-gray-300 leading-relaxed">• {tip}</p>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={onRestart} className="btn-gold w-full py-3 text-sm font-bold">🔄 重新开始</button>
        <button onClick={onBack} className="w-full py-2.5 text-sm text-gray-400 rounded-xl border border-white/10">返回游戏列表</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 预约管理面板
// ═══════════════════════════════════════════════════════════
function AppointmentPanel({ chronic, onSubmit, onClose }: {
  chronic: any; onSubmit: (ids: string[]) => void; onClose: () => void
}) {
  const [selected, setSelected] = useState<string[]>(chronic.appointments.map((a: any) => a.id))
  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">🏥 本月预约管理</h2>
        <button onClick={onClose} className="text-xs text-gray-400">关闭</button>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        选择本月要去复查的科室。每个科室都有时间和经济成本，但跳过会增加风险。
      </p>
      {chronic.appointments.map((appt: any) => {
        const isSelected = selected.includes(appt.id)
        const cost = appt.id === 'psych' ? 400 : appt.id === 'nutrition' ? 200 : 600
        return (
          <div key={appt.id} className="card p-3 mb-2 cursor-pointer active:scale-[0.98] transition-all"
            style={{ borderColor: isSelected ? 'rgba(6,182,212,0.3)' : appt.missedCount >= 2 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)' }}
            onClick={() => toggle(appt.id)}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">{isSelected ? '✅' : '❌'} {appt.dept}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{appt.frequency}</span>
            </div>
            <p className="text-[10px] text-gray-400">冲突：{appt.conflict}</p>
            <p className="text-[10px] text-cyan-400 mt-0.5">费用：¥{cost}</p>
            {appt.missedCount > 0 && (
              <p className="text-[10px] text-red-400 mt-0.5">⚠️ 已连续{appt.missedCount}次未复查</p>
            )}
          </div>
        )
      })}
      <button onClick={() => onSubmit(selected)} className="btn-gold w-full py-3 text-sm font-bold mt-4">
        确认预约方案（{selected.length}/{chronic.appointments.length}）
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 医保决策面板
// ═══════════════════════════════════════════════════════════
function InsurancePanel({ month, onSelect, onClose }: {
  month: number; onSelect: (d: InsuranceDecision) => void; onClose: () => void
}) {
  const options = getInsuranceOptions(month)

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">💰 医保决策</h2>
        <button onClick={onClose} className="text-xs text-gray-400">关闭</button>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        医疗开支的压力让你不得不考虑灰色地带。每个选择都有省下的钱，但也有风险。
      </p>
      <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
        <p className="text-[10px] text-yellow-400">⚠️ 当前可选 {options.length} 项策略（月{month}解锁）</p>
      </div>
      {options.map((opt) => (
        <div key={opt.type} className="card p-3 mb-2 cursor-pointer active:scale-[0.98] transition-all hover:border-white/20"
          onClick={() => onSelect(opt)}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-white">{opt.label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
              background: opt.riskLevel > 6 ? 'rgba(239,68,68,0.15)' : opt.riskLevel > 3 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
              color: opt.riskLevel > 6 ? '#f87171' : opt.riskLevel > 3 ? '#fbbf24' : '#4ade80'
            }}>
              风险 {opt.riskLevel}/10
            </span>
          </div>
          <p className="text-[11px] text-gray-400">{opt.description}</p>
          <p className="text-[10px] text-green-400 mt-1">季度节省：¥{opt.costSave * 3}</p>
        </div>
      ))}
      <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 rounded-xl border border-white/10 mt-2">
        暂不选择
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 职场管理面板
// ═══════════════════════════════════════════════════════════
function WorkplacePanel({ state, onSelect, onClose }: {
  state: GameState; onSelect: (d: WorkplaceDecision) => void; onClose: () => void
}) {
  const options = getWorkplaceOptions(state)

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">💼 职场决策</h2>
        <button onClick={onClose} className="text-xs text-gray-400">关闭</button>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        疾病正在影响你的工作。你需要做出选择：隐瞒、公开、还是请求便利。
      </p>
      <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p className="text-[10px] text-blue-400">
          当前公开程度：{state.chronic?.resources.disclosureLevel === 'hidden' ? '🔒 完全隐瞒' :
            state.chronic?.resources.disclosureLevel === 'partial' ? '🔓 部分公开' : '👁️ 已完全公开'}
        </p>
      </div>
      {options.map((opt, i) => (
        <div key={i} className="card p-3 mb-2 cursor-pointer active:scale-[0.98] transition-all hover:border-white/20"
          onClick={() => onSelect(opt)}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-white">{opt.label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
              意志力 -{opt.willpowerCost}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{opt.narrative}</p>
          <div className="flex gap-3 mt-1.5">
            {opt.effects.workPerformance !== 0 && (
              <span className={`text-[10px] ${opt.effects.workPerformance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                绩效 {opt.effects.workPerformance > 0 ? '+' : ''}{opt.effects.workPerformance}
              </span>
            )}
            {opt.effects.relationshipCapital !== 0 && (
              <span className={`text-[10px] ${opt.effects.relationshipCapital > 0 ? 'text-green-400' : 'text-red-400'}`}>
                关系 {opt.effects.relationshipCapital > 0 ? '+' : ''}{opt.effects.relationshipCapital}
              </span>
            )}
            {opt.effects.monthlyIncome !== 0 && (
              <span className={`text-[10px] ${opt.effects.monthlyIncome > 0 ? 'text-green-400' : 'text-red-400'}`}>
                收入 {opt.effects.monthlyIncome > 0 ? '+' : ''}¥{Math.abs(opt.effects.monthlyIncome)}
              </span>
            )}
          </div>
        </div>
      ))}
      <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 rounded-xl border border-white/10 mt-2">
        暂不做决定
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 季度叙事分支选择面板
// ═══════════════════════════════════════════════════════════
function QuarterlyBranchPanel({ state, onSelect, onClose }: {
  state: GameState; onSelect: (b: QuarterlyBranch) => void; onClose: () => void
}) {
  const options = getQuarterlyBranchOptions(state)

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">🔀 人生抉择</h2>
        <button onClick={onClose} className="text-xs text-gray-400">关闭</button>
      </div>
      <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <p className="text-sm text-amber-300 font-bold mb-2">半年的慢性生活让你走到了一个分叉口。</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          你不再只是"应对"疾病。你可以选择一种新的与身体共处的方式。
          <br />这个选择将影响你接下来的全部旅程。
        </p>
      </div>
      {options.map((opt) => (
        <div key={opt.branch} className="card p-4 mb-3 cursor-pointer active:scale-[0.98] transition-all hover:border-white/20"
          onClick={() => onSelect(opt.branch)}
          style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-white">{opt.label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
              需要：{opt.requirement}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed mb-2">{opt.desc}</p>
          <div className="flex gap-3">
            <span className={`text-[10px] ${opt.effects.meaningScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
              意义感 {opt.effects.meaningScore > 0 ? '+' : ''}{opt.effects.meaningScore}
            </span>
            <span className={`text-[10px] ${opt.effects.allostaticDelta > 0 ? 'text-red-400' : opt.effects.allostaticDelta < 0 ? 'text-green-400' : 'text-gray-400'}`}>
              稳态负荷 {opt.effects.allostaticDelta > 0 ? '+' : ''}{opt.effects.allostaticDelta}
            </span>
          </div>
        </div>
      ))}
      <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 rounded-xl border border-white/10 mt-2">
        暂不做选择
      </button>
    </div>
  )
}
