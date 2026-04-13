// ═══════════════════════════════════════════════════════════
// 《生理极限》 - 慢性生存事件数据
// 从第5周开始的身份重构 + 月度循环事件
// ═══════════════════════════════════════════════════════════

import { ChronicEvent } from './physio-types'

// ─── 身份重构事件（第5周过渡） ───
export const TRANSITION_EVENTS: ChronicEvent[] = [
  {
    id: 'transition_1',
    month: 0, weekInMonth: 1,
    title: '新常态',
    scene: '医院 · 出院结算处',
    category: 'existential',
    narrative: `你活下来了。

但出院小结上的诊断代码不会消失：
你不再是"亚健康"的普通人。
你是**慢性病人**（Chronic Patient）。
这不仅是医学状态，更是社会身份。

账单：¥47,830。
医保报销：¥23,200。
自付：¥24,630。

护士递给你三张纸：
1. 每日药物清单（分3个时段）
2. 复查预约单（时间冲突）
3. 请假证明（建议休息2周，但项目DDL是下周）

欢迎来到慢性病管理——
这是一场没有终点的马拉松，
而你的对手是**遗忘、疲劳和破产**。`,
    choices: [
      {
        text: '认真看每张纸，列出优先级',
        effects: {
          willpowerCost: 5,
          resources: { meaningScore: 5 },
          identityStage: 'denial',
          narrative: '你开始整理。这是你作为"自己的项目经理"的第一天。'
        }
      },
      {
        text: '先回家睡觉，明天再说',
        effects: {
          willpowerCost: 0,
          resources: { meaningScore: -5 },
          identityStage: 'denial',
          narrative: '你回到家，把三张纸塞进抽屉。等你打开时，已过了两周。'
        }
      }
    ]
  },
  {
    id: 'transition_2',
    month: 0, weekInMonth: 2,
    title: '药盒',
    scene: '家中 · 早晨',
    category: 'medication',
    narrative: `你买了一个7格药盒。
把一天的药分成早、中、晚三份。
每格里面有2-4颗不同颜色的药丸。

你盯着它们看了很久。
这些药将陪伴你**每一天**。
不是一周，不是一个月——
是**从现在开始**。

你的第一个选择：
今天的第一顿药，你吃吗？`,
    choices: [
      {
        text: '按说明书认真服用每一颗',
        effects: {
          willpowerCost: 3,
          medicationEffect: { medId: 'metformin', adherenceDelta: 0 },
          narrative: '药片在喉咙里慢慢滑下去。这是你的新晨间仪式。'
        }
      },
      {
        text: '"只是第一天，我先适应适应"',
        effects: {
          willpowerCost: 0,
          medicationEffect: { medId: 'metformin', adherenceDelta: -8 },
          narrative: '你把药盒放在桌上。它在那里坐了一整天，像一双审判的眼睛。'
        }
      }
    ]
  },
  {
    id: 'transition_3',
    month: 0, weekInMonth: 3,
    title: '否认',
    scene: '办公室',
    category: 'workplace',
    narrative: `同事问你为什么瘦了。
"健身。"你说。
他们问你怎么脸色不太好。
"最近熬夜了。"你说。

你没有告诉他们真相。
不是因为他们不会理解——
而是因为你**自己还不相信**。

你在心里对自己说：
"这只是暂时的。我会好的。"

但药盒还在口袋里。
血糖仪还在包里。
诊断书还在手机相册里。

**你还在否认。**`,
    choices: [
      {
        text: '继续隐瞒，表现得一切正常',
        effects: {
          willpowerCost: 10,
          resources: { workPerformance: 5, relationshipCapital: -5 },
          narrative: '你笑了笑，说最近在控制饮食。你的谎言越来越流畅了。'
        }
      },
      {
        text: '告诉一个最信任的同事',
        effects: {
          willpowerCost: 15,
          resources: { workPerformance: -5, relationshipCapital: 10, disclosureLevel: 'partial' },
          identityStage: 'anger',
          narrative: `她的表情从关心变成恐惧，再变成不知道说什么。
"会好的。"她最后说。
你点了点头。你知道不会。`
        }
      }
    ]
  },
  {
    id: 'transition_4',
    month: 0, weekInMonth: 4,
    title: '第一次复查',
    scene: '医院 · 内分泌科',
    category: 'healthcare',
    narrative: `候诊区坐满了人。
你注意到他们的表情——
不是痛苦，是**疲倦**。
慢性病患者的疲倦：每一周都要来，
每一次都要抽血，等结果，调药，再来。

医生看了你的报告，5秒钟。
"继续当前方案。三个月后来复诊。"

你想问很多问题。
但门外还有20个人等着。

你的5分钟结束了。`,
    choices: [
      {
        text: '鼓起勇气追问："我需要特别注意什么？"',
        effects: {
          willpowerCost: 8,
          resources: { meaningScore: 5 },
          narrative: `医生推了推眼镜："按时吃药，控制饮食，规律运动。"
他顿了顿："最重要的一点——不要自己停药。"
你走了出来，发现手里多了三张检查单。`
        }
      },
      {
        text: '默默出来，自己上网查',
        effects: {
          willpowerCost: 2,
          resources: { meaningScore: -3 },
          narrative: `你在搜索引擎输入你的诊断代码。
前三条是广告。第四条是"能活多久"。
你关掉了手机。`
        }
      }
    ]
  }
]

