// ═══════════════════════════════════════════════════════════
// 《生理极限》 - 原型定义 + 第一周事件链
// ═══════════════════════════════════════════════════════════

import { Archetype, DayEvent, WeekSettlement } from './physio-types'

// ─── 4种体质原型 ───

export const ARCHETYPES: Archetype[] = [
  {
    id: 'A',
    name: '代谢受损者',
    subtitle: '胰岛素抵抗体质',
    emoji: '🍔',
    color: '#ef4444',
    bgClass: 'from-red-500/20 to-red-600/10',
    narrative: `你从小就知道，你和别人不一样。

小学时，同样的午餐，同桌越吃越瘦，你越吃越困。
大学时，室友通宵游戏第二天精神抖擞，你熬夜一次需要一周恢复。
医生说你"体质问题"，但你更清楚——你的身体是一台燃料效率极差的机器。`,
    stats: {
      metabolic: { insulinSensitivity: 45, mitochondrialHealth: 60, adiposity: 40, glucoseStability: 50 },
      cardio: { vascularElasticity: 55, cardiacReserve: 60, autonomicBalance: 55, bloodPressureLoad: 35 },
      immune: { inflammation: 30, immuneCompetence: 60, gutIntegrity: 50, autoimmunityRisk: 10 },
      neural: { hpaRegulation: 50, neuroplasticity: 60, circadianStrength: 55, cognitiveReserve: 65 },
      chronic: { allostaticLoad: 45, oxidativeStress: 35, glycationEndProducts: 20, cortisolPattern: 'flat', sleepPressure: 40, sleepDebt: 5 }
    },
    hidden: '遗传负荷：PCOS/代谢综合征倾向。皮质醇节律已失调。',
    scenario: '体检报告惊吓'
  },
  {
    id: 'B',
    name: '高敏感神经系统',
    subtitle: 'HPA轴过度活跃',
    emoji: '⚡',
    color: '#8b5cf6',
    bgClass: 'from-violet-500/20 to-violet-600/10',
    narrative: `你的神经系统没有防火墙。

别人的压力是背景噪音，你的压力是全频段轰炸。
面试前夜，你的心跳会飙到120，持续整晚。
社交场合，你的手心出汗到握不住杯子。
你学会了隐藏，但身体从不撒谎。`,
    stats: {
      metabolic: { insulinSensitivity: 70, mitochondrialHealth: 65, adiposity: 25, glucoseStability: 65 },
      cardio: { vascularElasticity: 60, cardiacReserve: 55, autonomicBalance: 40, bloodPressureLoad: 45 },
      immune: { inflammation: 35, immuneCompetence: 55, gutIntegrity: 55, autoimmunityRisk: 15 },
      neural: { hpaRegulation: 35, neuroplasticity: 55, circadianStrength: 45, cognitiveReserve: 60 },
      chronic: { allostaticLoad: 50, oxidativeStress: 40, glycationEndProducts: 10, cortisolPattern: 'elevated', sleepPressure: 50, sleepDebt: 8 }
    },
    hidden: '基线焦虑：慢性。入睡困难型。HRV极低。',
    scenario: '惊恐发作边缘'
  },
  {
    id: 'C',
    name: '免疫紊乱者',
    subtitle: '隐形自身免疫',
    emoji: '🛡️',
    color: '#f59e0b',
    bgClass: 'from-amber-500/20 to-amber-600/10',
    narrative: `你的身体在攻击自己。

20岁时，你得了"奇怪的皮疹"，医生说"压力相关"。
25岁时，你"莫名其妙"地疲劳，检查却"一切正常"。
30岁时，你发现自己在用止痛药维持日常生活。
你不是懒。你的免疫系统把正常细胞当成了敌人。`,
    stats: {
      metabolic: { insulinSensitivity: 60, mitochondrialHealth: 50, adiposity: 30, glucoseStability: 60 },
      cardio: { vascularElasticity: 55, cardiacReserve: 55, autonomicBalance: 50, bloodPressureLoad: 30 },
      immune: { inflammation: 55, immuneCompetence: 40, gutIntegrity: 40, autoimmunityRisk: 30 },
      neural: { hpaRegulation: 60, neuroplasticity: 50, circadianStrength: 50, cognitiveReserve: 55 },
      chronic: { allostaticLoad: 48, oxidativeStress: 38, glycationEndProducts: 15, cortisolPattern: 'elevated', sleepPressure: 45, sleepDebt: 3 }
    },
    hidden: '肠通透性：受损。疼痛阈值：低。慢性炎症基线上移。',
    scenario: '慢性疼痛日常'
  },
  {
    id: 'D',
    name: '健康优化焦虑者',
    subtitle: '生物黑客陷阱',
    emoji: '🧬',
    color: '#06b6d4',
    bgClass: 'from-cyan-500/20 to-cyan-600/10',
    narrative: `你拥有令人羡慕的体检报告。

但你无法停止优化。
可穿戴设备记录着每一分钟的心率变异性。
你尝试过生酮、断食、冷暴露、补剂堆叠。
你的柜子里有17种保健品，每天服用时间表精确到分钟。
最讽刺的是：你比谁都"健康"，也比都害怕生病。`,
    stats: {
      metabolic: { insulinSensitivity: 85, mitochondrialHealth: 80, adiposity: 15, glucoseStability: 80 },
      cardio: { vascularElasticity: 75, cardiacReserve: 75, autonomicBalance: 70, bloodPressureLoad: 20 },
      immune: { inflammation: 20, immuneCompetence: 70, gutIntegrity: 70, autoimmunityRisk: 5 },
      neural: { hpaRegulation: 70, neuroplasticity: 75, circadianStrength: 70, cognitiveReserve: 75 },
      chronic: { allostaticLoad: 30, oxidativeStress: 20, glycationEndProducts: 5, cortisolPattern: 'normal', sleepPressure: 25, sleepDebt: 2 }
    },
    hidden: '健康食品强迫症：亚临床。休息恐惧：高。过度训练综合征风险。',
    scenario: '过度训练综合征'
  }
]

