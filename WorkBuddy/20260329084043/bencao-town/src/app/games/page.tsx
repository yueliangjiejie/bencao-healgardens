'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { dataService } from '@/lib/data-service'
import {
  Play, Trophy, Star, Clock, Zap, ChevronRight, RotateCcw,
  Check, Sword, Shield, Crown, Target, Flame, Sparkles,
  ArrowLeft, X, Lock, BookOpen
} from 'lucide-react'

// 懒加载《生理极限》游戏组件
const PhysioLimitGame = dynamic(() => import('@/components/games/PhysioLimitGame'), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl animate-pulse mb-3">⚡</div>
        <p className="text-sm text-gray-400">加载生理极限...</p>
      </div>
    </div>
  ),
  ssr: false
})

// ══════════════════════════════════════
//  接食物游戏数据
// ══════════════════════════════════════
const FOOD_ITEMS = [
  { emoji: '🥬', name: '白菜', score: 10, type: 'good' },
  { emoji: '🍎', name: '苹果', score: 15, type: 'good' },
  { emoji: '🍵', name: '绿茶', score: 20, type: 'good' },
  { emoji: '🥗', name: '沙拉', score: 25, type: 'good' },
  { emoji: '🍲', name: '药膳', score: 30, type: 'good' },
  { emoji: '🍔', name: '汉堡', score: -15, type: 'bad' },
  { emoji: '🍰', name: '蛋糕', score: -20, type: 'bad' },
  { emoji: '🧋', name: '全糖奶茶', score: -25, type: 'bad' },
]

// ══════════════════════════════════════
//  记忆翻牌游戏
// ══════════════════════════════════════
const CARD_PAIRS = [
  { emoji: '🌿', name: '薄荷' },
  { emoji: '🍵', name: '绿茶' },
  { emoji: '🌸', name: '玫瑰' },
  { emoji: '🫚', name: '生姜' },
  { emoji: '🫘', name: '赤小豆' },
  { emoji: '🍄', name: '灵芝' },
]

// ══════════════════════════════════════
//  每日养生打卡
// ══════════════════════════════════════
const DAILY_TASKS = [
  { id: 'water', name: '喝够8杯水', emoji: '💧', points: 5 },
  { id: 'walk', name: '步行8000步', emoji: '🚶', points: 10 },
  { id: 'sleep', name: '23点前入睡', emoji: '😴', points: 8 },
  { id: 'tea', name: '喝一杯养生茶', emoji: '🍵', points: 5 },
  { id: 'vegetable', name: '吃够5份蔬果', emoji: '🥬', points: 8 },
  { id: 'meditate', name: '冥想5分钟', emoji: '🧘', points: 6 },
]

// ══════════════════════════════════════
//  21天减脂训练营课程数据（从demo迁移）
// ══════════════════════════════════════
interface CourseItem {
  icon: string; name: string; brief: string;
  tag: string; tagClass: string; detail: string; tip: string;
}

interface CoursePhase {
  phase: number; label: string; name: string; desc: string;
  items: CourseItem[];
}

