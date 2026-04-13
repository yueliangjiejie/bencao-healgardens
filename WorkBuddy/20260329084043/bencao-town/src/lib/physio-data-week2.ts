// ═══════════════════════════════════════════════════════════
// 《生理极限》 - 第2周事件链：代偿期（The Compensation）
// ═══════════════════════════════════════════════════════════

import { DayEvent, WeekSettlement } from './physio-types'

// ─── 第2周：代偿期 · 身体的谎言 ───
// 主题：身体适应了你的虐待，但这是高利贷式的适应
// 核心情感：危险的舒适

export const WEEK2_EVENTS: DayEvent[] = [
  {
    day: 8, title: '虚假恢复', scene: '卧室', timeOfDay: '06:00', phase: 'compensation',
    monologue: `奇怪，今天早上醒来，你感觉**不错**。

连续几天6小时睡眠后，今天竟然不困了。
手表显示：静息心率从89降到了82。
你产生一种危险的错觉："我适应了。"

（你不知道这是代谢下调的结果——身体在降低能耗以匹配供给）`,
    choices: [
      {
        text: '利用这波精力加班推进项目',
        effects: {
          id: 'd8a', category: 'work', willpowerCost: 20, cognitiveCost: 15, physicalCost: 10,
          immediate: {
            neural: { cognitiveReserve: -5, hpaRegulation: -5 },
            metabolic: { mitochondrialHealth: -5, insulinSensitivity: -3 },
            chronic: { allostaticLoad: 4, cortisolPattern: 'elevated', sleepPressure: 5 }
          },
          delayed: [{ id: 'd8a_d', triggerDay: 3, cause: '虚假能量透支', applied: false, effects: { 'metabolic.mitochondrialHealth': -8, 'neural.hpaRegulation': -5 }, notification: '体温比平时低了0.3°C——甲状腺功能在下降。你的"适应"其实是身体在降频。' }]
        },
        tutorialTip: '虚假适应=代谢下调。你觉得精神了，其实是身体在节能。3天后代价显现。'
      },
      {
        text: '增加运动强度，"既然有精力"',
        effects: {
          id: 'd8b', category: 'exercise', willpowerCost: 15, cognitiveCost: 5, physicalCost: 30,
          immediate: {
            metabolic: { mitochondrialHealth: 2, insulinSensitivity: 2 },
            neural: { hpaRegulation: -3, neuroplasticity: 2 },
            chronic: { allostaticLoad: -2, sleepPressure: 5 }
          },
          delayed: [{ id: 'd8b_d', triggerDay: 5, cause: '脆弱状态下过度运动', applied: false, effects: { 'immune.immuneCompetence': -10, 'immune.inflammation': 8 }, notification: '鼻子发痒，喉咙不适...免疫窗口打开了。你的免疫系统正处于最脆弱的时刻。' }]
        },
        tutorialTip: '线粒体在脆弱状态下被过度消耗，5天后免疫抑制窗口打开'
      },
      {
        text: '提前休息，储备能量',
        effects: {
          id: 'd8c', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { circadianStrength: 5, hpaRegulation: 3, cognitiveReserve: 5 },
            chronic: { sleepPressure: -5, allostaticLoad: -3 }
          }
        },
        tutorialTip: '焦虑地"浪费"高效期，但这是唯一延缓崩溃的选择。社会代价：你会觉得自己"不够努力"。',
        narrative: '你躺在床上，焦虑地刷着工作群。同事们在讨论项目进度，你感到一种罪恶感。"我明明有精力，为什么在休息？"'
      }
    ]
  },
  {
    day: 9, title: '饮食习惯的陷阱', scene: '便利店', timeOfDay: '12:30', phase: 'compensation',
    monologue: `午餐时间。你已经连续5天没做饭了。

身体的信号很混乱：
- 不饿（瘦素抵抗——大脑收不到"吃饱了"信号）
- 但嘴馋（多巴胺渴求——压力性进食冲动）
- 下午开会，需要快速解决

你的胰岛素敏感性已经比上周下降了8%。
每一次"方便"的选择都在加速这个过程。`,
    choices: [
      {
        text: '便利店便当+含糖饮料（快速解决）',
        effects: {
          id: 'd9a', category: 'food', willpowerCost: 0, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            metabolic: { glucoseStability: -8, insulinSensitivity: -3, adiposity: 3 },
            chronic: { allostaticLoad: 3 }
          },
          delayed: [{ id: 'd9a_d', triggerDay: 1, cause: '高GI午餐', applied: false, effects: { 'neural.cognitiveReserve': -8 }, notification: '下午3点，你发现自己在同一行代码上看了五分钟。血糖崩溃的脑雾。' }]
        },
        tutorialTip: '高GI饮食=血糖过山车。3小时后认知能力-30%，比不吃饭还糟。'
      },
      {
        text: '步行15分钟去健康餐厅（费时但值得）',
        effects: {
          id: 'd9b', category: 'food', willpowerCost: 15, cognitiveCost: 5, physicalCost: 5,
          immediate: {
            metabolic: { glucoseStability: 5, insulinSensitivity: 2 },
            cardio: { vascularElasticity: 2 },
            neural: { cognitiveReserve: 3 },
            chronic: { allostaticLoad: -1 }
          }
        },
        tutorialTip: '步行+健康餐=双重收益。但需要15分钟+意志力15点。你是否"花得起"？'
      },
      {
        text: '跳过午餐，下午再说',
        effects: {
          id: 'd9c', category: 'food', willpowerCost: 5, cognitiveCost: 5, physicalCost: 5,
          immediate: {
            metabolic: { glucoseStability: -5 },
            neural: { hpaRegulation: -3, cognitiveReserve: -5 },
            chronic: { allostaticLoad: 3, cortisolPattern: 'elevated' }
          }
        },
        tutorialTip: '跳餐=皮质醇持续升高+暴食风险+40%。看似省时间，实则在借高利贷。'
      }
    ]
  },
  {
    day: 10, title: '消化系统警报', scene: '卫生间', timeOfDay: '07:30', phase: 'compensation',
    isCrisis: true,
    crisisNarrative: `你注意到变化。

不是疼痛，而是功能的改变：
- 便秘与腹泻交替（肠神经系统失调）
- 对某些食物突然不耐受（肠屏障通透性增加）
- 口臭，即使刚刷过牙（肠道菌群失调）

这是肠-脑轴崩溃的第一阶段。
你的消化系统正在失去对"正常"的定义。`,
    monologue: `⚠️ 系统警报！

你的肠道——人体最大的免疫器官——正在发出SOS。
连续10天的压力饮食已经让肠屏障变得脆弱。

这不仅是"肠胃不好"。
70%的免疫细胞在肠道，90%的血清素在肠道产生。
肠漏 = 全身炎症 + 情绪失调。`,
    choices: [
      {
        text: '开始吃益生菌和膳食纤维（亡羊补牢）',
        effects: {
          id: 'd10a', category: 'selfcare', willpowerCost: 10, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            immune: { gutIntegrity: 3, inflammation: -3 },
            neural: { cognitiveReserve: 2 },
            chronic: { allostaticLoad: -1 }
          },
          delayed: [{ id: 'd10a_d', triggerDay: 5, cause: '肠道修复需时间', applied: false, effects: { 'immune.gutIntegrity': 5, 'immune.inflammation': -5 }, notification: '排便变得规律了一些。肠道的修复是缓慢的，但方向是对的。' }]
        },
        tutorialTip: '肠道修复需要4-8周。现在开始，不晚。但如果你继续破坏，将不可逆。'
      },
      {
        text: '只是暂时的，继续正常生活',
        effects: {
          id: 'd10b', category: 'work', willpowerCost: 0, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            immune: { gutIntegrity: -5, inflammation: 5 },
            chronic: { allostaticLoad: 3 }
          }
        },
        tutorialTip: '忽视肠道信号=慢性炎症持续升高。体检不会检查肠屏障——这是医学盲区。'
      },
      {
        text: '喝粥养胃（传统做法）',
        effects: {
          id: 'd10c', category: 'food', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            metabolic: { glucoseStability: -3, insulinSensitivity: -2 },
            immune: { gutIntegrity: 2, inflammation: -2 },
            chronic: { allostaticLoad: 1 }
          }
        },
        tutorialTip: '粥确实易消化，但高GI。养胃和控糖矛盾——这是代谢受损者的两难。'
      }
    ]
  },
  {
    day: 11, title: '职场关系成本', scene: '办公室', timeOfDay: '10:00', phase: 'compensation',
    monologue: `周一晨会。你注意到一个趋势：

同事A：每天准时走，但升职了。
同事B：加班最多，但绩效垫底。
你：开始设定边界，但心里不安。

HR在群里发了一个通知：
"公司倡导拼搏文化，希望每位成员都能全情投入。"

你的身体在说"减速"，你的社会环境在说"加速"。
这两个声音的冲突，就是慢性压力的本质。`,
    choices: [
      {
        text: '迎合文化，加入加班队伍',
        effects: {
          id: 'd11a', category: 'work', willpowerCost: 20, cognitiveCost: 20, physicalCost: 15,
          immediate: {
            neural: { hpaRegulation: -8, cognitiveReserve: -8 },
            cardio: { autonomicBalance: -5, bloodPressureLoad: 5 },
            chronic: { allostaticLoad: 5, cortisolPattern: 'flat', sleepPressure: 8, sleepDebt: 2 }
          }
        },
        tutorialTip: '社会压力是最隐蔽的生理杀手。你以为是选择，其实是胁迫。皮质醇节律从"升高"恶化为"平坦"。'
      },
      {
        text: '保持边界，准时下班',
        effects: {
          id: 'd11b', category: 'selfcare', willpowerCost: 25, cognitiveCost: 10, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: -2, circadianStrength: 3 },
            chronic: { allostaticLoad: 1, sleepPressure: -3 }
          }
        },
        tutorialTip: '抵抗社会压力需要25点意志力。这是"做对的事"的隐藏成本。',
        narrative: '你准时收拾东西。组长看了你一眼，没说话。那眼神比任何话都重。'
      },
      {
        text: '折中：加班1小时，表现态度',
        effects: {
          id: 'd11c', category: 'work', willpowerCost: 12, cognitiveCost: 10, physicalCost: 5,
          immediate: {
            neural: { hpaRegulation: -3 },
            chronic: { allostaticLoad: 2, sleepPressure: 3 }
          }
        },
        tutorialTip: '折中看起来安全，但两头消耗：既没充分休息，也没充分表现。最容易被忽视的陷阱。'
      }
    ]
  },
  {
    day: 12, title: '认知债务到期', scene: '会议室', timeOfDay: '15:00', phase: 'compensation',
    isCrisis: true,
    crisisNarrative: `下午3点的会议，你**断片了**。

不是睡着，而是认知的黑洞——
同事说了三分钟话，你突然意识到一个字都没听进去。
你的大脑像被蒙上了一层毛玻璃。

这是睡眠债的复利计算：
第1周：-8小时
第2周：-12小时（累积）
缺失的深度睡眠导致glymphatic系统清洁失败，
β-淀粉样蛋白在积累。`,
    monologue: `⚠️ 紧急事件！

你的认知储备已耗尽。工作记忆-40%，错误率+300%。
这不是"困"能解释的——这是大脑在节能模式下的强制降频。

接下来的选择，将决定你是否进入"肾上腺素借贷"模式。`,
    choices: [
      {
        text: '灌咖啡硬撑，靠肾上腺素续命',
        effects: {
          id: 'd12a', category: 'work', willpowerCost: 30, cognitiveCost: 30, physicalCost: 10,
          immediate: {
            neural: { cognitiveReserve: -10, hpaRegulation: -8 },
            cardio: { autonomicBalance: -8, bloodPressureLoad: 8 },
            chronic: { allostaticLoad: 8, cortisolPattern: 'flat', sleepPressure: 10 }
          },
          delayed: [{ id: 'd12a_d', triggerDay: 2, cause: '肾上腺素借贷', applied: false, effects: { 'cardio.autonomicBalance': -5, 'neural.hpaRegulation': -5, 'cardio.bloodPressureLoad': 5 }, notification: '心脏在安静时也会偶尔"跳拍"。这不是焦虑，是心律失常的前兆。' }]
        },
        tutorialTip: '咖啡因是"肾上腺素借贷"——今天借的精力，明天要还本金+利息。代价是心脏和神经系统。'
      },
      {
        text: '承认状态不佳，申请延期交付',
        effects: {
          id: 'd12b', category: 'selfcare', willpowerCost: 25, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: 3, cognitiveReserve: -3 },
            chronic: { allostaticLoad: -2, sleepPressure: -3 }
          }
        },
        tutorialTip: '承认脆弱是最高意志力的表现。职场信誉短期-25，但避免了急性崩溃。',
        narrative: '"我这周状态不太好，能不能延期到周三？"你说出了这句话。沉默了3秒。"好吧。"组长的语气里，你听不出是理解还是失望。'
      },
      {
        text: '在工位上趴15分钟（微睡眠）',
        effects: {
          id: 'd12c', category: 'selfcare', willpowerCost: 10, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { cognitiveReserve: 5, hpaRegulation: 2, circadianStrength: 2 },
            chronic: { sleepPressure: -5, allostaticLoad: -1 }
          }
        },
        tutorialTip: '15分钟微睡眠能恢复部分认知功能，但深度睡眠无法通过这种方式补偿。',
        narrative: '你在工位上趴下了。醒来时，发现有人在看你。尴尬，但脑子确实清醒了一点。'
      }
    ]
  },
  {
    day: 13, title: '药物的诱惑', scene: '药店', timeOfDay: '18:30', phase: 'compensation',
    monologue: `下班路过药店。橱窗里的保健品排列整齐：

- 复合维生素："抗疲劳"
- 鱼油："心脑血管守护"
- 褪黑素："安睡一整晚"
- 益生菌："肠道健康"

你知道这些不能替代良好的生活习惯。
但你更知道——改变习惯需要的时间和精力，你现在没有。

这是一个危险的思维方式：
用消费品替代行为改变，用金钱购买"健康的幻觉"。`,
    choices: [
      {
        text: '买一堆保健品，"至少做点什么"',
        effects: {
          id: 'd13a', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            immune: { inflammation: -1 },
            neural: { cognitiveReserve: -2 },
            chronic: { allostaticLoad: 1 }
          }
        },
        tutorialTip: '安慰剂效应约15-20%。保健品的核心价值可能是心理安慰，而非生理效果。真正的成本是你的注意力被分散了。',
        narrative: '你花了380元，提着一袋瓶子回家。瓶身上的承诺很动人，但你注意到小字："本品不能替代药物和健康生活方式"。'
      },
      {
        text: '不买，把钱和时间用来早睡',
        effects: {
          id: 'd13b', category: 'selfcare', willpowerCost: 10, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { circadianStrength: 5, hpaRegulation: 3 },
            chronic: { sleepPressure: -5, allostaticLoad: -2 }
          }
        },
        tutorialTip: '22:00-02:00是深度睡眠黄金窗口。早睡1小时=免费的最强保健品。',
        narrative: '你从药店门前走过。回家，洗了个热水澡，22:30躺下。这是你两周来最早的一次。'
      },
      {
        text: '只买褪黑素，解决入睡问题',
        effects: {
          id: 'd13c', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { circadianStrength: 3 },
            chronic: { sleepPressure: -3 }
          },
          delayed: [{ id: 'd13c_d', triggerDay: 7, cause: '褪黑素依赖', applied: false, effects: { 'neural.circadianStrength': -5 }, notification: '不吃褪黑素就睡不着了。你的松果体已经开始"偷懒"——外源激素抑制了内源合成。' }]
        },
        tutorialTip: '褪黑素短期有用，但长期使用会抑制自身分泌。这是"解决方案"变成"问题"的典型案例。'
      }
    ]
  },
  {
    day: 14, title: '危险的舒适', scene: '客厅', timeOfDay: '20:00', phase: 'compensation',
    monologue: `周六晚上。

你发现自己进入了一种奇怪的状态：
不是很差，也不是很好。
而是一种**灰色的麻木**。

不疼了，但也不快乐了。
不累了，但也没有精力了。
不焦虑了，但也不期待了。

你的身体已经从"急性抗争"切换到了"慢性适应"。
代价是：你失去了感知"好坏"的能力。

这是最危险的状态——
因为你不再感到"有问题"，
问题却在加速累积。

🔓 第二周结算即将打开...`,
    choices: [
      {
        text: '认真审视自己的状态，记录症状变化',
        effects: {
          id: 'd14a', category: 'selfcare', willpowerCost: 10, cognitiveCost: 10, physicalCost: 0,
          immediate: {
            neural: { cognitiveReserve: 3, neuroplasticity: 2 },
            chronic: { allostaticLoad: -2 }
          }
        },
        tutorialTip: '自我觉察是改变的起点。但大多数人在这个阶段已经失去了觉察的能力——因为"感觉还好"。'
      },
      {
        text: '享受周末，不想这些烦心事',
        effects: {
          id: 'd14b', category: 'selfcare', willpowerCost: 0, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: 2 },
            chronic: { allostaticLoad: 1 }
          }
        },
        tutorialTip: '逃避是大脑的默认策略。短期减轻焦虑，但问题不会因为你不看而消失。',
        narrative: '你打开了一部新剧，点了外卖。这两个小时，你什么都不想。这是你应得的——至少你这样告诉自己。'
      }
    ]
  }
]