// ─── 第一周事件链（10个事件覆盖Day 1-7） ───

export const WEEK1_EVENTS: DayEvent[] = [
  {
    day: 1, title: '觉醒', scene: '卧室', timeOfDay: '06:30', phase: 'awakening',
    monologue: `闹钟响了。不是被声音叫醒的——是心跳。

你躺在床上，感受着自己的脉搏：快、浅、不规则。
智能手表显示：静息心率 89，HRV 32ms。
（正常应该是：心率60-70，HRV 50+）
你不知道HRV是什么，但那个红色的向下箭头让你不安。`,
    choices: [
      {
        text: '立即起床，利用"皮质醇峰值"工作',
        effects: { id: 'd1a', category: 'work', willpowerCost: 10, cognitiveCost: 15, physicalCost: 10,
          immediate: { neural: { cognitiveReserve: -5, hpaRegulation: -3 }, chronic: { sleepPressure: 5, allostaticLoad: 2 } } },
        tutorialTip: '强迫利用压力激素，短期提神但长期代价高昂',
        narrative: '你强迫自己爬起来，灌下咖啡开始工作。上午确实效率不错，但你知道这是在"借"明天的精力。'
      },
      {
        text: '再躺10分钟，让身体自然苏醒',
        effects: { id: 'd1b', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: { neural: { circadianStrength: 3, hpaRegulation: 2 }, chronic: { sleepPressure: -3 } } },
        tutorialTip: '短睡眠无法进入修复期，但心理安慰有价值',
        narrative: '你闭上眼，深呼吸几次。10分钟后，你感觉比闹钟响时好了一些。'
      },
      {
        text: '躺着刷手机"放松"',
        effects: { id: 'd1c', category: 'selfcare', willpowerCost: 0, cognitiveCost: 5, physicalCost: 0,
          immediate: { neural: { circadianStrength: -5, hpaRegulation: -2 }, chronic: { sleepPressure: 3, allostaticLoad: 2 } } },
        tutorialTip: '最糟糕的选项：既没休息，也没恢复。蓝光抑制褪黑素，下午崩溃概率+20%',
        narrative: '短视频一个接一个。等你意识到时已经过去了30分钟。感觉更累了，但说不清为什么。'
      }
    ]
  },
  {
    day: 1, title: '晨间能量投资', scene: '厨房', timeOfDay: '07:15', phase: 'awakening',
    monologue: `冰箱里有：
- 昨晚的外卖（高油高盐，但方便）
- 鸡蛋和牛油果（健康，但需要10分钟准备）
- 什么都不吃（省时间，但血糖会崩溃）

你的身体正在经历晨间皮质醇峰值，这是全天胰岛素敏感性最高的时刻。`,
    choices: [
      {
        text: '外卖早餐（方便快捷）',
        effects: { id: 'd1d', category: 'food', willpowerCost: 0, cognitiveCost: 0, physicalCost: 0,
          immediate: { metabolic: { glucoseStability: -10, insulinSensitivity: -3 }, chronic: { allostaticLoad: 3 } },
          delayed: [{ id: 'd1d_d', triggerDay: 1, cause: '高油高盐早餐', applied: false, effects: { 'metabolic.glucoseStability': -5, 'metabolic.adiposity': 2 }, notification: '下午3点，强烈的困意袭来——血糖崩溃的信号。' }] },
        tutorialTip: '高油高盐=胰岛素飙升→急跌→下午崩溃。这是"快感陷阱"'
      },
      {
        text: '鸡蛋+牛油果（健康但费时）',
        effects: { id: 'd1e', category: 'food', willpowerCost: 15, cognitiveCost: 0, physicalCost: 5,
          immediate: { metabolic: { glucoseStability: 8, insulinSensitivity: 3 }, neural: { cognitiveReserve: 5 } } },
        tutorialTip: '优质脂肪+蛋白质=血糖稳定4小时。这是真正的"能量投资"'
      },
      {
        text: '跳过早餐（省时间）',
        effects: { id: 'd1f', category: 'food', willpowerCost: 5, cognitiveCost: 5, physicalCost: 5,
          immediate: { metabolic: { glucoseStability: -5 }, neural: { hpaRegulation: -3, cognitiveReserve: -5 }, chronic: { allostaticLoad: 3, sleepPressure: 3 } },
          delayed: [{ id: 'd1f_d', triggerDay: 1, cause: '跳过早餐', applied: false, effects: { 'neural.cognitiveReserve': -8, 'metabolic.adiposity': 3 }, notification: '上午11点，你的手开始抖。暴食风险增加40%。' }] },
        tutorialTip: '跳过早餐=皮质醇持续升高+暴食风险。看似省时间，实则亏本'
      }
    ]
  },
  {
    day: 2, title: '负荷累积', scene: '办公室', timeOfDay: '16:00', phase: 'awakening',
    monologue: `项目经理在群里@你："这个需求今天必须上线。"

现在是下午4点，你估计需要工作到23点。
你的生理状态：
- 昨日睡眠：6.2小时（质量：差）
- 当前HRV：28ms（警戒线以下）
- 意志力剩余：35%

没有"完美"选项，只有权衡。`,
    choices: [
      {
        text: '接受加班，靠咖啡撑过去',
        effects: { id: 'd2a', category: 'work', willpowerCost: 25, cognitiveCost: 30, physicalCost: 20,
          immediate: { neural: { hpaRegulation: -8, circadianStrength: -5, cognitiveReserve: -10 }, cardio: { autonomicBalance: -5, bloodPressureLoad: 5 }, chronic: { cortisolPattern: 'elevated', sleepPressure: 15, sleepDebt: 3, allostaticLoad: 5 } },
          delayed: [{ id: 'd2a_d', triggerDay: 2, cause: '连续加班', applied: false, effects: { 'metabolic.mitochondrialHealth': -8, 'immune.inflammation': 8, 'immune.immuneCompetence': -10 }, notification: '你醒来感觉像被卡车碾过。深度睡眠只有12分钟。' }] },
        tutorialTip: '短期生存 vs 长期损伤的经典博弈。咖啡是"肾上腺素借贷"',
        narrative: '你灌下第四杯咖啡，手微微发抖。23:30提交代码，项目完成。但你知道明天会付出代价。'
      },
      {
        text: '折中：工作到21点，提交半成品',
        effects: { id: 'd2b', category: 'work', willpowerCost: 18, cognitiveCost: 20, physicalCost: 10,
          immediate: { neural: { hpaRegulation: -4, circadianStrength: -3 }, chronic: { cortisolPattern: 'elevated', sleepPressure: 8, sleepDebt: 2, allostaticLoad: 3 } } },
        tutorialTip: '中间路线往往两头不讨好，但有时候是唯一选择',
        narrative: '你提交了基本可用的版本，心里知道明天还要继续补。折中的焦虑反而比全做更折磨人。'
      },
      {
        text: '拒绝，说明天再做',
        effects: { id: 'd2c', category: 'work', willpowerCost: 10, cognitiveCost: 5, physicalCost: 0,
          immediate: { neural: { hpaRegulation: -3 }, chronic: { cortisolPattern: 'elevated', sleepPressure: 3, allostaticLoad: 4 } } },
        tutorialTip: '拒绝也有生理代价——预期性焦虑同样消耗HPA轴',
        narrative: '你拒绝了，但焦虑没有离开。躺在床上反复想这件事，1点才睡着。'
      }
    ]
  },
  {
    day: 3, title: '昨日代价', scene: '办公室', timeOfDay: '09:00', phase: 'awakening',
    monologue: `你醒来时，感觉像被卡车碾过。

手表显示：睡眠评分 42/100。深度睡眠：12分钟（正常应有60-120分钟）。
你的恢复失败了。

关键认知：昨天的选择，在今天显现。
你的身体记住了每一次透支。`,
    choices: [
      {
        text: '照常工作，假装没事',
        effects: { id: 'd3a', category: 'work', willpowerCost: 30, cognitiveCost: 25, physicalCost: 15,
          immediate: { neural: { cognitiveReserve: -10, hpaRegulation: -5 }, metabolic: { glucoseStability: -5 }, chronic: { sleepDebt: 2, allostaticLoad: 5 } } },
        tutorialTip: '在恢复失败状态下硬撑=二次透支。认知表现-30%，错误率+300%'
      },
      {
        text: '调整节奏，留出恢复时间',
        effects: { id: 'd3b', category: 'selfcare', willpowerCost: 15, cognitiveCost: 10, physicalCost: 5,
          immediate: { neural: { hpaRegulation: 3, circadianStrength: 2 }, chronic: { sleepPressure: -5, allostaticLoad: -2 } } },
        tutorialTip: '主动恢复是唯一正确的选择，但社会系统不奖励这种行为'
      }
    ]
  },
  {
    day: 4, title: '社交的生理代价', scene: '火锅店', timeOfDay: '19:00', phase: 'awakening',
    monologue: `团队聚餐，庆祝项目上线。
地点：火锅店，啤酒畅饮。19:00开始，预计23:00结束。

你的生理审计：
- 本周已累积睡眠债：5+小时
- 肠道状态：饮食不规律，菌群正在失调
- 明日有晨会（08:00）`,
    choices: [
      {
        text: '全程参与，喝酒吃肉',
        effects: { id: 'd4a', category: 'social', willpowerCost: 0, cognitiveCost: 5, physicalCost: 15,
          immediate: { metabolic: { insulinSensitivity: -5, glucoseStability: -8, adiposity: 5 }, immune: { inflammation: 8, gutIntegrity: -5 }, neural: { circadianStrength: -8 }, chronic: { sleepPressure: 12, sleepDebt: 2, allostaticLoad: 5 } },
          delayed: [{ id: 'd4a_d', triggerDay: 2, cause: '大量饮酒+高脂饮食', applied: false, effects: { 'immune.inflammation': 10, 'immune.gutIntegrity': -8, 'metabolic.mitochondrialHealth': -5 }, notification: '牙龈出血，伤口愈合变慢了...这不是巧合。' }] },
        tutorialTip: '酒精=肝脏负荷+30%，睡眠质量-40%，炎症+20%'
      },
      {
        text: '参与但控制：少喝酒，选清淡菜',
        effects: { id: 'd4b', category: 'social', willpowerCost: 25, cognitiveCost: 10, physicalCost: 5,
          immediate: { neural: { hpaRegulation: -3 }, chronic: { sleepPressure: 5, allostaticLoad: 3 } } },
        tutorialTip: '抵抗社交压力消耗意志力25点。被审视的疲惫比喝酒更消耗',
        narrative: '你拒绝了第三次敬酒。同事笑着说"养生呢？"——被审视的疲惫比喝酒本身更消耗。'
      },
      {
        text: '早退，借口"身体不适"',
        effects: { id: 'd4c', category: 'social', willpowerCost: 10, cognitiveCost: 5, physicalCost: 0,
          immediate: { neural: { circadianStrength: 3, hpaRegulation: -2 }, chronic: { sleepPressure: -3, allostaticLoad: 1 } } },
        tutorialTip: '睡眠+1h，但预期性压力+15（担心被标记"不合群"）'
      }
    ]
  },
  {
    day: 5, title: '隐形损伤', scene: '工位', timeOfDay: '14:00', phase: 'awakening',
    monologue: `周五下午，你盯着屏幕，发现自己看了三遍同一段文字。

不是困——是认知的枯竭。像大脑被抽干了葡萄糖。
连续5天的累积效应开始显现：
- 睡眠债：8+小时
- 皮质醇节律：已从"升高"变为"平坦"
- 意志力基线：从50降到30`,
    choices: [
      {
        text: '下班后去健身房"解压"',
        effects: { id: 'd5a', category: 'exercise', willpowerCost: 20, cognitiveCost: 5, physicalCost: 30,
          immediate: { metabolic: { mitochondrialHealth: 3, insulinSensitivity: 2 }, neural: { hpaRegulation: -3, neuroplasticity: 2 }, chronic: { allostaticLoad: -2 } },
          delayed: [{ id: 'd5a_d', triggerDay: 2, cause: '疲劳状态下高强度运动', applied: false, effects: { 'immune.immuneCompetence': -8, 'immune.inflammation': 5 }, notification: '鼻子发痒，喉咙不适...免疫窗口打开了。' }] },
        tutorialTip: '疲劳状态下运动=开窗期（免疫抑制）。48h后线粒体↑，但感染风险也↑'
      },
      {
        text: '回家躺平，彻底休息',
        effects: { id: 'd5b', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: { neural: { circadianStrength: 5, hpaRegulation: 5, cognitiveReserve: 5 }, chronic: { sleepPressure: -8, allostaticLoad: -3 } } },
        tutorialTip: '有时候什么都不做就是最好的选择'
      }
    ]
  },
  {
    day: 6, title: '第一次生理危机', scene: '会议室', timeOfDay: '14:00', phase: 'awakening',
    isCrisis: true,
    crisisNarrative: `你正在汇报，突然感到：
- 视野边缘变暗
- 心跳加速，手心出汗
- 强烈的进食冲动，特别是甜食

这是反应性低血糖——胰岛素抵抗的早期信号。
你的身体在"燃烧"葡萄糖，却无法有效利用它。`,
    monologue: `⚠️ 紧急事件触发！

本周的累积效应终于爆发了。
你正在会议室汇报，突然视野变暗，心跳加速。
这是身体发出的警报——你不能忽视它。`,
    choices: [
      {
        text: '立即吃糖（短期缓解）',
        effects: { id: 'd6a', category: 'food', willpowerCost: 0, cognitiveCost: 0, physicalCost: 0,
          immediate: { metabolic: { glucoseStability: -8, insulinSensitivity: -3 }, chronic: { allostaticLoad: 3 } } },
        tutorialTip: '糖分能立即缓解症状，但加重胰岛素抵抗。这是"拆东墙补西墙"。'
      },
      {
        text: '硬撑过去（认知-50%）',
        effects: { id: 'd6b', category: 'work', willpowerCost: 30, cognitiveCost: 30, physicalCost: 10,
          immediate: { neural: { cognitiveReserve: -15, hpaRegulation: -8 }, chronic: { allostaticLoad: 5, sleepPressure: 5 } } },
        tutorialTip: '硬撑=短期尊严保全，但可能触发更严重的崩溃。'
      },
      {
        text: '暂停会议，先休息5分钟',
        effects: { id: 'd6c', category: 'selfcare', willpowerCost: 15, cognitiveCost: 5, physicalCost: 0,
          immediate: { neural: { hpaRegulation: 3, cognitiveReserve: -5 }, chronic: { allostaticLoad: -1 } } },
        tutorialTip: '承认脆弱是困难的，但这是唯一对身体诚实的选择。',
        narrative: '你举起手："不好意思，我需要几分钟。" 走出会议室，你靠在墙上，等心跳慢下来。'
      }
    ]
  },
  {
    day: 7, title: '不安的清醒', scene: '卧室', timeOfDay: '10:00', phase: 'awakening',
    monologue: `周末，你终于有时间搜索这些症状。

你发现了：
- 稳态负荷(Allostatic Load)：身体为维持平衡付出的代价
- HRV（心率变异性）：神经系统弹性的窗口
- 胰岛素抵抗：不是"胖人问题"，是现代生活方式病

你意识到：过去一周的每一个"小选择"，
都在向一个你看不见的账户存款或取款。
而现在，账单开始到了。

🔓 系统解锁：稳态负荷可视化 + 延迟效应队列`,
    choices: [
      {
        text: '认真研究，建立自己的健康框架',
        effects: { id: 'd7a', category: 'selfcare', willpowerCost: 10, cognitiveCost: 15, physicalCost: 0,
          immediate: { neural: { cognitiveReserve: 5, neuroplasticity: 3 }, chronic: { allostaticLoad: -2 } } },
        tutorialTip: '知识本身就是治疗的一部分。理解生理机制=获得游戏的"规则手册"'
      },
      {
        text: '给自己放一天真正的假',
        effects: { id: 'd7b', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: { neural: { circadianStrength: 5, hpaRegulation: 5, neuroplasticity: 3 }, chronic: { sleepPressure: -10, allostaticLoad: -3 } } },
        tutorialTip: '周末超量恢复：休息质量>80且压力<40时，免疫能力+15，认知+10'
      }
    ]
  }
]