// ─── 月度循环事件模板（按月内周次分类） ───

// 第一周：稳定期管理
export const WEEK1_EVENTS_CHRONIC: ChronicEvent[] = [
  {
    id: 'cw1_med_check',
    month: -1, weekInMonth: 1,
    title: '药物调整窗口',
    scene: '家中',
    category: 'medication',
    narrative: `医生根据上月数据调整了你的方案。
新的剂量，新的服药时间。
你需要重新建立习惯。

问题来了：
之前的方案你刚适应。
现在一切又要重新开始。`,
    choices: [
      {
        text: '严格执行新方案',
        effects: {
          willpowerCost: 8,
          physiology: { chronic: { allostaticLoad: -2 } },
          medicationEffect: { medId: 'metformin', adherenceDelta: 5 },
          narrative: '你设了三个手机闹钟。新的routine，新的挣扎。'
        }
      },
      {
        text: '渐进调整，先保持旧习惯',
        effects: {
          willpowerCost: 3,
          medicationEffect: { medId: 'metformin', adherenceDelta: -3 },
          narrative: '你告诉自己"慢慢来"。但你知道"慢慢来"有时候就是"没来"。'
        }
      }
    ]
  },
  {
    id: 'cw1_work_eval',
    month: -1, weekInMonth: 1,
    title: '季度评估',
    scene: '办公室 · 会议室',
    category: 'workplace',
    narrative: `季度绩效评估。
你的数据还行——但没有以前好。
领导没有明说，但你感觉到那层意思：
"你最近是不是状态不太好？"

你的秘密正在被工作数据出卖。`,
    choices: [
      {
        text: '公开病情，申请合理便利',
        effects: {
          willpowerCost: 20,
          resources: { workPerformance: -10, disclosureLevel: 'full', relationshipCapital: 5 },
          narrative: `领导沉默了很久。"我们会考虑的。"
你不知道这是保护还是审判。但至少你不用再撒谎了。`
        }
      },
      {
        text: '继续隐瞒，用加班弥补',
        effects: {
          willpowerCost: 15,
          resources: { workPerformance: 5 },
          physiology: { neural: { cognitiveReserve: -3 }, chronic: { sleepPressure: 8 } },
          narrative: '你留下来多待了两小时。效率不高，但至少看起来很努力。'
        }
      }
    ]
  }
]

