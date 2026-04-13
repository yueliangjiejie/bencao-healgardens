// ═══════════════════════════════════════════════════════════
// 《生理极限》 - 第3周事件链：失代偿期（The Decompensation）
// ═══════════════════════════════════════════════════════════

import { DayEvent, WeekSettlement } from './physio-types'

// ─── 第3周：失代偿期 · 面具脱落 ───
// 主题：身体停止了友好协商，开始强制执行
// 核心情感：失控的恐惧

export const WEEK3_EVENTS: DayEvent[] = [
  {
    day: 15, title: '炎症风暴前兆', scene: '全身', timeOfDay: '07:00', phase: 'decompensation',
    isCrisis: true,
    crisisNarrative: `你开始**感觉到炎症**。

不是比喻——是真实的身体感觉：
- 牙龈持续的轻微胀痛
- 皮肤出现不明原因的疹子
- 旧伤部位隐隐作痛（曾经的扭伤、拔牙处）

你的免疫系统从防御模式切换到了攻击模式，
开始无差别开火。`,
    monologue: `⚠️ 系统级警报！

你的免疫系统正在失控。
炎症不再是局部的"保护性反应"，
而是系统性的"自毁程序"。

如果你是C型（免疫紊乱者），这个阶段特别危险：
抗核抗体可能在此时转阳，
一旦进入自身免疫循环，就是终身管理，而非治愈。`,
    choices: [
      {
        text: '去医院检查，认真对待',
        effects: {
          id: 'd15a', category: 'selfcare', willpowerCost: 15, cognitiveCost: 10, physicalCost: 5,
          immediate: {
            immune: { inflammation: -3, immuneCompetence: 3 },
            neural: { hpaRegulation: 2 },
            chronic: { allostaticLoad: -2 }
          }
        },
        tutorialTip: '早期干预是唯一能阻止自身免疫进程的窗口。但挂号排队、检查费用、时间成本...这些都是"就医障碍"。',
        narrative: '你请了半天假去医院。验血、CRP、ANA...结果要3天。医生说"可能只是压力大"，但你看到她多勾了两个检查项目。'
      },
      {
        text: '吃布洛芬压制症状',
        effects: {
          id: 'd15b', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            immune: { inflammation: -5, gutIntegrity: -3 },
            chronic: { allostaticLoad: 1 }
          },
          delayed: [{ id: 'd15b_d', triggerDay: 5, cause: 'NSAIDs损伤胃黏膜', applied: false, effects: { 'immune.gutIntegrity': -8, 'immune.inflammation': 5 }, notification: '胃开始疼了。布洛芬压制了症状，但代价是胃黏膜和肠屏障进一步损伤。' }]
        },
        tutorialTip: 'NSAIDs压制炎症的同时损伤胃黏膜。以胃换牙——这是"治标不治本"的医学困境。'
      },
      {
        text: '忽视，继续工作',
        effects: {
          id: 'd15c', category: 'work', willpowerCost: 10, cognitiveCost: 10, physicalCost: 10,
          immediate: {
            immune: { inflammation: 5, autoimmunityRisk: 3 },
            neural: { hpaRegulation: -5 },
            chronic: { allostaticLoad: 5 }
          }
        },
        tutorialTip: '炎症+压力=自身免疫的完美配方。每一次"忽视"都在推动基因彩票的兑现。'
      }
    ]
  },
  {
    day: 16, title: '社会面具的裂痕', scene: '办公室', timeOfDay: '11:00', phase: 'decompensation',
    monologue: `同事问："最近怎么样？"

你已经不记得上次被问到这个问题时，你说了真话。

"挺好的"——这句话你说了多少次？
但今天，你的身体差点出卖你：
- 说话时手微微发抖
- 突然忘了一个常用词
- 笑容维持了不到2秒就僵了

社会面具需要消耗认知能量来维持。
而你，已经快付不起了。`,
    choices: [
      {
        text: '继续伪装，"我没事"',
        effects: {
          id: 'd16a', category: 'social', willpowerCost: 20, cognitiveCost: 15, physicalCost: 5,
          immediate: {
            neural: { cognitiveReserve: -8, hpaRegulation: -3 },
            chronic: { allostaticLoad: 3, sleepPressure: 5 }
          }
        },
        tutorialTip: '社交伪装的认知消耗被严重低估。维持"正常人"形象需要的认知资源，接近解一道数学题。',
        narrative: '"挺好的！"你笑着说，同时在心里默默计算还能撑多久。同事满意地点头走了。你的表演又骗过了一个人。'
      },
      {
        text: '对信任的同事说真话',
        effects: {
          id: 'd16b', category: 'social', willpowerCost: 15, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: 5, cognitiveReserve: 3 },
            chronic: { allostaticLoad: -2, sleepPressure: -2 }
          }
        },
        tutorialTip: '社会支持是慢性压力的缓冲器。但暴露脆弱需要勇气——你不知道对方会如何反应。',
        narrative: '"说实话，最近身体不太好。"你低声说。同事沉默了一下，然后说："我也是。要不要一起去看医生？"'
      }
    ]
  },
  {
    day: 17, title: '快感缺失', scene: '家中', timeOfDay: '19:00', phase: 'decompensation',
    isCrisis: true,
    crisisNarrative: `你最喜欢的食物、音乐、游戏——

**味道变淡了**。
不是抑郁的那种悲伤，而是情感的扁平化。
多巴胺和血清素的合成速度跟不上消耗速度，
你的大脑为了节省能量，关闭了奖赏回路。

这是最危险的信号：**你失去了改变的动力**。
为什么？因为改变需要多巴胺，而你没有。`,
    monologue: `⚠️ 神经递质耗竭警报！

你的大脑进入了"节能模式"。
前额叶皮层功能抑制（能量不足）→
默认模式网络主导（反刍思维）。

这不是"懒"，是神经化学的现实：
执行健康行为需要2.5倍意志力。
你明知该休息，却无法执行。`,
    choices: [
      {
        text: '强迫自己做点什么（运动/做饭/读书）',
        effects: {
          id: 'd17a', category: 'exercise', willpowerCost: 35, cognitiveCost: 10, physicalCost: 15,
          immediate: {
            neural: { neuroplasticity: 3, cognitiveReserve: -3 },
            metabolic: { mitochondrialHealth: 2 },
            chronic: { allostaticLoad: -2 }
          }
        },
        tutorialTip: '在快感缺失状态下，"做点什么"需要35点意志力（正常只需15点）。这就是为什么抑郁症患者"动不起来"。',
        narrative: '你逼自己出门散步。每一步都像在泥里走。但15分钟后，你感觉到了一丝——只是一丝——活着的感觉。'
      },
      {
        text: '接受这种状态，允许自己"什么都不做"',
        effects: {
          id: 'd17b', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { circadianStrength: 3, hpaRegulation: 2 },
            chronic: { sleepPressure: -5, allostaticLoad: -1 }
          }
        },
        tutorialTip: '有时接受无力感反而是最勇敢的选择。但社会不这么看——"你怎么能躺着？"。',
        narrative: '你躺在沙发上，盯着天花板。没有愧疚，没有焦虑。只是...空。这种空白也许正是你需要的。'
      },
      {
        text: '用垃圾食品和短视频刺激多巴胺',
        effects: {
          id: 'd17c', category: 'food', willpowerCost: 0, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            neural: { cognitiveReserve: -5, circadianStrength: -3 },
            metabolic: { glucoseStability: -5, adiposity: 3 },
            chronic: { allostaticLoad: 3 }
          }
        },
        tutorialTip: '廉价多巴胺=透支未来的奖赏感受力。今天的一时快感，明天需要更多刺激才能达到同等效果。'
      }
    ]
  },
  {
    day: 18, title: '医检报告的冲击', scene: '医院', timeOfDay: '10:00', phase: 'decompensation',
    monologue: `体检报告出来了。你盯着纸上的数字：

🔴 空腹血糖：6.8 mmol/L（上周6.2）
🔴 HbA1c：6.1%（正式进入糖尿病区间）
🔴 CRP：8.5 mg/L（炎症持续攀升）
🟡 血压：138/88 mmHg（临界高血压）
🟡 维生素D：严重不足

医生的话：
"你需要注意生活方式。"
（你已经很注意了。问题不在"注意"，在于你的身体已经失去了自我修复的能力。）

报告附了一张处方：二甲双胍。
"先吃三个月看看。"`,
    choices: [
      {
        text: '认真遵医嘱，开始服药+生活方式大改',
        effects: {
          id: 'd18a', category: 'selfcare', willpowerCost: 20, cognitiveCost: 10, physicalCost: 5,
          immediate: {
            metabolic: { insulinSensitivity: 5, glucoseStability: 8 },
            chronic: { allostaticLoad: -5 }
          }
        },
        tutorialTip: '二甲双胍是目前最安全的降糖药之一。但"生活方式大改"需要持续意志力投入——你还有多少？',
        narrative: '你拿着处方走出医院。手里的药盒很轻，但它代表的"慢性病身份"很重。你从一个"亚健康的人"，变成了一个"需要吃药的人"。'
      },
      {
        text: '不服药，靠饮食运动逆转',
        effects: {
          id: 'd18b', category: 'selfcare', willpowerCost: 30, cognitiveCost: 15, physicalCost: 10,
          immediate: {
            metabolic: { glucoseStability: 3 },
            neural: { cognitiveReserve: -5 },
            chronic: { allostaticLoad: 2 }
          },
          delayed: [{ id: 'd18b_d', triggerDay: 7, cause: '不服药的代谢持续恶化', applied: false, effects: { 'metabolic.insulinSensitivity': -8, 'metabolic.glucoseStability': -10 }, notification: '血糖仪的数字在继续攀升。饮食控制的努力被压力和睡眠不足完全抵消。' }]
        },
        tutorialTip: 'HbA1c>6%时，单纯生活方式干预的成功率不到30%。不服药=赌30%的逆转概率。',
        narrative: '你把处方放进了抽屉。"我可以靠自己的。"这句话，不知道是在鼓励自己，还是在欺骗自己。'
      },
      {
        text: '领药但不确定是否真的要吃',
        effects: {
          id: 'd18c', category: 'selfcare', willpowerCost: 10, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            chronic: { allostaticLoad: 1 }
          }
        },
        tutorialTip: '犹豫期是正常的。但每犹豫一天，β细胞凋亡就多一点。胰腺的损伤是累积的。',
        narrative: '药盒放在桌上，你盯着它看了很久。它就像一个选择题：吃了，承认自己是病人；不吃，继续假装健康。'
      }
    ]
  },
  {
    day: 19, title: '心血管的悄悄话', scene: '卧室', timeOfDay: '02:00', phase: 'decompensation',
    isCrisis: true,
    crisisNarrative: `你醒来，不是因为噩梦，而是因为**心跳**。

咚。咚。咚。
不是快，而是重——每一次搏动都像敲击胸腔。
你测量脉搏：62bpm，但搏出量异常。
（心脏在代偿性肥大边缘）

你坐在黑暗中，突然意识到：
**我可能正在死去**。
不是明天，不是明年，而是此刻，细胞正在凋亡。`,
    monologue: `⚠️ 心血管系统警报！

静息时的重搏感=心脏在努力维持输出。
这不是正常的"心跳感觉得到"——
是心肌在肥大边缘的最后一次警告。

如果现在不休息，下一步就是心肌纤维化。
那是不可逆的。`,
    choices: [
      {
        text: '深呼吸冥想，尝试平复心率',
        effects: {
          id: 'd19a', category: 'selfcare', willpowerCost: 15, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: 5, circadianStrength: 3 },
            cardio: { autonomicBalance: 5 },
            chronic: { allostaticLoad: -3, sleepPressure: -3 }
          }
        },
        tutorialTip: '呼吸练习能激活副交感神经，降低心率。但这是急救，不是治疗。明天你需要真正的改变。'
      },
      {
        text: '焦虑到天亮，无法再入睡',
        effects: {
          id: 'd19b', category: 'selfcare', willpowerCost: 0, cognitiveCost: 10, physicalCost: 5,
          immediate: {
            neural: { hpaRegulation: -5, cognitiveReserve: -8, circadianStrength: -5 },
            cardio: { autonomicBalance: -5 },
            chronic: { allostaticLoad: 5, sleepPressure: 10, sleepDebt: 3, cortisolPattern: 'inverted' }
          }
        },
        tutorialTip: '夜间焦虑=最致命的压力形式。皮质醇在应该最低的时候飙高，这会加速全身器官老化。'
      },
      {
        text: '爬起来吃点东西，安抚自己',
        effects: {
          id: 'd19c', category: 'food', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: -2 },
            metabolic: { glucoseStability: -3 },
            chronic: { allostaticLoad: 2, sleepPressure: 3 }
          }
        },
        tutorialTip: '夜间进食=胰岛素分泌+消化负担+睡眠质量-30%。安抚了心理，伤害了生理。'
      }
    ]
  },
  {
    day: 20, title: '失控的恐惧', scene: '工位', timeOfDay: '16:00', phase: 'decompensation',
    monologue: `你在做一个简单的工作任务，但：

- 打字速度下降了40%
- 同一个错误犯了三次
- 你站起来去倒水，差点撞到桌角

这不是"状态不好"——
这是认知和运动协调同时退化。
你的前额叶（决策）和运动皮层（协调）都在罢工。

你开始害怕：
如果同事发现了怎么办？
如果领导知道了怎么办？
如果你真的"不行了"怎么办？

恐惧本身也在加速崩溃。`,
    choices: [
      {
        text: '请假回家，坦诚告知状态不好',
        effects: {
          id: 'd20a', category: 'selfcare', willpowerCost: 25, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: 5, cognitiveReserve: 3 },
            chronic: { allostaticLoad: -3, sleepPressure: -5 }
          }
        },
        tutorialTip: '请假是止损行为。短期职场信誉-15，但避免了更严重的后果。',
        narrative: '"我身体不太舒服，想请半天假。"你听到自己的声音在发抖。领导说："好的，注意身体。"——出乎意料地温和。'
      },
      {
        text: '硬撑到下班（反正快了）',
        effects: {
          id: 'd20b', category: 'work', willpowerCost: 25, cognitiveCost: 25, physicalCost: 15,
          immediate: {
            neural: { cognitiveReserve: -10, hpaRegulation: -5 },
            cardio: { bloodPressureLoad: 5 },
            chronic: { allostaticLoad: 5, sleepPressure: 5 }
          }
        },
        tutorialTip: '在认知-40%状态下工作=错误率+300%。你"撑过"的每一分钟，都在累积明天要付的账单。'
      }
    ]
  },
  {
    day: 21, title: '面具脱落', scene: '全身', timeOfDay: '22:00', phase: 'decompensation',
    monologue: `周日晚上。你坐在床边，做了一次诚实的自我盘点：

身体的变化：
- 面部浮肿（皮质醇+C反应蛋白）
- 皮肤暗沉+痤疮（炎症+激素失调）
- 手指甲出现竖纹（营养不良信号）
- 头发比一个月前少了（毛囊进入休止期）

功能的变化：
- 记忆力明显下降
- 情绪波动加剧
- 性欲基本消失
- 睡眠不再有恢复感

你不再是"亚健康"了。
你的身体正在从"功能代偿"滑向"功能丧失"。

下周，就是斩杀线。
你的身体还能撑多久？取决于这3周累积的每一个选择。

🔓 第三周结算即将打开...`,
    choices: [
      {
        text: '认真复盘，制定最后的生存计划',
        effects: {
          id: 'd21a', category: 'selfcare', willpowerCost: 10, cognitiveCost: 15, physicalCost: 0,
          immediate: {
            neural: { cognitiveReserve: 5, neuroplasticity: 3 },
            chronic: { allostaticLoad: -3 }
          }
        },
        tutorialTip: '自我觉察是最后的防线。知道自己在哪里，才能决定往哪走。'
      },
      {
        text: '关灯睡觉，明天再说',
        effects: {
          id: 'd21b', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { circadianStrength: 3 },
            chronic: { sleepPressure: -3 }
          }
        },
        tutorialTip: '有时候"明天再说"就是最好的选择。至少今晚你选择了睡眠。',
        narrative: '你关了灯。黑暗中，你把手放在胸口，感受心跳。它还在跳。明天再想吧。'
      }
    ]
  }
]