const COURSE_DATA: CoursePhase[] = [
  {
    phase: 1, label: '第一周', name: '🌱 认知觉醒期',
    desc: 'Day 1-7 · 建立正确的减脂认知，制定个人方案',
    items: [
      { icon:'📖', name:'减脂的唯一真理：热量缺口',
        brief:'减肥本质=摄入<消耗。不存在"某种食物就瘦"，只要没有热量缺口。',
        tag:'认知', tagClass:'learn',
        detail:'能量账户模型：把身体比作"能量账户"，食物是收入，代谢和运动是支出。只有收入小于支出，体脂才会减少。\n\n合理热量缺口：每日300-750大卡（大基数可用1000+）。过大会导致饥饿、代谢下降和反弹。',
        tip:'用小马记录每日饮食和体重，直观了解热量收支！' },
      { icon:'🧠', name:'省力学：方向比意志力更重要',
        brief:'先有省力的方法论再强调执行。"少吃多动"太抽象，长期大概率失败。',
        tag:'认知', tagClass:'learn',
        detail:'运动、健身、营养、减脂是四件事。本次行动营的目的不是减多少斤，而是通过21天不断认识-实践-再认识-再实践，最终掌握契合自身的可持续减脂系统。',
        tip:'每一次打卡都要围绕认知升级和方案调整来写。' },
      { icon:'🎯', name:'制定你的个人减脂方案',
        brief:'7天内必须完成！根据TDEE、饮食偏好、生活节奏设计专属方案。',
        tag:'行动', tagClass:'action',
        detail:'方案要素：\n① 计算个人TDEE（基础代谢+日常活动）\n② 设定目标热量（TDEE-300~750大卡）\n③ 列出可执行的食物清单\n④ 安排运动计划（每周3-5次）\n⑤ 设定弹性规则（每周1-2天允许超标）',
        tip:'方案要可持续——如果觉得痛苦，说明需要调整！' },
      { icon:'📝', name:'体验与可持续性原则',
        brief:'方案不仅要有效更要能坚持。优先高蛋白低热量密度食物，保留美味弹性。',
        tag:'认知', tagClass:'learn',
        detail:'提升体验三关键：\n🥩 饱腹感——优先高蛋白、低热量密度食物\n🍜 美味——一周安排1-2顿"美味食物"\n⚡ 便利性——选择自己能长期操作的方式',
        tip:'拳头估算：1拳≈150g蔬菜/100g肉/100g主食！' },
      { icon:'⚔️', name:'Boss战：停滞怪（Day 7）',
        brief:'体重连续3天不变？累计消耗3500kcal击败它！XP获取减半模拟平台期。',
        tag:'Boss', tagClass:'boss',
        detail:'第一关Boss「停滞怪」\n触发条件：体重连续3天不变\n血量：需累计消耗3500kcal\n特殊机制：此期间XP获取减半\n掉落：突破徽章 + 马粮币×50',
        tip:'平台期不是失败标志，是身体调整必要阶段！' }
    ]
  },
  {
    phase: 2, label: '第二周', name: '🔥 突破深化期',
    desc: 'Day 8-14 · 掌握科学方法论，迎战心理诱惑',
    items: [
      { icon:'🔬', name:'循证减脂：学点科学再行动',
        brief:'了解BMR、TDEE、TEF。用数据而非直觉指导决策。',
        tag:'认知', tagClass:'learn',
        detail:'核心科学概念：\n📊 BMR（基础代谢率）约占总消耗60-70%\n⚡ TDEE=BMR×活动系数(久坐1.2/轻活动1.375/中活动1.55)\n🍃 TEF：消化食物本身消耗的热量(蛋白质最高20-30%)\n⚠️ 代谢适应是正常生理反应',
        tip:'计算TDEE后先减300-500观察2周，不要一步到位！' },
      { icon:'⚖️', name:'动态平衡：饮食vs运动的博弈',
        brief:'初期饮食70%+运动30%，中期50/50，维持期40/60。不过分强调任何一方。',
        tag:'认知', tagClass:'learn',
        detail:'不同阶段的转移：\n🌱 初期（饮食70%+运动30%）获较快反馈\n🏋️ 中期（50/50）增加力量训练保留肌肉\n🏃 维持期（40/60）运动提升防反弹',
        tip:'推荐每周150-300分钟有氧+2次力量训练。' },
      { icon:'🧘', name:'中医体质与个性化调理',
        brief:'结合9种体质测评结果，匹配专属调理方案。体质不同策略不同。',
        tag:'实践', tagClass:'practice',
        detail:'9种体质 × 专属策略：\n💚平和质：保持均衡效果+20%\n💙气虚质：八段锦效果×2多吃益气\n🧡阳虚质：药浴艾灸注意保暖\n💜阴虚质：冥想太极忌辛辣\n💧痰湿质：拔罐祛湿清淡饮食\n🔥湿热质：茶饮忌油腻\n💗血瘀质：按摩拍打活血\n🌿气郁质：唱歌跳舞社交减压\n🛡️特禀质：过敏管理远离过敏原',
        tip:'使用匹配体质的药膳卡牌，效果翻倍！去中医馆查看推荐。' },
      { icon:'😈', name:'Boss战：诱惑魔（Day 14）',
        brief:'心理弹窗攻击？"放弃吧""吃一口没关系"？用坚持盾+愿景剑反击！',
        tag:'Boss', tagClass:'boss',
        detail:'第二关Boss「诱惑魔」\n触发条件：人体适应周期14天自然出现\n攻击方式：心理弹窗——\n"放弃吧都两周了放松一下"\n"吃一口又不会胖回来"\n"今天好累明天再说吧"\n武器库：坚持盾+愿景剑+盟友召唤',
        tip:'触发完美一天Combo可大幅削弱诱惑魔攻击力！' }
    ]
  },
  {
    phase: 3, label: '第三周', name: '👑 习惯固化期',
    desc: 'Day 15-21 · 最终Boss战，生成21天战报，毕业成为导师',
    items: [
      { icon:'📊', name:'体重管理的科学监测',
        brief:'晨起称重看周平均趋势。不对比单日只对比同周期。排除生理期干扰。',
        tag:'实践', tagClass:'practice',
        detail:'科学称重法：\n⏰ 每天同一时间（晨起排便后）\n📈 看周平均趋势忽略单日波动\n🔄 只对比同周期相同阶段\n体重波动正常范围±1-2kg/天',
        tip:'连续4周无下降趋势→重新评估TDEE！' },
      { icon:'🔄', name:'动态调整：打造你的终身系统',
        brief:'根据身体反馈微调，将短期冲刺转化为长期习惯。学会多退少补。',
        tag:'实践', tagClass:'practice',
        detail:'动态调整三原则：\n1️⃣ 多退少补——单日吃多后续几天平均补回\n2️⃣ 2周评估——每两周评估趋势+感受+依从性\n3️⃣ 不要频繁改方案——给身体至少2周适应',
        tip:'用习惯追踪器记录连胜天数！连续7天=成就解锁。' },
      { icon:'🏠', name:'实战武器库：随取即用',
        brief:'16:8间歇断食、拳头估算、时间阻塞法等实用工具随时调用。',
        tag:'行动', tagClass:'action',
        detail:'实用工具箱：\n⏰ 16:8间歇断食——每天16h不吃8h进食窗口\n📅 5:2法——一周2天减至500-600大卡\n✊ 拳头估算——1拳≈150g蔬菜/100g肉/100g主食\n🕐 时间阻塞——预先固定运动时间\n🧊 汉堡法则——只吃夹层不吃面包两侧省150大卡',
        tip:'这些工具只是器不是道，先用好基础饮食控制！' },
      { icon:'👑', name:'最终战：自我之战（Day 21）',
        brief:'回顾21天数据面板——总减重、运动时长、打卡天数。生成战报选择下个21天或毕业！',
        tag:'Boss', tagClass:'boss',
        detail:'最终Boss「自我之战」回顾21天数据：\n📊 总减重量 | 🏃 总运动时长\n📅 总打卡天数 | 🔥 最大连续天数\n💰 获得马粮币 | ⭐ Combo发现数\n生成「21天战报」分享卡片\n终局选择：继续下个21天 / 毕业成为导师',
        tip:'毕业不是终点而是新起点！成为导师后马粮币交易有佣金！' }
    ]
  }
]