// 第二周：累积效应
export const WEEK2_EVENTS_CHRONIC: ChronicEvent[] = [
  {
    id: 'cw2_side_effects',
    month: -1, weekInMonth: 2,
    title: '副作用的代价',
    scene: '家中 · 浴室',
    category: 'medication',
    narrative: `你站在镜子前，看着自己的脸。
SSRI让体重增加了4公斤。
β受体阻滞剂让你连跑步都跑不动。
二甲双胍的胃肠道反应让你每天早上都很难受。

药物在帮你，也在改变你。
你开始理解一个词：**医源性伤害**。`,
    choices: [
      {
        text: '接受副作用，继续服药',
        effects: {
          willpowerCost: 10,
          medicationEffect: { medId: 'ssri', adherenceDelta: 5 },
          narrative: '你对自己说：活着最重要。体重以后再说。'
        }
      },
      {
        text: '偷偷减量试试',
        effects: {
          willpowerCost: 3,
          medicationEffect: { medId: 'ssri', adherenceDelta: -15 },
          physiology: { neural: { hpaRegulation: -5 } },
          narrative: `你把药片掰成两半。
第二天，你感到一种奇怪的电击感从后脑勺传到指尖。
**停药综合征。**
你赶紧把另一半也吃了。`
        }
      }
    ]
  },
  {
    id: 'cw2_social',
    month: -1, weekInMonth: 2,
    title: '被排除的晚餐',
    scene: '朋友聚餐',
    category: 'social',
    narrative: `朋友们约了聚餐。
你不能喝酒（药物冲突）。
你不能熬夜（睡眠压力）。
你不能吃大部分菜（饮食控制）。

你坐在桌上，看着他们碰杯、大笑。
你笑了笑，说你"最近养生"。

晚上回家，你意识到：
你失去的不只是健康。
你失去了**正常的社交生活**。`,
    choices: [
      {
        text: '以后少参加这种聚会',
        effects: {
          willpowerCost: 3,
          resources: { socialDays: -2, relationshipCapital: -5, meaningScore: -5 },
          narrative: '你退出了群聊。世界变小了一点。'
        }
      },
      {
        text: '找到适合慢性病人的社交方式',
        effects: {
          willpowerCost: 10,
          resources: { socialDays: 1, relationshipCapital: 5, meaningScore: 5 },
          narrative: `你约了一个朋友去公园散步。
不喝酒，不熬夜。
只是走路，聊天。
你发现：真正的朋友不需要酒精。`
        }
      }
    ]
  }
]

// 第三周：危机窗口
export const WEEK3_EVENTS_CHRONIC: ChronicEvent[] = [
  {
    id: 'cw3_breakthrough',
    month: -1, weekInMonth: 3,
    title: '突破性疼痛',
    scene: '办公室',
    category: 'crisis',
    narrative: `药效不够了。
原本控制好的症状突然加重。
你坐在工位上，额头冒汗。

这不是游戏里的红色数字。
这是你身体的**真实信号**。

你有三个选择：
加量？忍耐？还是寻找其他途径？`,
    choices: [
      {
        text: '打电话给医生，要求加急就诊',
        effects: {
          willpowerCost: 12,
          resources: { medicalDebt: 800, workPerformance: -5 },
          physiology: { chronic: { allostaticLoad: -3 } },
          narrative: '等了三天才排上号。但调药后确实好了一些。'
        }
      },
      {
        text: '忍耐，等下次复诊再说',
        effects: {
          willpowerCost: 5,
          physiology: { chronic: { allostaticLoad: 5 }, neural: { cognitiveReserve: -3 } },
          narrative: `你咬着牙撑过去了。
但你的身体记住了这一次的疼痛。
它在累积。像一份没有利息上限的贷款。`
        }
      },
      {
        text: '试试病友推荐的偏方',
        effects: {
          willpowerCost: 8,
          resources: { medicalDebt: 500, meaningScore: 3 },
          physiology: { immune: { inflammation: 3 }, chronic: { allostaticLoad: 2 } },
          narrative: `一个病友群里的"偏方"。你不确定有没有用。
但当你走投无路时，任何稻草都像救生圈。`
        }
      }
    ]
  },
  {
    id: 'cw3_work_conflict',
    month: -1, weekInMonth: 3,
    title: '时间冲突',
    scene: '医院走廊',
    category: 'healthcare',
    narrative: `下周二上午：
- 内分泌复查（调药关键期，不能改期）
- 项目路演（晋升关键，不能缺席）
- 孩子家长会（承诺过的，家庭关系敏感）

三个日历事件叠在一起。
没有完美解，只有权衡。`,
    choices: [
      {
        text: '健康优先：去复查',
        effects: {
          willpowerCost: 10,
          resources: { workPerformance: -15, relationshipCapital: -5 },
          physiology: { chronic: { allostaticLoad: -2 } },
          narrative: '你跟领导请了病假。他的沉默比拒绝更让人难受。'
        }
      },
      {
        text: '职业优先：去路演',
        effects: {
          willpowerCost: 8,
          resources: { workPerformance: 10, medicalDebt: 200 },
          physiology: { metabolic: { glucoseStability: -5 }, chronic: { allostaticLoad: 3 } },
          narrative: '路演很成功。但你的血糖仪显示了一个让你不安的数字。'
        }
      },
      {
        text: '家庭优先：去家长会',
        effects: {
          willpowerCost: 8,
          resources: { relationshipCapital: 10, workPerformance: -5, medicalDebt: 200 },
          physiology: { neural: { hpaRegulation: -3 } },
          narrative: `孩子看到你来，笑了。
那一刻你觉得：为了这个笑容，血糖高一点也值得。
但医生不会同意。`
        }
      }
    ]
  }
]

