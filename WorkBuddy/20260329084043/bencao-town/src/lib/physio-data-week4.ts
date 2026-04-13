// ═══════════════════════════════════════════════════════════
// 《生理极限》 - 第4周事件链：斩杀线（The Kill Line）
// ═══════════════════════════════════════════════════════════

import { DayEvent, WeekSettlement } from './physio-types'

// ─── 第4周：斩杀线 · 急性事件 ───
// 主题：不是突然的崩溃，而是缓慢的坠落终于触地
// 核心情感：终局的重量
// 根据累积损伤和原型，分支为不同的斩杀事件

export const WEEK4_EVENTS: DayEvent[] = [
  {
    day: 22, title: '最后的平静', scene: '卧室', timeOfDay: '06:30', phase: 'kill_line',
    monologue: `第22天。

你醒来，意外地平静。
不是好了——是麻木到感觉不到疼痛了。

手表数据：
- 静息心率：95 bpm（基线已上移）
- HRV：22ms（极低，副交感神经几乎关闭）
- 睡眠：4.5小时，深度睡眠：0分钟

你下床时，眼前黑了3秒。
扶着墙站稳后，你问自己一个问题：

"今天是普通的一天，还是最后一天？"
你不知道答案。没有人知道。

但你知道一件事：
从现在开始，每一个选择都有可能是决定性的。`,
    choices: [
      {
        text: '照常上班（惯性生存）',
        effects: {
          id: 'd22a', category: 'work', willpowerCost: 15, cognitiveCost: 15, physicalCost: 10,
          immediate: {
            neural: { cognitiveReserve: -5, hpaRegulation: -3 },
            chronic: { allostaticLoad: 3, sleepPressure: 5 }
          }
        },
        tutorialTip: '惯性不是勇气，是无意识。在斩杀线边缘，"照常"可能就是最危险的选择。'
      },
      {
        text: '请假，去医院做全面检查',
        effects: {
          id: 'd22b', category: 'selfcare', willpowerCost: 20, cognitiveCost: 5, physicalCost: 5,
          immediate: {
            neural: { hpaRegulation: 3 },
            chronic: { allostaticLoad: -2, sleepPressure: -3 }
          }
        },
        tutorialTip: '在斩杀线前刹车需要巨大的意志力——因为"还没出事"的幻觉最致命。',
        narrative: '你打了请假电话。然后打120预约了急诊。"我觉得不太对劲。"你对电话那头说。'
      }
    ]
  },
  {
    day: 22, title: '代谢崩溃', scene: '办公室', timeOfDay: '14:00', phase: 'kill_line',
    isCrisis: true,
    crisisNarrative: `你正在回复邮件，突然**视野变窄**。

像从隧道里看世界，边缘发黑。
同时：极度口渴，尿意汹涌，恶心。

这不是普通的低血糖。
你的血糖仪显示：**22 mmol/L**（正常<6.1）。
尿酮体：+++。

你的身体进入了**糖尿病酮症酸中毒(DKA)**。
细胞无法使用葡萄糖，正在分解脂肪产生酮体，
血液正在变酸。

⚠️ 这是生死级别的紧急事件。`,
    monologue: `💀 斩杀线事件触发！

代谢崩溃——你三周以来的每一个"方便"选择，
每一次跳过的健康餐，每一个失眠的夜晚，
都在此刻收到了总账单。

你的胰腺β细胞已经凋亡超过50%。
这不是"生活方式调整"能解决的了。
你需要立即行动。`,
    choices: [
      {
        text: '拨打120急救电话',
        effects: {
          id: 'd22c', category: 'selfcare', willpowerCost: 10, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            chronic: { allostaticLoad: -5 }
          }
        },
        tutorialTip: 'DKA的致死率：及时治疗<5%，延误>30%。120是最正确的选择。',
        narrative: '你拨出了120。接线员的声音很冷静："请保持清醒，我们马上到。"你躺在地上，等待。这是你做过的最明智的决定。'
      },
      {
        text: '自己打车去医院（怕麻烦同事）',
        effects: {
          id: 'd22d', category: 'selfcare', willpowerCost: 15, cognitiveCost: 10, physicalCost: 10,
          immediate: {
            neural: { cognitiveReserve: -10 },
            cardio: { autonomicBalance: -5 },
            chronic: { allostaticLoad: 5 }
          }
        },
        tutorialTip: '独自前往=风险倍增。途中可能意识丧失，无人发现。'
      },
      {
        text: '喝水硬撑，继续工作（否认现实）',
        effects: {
          id: 'd22e', category: 'work', willpowerCost: 30, cognitiveCost: 20, physicalCost: 20,
          immediate: {
            neural: { cognitiveReserve: -15, hpaRegulation: -10 },
            cardio: { autonomicBalance: -10, bloodPressureLoad: 10 },
            chronic: { allostaticLoad: 15, cortisolPattern: 'inverted' }
          }
        },
        tutorialTip: '💀 否认是最致命的应对方式。DKA不治疗→昏迷→死亡，时间窗：6-12小时。',
        narrative: '你灌了一大杯水，强迫自己继续工作。视线越来越窄...你在键盘上趴下了。再醒来时，白色的天花板。消毒水的味道。你活着，但你的世界已经永远不同了。'
      }
    ]
  },
  {
    day: 23, title: '心血管事件', scene: '健身房', timeOfDay: '18:00', phase: 'kill_line',
    isCrisis: true,
    crisisNarrative: `你决定"改变"，来健身房释放压力。

第3组深蹲时，你感到**胸部挤压感**，
像被大象踩住，辐射到左臂和下颌。
不是疼痛，是**濒死感**。

你的视野开始缩小，耳边嗡鸣。
你倒下了。

（交感神经过度激活 + 心肌耗氧量超过狭窄冠脉供给 = 急性缺血）`,
    monologue: `💀 斩杀线事件触发！

心血管崩溃——讽刺的是，它发生在你试图"变好"的时候。

三周的慢性压力已经让你的冠状动脉内皮受损，
斑块在你不注意时悄悄长大。
今天的运动只是压垮骆驼的最后一根稻草。

心脏的代偿终于耗尽。`,
    choices: [
      {
        text: '让旁边的人打120（求生本能）',
        effects: {
          id: 'd23a', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            chronic: { allostaticLoad: -3 }
          }
        },
        tutorialTip: '急性心梗的黄金时间：90分钟。越快开通血管，挽救的心肌越多。',
        narrative: '"帮...帮我打120..."你用最后的力气对旁边的人说。然后世界变白了。'
      },
      {
        text: '试图站起来，"只是肌肉拉伤"',
        effects: {
          id: 'd23b', category: 'work', willpowerCost: 20, cognitiveCost: 10, physicalCost: 15,
          immediate: {
            cardio: { cardiacReserve: -15, vascularElasticity: -10 },
            chronic: { allostaticLoad: 10 }
          }
        },
        tutorialTip: '💀 心肌每多缺血1分钟，就有更多细胞凋亡。否认=加速死亡。'
      }
    ]
  },
  {
    day: 24, title: '精神崩溃', scene: '家中', timeOfDay: '03:00', phase: 'kill_line',
    isCrisis: true,
    crisisNarrative: `你盯着天花板，已经**72小时没有真正睡眠**。

不是不想睡——是神经系统失去了**关闭的能力**。
你的HPA轴像卡住的开关，持续释放皮质醇。

第4天早晨，你出现了**解离症状**：
看着镜子不认识自己，
感觉世界像塑料做的，
听到不存在的声音说"你失败了"。

这不是"想太多"——这是精神科的急性事件。`,
    monologue: `💀 斩杀线事件触发！

精神崩溃——你的神经系统已经无法区分真实威胁和想象威胁。
持续的高皮质醇水平导致了前额叶-杏仁核回路的崩溃。

这不是意志力的问题。
这是神经化学的灾难。`,
    choices: [
      {
        text: '拨打心理援助热线',
        effects: {
          id: 'd24a', category: 'selfcare', willpowerCost: 15, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: 5, cognitiveReserve: 3 },
            chronic: { allostaticLoad: -3 }
          }
        },
        tutorialTip: '求助不是软弱。在解离状态下，寻求外部锚点是唯一理性的选择。',
        narrative: '"你好，我...我觉得不太对。"电话那头，一个温暖的声音说："你做得很对，打这个电话。你现在在哪里？"'
      },
      {
        text: '继续撑着，"明天会好的"',
        effects: {
          id: 'd24b', category: 'work', willpowerCost: 10, cognitiveCost: 15, physicalCost: 5,
          immediate: {
            neural: { hpaRegulation: -10, cognitiveReserve: -15 },
            chronic: { allostaticLoad: 10, cortisolPattern: 'inverted' }
          }
        },
        tutorialTip: '💀 解离症状是精神科急症的标志。"明天会好"不是策略，是否认。不治疗→精神分裂谱系风险。'
      }
    ]
  },
  {
    day: 25, title: '免疫风暴', scene: '急诊室', timeOfDay: '全天', phase: 'kill_line',
    isCrisis: true,
    crisisNarrative: `你以为只是感冒。

但体温39.8°C已经持续5天，
CRP > 200（正常<10），
白细胞计数异常——不是升高，而是**异常分布**。

这是**细胞因子风暴**。
你的免疫系统在攻击自己的组织，
多器官功能障碍开始。

肾脏：肌酐升高
肝脏：转氨酶飙升
肺部：CT显示磨玻璃影`,
    monologue: `💀 斩杀线事件触发！

免疫崩溃——你的防御系统变成了攻击系统。
这不是"免疫力低"，而是"友军火力"。

三周的慢性炎症终于引爆了全身性炎症反应。
ICU、呼吸机、血液净化...
这些词突然变成了你的日常。`,
    choices: [
      {
        text: '接受ICU治疗，配合所有医疗方案',
        effects: {
          id: 'd25a', category: 'selfcare', willpowerCost: 10, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            immune: { inflammation: -15, immuneCompetence: 5 },
            chronic: { allostaticLoad: -5 }
          }
        },
        tutorialTip: 'ICU是残酷的但有效的。存活率取决于多器官损伤程度和干预时机。'
      },
      {
        text: '拒绝有创治疗，只接受基础支持',
        effects: {
          id: 'd25b', category: 'selfcare', willpowerCost: 15, cognitiveCost: 10, physicalCost: 0,
          immediate: {
            immune: { inflammation: -5 },
            chronic: { allostaticLoad: 5 }
          }
        },
        tutorialTip: '拒绝有创治疗=降低生存概率。但在清醒时做出这个决定，是你的权利。'
      }
    ]
  },
  {
    day: 26, title: '命运的十字路口', scene: '病床', timeOfDay: '全天', phase: 'kill_line',
    monologue: `你躺在病床上。周围是仪器的嗡鸣声。

过去4周的每一天像幻灯片一样闪过：
Day 1的闹钟
Day 2的加班
Day 4的火锅
Day 6的会议
Day 10的卫生间
Day 12的认知断片
Day 17的快感缺失
Day 19的心跳
...

每一个"小选择"，都在这个瞬间找到了它的回响。
你以为那是孤立的决定，
但你的身体把每一笔都记在了账上。

现在，账单到了。

医生走进来："你的检查结果出来了。我们需要谈谈。"`,
    choices: [
      {
        text: '认真听，开始长期管理计划',
        effects: {
          id: 'd26a', category: 'selfcare', willpowerCost: 15, cognitiveCost: 10, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: 3, cognitiveReserve: 5 },
            chronic: { allostaticLoad: -5 }
          }
        },
        tutorialTip: '接受诊断是治疗的第一步。"慢性病"不是终点，是新起点——虽然不是你想要的起点。'
      },
      {
        text: '闭上眼，需要时间消化',
        effects: {
          id: 'd26b', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { circadianStrength: 2 },
            chronic: { allostaticLoad: -2 }
          }
        },
        tutorialTip: '否认是悲伤的第一阶段。它会过去，但不要停留太久。'
      }
    ]
  },
  {
    day: 27, title: '最后的清单', scene: '病房', timeOfDay: '20:00', phase: 'kill_line',
    monologue: `你躺在病床上，翻看着手机里的日历。

27天前，你还是一个"正常人"。
27天后，你是一个带着诊断代码的人。

你打开了备忘录，开始写一份清单：
"如果我能重来一次——"

你列出的第一项是：好好睡觉。
第二项是：好好吃饭。
第三项是：学会说不。

可笑吗？这些事不需要任何天赋、
不需要任何金钱、不需要任何运气。
它们只需要你做一个选择。

而你，在过去27天里，有无数次机会做这些选择。
每一次，你都选择了"更重要的事"。

直到你的身体说：没有比你更重要的了。`,
    choices: [
      {
        text: '把清单发给最在乎的人',
        effects: {
          id: 'd27a', category: 'social', willpowerCost: 10, cognitiveCost: 5, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: 3, cognitiveReserve: 3 },
            chronic: { allostaticLoad: -2 }
          }
        },
        tutorialTip: '分享脆弱是一种力量。你不知道这条消息会在什么时候帮到某个人。',
        narrative: '你按下了发送键。5分钟后，手机亮了："谢谢你。我最近也不好。"对话开始了。'
      },
      {
        text: '删掉清单，觉得自己矫情',
        effects: {
          id: 'd27b', category: 'selfcare', willpowerCost: 5, cognitiveCost: 0, physicalCost: 0,
          immediate: {
            neural: { hpaRegulation: -2 },
            chronic: { allostaticLoad: 1 }
          }
        },
        tutorialTip: '否定自己的感受是一种防御机制。但清单上的每一项都是真实的——你的身体已经证明了。',
        narrative: '你删掉了备忘录。但那些字句已经刻在了你的记忆里。删得掉文字，删不掉真相。'
      }
    ]
  },
  {
    day: 28, title: '终局的重量', scene: '病房窗边', timeOfDay: '清晨', phase: 'kill_line',
    monologue: `第28天。你坐在病床边，窗外是城市的天际线。

一个月前，你是一个"正常"的打工人。
今天，你是一个有诊断代码的人。

出院小结上的字：
你的身体记住了这28天的每一个选择。
有些损伤会愈合。有些不会。
但你还活着。

窗外，太阳升起来了。
和28天前一模一样的太阳。
但看着它的你，已经不是同一个人了。

你知道了一件最重要的事：
**健康不是"有"或"没有"的状态，
而是你每一天选择的累积。**

游戏结束。
但你的选择，还在继续。`,
    choices: [
      {
        text: '重新开始，用你学到的一切',
        effects: {
          id: 'd28a', category: 'selfcare', willpowerCost: 0, cognitiveCost: 0, physicalCost: 0,
          immediate: { chronic: { allostaticLoad: 0 } }
        },
        tutorialTip: '恭喜你完成了《生理极限》。你在游戏中经历的每一天，都有人在现实中经历。珍惜你的选择权。'
      }
    ]
  }
]