// ══════════════════════════════════════
//  Boss 数据
// ══════════════════════════════════════
interface BossTask { t: string; k: number }

interface BossData {
  day: number; name: string; icon: string; desc: string
  hp: number; tasks: BossTask[]
}

const BOSS_DATA: BossData[] = [
  { day:1, name:'新手怪·懒癌', icon:'🐌', desc:'第一天就放弃？动起来！', hp:2000,
    tasks:[{t:'完成首次称重',k:30},{t:'拍一张全身照',k:0},{t:'设定目标体重',k:0}] },
  { day:7, name:'停滞怪', icon:'👹', desc:'体重不动了？累计消耗3500kcal击败它！', hp:3500,
    tasks:[{t:'完成30分钟有氧运动',k:250},{t:'喝够2000ml水',k:50},{t:'记录三餐饮食热量',k:100}] },
  { day:14, name:'诱惑魔', icon:'😈', desc:'心理弹窗攻击？用坚持盾+愿景剑反击！', hp:5000,
    tasks:[{t:'拒绝一次高热量诱惑',k:150},{t:'吃够300g蔬菜',k:80},{t:'完成力量训练20分钟',k:180}] },
  { day:21, name:'自我之战', icon:'👑', desc:'回顾数据面板，生成21天战报！', hp:7000,
    tasks:[{t:'完成全部打卡项',k:300},{t:'写一篇21天总结',k:0},{t:'对比前后照片',k:0}] }
]

// ══════════════════════════════════════
//  小马鼓励消息
// ══════════════════════════════════════
const HORSE_CHEER_MSGS = [
  '太棒了主人！每击败一个任务我就离进化更近一步！💪',
  '主人今天已经完成好多项任务了！再坚持一下就能打败Boss！',
  '🔥 连续击杀中！我的经验值在暴涨！',
  '主人你是最棒的！我为你骄傲！🎉',
  '坚持就是胜利！我们一起打败Boss！冲鸭！',
]

// ══════════════════════════════════════
//  Tag 样式映射
// ══════════════════════════════════════
const TAG_STYLES: Record<string, string> = {
  learn:   'bg-blue-500/15 text-blue-400',
  action:  'bg-orange-500/15 text-orange-400',
  practice:'bg-purple-500/15 text-purple-400',
  boss:    'bg-red-500/15 text-red-400',
}

