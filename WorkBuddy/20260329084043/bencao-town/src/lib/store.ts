import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Constitution =
  | '平和质' | '气虚质' | '阳虚质' | '阴虚质'
  | '痰湿质' | '湿热质' | '血瘀质' | '气郁质' | '特禀质'

export type HorseStyle = '金鬃骏马' | '蓝紫灵马' | '赤棕壮马' | '粉樱萌马'
export type HorseStyleShort = 'golden' | 'purple' | 'brown' | 'pink'
export type HorseLevel = '小马驹' | '少年马' | '壮年马' | '千里马' | '神驹'
export type HorseMood = 'idle' | 'happy' | 'eating' | 'playing' | 'sleeping' | 'sad' | 'excited' | 'content'

export type HorseFur = '暗淡' | '普通' | '光泽' | '亮丽' | '金光闪闪'

export type SceneType = 'bedroom' | 'hospital' | 'office' | 'outdoor' | 'kitchen' | 'garden'

export interface HorseState {
  name: string
  style: HorseStyle
  styleShort: HorseStyleShort
  level: HorseLevel
  fur: HorseFur
  exp: number
  mood: HorseMood
  satiety: number   // 饱食度 0-100
  hunger: number    // 饥饿度(兼容) = 100 - satiety
  clean: number     // 清洁度 0-100
  joy: number       // 快乐度 0-100
  fitness: number   // 体质度 0-100
}

export interface UserState {
  isLoggedIn: boolean
  userId: string | null
  email: string | null
  constitution: Constitution | null
  points: number      // 养生积分
  coins: number       // 马粮币
  streak: number      // 连续打卡天数
  horse: HorseState | null
  todayCalories: number
  currentWeight: number
  totalCardsRead: number
  currentScene: SceneType  // 当前场景
}

interface AppState extends UserState {
  // Actions
  login: (userId: string, email: string) => void
  logout: () => void
  setConstitution: (c: Constitution) => void
  adoptHorse: (style: HorseStyle, styleShort: HorseStyleShort, name: string) => void
  setHorseStyle: (styleShort: HorseStyleShort) => void
  setHorseMood: (mood: HorseMood) => void
  changeScene: (scene: SceneType) => void
  feedHorse: () => void
  cleanHorse: () => void
  playWithHorse: () => void
  exerciseHorse: () => void
  addPoints: (amount: number) => void
  addCoins: (amount: number) => void
  spendPoints: (amount: number) => void
  spendCoins: (amount: number) => void
  addCalories: (cal: number) => void
  setWeight: (w: number) => void
  incrementStreak: () => void
  addCardsRead: (n: number) => void
}

const HORSE_STYLES: Record<HorseStyle, { emoji: string; accessory: string }> = {
  '金鬃骏马': { emoji: '🐴', accessory: '⭐' },
  '蓝紫灵马': { emoji: '🦄', accessory: '🏮' },
  '赤棕壮马': { emoji: '🐎', accessory: '💰' },
  '粉樱萌马': { emoji: '🎠', accessory: '🐟' },
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userId: null,
      email: null,
      constitution: null,
      points: 0,
      coins: 0,
      streak: 0,
      horse: null,
      todayCalories: 0,
      currentWeight: 0,
      totalCardsRead: 0,
      currentScene: 'bedroom',

      login: (userId, email) => set({ isLoggedIn: true, userId, email }),
      logout: () => set({ isLoggedIn: false, userId: null, email: null }),

      setConstitution: (c) => set({ constitution: c }),

      adoptHorse: (style, styleShort, name) => set({
        horse: {
          name,
          style,
          styleShort,
          level: '小马驹',
          fur: '普通',
          exp: 0,
          mood: 'happy',
          satiety: 80,
          hunger: 20,
          clean: 80,
          joy: 80,
          fitness: 60,
        }
      }),

      setHorseStyle: (styleShort) => set((s) => {
        if (!s.horse) return {}
        const styleMap: Record<HorseStyleShort, HorseStyle> = {
          golden: '金鬃骏马',
          purple: '蓝紫灵马',
          brown: '赤棕壮马',
          pink: '粉樱萌马',
        }
        return {
          horse: { ...s.horse, styleShort, style: styleMap[styleShort] }
        }
      }),

      changeScene: (scene) => set({ currentScene: scene }),

      setHorseMood: (mood) => set((s) => ({
        horse: s.horse ? { ...s.horse, mood } : null
      })),

      feedHorse: () => set((s) => {
        if (!s.horse) return {}
        const satiety = Math.min(100, s.horse.satiety + 20)
        const exp = s.horse.exp + 10
        return {
          horse: { ...s.horse, satiety, exp, mood: 'eating' as HorseMood },
          points: s.points + 5,
        }
      }),

      cleanHorse: () => set((s) => {
        if (!s.horse) return {}
        const clean = Math.min(100, s.horse.clean + 20)
        return {
          horse: { ...s.horse, clean, mood: 'happy' as HorseMood },
          points: s.points + 5,
        }
      }),

      playWithHorse: () => set((s) => {
        if (!s.horse) return {}
        const joy = Math.min(100, s.horse.joy + 20)
        return {
          horse: { ...s.horse, joy, mood: 'playing' as HorseMood },
          points: s.points + 5,
        }
      }),

      exerciseHorse: () => set((s) => {
        if (!s.horse) return {}
        const fitness = Math.min(100, s.horse.fitness + 15)
        return {
          horse: { ...s.horse, fitness, mood: 'excited' as HorseMood },
          points: s.points + 10,
          streak: s.streak + 1,
        }
      }),

      addPoints: (amount) => set((s) => ({ points: s.points + amount })),
      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),
      spendPoints: (amount) => set((s) => ({ points: Math.max(0, s.points - amount) })),
      spendCoins: (amount) => set((s) => ({ coins: Math.max(0, s.coins - amount) })),
      addCalories: (cal) => set((s) => ({ todayCalories: s.todayCalories + cal })),
      setWeight: (w) => set({ currentWeight: w }),
      incrementStreak: () => set((s) => ({ streak: s.streak + 1 })),
      addCardsRead: (n) => set((s) => ({ totalCardsRead: s.totalCardsRead + n })),
    }),
    {
      name: 'bencao-town-storage',
    }
  )
)
