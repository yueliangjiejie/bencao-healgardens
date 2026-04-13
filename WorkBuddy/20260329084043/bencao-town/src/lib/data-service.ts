/**
 * 本草纲目健康小镇 — 统一数据访问层
 * 
 * 架构策略：
 * - Online模式：数据直接读写 Supabase（带乐观更新）
 * - Offline/Demo模式：数据读写 localStorage（Zustand persist）
 * - 自动检测 Supabase 连接状态，无感切换
 * 
 * 使用方式：
 *   const ds = DataService.getInstance()
 *   await ds.diet.addRecord({...})
 *   const records = await ds.diet.getTodayRecords()
 */

import { supabase } from './supabase'
import { useStore } from './store'
import type {
  DietRecord, WeightRecord, ExerciseLog, GameSession,
  DailyCheckin, Notification, KnowledgeProgress,
  ConstitutionAssessment,
  ConstitutionType, HorseMood, MealType, GameType,
  DietRecordSource,
} from './database.types'

// ═══════════════════════════════════════════════════
// 连接状态检测
// ═══════════════════════════════════════════════════

let _isOnline = false
let _checkedOnce = false

async function checkSupabaseConnection(): Promise<boolean> {
  if (_checkedOnce) return _isOnline
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (!url || url.includes('placeholder') || url.includes('your-project')) {
      _isOnline = false
    } else {
      const { error } = await supabase.from('tenants').select('id').limit(1)
      _isOnline = !error
    }
  } catch {
    _isOnline = false
  }
  _checkedOnce = true
  return _isOnline
}

export function isSupabaseOnline(): boolean {
  return _isOnline
}

export function resetConnectionCheck(): void {
  _checkedOnce = false
  _isOnline = false
}

// ═══════════════════════════════════════════════════
// LocalStorage 键管理
// ═══════════════════════════════════════════════════

const LS_KEYS = {
  dietRecords: 'bt_diet_records',
  weightRecords: 'bt_weight_records',
  exerciseLogs: 'bt_exercise_logs',
  gameSessions: 'bt_game_sessions',
  checkins: 'bt_checkins',
  notifications: 'bt_notifications',
  knowledge: 'bt_knowledge',
  assessments: 'bt_assessments',
}

function lsGet<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function lsSet<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

