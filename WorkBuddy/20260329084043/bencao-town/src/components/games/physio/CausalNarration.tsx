'use client'

// ═══════════════════════════════════════════════════════════
// CausalNarration v2 - 认知锚定·因果叙述系统
// 
// 核心设计理念：
// 1. 每次重要生理变化都生成叙述（不仅 allostaticLoad）
// 2. 跨指标因果链（sleep debt → willpower → poor choice）
// 3. 前3次强制显示，之后可关闭
// 4. 支持叙述历史回顾
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react'
import type { CausalNarration } from './FeedbackSystem'

// ─── 完整指标名称映射 ───
const STAT_LABELS: Record<string, string> = {
  'metabolic.insulinSensitivity': '胰岛素敏感性',
  'metabolic.mitochondrialHealth': '线粒体健康',
  'metabolic.adiposity': '脂肪蓄积',
  'metabolic.glucoseStability': '血糖稳定性',
  'cardio.vascularElasticity': '血管弹性',
  'cardio.cardiacReserve': '心脏储备',
  'cardio.autonomicBalance': '自主神经平衡',
  'cardio.bloodPressureLoad': '血压负荷',
  'immune.inflammation': '炎症水平',
  'immune.immuneCompetence': '免疫力',
  'immune.gutIntegrity': '肠道完整性',
  'immune.autoimmunityRisk': '自身免疫风险',
  'neural.hpaRegulation': 'HPA轴调节',
  'neural.neuroplasticity': '神经可塑性',
  'neural.circadianStrength': '昼夜节律',
  'neural.cognitiveReserve': '认知储备',
  'chronic.allostaticLoad': '稳态负荷',
  'chronic.oxidativeStress': '氧化应激',
  'chronic.glycationEndProducts': '糖基化终产物',
  'chronic.sleepPressure': '睡眠压力',
  'chronic.sleepDebt': '睡眠负债',
  'willpower': '意志力',
}

// ─── 指标是否为"越低越好" ───
const NEGATIVE_STATS = new Set([
  'metabolic.adiposity', 'immune.inflammation', 'immune.autoimmunityRisk',
  'chronic.allostaticLoad', 'chronic.oxidativeStress', 'chronic.glycationEndProducts',
  'chronic.sleepPressure', 'chronic.sleepDebt', 'cardio.bloodPressureLoad',
])

// ═══════════════════════════════════════════════════════════
// 完整机制解释库（22指标 × 升/降 = 44条）
// ═══════════════════════════════════════════════════════════

interface MechEntry {
  up: string    // 数值升高时
  down: string  // 数值降低时
  icon: string
  chains?: string[]  // 跨指标因果链
}