// 第四周：审计与调整
export const WEEK4_EVENTS_CHRONIC: ChronicEvent[] = [
  {
    id: 'cw4_debt',
    month: -1, weekInMonth: 4,
    title: '月度账单',
    scene: '家中 · 书桌',
    category: 'existential',
    narrative: `你打开银行APP。

本月医疗支出：
- 药物自付：¥${(1800 + Math.random() * 600).toFixed(0)}
- 检查自费：¥${(600 + Math.random() * 400).toFixed(0)}
- 营养补充：¥320
- 专家号：¥300

总计：超过月收入的20%。

你开始计算：如果不吃营养补充，能不能省一点？
如果减少复查频率呢？

但每一个"省"字背后，都是身体的风险。`,
    choices: [
      {
        text: '全额支付，不省',
        effects: {
          willpowerCost: 5,
          resources: { medicalDebt: 2800 },
          narrative: '你叹了口气，按了转账。钱可以再赚，身体不会重来。'
        }
      },
      {
        text: '停掉营养补充，减少一次检查',
        effects: {
          willpowerCost: 3,
          resources: { medicalDebt: 1500 },
          physiology: { immune: { immuneCompetence: -3 }, chronic: { allostaticLoad: 2 } },
          narrative: '你划掉了两项支出。身体不会立刻抗议，但它会记住。'
        }
      }
    ]
  },
  {
    id: 'cw4_meaning',
    month: -1, weekInMonth: 4,
    title: '深夜的自问',
    scene: '卧室 · 凌晨',
    category: 'existential',
    narrative: `又是一个失眠的夜晚。
不是因为疼痛——药效还行。
而是因为一个问题在脑子里转：

"这样活着，有什么意义？"

每天吃药、检查、控制饮食、限制活动。
你的生活变成了**管理一具身体**。
不是享受、不是创造、不是爱——
只是维持。

但如果维持本身就有价值呢？`,
    choices: [
      {
        text: '开始写病友日记，分享经验',
        effects: {
          willpowerCost: 10,
          resources: { meaningScore: 15 },
          identityStage: 'acceptance',
          narrative: `你打开了一个新的文档。
标题写的是："Day 1 of the Rest of My Life."
你写下了第一段话。
这可能是你做过的最勇敢的事。`
        }
      },
      {
        text: '翻个身，强迫自己入睡',
        effects: {
          willpowerCost: 2,
          resources: { meaningScore: -5 },
          physiology: { chronic: { sleepPressure: 5 } },
          narrative: '你闭上眼睛。问题还在。但至少今晚不回答也可以。'
        }
      }
    ]
  }
]

// ─── 月度差异化事件（每月独特主题） ───