// ─── 第4周结算（最终结算） ───

export const WEEK4_SETTLEMENT: WeekSettlement = {
  week: 4,
  title: '最终审计 · 生理极限',
  narrative: `你走完了28天。

也许你活了下来，也许你没有。但无论结局如何，请记住——这不仅仅是一个游戏。

有人在现实中正在经历你刚才的每一个选择：
凌晨两点还在写代码的程序员，他说"再改一个bug"；
跳过早餐赶地铁的白领，她说"中午再说"；
用第四杯咖啡续命的创业者，他说"撑过这阵就好了"；
在跑步机上突然倒下的"健身达人"——他以为运动能抵消一切。

他们的身体也在记账。只是账单还没到。

你刚才在游戏里看到的一切——
延迟效应、代偿骗局、斩杀线、不可逆损伤——
都不是虚构的。它们每天都在医院里上演。

但有一个区别：游戏可以重来，人生不行。

如果你从这28天里学到了什么，现在就是用到它的时候。
不是明天。不是下周。是现在。`,
  metrics: [
    { name: '存活状态', value: '已度过急性期', context: '你活下来了。但"活下来"和"活得好"是两件事。' },
    { name: '不可逆损伤', value: '2-4项', context: '肠屏障、心肌壁、认知储备、免疫基线——你的身体被永久改写了。' },
    { name: '新诊断', value: '2-3个', context: '糖尿病、高血压、焦虑障碍...你现在是"慢性病患者"了。' },
    { name: '药物方案', value: '4-7种/日', context: '二甲双胍、降压药、SSRI...每天的药盒像一个小型药房。' },
    { name: '医疗费用', value: '¥47,000-120,000', context: '一个月的收入，一顿早餐的选择，三年的积累。' },
    { name: '恢复预估', value: '6-18个月', context: '如果严格遵医嘱，部分功能可恢复。但有些损伤是永久的。' }
  ],
  status: `你到达了生理极限，然后回来了。

这不是一个"赢"或"输"的游戏。
这是一面镜子。

你在游戏中做的每一个选择，
都有人在现实中重复着：
加班到深夜的程序员，
跳过早餐的销售，
用咖啡续命的教师，
在健身房倒下的"健康达人"。

他们的身体也在记账。
只是账单还没到。

---

💡 游戏教会你的5件事：
1. 健康不是状态，是选择的累积
2. 延迟效应意味着"现在没事≠真的没事"
3. 身体的"适应"可能是欺骗
4. 社会压力是最隐蔽的生理杀手
5. 最危险的时刻不是崩溃，而是你觉得"还行"的时候`,
  strategies: [
    { name: '遗产模式', desc: '回顾你的28天旅程，看看不同选择会带来怎样不同的结局', diff: '', effect: '解锁所有分支路线预览' },
    { name: '重新挑战', desc: '用你学到的一切，看看能否避开斩杀线', diff: '', effect: '带着知识重新开始' },
    { name: '分享', desc: '把这个游戏分享给你关心的人', diff: '', effect: '也许能帮到某个正在"账单累积"的人' }
  ]
}