// ─── 第2周结算 ───

export const WEEK2_SETTLEMENT: WeekSettlement = {
  week: 2,
  title: '第2周生理审计 · 代偿期',
  narrative: `你可能觉得这一周"还行"。

没那么困了。没那么饿了。好像身体"适应了"。

这是骗局。

你的身体没有变强，它在节能。就像一家现金流断裂的公司，开始卖资产维持运营——账面利润转正了，但核心能力在瓦解。

甲状腺T3在下降，因为身体主动关闭了代谢。你"不困了"不是因为恢复了，而是因为应激系统取代了正常的精力循环。

炎症翻倍了。肠屏障在漏。认知储备在消耗。

而最危险的是：你感觉"还行"。

代偿期最大的敌人不是疾病本身，而是"适应"制造的虚假安全感。
你的身体在骗你，因为这就是生存本能——让你觉得一切正常，直到撑不住的那一天。`,
  metrics: [
    { name: '空腹血糖', value: '6.2 mmol/L', context: '持续上升。上周5.8，这周6.2。趋势比绝对值更可怕。' },
    { name: 'HbA1c', value: '5.8%', context: '较上周+0.1%。三个月平均值——你的"改善"窗口正在关闭。' },
    { name: 'hs-CRP', value: '5.8 mg/L', context: '炎症翻倍。上周3.2，这周5.8。身体正在进入"攻击模式"。' },
    { name: '甲状腺T3', value: '偏低', context: '代谢下调的信号。你的身体在主动降速——这就是为什么你"不困了"。' },
    { name: '肠屏障通透性', value: '↑↑', context: '不可逆损伤风险。一旦肠屏障永久受损，慢性炎症将成为你的新基线。' }
  ],
  status: `身体正在用"适应"欺骗你。

你以为自己"适应了"，其实是身体在降低能耗来应对供给不足。
就像企业裁员减支——短期账面好看，长期竞争力瓦解。

⚠️ 关键数据：
- 稳态负荷已进入危险区
- 炎症水平翻倍
- 认知储备持续下降
- 肠屏障接近不可逆阈值

下周如果不改变，将进入**失代偿期**——
身体的代偿机制将耗尽，器官功能开始实质性受损。`,
  strategies: [
    { name: '紧急干预', desc: '强制睡眠8小时+抗炎饮食+请假3天', diff: '极端困难（职场代价极高）', effect: '稳态负荷-20，炎症-15，但经济/社交-30' },
    { name: '精准修复', desc: '睡眠7小时+每日30分钟散步+减少加班', diff: '困难', effect: '稳态负荷-8，延缓失代偿，但无法逆转已有损伤' },
    { name: '继续代偿', desc: '维持现状，靠身体"适应力"硬撑', diff: '现在轻松', effect: '稳态负荷+10，第3周大概率进入失代偿期，第4周急性事件概率>50%' }
  ]
}