// 月2：学习曲线
const MONTH2_EVENTS: ChronicEvent[] = [
  {
    id: 'm2_excel', month: 2, weekInMonth: 1,
    title: '17种指标', scene: '家中 · 书桌', category: 'existential',
    narrative: `你建了一个Excel表格。\n17列，每列一种指标。\n血糖、血压、心率、情绪、睡眠质量……\n\n你开始理解什么叫"数据驱动的生活"。\n也理解了什么叫"过度思考"。`,
    choices: [
      { text: '认真追踪，发现规律', effects: { willpowerCost: 8, resources: { meaningScore: 8 }, narrative: '你在数据中看到了模式。血糖在周三偏高——因为周二加班。' } },
      { text: '算了，太累了', effects: { willpowerCost: 0, resources: { meaningScore: -3 }, narrative: '你关掉了电脑。有些事，不看反而更好。' } }
    ]
  },
  {
    id: 'm2_drug_swap', month: 2, weekInMonth: 2,
    title: '病友群的药', scene: '微信 · 病友群', category: 'social',
    narrative: `病友群里有人私信你：\n"我这个月多开了两盒，你要不要？"\n\n你知道这是违规的。\n但医保限额让你上个月自费了1200。\n\n这是灰色地带。`,
    choices: [
      { text: '接受调剂，省600块', effects: { willpowerCost: 3, resources: { medicalDebt: -600, relationshipCapital: 5 }, physiology: { chronic: { allostaticLoad: 1 } }, narrative: '你拿到了药。包装是真的。但你不知道它经过了什么。' } },
      { text: '婉拒，走正规渠道', effects: { willpowerCost: 5, resources: { medicalDebt: 800 }, narrative: '你买了正价的药。钱包又瘪了一点，但心安。' } }
    ]
  },
  {
    id: 'm2_second_opinion', month: 2, weekInMonth: 3,
    title: '第二诊疗意见', scene: '三甲医院 · 专家门诊', category: 'healthcare',
    narrative: `你挂了另一个专家的号。\n300块，等了3小时，看了5分钟。\n\n他说的话和你的主治医不一样。\n\n现在你有两个互相矛盾的专业意见。\n而你——一个非医学背景的人——\n必须做出选择。`,
    choices: [
      { text: '信新专家，要求调药', effects: { willpowerCost: 12, resources: { medicalDebt: 1500 }, physiology: { metabolic: { glucoseStability: 3 }, chronic: { allostaticLoad: -2 } }, narrative: '换了方案。新药副作用更小，但费用更高。' } },
      { text: '信原主治医，维持不变', effects: { willpowerCost: 3, narrative: '你选择信任熟悉你的人。即使他只看了5分钟。' } }
    ]
  },
  {
    id: 'm2_routine', month: 2, weekInMonth: 4,
    title: '新节奏', scene: '家中 · 早晨', category: 'medication',
    narrative: `两个月了。\n你终于建立了某种节奏：\n7:00 闹钟响，二甲双胍\n7:30 早餐，测血糖\n12:00 午餐后，β阻滞剂\n22:00 睡前，免疫调节剂\n\n这不再是"治疗"。\n这是你的**新生活**。`,
    choices: [
      { text: '接受这个节奏', effects: { willpowerCost: 0, resources: { meaningScore: 5 }, medicationEffect: { medId: 'metformin', adherenceDelta: 10 }, narrative: '你不再需要闹钟了。身体记住了时间。' } },
      { text: '还是怀念以前的生活', effects: { willpowerCost: 5, resources: { meaningScore: -5 }, narrative: '你看着窗外的晨跑者，关上了闹钟。今天的药晚了两小时。' } }
    ]
  }
]