// ─── 第一周结算 ───

export const WEEK1_SETTLEMENT: WeekSettlement = {
  week: 1,
  title: '第1周生理审计',
  narrative: `七天前，你拿到那份体检报告的时候，觉得"也没什么大不了的"。

现在，你的身体告诉你另一个版本的故事。

血糖在攀升。炎症在积累。皮质醇节律已经倒置——你的身体在夜里焦虑，在白天疲惫。

这些数字不是冰冷的指标。它们是你每一天的缩影：
跳过的早餐，扛住的加班，咽下去的压力，以及那些"明天再说"的承诺。

你以为这只是一周。
但你的身体已经开始记账了。

下周，你可以选择改变。
也可以选择继续——直到身体替你做决定。`,
  metrics: [
    { name: '空腹血糖', value: '5.8 mmol/L', context: '正常上限（5.6），但你记得那次会议上的崩溃' },
    { name: 'HbA1c', value: '5.7%', context: '糖尿病前期阈值。医生说"要注意"。' },
    { name: 'hs-CRP', value: '3.2 mg/L', context: '炎症标志物。"轻度升高"。' },
    { name: '皮质醇节律', value: '晨间↓ 夜间↑', context: '倒置——你的身体在夜间"清醒"，在早晨"沉睡"。' }
  ],
  status: `生理债务持续累积中。
下周如果不改变，第3周将进入危险区（稳态负荷>75），急性事件概率：30%。`,
  strategies: [
    { name: '修复模式', desc: '强制睡眠优先，工作设边界，社交减少', diff: '困难（社会代价高）', effect: '稳态负荷-15，但经济/社交-20' },
    { name: '维持模式', desc: '继续当前节奏，微调优化', diff: '中等', effect: '稳态负荷+5，慢性累积' },
    { name: '透支模式', desc: '咖啡+意志力硬撑，相信年轻', diff: '现在轻松，后患无穷', effect: '稳态负荷+20，第4周极大概率触发急性事件' }
  ]
}