const MECHANISM_DB: Record<string, MechEntry> = {
  'metabolic.insulinSensitivity': {
    up: '细胞对胰岛素的响应改善，葡萄糖能更高效地进入细胞转化为能量。这是代谢健康恢复的核心信号。',
    down: '胰岛素抵抗加剧——细胞对胰岛素的"敲门"充耳不闻，血糖无处可去，胰腺只能分泌更多胰岛素。这是2型糖尿病的起步价。',
    icon: '🔬',
    chains: ['↑血糖波动', '↑脂肪蓄积', '↑炎症水平'],
  },
  'metabolic.mitochondrialHealth': {
    up: '线粒体是细胞的"发电厂"。效率提升意味着每个细胞都能产生更多ATP能量，你的身体不再时刻处于"低电量"状态。',
    down: '线粒体功能退化 = 细胞能量工厂罢工。你感到的疲劳不是"懒"，是每个细胞真的在缺氧运转。长期损伤可导致代谢综合征。',
    icon: '⚡',
    chains: ['↑氧化应激', '↓认知储备', '↑脂肪蓄积'],
  },
  'metabolic.adiposity': {
    up: '脂肪组织增加不仅是外观变化。内脏脂肪会释放促炎因子（TNF-α、IL-6），把整个身体推向慢性炎症状态。你的"肚腩"正在内分泌战争的前线。',
    down: '脂肪减少减轻了全身的炎症负担。每减少1kg内脏脂肪，炎症因子下降约5-10%。身体正在从"战时状态"退出。',
    icon: '🍖',
    chains: ['↓炎症水平', '↑胰岛素敏感性', '↓血压负荷'],
  },
  'metabolic.glucoseStability': {
    up: '血糖趋于稳定。稳定的血糖意味着稳定的能量供应、稳定的情绪、以及……不那么频繁的"饿怒"。',
    down: '血糖像过山车一样剧烈波动。每次飙升后必有一次暴跌，暴跌触发肾上腺素释放——这就是你手抖、心慌、暴躁的原因。每一次波动都在损耗胰岛β细胞。',
    icon: '🍬',
    chains: ['↓胰岛素敏感性', '↑糖基化终产物', '↑氧化应激'],
  },
  'cardio.vascularElasticity': {
    up: '血管弹性恢复意味着心脏泵血更省力。这就像从生锈的水管换成了新管道——水压更稳定，系统更持久。',
    down: '血管壁正在硬化。这不是一天造成的——高血糖、高炎症、高血压日复一日地损伤血管内膜。最终结果是：心脑血管事件的倒计时。',
    icon: '❤️',
    chains: ['↑血压负荷', '↓心脏储备', '↑氧化应激'],
  },
  'cardio.cardiacReserve': {
    up: '心脏储备提升 = 紧急时刻有更多"备用马力"。爬楼梯不再气喘吁吁，因为心脏能在需要时输出更多血液。',
    down: '心脏储备下降意味着心脏已经接近满负荷运转。日常生活中可能不觉得，但任何额外压力（生病、加班、情绪波动）都可能让心脏"过载"。',
    icon: '💓',
    chains: ['↓自主神经平衡', '↑稳态负荷'],
  },
  'cardio.autonomicBalance': {
    up: '交感神经（油门）和副交感神经（刹车）的平衡恢复。你的身体不再时刻处于"战斗或逃跑"模式。',
    down: '自主神经系统失衡 = 身体一直踩着油门。交感神经持续亢奋，心率变异性下降，身体无法进入"修复模式"。',
    icon: '⚖️',
    chains: ['↑血压负荷', '↑稳态负荷', '↓睡眠质量'],
  },
  'cardio.bloodPressureLoad': {
    up: '血压负荷增加，血管壁承受的压力增大。长期高血压会损伤心、脑、肾三大靶器官。这不是"有点高"，是在透支器官寿命。',
    down: '血压负荷下降，心脑血管系统的压力减轻。这是对心脏和大脑最直接的保护。',
    icon: '🩸',
    chains: ['↓血管弹性', '↑心脏储备消耗'],
  },
  'immune.inflammation': {
    up: '炎症水平飙升。慢性炎症是"沉默的杀手"——它不像急性炎症那样红肿热痛，但每分每秒都在损伤你的血管、关节和器官。C反应蛋白正在上升。',
    down: '炎症消退是好消息！血管内膜的损伤开始修复，免疫系统能把资源从"灭火"转向"巡逻"。但如果根源未除，它会再次攀升。',
    icon: '🔥',
    chains: ['↓血管弹性', '↓胰岛素敏感性', '↑氧化应激', '↑自身免疫风险'],
  },
  'immune.immuneCompetence': {
    up: '免疫力提升意味着你的身体更能识别和清除异常细胞。T细胞、NK细胞的"战斗力"正在恢复。',
    down: '免疫防线正在出现漏洞。高压力、差睡眠、差营养共同削弱了你的免疫监视系统。下一个感冒可能来得比预期快。',
    icon: '🛡️',
    chains: ['↑感染风险', '↑炎症水平'],
  },
  'immune.gutIntegrity': {
    up: '肠道屏障修复。这意味着肠道内的毒素和未消化食物颗粒不再大量渗漏到血液中。"肠漏"正在愈合。',
    down: '肠道屏障受损——"肠漏"加剧。细菌内毒素（LPS）渗入血液，触发全身炎症反应。你的消化不适只是冰山一角。',
    icon: '🦠',
    chains: ['↑炎症水平', '↑自身免疫风险', '↓免疫力'],
  },
  'immune.autoimmunityRisk': {
    up: '自身免疫风险上升——免疫系统开始"敌我不分"，可能攻击自身组织。遗传因素加载了子弹，环境压力扣动了扳机。',
    down: '自身免疫风险降低。免疫耐受性增强，身体不再把自身组织误认为外来入侵者。',
    icon: '🎯',
    chains: ['↑组织损伤', '↓免疫力', '↑炎症'],
  },
  'neural.hpaRegulation': {
    up: 'HPA轴（下丘脑-垂体-肾上腺轴）调节能力恢复。皮质醇恢复正常的昼夜节律：早晨高峰让你清醒，傍晚低谷让你入睡。',
    down: 'HPA轴失调 = 皮质醇失控。你可能白天昏昏沉沉（皮质醇该高时不高），夜晚辗转难眠（皮质醇该低时居高不下）。这是"过劳"的神经生物学本质。',
    icon: '🧠',
    chains: ['↑睡眠负债', '↓认知储备', '↑稳态负荷', '↓意志力'],
  },
  'neural.neuroplasticity': {
    up: '神经可塑性提升 = 大脑能更快学习、适应和重组。新的神经连接正在形成，就像森林里开出新的小路。',
    down: '神经可塑性下降意味着大脑的"学习能力"在萎缩。这不是变笨——是大脑在能量不足时的节能策略，把资源从"探索"转向"生存"。',
    icon: '🌱',
    chains: ['↓认知储备', '↓情绪调节'],
  },
  'neural.circadianStrength': {
    up: '昼夜节律增强——你的身体重新找回了"什么时候该做什么"的节奏。睡眠质量、消化效率、认知表现都在改善。',
    down: '昼夜节律紊乱 = 身体的"时钟"被打碎。褪黑素分泌混乱，皮质醇节律颠倒。你以为自己只是"作息不规律"，实际上每个细胞都在困惑"现在到底是白天还是黑夜？"',
    icon: '🌙',
    chains: ['↑睡眠负债', '↓HPA轴调节', '↑炎症水平'],
  },
  'neural.cognitiveReserve': {
    up: '认知储备增加 = 大脑有了更多"缓冲区"。面对压力、疲劳或疾病时，你有更多的脑力资源来维持正常运转。',
    down: '认知储备正在被消耗。你会发现注意力难以集中、记忆力下降、决策速度变慢。这不是"变老了"——是你的大脑在资源匮乏时的降级运行。',
    icon: '💡',
    chains: ['↓决策质量', '↓意志力', '↑失误风险'],
  },
  'chronic.allostaticLoad': {
    up: '稳态负荷上升——你的身体正在超负荷运转。就像一台同时运行20个程序的老电脑：还没崩溃，但每多开一个程序都更接近死机。长期维持在这个水平会导致系统崩溃。',
    down: '稳态负荷下降说明身体获得了一定的恢复空间。但累积的损伤不会完全消失——就像反复折叠的纸张，折痕永远存在。',
    icon: '📊',
    chains: ['↓所有系统效率', '↑慢性病风险'],
  },
  'chronic.oxidativeStress': {
    up: '氧化应激加剧 = 自由基正在疯狂攻击你的细胞膜、DNA和蛋白质。这就像身体内部的"生锈"过程。抗氧化系统正在被消耗殆尽。',
    down: '氧化应激降低意味着抗氧化系统重新占据上风。维生素C、E、谷胱甘肽等"防锈剂"正在修复受损的细胞结构。',
    icon: '⚡',
    chains: ['↓线粒体健康', '↑炎症', '加速老化'],
  },
  'chronic.glycationEndProducts': {
    up: '糖基化终产物（AGEs）累积——多余的糖分把蛋白质"粘"在了一起。血管壁、皮肤胶原蛋白、晶状体都在被糖化。这就是为什么糖尿病患者容易血管硬化、皮肤老化、视力下降。',
    down: '糖基化终产物减少，细胞蛋白质的"糖化锈蚀"减缓。这直接减缓了血管和器官的老化速度。',
    icon: '🧲',
    chains: ['↓血管弹性', '加速器官老化'],
  },
  'chronic.sleepPressure': {
    up: '睡眠压力增大——腺苷（让你想睡觉的化学物质）在大脑中大量堆积。你的身体在尖叫"我需要睡眠"，但你的意志力在说"再撑一下"。',
    down: '睡眠压力释放，身体重新获得了进入深度睡眠的能力。这是最有效的"系统重启"。',
    icon: '😴',
    chains: ['→睡眠负债累积', '↓认知功能'],
  },
  'chronic.sleepDebt': {
    up: '睡眠负债又增加了。每一小时的负债都在削弱前额叶皮层的功能——你的决策力、自控力、情绪调节力都在下降。连续一周每晚少睡1小时 = 认知能力相当于醉酒状态。',
    down: '睡眠负债减少！但注意：偿还睡眠债不是"周末补觉10小时"能解决的，它需要连续多天的规律睡眠来逐步恢复。',
    icon: '🛏️',
    chains: ['↓意志力', '↓认知储备', '↑HPA轴失调', '↑炎症水平'],
  },
  'willpower': {
    up: '意志力恢复——前额叶皮层的血糖供应和神经递质水平回升。你重新获得了"做正确但困难的选择"的能力。',
    down: '意志力消耗后需要恢复时间。持续消耗而不恢复会导致决策质量断崖式下降——这就是为什么深夜容易做出糟糕的决定、为什么节食到晚上容易暴食。',
    icon: '💪',
    chains: ['↓决策质量', '↑冲动行为'],
  },
}