// 月4：多米诺骨牌（并发症期）
const MONTH4_EVENTS: ChronicEvent[] = [
  {
    id: 'm4_retina', month: 4, weekInMonth: 1,
    title: '视网膜筛查', scene: '眼科', category: 'healthcare',
    narrative: `糖尿病带来了视网膜病变筛查。\n你盯着那个仪器，瞳孔被放大。\n\n医生说："目前还好。但需要每年查。"\n\n"目前还好"——\n这四个字现在对你来说意味着：\n**还有时间。**`,
    choices: [
      { text: '认真记录，加入年度检查计划', effects: { willpowerCost: 5, resources: { medicalDebt: 600, meaningScore: 3 }, narrative: '你把眼科加入了你的17列Excel。现在是18列了。' } },
      { text: '松了口气，暂时不想', effects: { willpowerCost: 0, narrative: '你决定先不想这件事。反正目前还好。' } }
    ]
  },
  {
    id: 'm4_contradict', month: 4, weekInMonth: 2,
    title: '矛盾的建议', scene: '诊室', category: 'healthcare',
    narrative: `心内科医生说："你需要规律运动。"\n风湿科医生说："你需要减少关节负担。"\n营养师说："你需要高蛋白饮食。"\n肾内科说："你需要限制蛋白质摄入。"\n\n你拿着四张互相矛盾的建议，\n突然理解了什么叫**分形伤害**——\n每个专科只见自己那棵树，\n只有你是被迫看见整片森林的人。`,
    choices: [
      { text: '综合权衡，制定折中方案', effects: { willpowerCost: 15, resources: { meaningScore: 5 }, physiology: { chronic: { allostaticLoad: -2 } }, narrative: '你花了整个周末研究。折中方案不完美，但至少是你自己的。' } },
      { text: '听从最新看的那个医生', effects: { willpowerCost: 3, physiology: { chronic: { allostaticLoad: 1 } }, narrative: '你选择了肾内科的建议。因为他的号最难挂，所以一定最对。不一定。' } }
    ]
  },
  {
    id: 'm4_polypharmacy', month: 4, weekInMonth: 3,
    title: '药物交互', scene: '家中 · 药盒', category: 'medication',
    narrative: `你的药从3种变成了5种。\n你突然意识到一个可怕的事实：\n5种药 = 10种两两交互。\n\n你开始在网上查每一种组合。\n搜索结果让你更焦虑了。\n\n"请咨询您的医生"\n——你的医生下次有空是两周后。`,
    choices: [
      { text: '整理全部药物清单，挂号咨询药师', effects: { willpowerCost: 10, resources: { medicalDebt: 300 }, physiology: { chronic: { allostaticLoad: -1 } }, narrative: '药师帮你梳理了。有一对确实有冲突，需要调整时间。你庆幸自己查了。' } },
      { text: '按目前方案继续，有不舒服再说', effects: { willpowerCost: 0, physiology: { neural: { cognitiveReserve: -2 } }, narrative: '你决定赌一把。大部分时间，你的身体不会告诉你正在发生什么。直到太晚。' } }
    ]
  },
  {
    id: 'm4_blood_draw', month: 4, weekInMonth: 4,
    title: '第8管血', scene: '检验科', category: 'healthcare',
    narrative: `护士找到了你肘弯的静脉。\n"又是你啊。"她笑了。\n\n你已经来了太多次，\n以至于护士都认识你了。\n\n这个月抽了8管血。\n你的手臂上全是淤青。\n\n你开玩笑说："再抽下去我要贫血了。"\n护士没笑。\n\n**因为这不是玩笑。**`,
    choices: [
      { text: '申请植入输液港，减少扎针', effects: { willpowerCost: 8, resources: { medicalDebt: 3000 }, narrative: '小手术，局麻。胸壁下多了一个小鼓包。但至少不用再被扎了。' } },
      { text: '忍着，再抽几次也没事', effects: { willpowerCost: 2, physiology: { metabolic: { mitochondrialHealth: -1 }, immune: { immuneCompetence: -2 } }, narrative: '你咬着牙。第9管。你的血管开始讨厌你了。' } }
    ]
  }
]