function generateId(): string {
  return crypto.randomUUID()
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// ═══════════════════════════════════════════════════
// DataService 单例
// ═══════════════════════════════════════════════════

class DataService {
  private static instance: DataService

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  async init(): Promise<boolean> {
    return await checkSupabaseConnection()
  }

  get isOnline(): boolean {
    return isSupabaseOnline()
  }

  // ─── 饮食记录 ─────────────────────────────────

  diet = {
    async addRecord(record: {
      food_name: string
      calories: number
      meal_type: MealType
      source: DietRecordSource
      quantity?: number
      unit?: string
      protein?: number
      fat?: number
      carbs?: number
      food_nature?: string
      constitution_fit?: Record<string, number>
      food_image_url?: string
      ai_confidence?: number
      ai_raw_response?: Record<string, unknown>
      notes?: string
    }): Promise<DietRecord> {
      const store = useStore.getState()
      const userId = store.userId || 'demo-user'

      const newRecord: DietRecord = {
        id: generateId(),
        user_id: userId,
        tenant_id: 'personal',
        record_date: todayStr(),
        meal_type: record.meal_type,
        source: record.source,
        food_name: record.food_name,
        food_name_en: null,
        quantity: record.quantity ?? 1,
        unit: record.unit ?? '份',
        calories: record.calories,
        protein: record.protein ?? null,
        fat: record.fat ?? null,
        carbs: record.carbs ?? null,
        fiber: null,
        ai_confidence: record.ai_confidence ?? null,
        ai_raw_response: record.ai_raw_response ?? null,
        food_image_url: record.food_image_url ?? null,
        food_nature: record.food_nature ?? null,
        food_flavor: null,
        constitution_fit: record.constitution_fit ?? null,
        notes: record.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 乐观更新：先更新本地
      const records = lsGet<DietRecord>(LS_KEYS.dietRecords)
      records.unshift(newRecord)
      lsSet(LS_KEYS.dietRecords, records)

      // 积分更新
      const pts = record.source === 'ai_recognition' ? 3 : 1
      store.addPoints(pts)
      store.addCalories(record.calories)

      // 如果在线，同步到Supabase
      if (isSupabaseOnline()) {
        try {
          await supabase.from('diet_records').insert({
            ...newRecord,
            user_id: userId,
            tenant_id: 'personal',
          })
        } catch (err) {
          console.warn('[DataService] Supabase sync failed:', err)
        }
      }

      return newRecord
    },

    async getTodayRecords(): Promise<DietRecord[]> {
      const today = todayStr()

      if (isSupabaseOnline()) {
        try {
          const { data, error } = await supabase
            .from('diet_records')
            .select('*')
            .eq('record_date', today)
            .order('created_at', { ascending: false })
          if (!error && data) return data as DietRecord[]
        } catch { /* fallback */ }
      }

      return lsGet<DietRecord>(LS_KEYS.dietRecords).filter(r => r.record_date === today)
    },

    async getRecordsByDateRange(start: string, end: string): Promise<DietRecord[]> {
      if (isSupabaseOnline()) {
        try {
          const { data, error } = await supabase
            .from('diet_records')
            .select('*')
            .gte('record_date', start)
            .lte('record_date', end)
            .order('record_date', { ascending: false })
          if (!error && data) return data as DietRecord[]
        } catch { /* fallback */ }
      }

      return lsGet<DietRecord>(LS_KEYS.dietRecords)
        .filter(r => r.record_date >= start && r.record_date <= end)
    },

    async deleteRecord(id: string): Promise<void> {
      const records = lsGet<DietRecord>(LS_KEYS.dietRecords)
      lsSet(LS_KEYS.dietRecords, records.filter(r => r.id !== id))

      if (isSupabaseOnline()) {
        try { await supabase.from('diet_records').delete().eq('id', id) } catch { /* ok */ }
      }
    },
  }

  // ─── 体重记录 ─────────────────────────────────

  weight = {
    async addRecord(weightKg: number, bmi?: number, bodyFat?: number, notes?: string): Promise<WeightRecord> {
      const store = useStore.getState()
      const userId = store.userId || 'demo-user'

      const newRecord: WeightRecord = {
        id: generateId(),
        user_id: userId,
        tenant_id: 'personal',
        record_date: todayStr(),
        weight_kg: weightKg,
        bmi: bmi ?? null,
        body_fat_pct: bodyFat ?? null,
        notes: notes ?? null,
        created_at: new Date().toISOString(),
      }

      const records = lsGet<WeightRecord>(LS_KEYS.weightRecords)
      records.unshift(newRecord)
      lsSet(LS_KEYS.weightRecords, records)

      store.setWeight(weightKg)
      store.addPoints(2)

      if (isSupabaseOnline()) {
        try {
          await supabase.from('weight_records').insert({
            ...newRecord, user_id: userId, tenant_id: 'personal',
          })
        } catch { /* ok */ }
      }

      return newRecord
    },

    async getHistory(days = 30): Promise<WeightRecord[]> {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceStr = since.toISOString().split('T')[0]

      if (isSupabaseOnline()) {
        try {
          const { data, error } = await supabase
            .from('weight_records')
            .select('*')
            .gte('record_date', sinceStr)
            .order('record_date', { ascending: true })
          if (!error && data) return data as WeightRecord[]
        } catch { /* fallback */ }
      }

      return lsGet<WeightRecord>(LS_KEYS.weightRecords)
        .filter(r => r.record_date >= sinceStr)
    },
  }

  // ─── 运动日志 ─────────────────────────────────

  exercise = {
    async addLog(log: {
      exercise_type: string
      duration_minutes: number
      intensity?: string
      calories_burned?: number
      notes?: string
    }): Promise<ExerciseLog> {
      const store = useStore.getState()
      const userId = store.userId || 'demo-user'

      const newLog: ExerciseLog = {
        id: generateId(),
        user_id: userId,
        tenant_id: 'personal',
        log_date: todayStr(),
        exercise_type: log.exercise_type,
        duration_minutes: log.duration_minutes,
        intensity: log.intensity ?? 'moderate',
        calories_burned: log.calories_burned ?? null,
        avg_heart_rate: null,
        max_heart_rate: null,
        notes: log.notes ?? null,
        created_at: new Date().toISOString(),
      }

      const logs = lsGet<ExerciseLog>(LS_KEYS.exerciseLogs)
      logs.unshift(newLog)
      lsSet(LS_KEYS.exerciseLogs, logs)

      store.addPoints(10)

      if (isSupabaseOnline()) {
        try { await supabase.from('exercise_logs').insert({ ...newLog, user_id: userId, tenant_id: 'personal' }) } catch { /* ok */ }
      }

      return newLog
    },

    async getTodayLogs(): Promise<ExerciseLog[]> {
      const today = todayStr()
      if (isSupabaseOnline()) {
        try {
          const { data, error } = await supabase.from('exercise_logs').select('*').eq('log_date', today)
          if (!error && data) return data as ExerciseLog[]
        } catch { /* fallback */ }
      }
      return lsGet<ExerciseLog>(LS_KEYS.exerciseLogs).filter(l => l.log_date === today)
    },
  }

  // ─── 游戏会话 ─────────────────────────────────

  games = {
    async saveSession(session: {
      game_type: GameType
      score: number
      level_reached?: number
      is_completed?: boolean
      points_earned?: number
      coins_earned?: number
      game_data?: Record<string, unknown>
    }): Promise<GameSession> {
      const store = useStore.getState()
      const userId = store.userId || 'demo-user'
      const now = new Date().toISOString()

      const newSession: GameSession = {
        id: generateId(),
        user_id: userId,
        tenant_id: 'personal',
        game_type: session.game_type,
        started_at: now,
        ended_at: now,
        score: session.score,
        level_reached: session.level_reached ?? 1,
        is_completed: session.is_completed ?? false,
        points_earned: session.points_earned ?? 0,
        coins_earned: session.coins_earned ?? 0,
        game_data: session.game_data ?? {},
        created_at: now,
      }

      const sessions = lsGet<GameSession>(LS_KEYS.gameSessions)
      sessions.unshift(newSession)
      lsSet(LS_KEYS.gameSessions, sessions)

      if (session.points_earned) store.addPoints(session.points_earned)
      if (session.coins_earned) store.addCoins(session.coins_earned)

      if (isSupabaseOnline()) {
        try { await supabase.from('game_sessions').insert({ ...newSession, user_id: userId, tenant_id: 'personal' }) } catch { /* ok */ }
      }

      return newSession
    },

    async getHighScores(gameType: GameType, limit = 10): Promise<GameSession[]> {
      if (isSupabaseOnline()) {
        try {
          const { data, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('game_type', gameType)
            .eq('is_completed', true)
            .order('score', { ascending: false })
            .limit(limit)
          if (!error && data) return data as GameSession[]
        } catch { /* fallback */ }
      }

      return lsGet<GameSession>(LS_KEYS.gameSessions)
        .filter(s => s.game_type === gameType && s.is_completed)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    },
  }

  // ─── 每日打卡 ─────────────────────────────────

  checkin = {
    async getToday(): Promise<DailyCheckin | null> {
      const today = todayStr()

      if (isSupabaseOnline()) {
        try {
          const { data, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('checkin_date', today)
            .maybeSingle()
          if (!error && data) return data as DailyCheckin
        } catch { /* fallback */ }
      }

      const checkins = lsGet<DailyCheckin>(LS_KEYS.checkins)
      return checkins.find(c => c.checkin_date === today) || null
    },

    async updateToday(updates: Partial<DailyCheckin>): Promise<DailyCheckin> {
      const today = todayStr()
      const store = useStore.getState()
      const userId = store.userId || 'demo-user'

      const checkins = lsGet<DailyCheckin>(LS_KEYS.checkins)
      let existing = checkins.find(c => c.checkin_date === today)

      if (!existing) {
        existing = {
          id: generateId(),
          user_id: userId,
          tenant_id: 'personal',
          checkin_date: today,
          diet_recorded: false,
          weight_recorded: false,
          exercise_done: false,
          water_glasses: 0,
          medicine_taken: false,
          horse_fed: false,
          horse_cleaned: false,
          horse_played: false,
          horse_exercised: false,
          points_earned: 0,
          bonus_earned: 0,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        checkins.push(existing)
      }

      Object.assign(existing, updates, { updated_at: new Date().toISOString() })
      lsSet(LS_KEYS.checkins, checkins)

      if (isSupabaseOnline()) {
        try {
          await supabase.from('daily_checkins').upsert({
            ...existing,
            user_id: userId,
            tenant_id: 'personal',
          }, { onConflict: 'user_id,checkin_date' })
        } catch { /* ok */ }
      }

      return existing
    },

    async getStreak(): Promise<number> {
      if (isSupabaseOnline()) {
        try {
          const { data } = await supabase
            .from('user_profiles')
            .select('streak_days')
            .maybeSingle()
          if (data) return (data as { streak_days: number }).streak_days
        } catch { /* fallback */ }
      }
      return useStore.getState().streak
    },
  }

  // ─── 体质测评 ─────────────────────────────────

  assessment = {
    async save(result: {
      method: string
      quiz_answers?: number[]
      quiz_scores?: Record<string, number>
      tongue_image_url?: string
      tongue_analysis?: Record<string, unknown>
      tongue_scores?: Record<string, number>
      final_scores: Record<string, number>
      primary_constitution: ConstitutionType
      secondary_constitution?: ConstitutionType
      organ_analysis?: Record<string, number>
    }): Promise<ConstitutionAssessment> {
      const store = useStore.getState()
      const userId = store.userId || 'demo-user'

      const newAssessment: ConstitutionAssessment = {
        id: generateId(),
        user_id: userId,
        tenant_id: 'personal',
        method: result.method,
        quiz_answers: result.quiz_answers ?? null,
        quiz_scores: result.quiz_scores ?? null,
        tongue_image_url: result.tongue_image_url ?? null,
        tongue_analysis: result.tongue_analysis ?? null,
        tongue_scores: result.tongue_scores ?? null,
        final_scores: result.final_scores,
        primary_constitution: result.primary_constitution,
        secondary_constitution: result.secondary_constitution ?? null,
        organ_analysis: result.organ_analysis ?? null,
        created_at: new Date().toISOString(),
      }

      const assessments = lsGet<ConstitutionAssessment>(LS_KEYS.assessments)
      assessments.unshift(newAssessment)
      lsSet(LS_KEYS.assessments, assessments)

      store.setConstitution(result.primary_constitution)

      if (isSupabaseOnline()) {
        try {
          await supabase.from('constitution_assessments').insert({
            ...newAssessment, user_id: userId, tenant_id: 'personal',
          })
          await supabase.from('user_profiles').update({
            primary_constitution: result.primary_constitution,
            constitution_scores: result.final_scores,
            constitution_tested_at: new Date().toISOString(),
          }).eq('id', userId)
        } catch { /* ok */ }
      }

      return newAssessment
    },

    async getLatest(): Promise<ConstitutionAssessment | null> {
      if (isSupabaseOnline()) {
        try {
          const { data, error } = await supabase
            .from('constitution_assessments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (!error && data) return data as ConstitutionAssessment
        } catch { /* fallback */ }
      }

      const assessments = lsGet<ConstitutionAssessment>(LS_KEYS.assessments)
      return assessments[0] || null
    },
  }

  // ─── 通知 ─────────────────────────────────

  notifications = {
    async getAll(): Promise<Notification[]> {
      if (isSupabaseOnline()) {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('scheduled_at', { ascending: false })
            .limit(50)
          if (!error && data) return data as Notification[]
        } catch { /* fallback */ }
      }
      return lsGet<Notification>(LS_KEYS.notifications)
    },

    async markRead(id: string): Promise<void> {
      const notifications = lsGet<Notification>(LS_KEYS.notifications)
      const n = notifications.find(item => item.id === id)
      if (n) {
        n.is_read = true
        n.read_at = new Date().toISOString()
        lsSet(LS_KEYS.notifications, notifications)
      }

      if (isSupabaseOnline()) {
        try {
          await supabase.from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', id)
        } catch { /* ok */ }
      }
    },

    async markAllRead(): Promise<void> {
      const notifications = lsGet<Notification>(LS_KEYS.notifications)
      const now = new Date().toISOString()
      notifications.forEach(n => {
        if (!n.is_read) {
          n.is_read = true
          n.read_at = now
        }
      })
      lsSet(LS_KEYS.notifications, notifications)

      if (isSupabaseOnline()) {
        try {
          const userId = useStore.getState().userId
          if (userId) {
            await supabase.from('notifications')
              .update({ is_read: true, read_at: now })
              .eq('user_id', userId)
              .eq('is_read', false)
          }
        } catch { /* ok */ }
      }
    },

    getUnreadCount(): number {
      return lsGet<Notification>(LS_KEYS.notifications).filter(n => !n.is_read).length
    },
  }

  // ─── 知识进度 ─────────────────────────────────

  knowledge = {
    async markRead(cardType: string, cardId: string): Promise<void> {
      const store = useStore.getState()
      const userId = store.userId || 'demo-user'
      const now = new Date().toISOString()

      const records = lsGet<KnowledgeProgress>(LS_KEYS.knowledge)
      const existing = records.find(r => r.card_type === cardType && r.card_id === cardId)

      if (existing) {
        existing.is_read = true
        existing.read_count += 1
        existing.last_read_at = now
      } else {
        records.push({
          id: generateId(),
          user_id: userId,
          tenant_id: 'personal',
          card_type: cardType,
          card_id: cardId,
          is_read: true,
          read_count: 1,
          is_favorited: false,
          last_read_at: now,
          created_at: now,
        })
        store.addCardsRead(1)
      }
      lsSet(LS_KEYS.knowledge, records)

      if (isSupabaseOnline()) {
        try {
          await supabase.from('knowledge_progress').upsert({
            user_id: userId,
            tenant_id: 'personal',
            card_type: cardType,
            card_id: cardId,
            is_read: true,
            read_count: existing ? existing.read_count : 1,
            last_read_at: now,
          }, { onConflict: 'user_id,card_type,card_id' })
        } catch { /* ok */ }
      }
    },

    async getReadCards(cardType?: string): Promise<KnowledgeProgress[]> {
      if (isSupabaseOnline()) {
        try {
          let query = supabase.from('knowledge_progress').select('*')
          if (cardType) query = query.eq('card_type', cardType)
          const { data, error } = await query
          if (!error && data) return data as KnowledgeProgress[]
        } catch { /* fallback */ }
      }

      const records = lsGet<KnowledgeProgress>(LS_KEYS.knowledge)
      return cardType ? records.filter(r => r.card_type === cardType) : records
    },
  }

  // ─── 马匹操作 ─────────────────────────────────

  horse = {
    feed: async (): Promise<void> => {
      const store = useStore.getState()
      store.feedHorse()
      await dataService.checkin.updateToday({ horse_fed: true })
    },

    clean: async (): Promise<void> => {
      const store = useStore.getState()
      store.cleanHorse()
      await dataService.checkin.updateToday({ horse_cleaned: true })
    },

    play: async (): Promise<void> => {
      const store = useStore.getState()
      store.playWithHorse()
      await dataService.checkin.updateToday({ horse_played: true })
    },

    exercise: async (): Promise<void> => {
      const store = useStore.getState()
      store.exerciseHorse()
      await dataService.checkin.updateToday({ horse_exercised: true })
    },

    async updateMood(mood: HorseMood): Promise<void> {
      const store = useStore.getState()
      store.setHorseMood(mood)

      if (isSupabaseOnline() && store.userId) {
        try {
          await supabase.from('horses').update({ mood }).eq('user_id', store.userId)
        } catch { /* ok */ }
      }
    },
  }

  // ─── 数据同步（从Supabase拉取到本地）─────────

  sync = {
    pullAll: async (): Promise<void> => {
      if (!isSupabaseOnline()) return

      const store = useStore.getState()
      if (!store.userId) return

      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', store.userId)
          .maybeSingle()

        if (profile) {
          const p = profile as { primary_constitution: ConstitutionType | null }
          if (p.primary_constitution) {
            // ConstitutionType 和 store.Constitution 是相同的联合类型
            store.setConstitution(p.primary_constitution as '平和质' | '气虚质' | '阳虚质' | '阴虚质' | '痰湿质' | '湿热质' | '血瘀质' | '气郁质' | '特禀质')
          }
        }

        const { data: dietData } = await supabase
          .from('diet_records')
          .select('*')
          .eq('user_id', store.userId)
          .order('created_at', { ascending: false })

        if (dietData) {
          lsSet(LS_KEYS.dietRecords, dietData as DietRecord[])
        }

        const { data: weightData } = await supabase
          .from('weight_records')
          .select('*')
          .eq('user_id', store.userId)
          .order('record_date', { ascending: false })

        if (weightData) {
          lsSet(LS_KEYS.weightRecords, weightData as WeightRecord[])
          if (weightData.length > 0) {
            store.setWeight((weightData[0] as WeightRecord).weight_kg)
          }
        }
      } catch (err) {
        console.warn('[DataService] Pull sync failed:', err)
      }
    },

    pushPending: async (): Promise<void> => {
      if (!isSupabaseOnline()) return
      // 将本地未同步的数据推送到 Supabase
    },
  }
}

// 导出单例
export const dataService = DataService.getInstance()

// React Hook
export function useDataService() {
  return dataService
}