// ─── 跨指标因果链规则 ───
interface CausalChainRule {
  trigger: string     // 触发指标
  direction: 'up' | 'down'
  threshold: number   // 变化量阈值
  result: string      // 导致的结果描述
  resultStats: string[] // 受影响的指标
}

const CAUSAL_CHAINS: CausalChainRule[] = [
  { trigger: 'chronic.sleepDebt', direction: 'up', threshold: 3, result: '睡眠负债累积→HPA轴失调→皮质醇失控→全天候"战斗模式"', resultStats: ['neural.hpaRegulation', 'chronic.allostaticLoad'] },
  { trigger: 'immune.inflammation', direction: 'up', threshold: 8, result: '慢性炎症→血管内膜损伤→动脉硬化启动→心脑血管事件风险↑', resultStats: ['cardio.vascularElasticity', 'cardio.bloodPressureLoad'] },
  { trigger: 'metabolic.glucoseStability', direction: 'down', threshold: 5, result: '血糖剧烈波动→胰岛素抵抗恶化→脂肪加速囤积→代谢综合征推进', resultStats: ['metabolic.insulinSensitivity', 'metabolic.adiposity'] },
  { trigger: 'neural.hpaRegulation', direction: 'down', threshold: 5, result: 'HPA轴失调→昼夜节律崩溃→睡眠质量暴跌→认知功能全面下降', resultStats: ['neural.circadianStrength', 'chronic.sleepDebt', 'neural.cognitiveReserve'] },
  { trigger: 'chronic.allostaticLoad', direction: 'up', threshold: 10, result: '稳态超载→免疫系统资源被征调→抗感染能力下降→身体进入"战时经济"', resultStats: ['immune.immuneCompetence', 'chronic.oxidativeStress'] },
  { trigger: 'metabolic.insulinSensitivity', direction: 'down', threshold: 5, result: '胰岛素抵抗→血糖无处可去→糖基化加速→血管和器官"生锈"', resultStats: ['chronic.glycationEndProducts', 'cardio.vascularElasticity'] },
  { trigger: 'cardio.vascularElasticity', direction: 'down', threshold: 5, result: '血管硬化→心脏泵血阻力增大→心脏储备被消耗→心功能代偿极限逼近', resultStats: ['cardio.cardiacReserve', 'cardio.bloodPressureLoad'] },
  { trigger: 'immune.gutIntegrity', direction: 'down', threshold: 5, result: '肠漏加剧→内毒素入血→全身性炎症反应→自身免疫风险攀升', resultStats: ['immune.inflammation', 'immune.autoimmunityRisk'] },
]