// ─── 第3周结算 ───

export const WEEK3_SETTLEMENT: WeekSettlement = {
  week: 3,
  title: '第3周生理审计 · 失代偿期',
  narrative: `代偿期结束了。

你的身体再也无法用"适应"来掩盖损伤了。血糖正式突破糖尿病诊断线。血压进入高血压范围。心率变异性暴跌——你的心脏已经失去了弹性。

体检报告上出现了三个新词："肥大"、"降低"、"升高"。
医生不再说"注意"，开始说"治疗"。

不可逆损伤正在累积。肠屏障通透性改变是永久的。心肌壁增厚不会自己消退。你的认知效率下降了，不是"注意力不集中"——是前额叶皮层在生理性衰退。

从下周开始，每一天都是赌注。
不是"会不会出事"的问题，而是"哪天出事"的问题。

21天前，你觉得"我还年轻，扛得住"。
现在你知道了——身体从来不和你商量。

最后一周。你的选择将决定结局。`,
  metrics: [
    { name: '空腹血糖', value: '7.2 mmol/L', context: '正式糖尿病诊断阈值(≥7.0)。你的"注意"没有阻止它。' },
    { name: 'HbA1c', value: '6.3%', context: '糖尿病控制目标<7.0%，你已经确诊但还没开始治疗。' },
    { name: 'hs-CRP', value: '12.5 mg/L', context: '炎症再次翻倍。正常<1.0。你的身体在打一场内战。' },
    { name: '血压', value: '142/92 mmHg', context: '一级高血压。上周138/88，这周正式超标。' },
    { name: '心率变异性', value: 'SDNN 45ms', context: '严重降低（正常>100ms）。你的神经系统弹性接近耗尽。' },
    { name: '心超', value: '左室壁稍厚', context: '代偿性肥大。心脏在变大来弥补效率下降——不可逆损伤的前兆。' }
  ],
  status: `代偿期结束。身体的"备用系统"已经耗尽。

从下周开始，你的每一个选择都可能是最后一个"正常"的选择。
稳态负荷已进入危险区（>75），急性事件概率：50%。

💀 不可逆损伤已累积：
- 肠屏障通透性：永久性改变
- 心肌壁厚度：代偿性增加
- 认知功能：前额叶效率下降
- 免疫记忆：自身免疫风险基线上移

下周是斩杀线。
取决于你的累积选择，可能触发：
代谢崩溃 / 心血管事件 / 精神崩溃 / 免疫风暴

你准备好了吗？`,
  strategies: [
    { name: '全面撤退', desc: '请长假、住院检查、开始系统治疗', diff: '极端困难（经济/职业代价巨大）', effect: '稳态负荷-25，但可能已无法避免急性事件' },
    { name: '背水一战', desc: '严格睡眠+服药+减少一切消耗', diff: '困难', effect: '稳态负荷-10，降低急性事件概率至30%' },
    { name: '听天由命', desc: '继续当前节奏', diff: '零门槛', effect: '稳态负荷+15，急性事件概率>80%' }
  ]
}