// 月7：新基线（Q3开始）
const MONTH7_EVENTS: ChronicEvent[] = [
  {
    id: 'm7_normal', month: 7, weekInMonth: 1,
    title: '什么是"正常"', scene: '公园', category: 'existential',
    narrative: `你看到一个跑步的人。\n他跑得很轻松，耳机里放着音乐。\n\n你看着他，想起自己以前也这样跑。\n7个月了。你已经不记得"正常"是什么感觉。\n\n但你在"不正常"中找到了新的节奏。\n这不是接受。\n这是**适应**。`,
    choices: [
      { text: '尝试慢跑，用你的新节奏', effects: { willpowerCost: 12, physiology: { cardio: { cardiacReserve: 3, vascularElasticity: 1 }, chronic: { allostaticLoad: -2 } }, resources: { meaningScore: 8 }, narrative: '你跑了200米。气喘吁吁。但你笑了。这是7个月来你第一次跑。' } },
      { text: '散步就好，不勉强', effects: { willpowerCost: 3, resources: { meaningScore: 3 }, narrative: '你走了三圈。膝盖没抗议。这就是你的新"正常"。' } }
    ]
  },
  {
    id: 'm7_caregiver', month: 7, weekInMonth: 2,
    title: '照顾者疲劳', scene: '家中 · 客厅', category: 'social',
    narrative: `伴侣在厨房里默默收拾。\n你已经记不清上一次做饭是什么时候了。\n\n他/她从不说累。但你能看到：\n黑眼圈，叹气的频率，沉默的时间变长。\n\n慢性病人的伴侣也有一种慢性病——\n叫**照顾者疲劳**。\n而你知道，离婚率+40%不是空话。`,
    choices: [
      { text: '认真谈一次，承认自己也看到对方的辛苦', effects: { willpowerCost: 15, resources: { relationshipCapital: 15 }, narrative: '你们坐在沙发上，第一次认真地谈论这件事。没有解决方案。但至少不再假装没事。' } },
      { text: '默默做一件力所能及的家务', effects: { willpowerCost: 8, resources: { relationshipCapital: 5 }, physiology: { chronic: { allostaticLoad: 2 } }, narrative: '你洗了碗。手在抖，但洗完了。对方回来看到干净的碗，什么也没说。' } }
    ]
  },
  {
    id: 'm7_old_friend', month: 7, weekInMonth: 3,
    title: '老友的婚礼', scene: '婚礼现场', category: 'social',
    narrative: `你收到了请帖。\n你犹豫了很久。\n\n你不能喝酒、不能熬夜、不能吃大部分菜。\n但你去了一一换好衣服，带好药。\n\n婚礼上有人问："最近怎么样？"\n你说："挺好的。"\n\n这是一个标准的谎言。\n但今晚，你允许自己相信一次。`,
    choices: [
      { text: '待到最后一刻，融入人群', effects: { willpowerCost: 15, resources: { socialDays: -2, relationshipCapital: 10, meaningScore: 5 }, physiology: { chronic: { sleepPressure: 10 } }, narrative: '你撑到了散场。回家的路上你在车里睡着了。但你不后悔。' } },
      { text: '提前离场，保重身体', effects: { willpowerCost: 5, resources: { relationshipCapital: -3 }, narrative: '你在蛋糕环节前离开了。没有人注意到。这让你有点难过，也有点释然。' } }
    ]
  },
  {
    id: 'm7_rebuild', month: 7, weekInMonth: 4,
    title: '重建', scene: '家中 · 书桌', category: 'existential',
    narrative: `7个月了。\n你翻开手机相册，看到7个月前的自己。\n那时候你不知道"慢性"意味着什么。\n\n现在你知道了：\n慢性意味着每天。\n每天吃药、每天选择、每天与身体谈判。\n\n但你还在这里。\n而你面前的选择是：\n**仅仅活着，还是在活着的基础上建构意义？**`,
    choices: [
      { text: '开始做一件新的事情（写博客/画画/学乐器）', effects: { willpowerCost: 12, resources: { meaningScore: 20 }, narrative: '你打开了一个新文档。标题是："Day 1"。和7个月前出院那天一样。但这一次，你是主动选择的。' } },
      { text: '继续维持现状就好', effects: { willpowerCost: 0, resources: { meaningScore: -3 }, narrative: '你关上了手机。今天不做决定。明天再说。' } }
    ]
  }
]