// ═══════════════════════════════════════════════════════════
// 叙述生成器（核心增强版）
// ═══════════════════════════════════════════════════════════

export interface NarrationInput {
  cause: string           // "Day 5 选择：深夜加班"
  statPath: string        // 'chronic.sleepDebt'
  delta: number           // +3 (升高3)
  day: number
  context?: {
    archetype?: string
    phase?: string
    willpowerRemaining?: number
    totalDeltas?: Record<string, number>  // 同一次选择中所有变化
  }
}

export function generateCausalNarration(
  cause: string,
  statPath: string,
  delta: number,
  day: number
): CausalNarration {
  const mech = MECHANISM_DB[statPath]
  const label = STAT_LABELS[statPath] || statPath.split('.').pop() || statPath
  const isNegativeStat = NEGATIVE_STATS.has(statPath)
  
  // 判断好坏：负向指标升高=坏事，正向指标降低=坏事
  const isWorsening = isNegativeStat ? delta > 0 : delta < 0
  
  const mechanism = mech
    ? (isWorsening ? mech.down : mech.up)
    : `${label} ${delta > 0 ? '升高' : '降低'}了${Math.abs(delta)}个单位`
  
  const effect = `${label} ${delta > 0 ? '↑' : '↓'}${Math.abs(delta)}`
  
  return {
    id: `n-${day}-${statPath.replace(/\./g, '_')}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    cause,
    effect,
    mechanism,
    day,
    relatedStats: [statPath],
    showCount: 1,
  }
}

/**
 * 从一次选择的所有生理变化中批量生成叙述
 * 按影响优先级排序，只保留最重要的
 */
export function generateNarrationsFromChoice(
  choiceText: string,
  allDeltas: { path: string; delta: number }[],
  day: number,
  willpowerCost: number = 0,
): CausalNarration[] {
  const narrations: CausalNarration[] = []
  const cause = `Day ${day}：${choiceText}`
  
  // 1. 为每个显著变化生成基础叙述
  for (const { path, delta } of allDeltas) {
    if (Math.abs(delta) < 3) continue // 低于感知阈值的不生成
    narrations.push(generateCausalNarration(cause, path, delta, day))
  }
  
  // 2. 意志力消耗单独叙述
  if (willpowerCost >= 10) {
    narrations.push(generateCausalNarration(cause, 'willpower', -willpowerCost, day))
  }
  
  // 3. 检测跨指标因果链，生成链式叙述
  const totalDeltas: Record<string, number> = {}
  for (const { path, delta } of allDeltas) {
    totalDeltas[path] = delta
  }
  
  for (const chain of CAUSAL_CHAINS) {
    const delta = totalDeltas[chain.trigger]
    if (delta === undefined) continue
    const matchesDirection = (chain.direction === 'up' && delta >= chain.threshold) ||
                              (chain.direction === 'down' && delta <= -chain.threshold)
    if (!matchesDirection) continue
    
    // 只在触发链的条件满足时追加
    narrations.push({
      id: `chain-${day}-${chain.trigger.replace(/\./g, '_')}-${Date.now()}`,
      cause: `${cause} → ${STAT_LABELS[chain.trigger] || chain.trigger}`,
      effect: chain.result,
      mechanism: `🔗 这是跨系统连锁反应：${chain.result}。单独看每个指标的变化不大，但它们在相互放大。这就是为什么"身体突然垮了"从来不是突然的。`,
      day,
      relatedStats: [chain.trigger, ...chain.resultStats],
      showCount: 1,
    })
  }
  
  // 4. 按优先级排序：链式 > 大delta > 小delta
  narrations.sort((a, b) => {
    const aIsChain = a.id.startsWith('chain-') ? 1 : 0
    const bIsChain = b.id.startsWith('chain-') ? 1 : 0
    if (aIsChain !== bIsChain) return bIsChain - aIsChain
    return b.relatedStats.length - a.relatedStats.length
  })
  
  // 最多返回3条（避免信息过载）
  return narrations.slice(0, 3)
}

// ═══════════════════════════════════════════════════════════
// 叙述历史面板（可回顾所有已生成的因果解释）
// ═══════════════════════════════════════════════════════════

function NarrationHistory({ narrations, onClose }: {
  narrations: CausalNarration[]
  onClose: () => void
}) {
  // 按天分组
  const byDay = narrations.reduce<Record<number, CausalNarration[]>>((acc, n) => {
    if (!acc[n.day]) acc[n.day] = []
    acc[n.day].push(n)
    return acc
  }, {})
  
  return (
    <div className="fixed inset-0 z-70 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.95)' }}>
      <div className="max-w-[420px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">📖 因果叙述档案</h3>
            <p className="text-[10px] text-gray-500">你的身体经历了什么、为什么</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-gray-400">✕</button>
        </div>
        
        {Object.entries(byDay).sort(([a], [b]) => Number(b) - Number(a)).map(([day, dayNarrations]) => (
          <div key={day} className="mb-4">
            <div className="text-[10px] font-bold text-cyan-400 mb-1.5 flex items-center gap-1.5">
              <span>📅</span> Day {day}
            </div>
            <div className="space-y-1.5">
              {dayNarrations.map(n => (
                <div key={n.id} className="p-2.5 rounded-lg" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p className="text-[9px] text-gray-500 mb-1">{n.cause}</p>
                  <p className="text-[10px] text-gray-300">{n.effect}</p>
                  <p className="text-[9px] text-gray-600 mt-1 leading-relaxed">💡 {n.mechanism.slice(0, 100)}{n.mechanism.length > 100 ? '…' : ''}</p>
                  {n.relatedStats.length > 1 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {n.relatedStats.map((s, i) => (
                        <span key={i} className="text-[7px] px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-400/70">
                          {STAT_LABELS[s] || s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {narrations.length === 0 && (
          <p className="text-center text-gray-600 text-sm mt-8">暂无因果记录。做出你的第一个选择吧。</p>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 主组件：叙述浮层
// ═══════════════════════════════════════════════════════════

interface CausalNarrationOverlayProps {
  narrations: CausalNarration[]
  onDismiss: (id: string) => void
  onToggleAuto: () => void
}

export default function CausalNarrationOverlay({
  narrations, onDismiss, onToggleAuto
}: CausalNarrationOverlayProps) {
  const [autoShow, setAutoShow] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const showCountRef = useRef<Record<string, number>>({})
  
  // 更新 showCount
  useEffect(() => {
    for (const n of narrations) {
      if (!showCountRef.current[n.id]) {
        showCountRef.current[n.id] = 1
      }
    }
  }, [narrations])
  
  // 筛选可见叙述：未关闭 + 展示次数≤3（自动模式下）
  const visibleNarrations = autoShow
    ? narrations.filter(n => {
        if (dismissedIds.has(n.id)) return false
        const count = showCountRef.current[n.id] || 1
        return count <= 3
      }).slice(-2)  // 最多同时显示2条
    : []
  
  if (showHistory) {
    return <NarrationHistory narrations={narrations} onClose={() => setShowHistory(false)} />
  }
  
  return (
    <>
      {/* 叙述卡片浮层 */}
      <div className="fixed bottom-20 left-4 right-4 z-50 space-y-2 pointer-events-none">
        {visibleNarrations.map(n => {
          const count = showCountRef.current[n.id] || 1
          return (
            <NarrationCard
              key={n.id}
              narration={{ ...n, showCount: count }}
              onDismiss={() => {
                setDismissedIds(prev => new Set([...prev, n.id]))
                onDismiss(n.id)
                if (showCountRef.current[n.id]) {
                  showCountRef.current[n.id]++
                }
              }}
            />
          )
        })}
      </div>
      
      {/* 底部控制栏 */}
      {narrations.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-50 flex justify-center gap-2 pointer-events-none">
          <button
            onClick={() => { setAutoShow(false); onToggleAuto() }}
            className="pointer-events-auto text-[8px] text-gray-600 underline px-2 py-1 rounded bg-black/50"
          >
            关闭自动解释
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="pointer-events-auto text-[8px] text-cyan-500 underline px-2 py-1 rounded bg-black/50"
          >
            📖 叙述档案 ({narrations.length})
          </button>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// 单条叙述卡片
// ═══════════════════════════════════════════════════════════

function NarrationCard({ narration, onDismiss }: {
  narration: CausalNarration
  onDismiss: () => void
}) {
  const mech = MECHANISM_DB[narration.relatedStats[0]]
  const icon = mech?.icon || '🔗'
  const isChain = narration.id.startsWith('chain-')
  
  return (
    <div className="animate-slide-up rounded-xl overflow-hidden pointer-events-auto"
      style={{
        background: isChain ? 'rgba(139,92,246,0.12)' : 'rgba(15,15,25,0.95)',
        border: isChain ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(6,182,212,0.2)',
        boxShadow: isChain ? '0 4px 24px rgba(139,92,246,0.2)' : '0 4px 20px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* 头部 */}
      <div className="px-3 py-1.5 flex items-center justify-between"
        style={{ background: isChain ? 'rgba(139,92,246,0.15)' : 'rgba(6,182,212,0.08)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">{isChain ? '🔗' : icon}</span>
          <span className={`text-[10px] font-bold ${isChain ? 'text-purple-400' : 'text-cyan-400'}`}>
            {isChain ? '连锁反应' : '因果解释'}
          </span>
        </div>
        <span className="text-[8px] text-gray-600">
          {narration.showCount <= 3 ? `(${narration.showCount}/3 强制)` : '可关闭'}
        </span>
      </div>
      
      {/* 因→果 */}
      <div className="p-3">
        <div className="flex items-start gap-1.5 mb-1.5">
          <span className="text-[9px] text-yellow-400 font-bold shrink-0">因</span>
          <p className="text-[10px] text-gray-400 leading-relaxed">{narration.cause}</p>
        </div>
        <div className="flex items-center justify-center my-0.5">
          <span className={`text-[10px] ${isChain ? 'text-purple-400' : 'text-cyan-400'}`}>↓</span>
        </div>
        <div className="flex items-start gap-1.5 mb-2">
          <span className="text-[9px] text-red-400 font-bold shrink-0">果</span>
          <p className="text-[10px] text-gray-200 leading-relaxed font-medium">{narration.effect}</p>
        </div>
        
        {/* 机制解释 */}
        <div className="p-2 rounded-lg" style={{
          background: isChain ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isChain ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.06)'}`,
        }}>
          <p className="text-[9px] text-gray-500 leading-relaxed">
            💡 {narration.mechanism}
          </p>
        </div>
        
        {/* 关联指标 */}
        {narration.relatedStats.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {narration.relatedStats.map((stat, i) => (
              <span key={i} className={`text-[8px] px-1.5 py-0.5 rounded ${
                isChain ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'
              }`}>
                {STAT_LABELS[stat] || stat}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* 关闭按钮 */}
      <button onClick={onDismiss}
        className="w-full py-1.5 text-[10px] text-gray-500 border-t border-white/5 active:bg-white/5 transition-colors">
        我知道了
      </button>
    </div>
  )
}

// 导出工具函数
export { STAT_LABELS, MECHANISM_DB, CAUSAL_CHAINS, NEGATIVE_STATS }