export default function GamesPage() {
  const router = useRouter()
  const { points, addPoints, streak, horse } = useStore()
  const { t, isZh } = useTranslation()
  const [activeGame, setActiveGame] = useState<string | null>(null)

  // ── 接食物游戏状态 ──
  const [foodScore, setFoodScore] = useState(0)
  const [foodTime, setFoodTime] = useState(30)
  const [foodPlaying, setFoodPlaying] = useState(false)
  const [foodCurrent, setFoodCurrent] = useState<typeof FOOD_ITEMS[0] | null>(null)

  // ── 记忆翻牌状态 ──
  const [memoryCards, setMemoryCards] = useState<Array<{ emoji: string; name: string; flipped: boolean; matched: boolean; id: number }>>([])
  const [memoryFlipped, setMemoryFlipped] = useState<number[]>([])
  const [memoryMoves, setMemoryMoves] = useState(0)
  const [memoryWon, setMemoryWon] = useState(false)

  // ── 打卡状态 ──
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set())

  // ── 减脂训练营状态 ──
  const [showAdventureOverlay, setShowAdventureOverlay] = useState(false)
  const [adventureStarted, setAdventureStarted] = useState(false)
  const [expandedPhase, setExpandedPhase] = useState<number>(0)
  const [currentCourseDetail, setCurrentCourseDetail] = useState<CourseItem | null>(null)
  // Boss 战状态
  const [currentBossIdx, setCurrentBossIdx] = useState(1) // 默认第7天停滞怪
  const [bossHp, setBossHp] = useState(BOSS_DATA[1].hp)
  const [bossTasksDone, setBossTasksDone] = useState<Set<number>>(new Set())
  const [combo, setCombo] = useState(0)
  const [showComboBar, setShowComboBar] = useState(false)
  const [horseCheerMsg, setHorseCheerMsg] = useState('')
  // 总 kcal 统计
  const [totalKcal, setTotalKcal] = useState(0)
  // 21天战报
  const [showReport, setShowReport] = useState(false)

  // 首次进入减脂营时显示冒险弹窗
  const enterCamp = () => {
    setActiveGame('camp')
    if (!adventureStarted) {
      setShowAdventureOverlay(true)
    }
  }

  // ─── 接食物游戏逻辑 ───
  const startFoodGame = () => {
    setFoodScore(0); setFoodTime(30); setFoodPlaying(true)
    nextFoodItem()
    const timer = setInterval(() => {
      setFoodTime(prev => {
        if (prev <= 1) { clearInterval(timer); setFoodPlaying(false); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const nextFoodItem = () => {
    setFoodCurrent(FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)])
  }

  const catchFood = (accept: boolean) => {
    if (!foodCurrent || !foodPlaying) return
    if ((accept && foodCurrent.type === 'good') || (!accept && foodCurrent.type === 'bad')) {
      setFoodScore(prev => prev + Math.abs(foodCurrent.score))
    } else {
      setFoodScore(prev => Math.max(0, prev + foodCurrent.score))
    }
    nextFoodItem()
  }

  // ─── 记忆翻牌逻辑 ───
  const startMemoryGame = () => {
    const shuffled = [...CARD_PAIRS, ...CARD_PAIRS].sort(() => Math.random() - 0.5)
      .map((card, i) => ({ ...card, flipped: false, matched: false, id: i }))
    setMemoryCards(shuffled); setMemoryFlipped([]); setMemoryMoves(0); setMemoryWon(false)
  }

  const flipCard = (index: number) => {
    if (memoryCards[index].flipped || memoryCards[index].matched || memoryFlipped.length >= 2) return
    const nc = [...memoryCards]; nc[index].flipped = true; setMemoryCards(nc)
    const nf = [...memoryFlipped, index]; setMemoryFlipped(nf)
    if (nf.length === 2) {
      setMemoryMoves(p => p + 1)
      const [a, b] = nf
      if (nc[a].emoji === nc[b].emoji) {
        nc[a].matched = true; nc[b].matched = true
        setMemoryCards([...nc]); setMemoryFlipped([])
        if (nc.every(c => c.matched)) { setMemoryWon(true); addPoints(15) }
      } else {
        setTimeout(() => { nc[a].flipped = false; nc[b].flipped = false; setMemoryCards([...nc]); setMemoryFlipped([]) }, 800)
      }
    }
  }

  // ─── 打卡逻辑 ───
  const toggleCheck = async (taskId: string, taskPoints: number) => {
    const nc = new Set(checkedTasks)
    
    if (nc.has(taskId)) {
      // 取消打卡（不退积分，防作弊）
      nc.delete(taskId)
    } else {
      // 新打卡 → 通过 DataService 持久化
      nc.add(taskId)
      addPoints(taskPoints)
      
      // 映射 taskId 到 daily_checkin 字段
      const fieldMap: Record<string, Partial<Record<string, boolean>>> = {
        water: { water_glasses: true },
        walk: { exercise_done: true },
        sleep: { medicine_taken: true },
        tea: { diet_recorded: true },
        vegetable: { diet_recorded: true },
        meditate: { horse_played: true },
      }
      await dataService.checkin.updateToday(fieldMap[taskId] || {})
    }
    
    setCheckedTasks(nc)
  }

  // ─── 减脂营逻辑 ───
  const startAdventure = () => {
    setShowAdventureOverlay(false); setAdventureStarted(true)
  }

  const toggleBossTask = async (taskIdx: number) => {
    const boss = BOSS_DATA[currentBossIdx]
    const nc = new Set(bossTasksDone)
    let newHp = bossHp

    if (nc.has(taskIdx)) {
      nc.delete(taskIdx)
      // 回退HP
      newHp = Math.min(boss.hp, newHp + 350)
    } else {
      nc.add(taskIdx)
      // 扣除HP（每完成一个任务扣350）
      newHp = Math.max(0, bossHp - 350)
      // 加combo
      const newCombo = combo + 1
      setCombo(newCombo)
      setShowComboBar(true)
      setTimeout(() => { if (newCombo > 5) setShowComboBar(false) }, 2500)
      // 更新鼓励消息
      setHorseCheerMsg(HORSE_CHEER_MSGS[Math.floor(Math.random() * HORSE_CHEER_MSGS.length)])
      // 增加kcal统计
      const taskKcal = boss.tasks[taskIdx]?.k || 0
      if (taskKcal > 0) {
        setTotalKcal(t => t + taskKcal)
        // 通过 DataService 保存运动记录和积分
        await dataService.exercise.addLog({
          exercise_type: `boss_${boss.name}_${boss.tasks[taskIdx].t}`,
          duration_minutes: 15,
          calories_burned: taskKcal,
        })
        // addPoints 已在 exercise.addLog 内部调用，这里不需要重复
      }
    }

    setBossTasksDone(nc)
    setBossHp(newHp)
  }

  // 切换Boss
  const switchBoss = (idx: number) => {
    setCurrentBossIdx(idx)
    setBossHp(BOSS_DATA[idx].hp)
    setBossTasksDone(new Set())
  }

  // ══════════════════════════════════════
  //  游戏主页
  // ══════════════════════════════════════
  if (!activeGame) {
    return (
      <div className="px-4 pt-4 pb-4">
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t.games.title}</h1>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          {isZh ? '健康管理，游戏化体验' : 'Gamified Health Management'}
        </p>

        {/* ====== ⚡ 生理极限（置顶核心游戏） ====== */}
        <div className="mb-4">
          <button onClick={() => setActiveGame('physio')}
            className="w-full text-left relative overflow-hidden group active:scale-[0.98] transition-all rounded-2xl p-4"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(8,145,178,0.06))', border: '1px solid rgba(6,182,212,0.25)' }}>
            {/* 顶部渐变条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.15))' }}>
                ⚡
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">生理极限</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-400">NEW</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400">HARD</span>
                </div>
                <p className="text-xs mt-1 text-gray-400 truncate">
                  健康管理生存模拟 · 四维生理系统 · 斩杀线机制
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="tag bg-cyan-500/15 text-cyan-400 text-[10px]">4种体质</span>
                  <span className="tag bg-violet-500/15 text-violet-400 text-[10px]">延迟效应</span>
                  <span className="tag bg-red-500/15 text-red-400 text-[10px]">斩杀线</span>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* ====== 🏟️ 减脂训练营 ====== */}
        <div className="mb-4">
          <button onClick={enterCamp}
            className="card w-full text-left relative overflow-hidden group active:scale-[0.98] transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--gold)] via-yellow-400 to-[var(--gold)]" />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.08))' }}>
                ⚔️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>🏟️ 减脂训练营</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400">HOT</span>
                </div>
                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                  21天征途 · 3大Boss · 课程学习 · 小马陪伴
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="tag bg-red-500/15 text-red-400 text-[10px]">3个Boss</span>
                  <span className="tag bg-purple-500/15 text-purple-400 text-[10px]">12节课程</span>
                  <span className="tag bg-green-500/15 text-green-400 text-[10px]">马匹进化</span>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 group-hover:translate-x-1 transition-transform"
                style={{ color: 'var(--text-secondary)' }} />
            </div>
          </button>
        </div>

        {/* 其他小游戏（折叠） */}
        <details className="mb-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors mb-2">
            🎮 休闲小游戏
          </summary>
          <div className="space-y-3">
            <button onClick={() => setActiveGame('food')}
              className="card w-full text-left flex items-center gap-4 hover:border-[var(--gold)] active:scale-[0.98] transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 flex items-center justify-center text-3xl">🥬</div>
              <div className="flex-1">
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{t.games.catchFood.title}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>接住健康食物，躲开垃圾食品！30秒挑战</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="tag bg-green-500/15 text-green-500">+5~30积分</span><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>30秒</span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>

            <button onClick={() => { setActiveGame('memory'); startMemoryGame() }}
              className="card w-full text-left flex items-center gap-4 hover:border-[var(--gold)] active:scale-[0.98] transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/10 flex items-center justify-center text-3xl">🧠</div>
              <div className="flex-1">
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{t.games.memoryMatch.title}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>翻开中药卡片找到配对组合！锻炼记忆力</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="tag bg-purple-500/15 text-purple-500">+15积分</span><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>6对卡片</span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>

            <button disabled className="card w-full text-left flex items-center gap-4 opacity-60 cursor-not-allowed">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 flex items-center justify-center text-3xl">🏇</div>
              <div className="flex-1">
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>赛马竞技</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>和你的小马一起竞速！壮年马解锁</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="tag bg-amber-500/15 text-amber-500">🔒 壮年马解锁</span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </details>

        {/* 每日打卡 */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t.games.dailyCheckin.title}</h2>
            <span className="text-xs" style={{ color: 'var(--gold)' }}>🔥 连续{streak}天</span>
          </div>
          <div className="space-y-2">
            {DAILY_TASKS.map(task => {
              const checked = checkedTasks.has(task.id)
              return (
                <button key={task.id} onClick={() => toggleCheck(task.id, task.points)}
                  className={`card w-full text-left flex items-center gap-3 py-3 transition-all ${
                    checked ? 'border-[var(--green)] bg-[var(--green)]/5' : ''
                  }`}>
                  <span className="text-xl">{task.emoji}</span>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${checked ? 'line-through' : ''}`}
                      style={{ color: checked ? 'var(--green)' : 'var(--text-primary)' }}>{task.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--gold)' }}>+{task.points}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${checked ? 'bg-[var(--green)]' : 'border border-[var(--border)]'}`}>
                      {checked && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              今日已打卡 {checkedTasks.size}/{DAILY_TASKS.length}，获得{' '}
              {Array.from(checkedTasks).reduce((sum, id) => {
                const task = DAILY_TASKS.find(t => t.id === id); return sum + (task?.points || 0)
              }, 0)} 积分
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════
  //  ⚡ 生理极限
  // ═══════════════════════════════════════════
  if (activeGame === 'physio') {
    return <PhysioLimitGame onBack={() => setActiveGame(null)} />
  }

  // ═══════════════════════════════════════════
  //  🏟️ 减脂训练营页面
  // ═══════════════════════════════════════════
  if (activeGame === 'camp') {
    const boss = BOSS_DATA[currentBossIdx]
    const hpPercent = Math.max(0, (bossHp / boss.hp * 100)).toFixed(0)

    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)' }}>
        {/* 顶部导航 */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 sticky top-0 z-10"
          style={{ background: 'rgba(13,17,23,0.95)', borderBottom: '1px solid rgba(255,215,0,0.1)' }}>
          <button onClick={() => setActiveGame(null)} className="p-1">
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">🏟️ 减脂训练营</h1>
            <p className="text-[10px] text-gray-500">演武场 · 21天征途</p>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Flame size={14} className="text-orange-400" />
            <span className="text-orange-300">{totalKcal.toLocaleString()} kcal</span>
          </div>
        </div>

        {/* Combo 连击条 */}
        {showComboBar && (
          <div className="mx-4 mt-2 px-3 py-1.5 rounded-full text-center animate-pulse"
            style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.3), rgba(220,38,38,0.15))', border: '1px solid rgba(239,68,68,0.4)' }}>
            <span className="text-sm font-black text-red-400">🔥 COMBO ×{combo}</span>
          </div>
        )}

        {/* 小马鼓励 */}
        {horseCheerMsg && (
          <div className="mx-4 mt-2 card py-2 px-3 border-l-4 border-[var(--gold)]"
            style={{ background: 'rgba(255,215,0,0.06)' }}>
            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
              🐴 小马说：「{horseCheerMsg}」
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

          {/* ====== Boss 战区域 ====== */}
          <div className="card overflow-hidden" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{boss.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{boss.name}</h3>
                  <p className="text-[10px] text-gray-400">{boss.desc}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                Day {boss.day}
              </span>
            </div>

            {/* Boss 血条 */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-400">Boss HP</span>
                <span className="text-red-400 font-bold">{hpPercent}% 剩余</span>
              </div>
              <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${hpPercent}%`,
                    background: `linear-gradient(90deg, #ef4444, #dc2626)`
                  }}
                />
              </div>
            </div>

            {/* Boss 切换标签 */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
              {BOSS_DATA.map((b, i) => (
                <button key={i} onClick={() => switchBoss(i)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                    i === currentBossIdx
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                  } ${i > 1 ? 'opacity-60' : ''}`}>
                  {b.icon} {b.name.split('·')[1] || b.name}
                </button>
              ))}
            </div>

            {/* Boss 任务列表 */}
            <div className="space-y-2">
              {boss.tasks.map((task, ti) => {
                const done = bossTasksDone.has(ti)
                return (
                  <button key={ti} onClick={() => toggleBossTask(ti)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                      done
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-white/5 border border-white/5 hover:bg-white/10 active:scale-[0.98]'
                    }`}>
                    <span className={`text-base w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      done ? 'bg-green-500/20' : 'bg-white/10'
                    }`}>{done ? '✅' : '⬜'}</span>
                    <span className={`text-xs flex-1 ${done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                      {task.t}
                    </span>
                    {task.k > 0 && (
                      <span className={`text-[10px] font-bold ${done ? 'text-green-400' : 'text-[var(--gold)]'}`}>
                        {done ? '+' : ''}{task.k} kcal
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ====== 21天课程时间线 ====== */}
          <div>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--gold)' }}>
              <BookOpen size={16} /> 21天减脂训练营课程
            </h2>

            {COURSE_DATA.map((phase, pi) => {
              const isExpanded = expandedPhase === pi
              return (
                <div key={pi} className="mb-3">
                  {/* 阶段头部（可折叠） */}
                  <button onClick={() => setExpandedPhase(isExpanded ? -1 : pi)}
                    className="card w-full text-left p-3 transition-all"
                    style={isExpanded ? { borderColor: 'rgba(255,215,0,0.3)' } : undefined}>
                    <div className="flex items-start gap-3">
                      {/* 阶段圆点 */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                        pi === 0 ? 'bg-green-500/20 text-green-400' :
                        pi === 1 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>{phase.label.slice(1)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-400">{phase.label}</span>
                          <span className={`text-sm font-bold ${
                            pi === 0 ? 'text-green-400' :
                            pi === 1 ? 'text-orange-400' : 'text-purple-400'
                          }`}>{phase.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{phase.desc}</p>
                        {/* Badge 标签 */}
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {phase.items.map(it => (
                            <span key={it.name}
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${TAG_STYLES[it.tagClass] || ''}`}>
                              {it.tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`text-gray-500 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </button>

                  {/* 展开的课程详情列表 */}
                  {isExpanded && (
                    <div className="mt-2 ml-4 pl-4 border-l-2 border-[var(--gold)]/20 space-y-2 animate-fade-in">
                      {phase.items.map((item, ii) => (
                        <button key={ii} onClick={() => setCurrentCourseDetail(item)}
                          className="w-full card p-3 text-left hover:border-[var(--gold)]/40 transition-all group">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl shrink-0">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
                                  {item.name}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${TAG_STYLES[item.tagClass] || ''}`}>
                                  {item.tag}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{item.brief}</p>
                            </div>
                            <ChevronRight size={14} className="shrink-0 text-gray-500 group-hover:text-[var(--gold)] transition-colors mt-1" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* 生成战报按钮 */}
            <button onClick={() => setShowReport(true)}
              className="btn-gold w-full mt-3 flex items-center justify-center gap-2 py-3">
              <Crown size={16} /> 生成21天战报
            </button>
          </div>
        </div>

        {/* ═══ 冒险启动覆盖层（首次进入） ═══ */}
        {showAdventureOverlay && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
            <div className="text-7xl mb-4" style={{ animation: 'bounce 1s ease-in-out infinite' }}>🐴</div>
            <h2 className="text-2xl font-black text-white mb-2">冒险即将开始！</h2>
            <p className="text-sm text-gray-400 mb-8 max-w-[280px] leading-relaxed">
              你和小马将一起踏上 <span className="text-green-400 font-bold">21天减脂征途</span>，
              从认知觉醒到习惯养成，
              击败三大Boss，最终毕业成为健康导师！
            </p>
            <button onClick={startAdventure}
              className="px-8 py-4 rounded-2xl text-base font-black text-white flex items-center gap-2 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 8px 24px rgba(34,197,94,0.35)' }}>
              🐴 出发！开启训练 →
            </button>
            <button onClick={startAdventure}
              className="mt-4 text-xs text-gray-500 underline decoration-gray-600">
              跳过，直接查看训练
            </button>
          </div>
        )}

        {/* ═══ 课程详情弹窗 ═══ */}
        {currentCourseDetail && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={(e) => { if (e.target === e.currentTarget) setCurrentCourseDetail(null) }}>
            <div className="card w-full max-w-[420px] max-h-[80vh] overflow-y-auto animate-slide-up">
              {/* 头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentCourseDetail.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TAG_STYLES[currentCourseDetail.tagClass] || ''}`}>
                        {currentCourseDetail.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">{currentCourseDetail.name}</h3>
                  </div>
                </div>
                <button onClick={() => setCurrentCourseDetail(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* 简介 */}
              <p className="text-sm text-gray-300 mb-4">{currentCourseDetail.brief}</p>

              {/* 详细内容 */}
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}>
                <h4 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: 'var(--gold)' }}>
                  <BookOpen size={12} /> 详细内容
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {currentCourseDetail.detail}
                </p>
              </div>

              {/* 小贴士 */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(74,124,89,0.08)', border: '1px solid rgba(74,124,89,0.2)' }}>
                <h4 className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--green)' }}>
                  💡 小贴士
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">{currentCourseDetail.tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ 21天战报弹窗 ═══ */}
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowReport(false) }}>
            <div className="card w-full max-w-[380px] text-center animate-scale-in p-6">
              <div className="text-5xl mb-3">🏆</div>
              <h2 className="text-xl font-bold text-white mb-1">21天战报</h2>
              <p className="text-xs text-gray-400 mb-5">恭喜完成本轮训练！以下是你的战绩</p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,215,0,0.06)' }}>
                  <p className="text-2xl font-black" style={{ color: 'var(--gold)' }}>{totalKcal.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">总消耗(kcal)</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.06)' }}>
                  <p className="text-2xl font-black text-green-400">{streak}</p>
                  <p className="text-[10px] text-gray-400">最大连续天数</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.06)' }}>
                  <p className="text-2xl font-black text-purple-400">{combo}</p>
                  <p className="text-[10px] text-gray-400">最高COMBO</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.06)' }}>
                  <p className="text-2xl font-black text-blue-400">{points}</p>
                  <p className="text-[10px] text-gray-400">当前积分</p>
                </div>
              </div>

              <div className="space-y-2">
                <button onClick={() => { setShowReport(false); setCombo(0); setTotalKcal(0) }}
                  className="btn-gold w-full py-3 text-sm font-bold">
                  🔄 开始新一轮21天
                </button>
                <button onClick={() => setShowReport(false)}
                  className="w-full py-2.5 text-sm font-bold rounded-xl text-gray-400 border border-white/10 hover:bg-white/5 transition-all">
                  🎓 查看完整报告
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════
  //  接食物游戏
  // ═══════════════════════════════════════════
  if (activeGame === 'food') {
    return (
      <div className="px-4 pt-4 pb-4 min-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setActiveGame(null)} className="text-sm" style={{ color: 'var(--text-secondary)' }}>← 返回</button>
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.games.catchFood.title}</span>
          <div className="flex items-center gap-2"><Clock size={14} style={{ color: 'var(--text-secondary)' }} /><span className={`font-bold ${foodTime <= 10 ? 'text-[var(--red)]' : ''}`} style={{ color: foodTime <= 10 ? undefined : 'var(--text-primary)' }}>{foodTime}s</span></div>
        </div>
        <div className="text-center mb-6">
          <span className="text-4xl font-bold" style={{ color: 'var(--gold)' }}>{foodScore}</span>
          <span className="text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>分</span>
        </div>
        {!foodPlaying ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            {foodTime === 0 ? (
              <>
                <Trophy size={48} style={{ color: 'var(--gold)' }} /><h2 className="text-xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>{t.games.catchFood.gameOver}</h2>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>最终得分：{foodScore}分</p>
                <button onClick={async () => {
                  // 保存游戏会话到 DataService
                  await dataService.games.saveSession({
                    game_type: 'food_catcher',
                    score: foodScore,
                    is_completed: true,
                    points_earned: Math.floor(foodScore / 5),
                    game_data: { duration: 30 },
                  })
                  startFoodGame()
                }} className="btn-gold mt-6 flex items-center gap-2"><RotateCcw size={16} />再来一局</button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">🥬</div><h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>接住健康食物！</h2>
                <p className="text-sm mt-2 text-center" style={{ color: 'var(--text-secondary)' }}>点击「接住」获取健康食物<br/>点击「躲开」避开垃圾食品<br/>30秒内尽可能多得分！</p>
                <button onClick={startFoodGame} className="btn-gold mt-6 flex items-center gap-2"><Play size={16} />开始游戏</button>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-7xl mb-8 animate-bounce">{foodCurrent?.emoji}</div>
            <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{foodCurrent?.name}</p>
            <p className="text-sm mb-8" style={{ color: foodCurrent?.type === 'good' ? 'var(--green)' : 'var(--red)' }}>{foodCurrent?.type === 'good' ? '健康食物！接住它！' : '垃圾食品！快躲开！'}</p>
            <div className="flex gap-6">
              <button onClick={() => catchFood(true)} className="px-8 py-4 rounded-2xl text-lg font-bold bg-[var(--green)] text-white active:scale-95 transition-transform">✅ 接住</button>
              <button onClick={() => catchFood(false)} className="px-8 py-4 rounded-2xl text-lg font-bold bg-[var(--red)] text-white active:scale-95 transition-transform">❌ 躲开</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════
  //  记忆翻牌游戏
  // ═══════════════════════════════════════════
  if (activeGame === 'memory') {
    return (
      <div className="px-4 pt-4 pb-4 min-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setActiveGame(null)} className="text-sm" style={{ color: 'var(--text-secondary)' }}>← 返回</button>
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.games.memoryMatch.title}</span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{memoryMoves}步</span>
        </div>
        {memoryWon ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Trophy size={48} style={{ color: 'var(--gold)' }} /><h2 className="text-xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>{t.games.memoryMatch.win}</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>用了{memoryMoves}步完成配对</p>
            <p className="text-sm" style={{ color: 'var(--gold)' }}>+15 养生积分</p>
            <button onClick={async () => {
              // 保存游戏会话到 DataService
              await dataService.games.saveSession({
                game_type: 'memory_flip',
                score: memoryMoves, // 步数越少分数越高
                is_completed: true,
                points_earned: 15,
                coins_earned: 0,
                game_data: { moves: memoryMoves },
              })
              startMemoryGame()
            }} className="btn-gold mt-6 flex items-center gap-2"><RotateCcw size={16} />再来一局</button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 flex-1 content-center">
            {memoryCards.map((card, i) => (
              <button key={card.id} onClick={() => flipCard(i)}
                className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 ${card.flipped || card.matched ? 'bg-[var(--bg-card)] border-2 border-[var(--gold)]' : 'bg-gradient-to-br from-[var(--gold)]/30 to-[var(--gold)]/10 border-2 border-[var(--gold)]/30 hover:scale-105'} ${card.matched ? 'border-[var(--green)] opacity-60' : ''}`}>
                {(card.flipped || card.matched) ? card.emoji : '?'}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}