// 月10：长期共处
const MONTH10_EVENTS: ChronicEvent[] = [
  {
    id: 'm10_anniversary', month: 10, weekInMonth: 1,
    title: '周年', scene: '医院 · 候诊区', category: 'existential',
    narrative: `你在候诊区等号。\n旁边坐着一个新确诊的年轻人。\n他看着手中的检查单，表情像10个月前的你。\n\n你想说点什么。\n但你不知道说什么。\n\n"会好的"——你知道这是谎言。\n"习惯就好了"——这是真话，但没有人想听。`,
    choices: [
      { text: '和他聊聊，分享你的经验', effects: { willpowerCost: 10, resources: { meaningScore: 15, relationshipCapital: 5 }, identityStage: 'acceptance', narrative: '你说："第一个月最难。之后你会发现，你能做到的事比你以为的多。"他没回答。但他的手不抖了。' } },
      { text: '默默等待，不打扰', effects: { willpowerCost: 0, narrative: '你低下头。每个人都有自己的路。你能做的只是走好自己的。' } }
    ]
  },
  {
    id: 'm10_wearable', month: 10, weekInMonth: 2,
    title: '可穿戴的焦虑', scene: '家中', category: 'medication',
    narrative: `你买了智能手表。\n24小时监测心率、血氧、睡眠。\n\n数据很美——折线图、柱状图、趋势线。\n但你发现自己每小时看一次。\n\n一个念头浮现：\n**你是在管理身体，还是身体在管理你？**`,
    choices: [
      { text: '设定查看频率限制（每天2次）', effects: { willpowerCost: 5, resources: { meaningScore: 5 }, narrative: '你删掉了实时推送。每天早上和晚上各看一次。数据为辅，感受为主。' } },
      { text: '全时段监控，不错过任何信号', effects: { willpowerCost: 8, resources: { meaningScore: -10 }, physiology: { neural: { cognitiveReserve: -3 } }, narrative: '你的生活变成了对数字的恐惧。62——太高了。58——是不是太低了？55——正常。但为什么你觉得不正常？' } }
    ]
  },
  {
    id: 'm10_advocacy', month: 10, weekInMonth: 3,
    title: '政策提案', scene: '社区中心', category: 'social',
    narrative: `病友组织推举你参加一个政策建议会。\n议题：慢性病患者医疗保障。\n\n你准备了一页纸的建议——\n都是你这10个月亲身经历的痛点。\n\n你坐在一群西装革履的人中间，\n穿着洗了不知道多少次的外套，\n口袋里还装着今天的药。\n\n你是这里唯一一个**真正知道**\n"慢性"意味着什么的人。`,
    choices: [
      { text: '站起来发言', effects: { willpowerCost: 20, resources: { meaningScore: 25, relationshipCapital: 10 }, narrative: '你的声音在发抖。但你说完了。散会时有人走过来："你说得好。我们会考虑。"你不确定他们会不会。但你说了。' } },
      { text: '把建议书交给组织者，自己不发言', effects: { willpowerCost: 5, resources: { meaningScore: 5 }, narrative: '你把那页纸放在了建议箱里。它可能会被看到。也可能不会。' } }
    ]
  },
  {
    id: 'm10_balance', month: 10, weekInMonth: 4,
    title: '平衡', scene: '家中 · 窗边', category: 'existential',
    narrative: `10个月了。\n你坐在窗边，看着夕阳。\n\n身体在稳定——至少目前是。\n药物在起效——虽然副作用还在。\n生活在继续——虽然和以前不一样。\n\n你不再追求"治愈"。\n你在追求一种更微妙的东西：\n**在斩杀线上方悬停。**\n\n用持续的劳动、警惕和妥协，\n维持一种脆弱的平衡。\n\n这就是你的生活。\n不完美，但是你的。`,
    choices: [
      { text: '微笑，继续明天', effects: { willpowerCost: 3, resources: { meaningScore: 10 }, narrative: '你站起身，走到药盒前。明天的药已经分好了。你拿出一颗，就着温水咽下。这是你的晚间仪式。' } },
      { text: '允许自己今天不坚强', effects: { willpowerCost: 0, resources: { meaningScore: 3 }, narrative: '你哭了。不为任何具体的事。只是哭了。然后擦干眼泪，按时吃了药。' } }
    ]
  }
]

// ─── 获取当周事件（支持月度差异化） ───
export function getChronicEventsForWeek(weekInMonth: number, month?: number): ChronicEvent[] {
  // 月度专属事件
  const monthEvents: Record<number, ChronicEvent[]> = {
    2: MONTH2_EVENTS,
    4: MONTH4_EVENTS,
    7: MONTH7_EVENTS,
    10: MONTH10_EVENTS,
  }

  if (month && monthEvents[month]) {
    const events = monthEvents[month]
    return events.filter(e => e.weekInMonth === weekInMonth)
  }

  // 默认回退到通用周事件
  switch (weekInMonth) {
    case 1: return WEEK1_EVENTS_CHRONIC
    case 2: return WEEK2_EVENTS_CHRONIC
    case 3: return WEEK3_EVENTS_CHRONIC
    case 4: return WEEK4_EVENTS_CHRONIC
    default: return WEEK1_EVENTS_CHRONIC
  }
}
