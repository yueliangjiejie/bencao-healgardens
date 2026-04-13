/**
 * Zustand ↔ Supabase 双向同步中间件
 *
 * 策略：
 * 1. 本地优先（Local-First）：所有写入先到 Zustand + localStorage
 * 2. 后台同步：异步将变更推送到 Supabase
 * 3. 启动时拉取：登录后从 Supabase 拉取最新数据覆盖本地
 * 4. 冲突处理：以 Supabase 数据为准（Server Wins）
 *
 * 使用：
 *   import { syncStoreToCloud } from '@/lib/store-sync'
 *   // 在 App 初始化或登录后调用
 *   await syncStoreToCloud()
 */

import type { HorseStyleShort } from './store'

import { useStore } from './store'
import { supabase } from './supabase'
import { isSupabaseOnline } from './data-service'
import type { ConstitutionType } from './database.types'

// ═══════════════════════════════════════════════════
// Store 变更 → Supabase 同步
// ═══════════════════════════════════════════════════

type SyncableField = 
  | 'constitution' | 'points' | 'coins' | 'streak'
  | 'currentWeight' | 'todayCalories' | 'totalCardsRead'

const FIELD_MAP: Record<SyncableField, string> = {
  constitution: 'primary_constitution',
  points: 'total_points',
  coins: 'total_coins',
  streak: 'streak_days',
  currentWeight: 'weight_current',
  todayCalories: 'today_calories',
  totalCardsRead: 'total_cards_read',  // 虚拟字段，仅本地
}

/**
 * 将 Zustand Store 的关键状态同步到 Supabase
 */
export async function pushStoreToSupabase(): Promise<void> {
  if (!isSupabaseOnline()) return

  const store = useStore.getState()
  if (!store.userId) return

  try {
    const updates: Record<string, unknown> = {}

    if (store.constitution) {
      updates.primary_constitution = store.constitution
    }
    if (store.points !== undefined) {
      updates.total_points = store.points
    }
    if (store.coins !== undefined) {
      updates.total_coins = store.coins
    }
    if (store.streak !== undefined) {
      updates.streak_days = store.streak
    }
    if (store.currentWeight) {
      updates.weight_current = store.currentWeight
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', store.userId)
    }

    // 同步马匹数据
    if (store.horse) {
      const horseUpdates: Record<string, unknown> = {
        style: store.horse.style,
        level: store.horse.level,
        mood: store.horse.mood,
        xp: store.horse.exp,
        satiety: store.horse.satiety,
        clean: store.horse.clean,
        joy: store.horse.joy,
        fitness: store.horse.fitness,
      }

      await supabase
        .from('horses')
        .update(horseUpdates)
        .eq('user_id', store.userId)
    }
  } catch (err) {
    console.warn('[StoreSync] Push failed:', err)
  }
}

// ═══════════════════════════════════════════════════
// Supabase → Store 同步
// ═══════════════════════════════════════════════════

/**
 * 从 Supabase 拉取最新数据到 Zustand Store
 */
export async function pullSupabaseToStore(): Promise<void> {
  if (!isSupabaseOnline()) return

  const store = useStore.getState()
  if (!store.userId) return

  try {
    // 拉取用户资料
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', store.userId)
      .maybeSingle()

    if (profile) {
      const p = profile as Record<string, unknown>
      
      if (p.primary_constitution) {
        store.setConstitution(p.primary_constitution as '平和质' | '气虚质' | '阳虚质' | '阴虚质' | '痰湿质' | '湿热质' | '血瘀质' | '气郁质' | '特禀质')
      }
    }

    // 拉取马匹数据
    const { data: horseData } = await supabase
      .from('horses')
      .select('*')
      .eq('user_id', store.userId)
      .maybeSingle()

    if (horseData && !store.horse) {
      const h = horseData as Record<string, unknown>
      const styleMap: Record<string, HorseStyleShort> = {
        '金鬃骏马': 'golden',
        '蓝紫灵马': 'purple',
        '赤棕壮马': 'brown',
        '粉樱萌马': 'pink',
      }
      const styleShort = h.style_short as HorseStyleShort || 'golden'
      store.adoptHorse(
        h.style as '金鬃骏马' | '蓝紫灵马' | '赤棕壮马' | '粉樱萌马',
        styleShort,
        (h.name as string) || '小金'
      )
    }
  } catch (err) {
    console.warn('[StoreSync] Pull failed:', err)
  }
}

// ═══════════════════════════════════════════════════
// 完整同步流程
// ═══════════════════════════════════════════════════

/**
 * 完整同步：先推本地变更，再拉云端数据
 * 适用于：登录后、定期同步
 */
export async function syncStoreToCloud(): Promise<{
  pushed: boolean
  pulled: boolean
}> {
  const results = { pushed: false, pulled: false }

  // 1. 先推送本地变更
  try {
    await pushStoreToSupabase()
    results.pushed = true
  } catch { /* ok */ }

  // 2. 再拉取云端数据
  try {
    await pullSupabaseToStore()
    results.pulled = true
  } catch { /* ok */ }

  return results
}

/**
 * 定期自动同步（每5分钟）
 */
let syncIntervalId: ReturnType<typeof setInterval> | null = null

export function startAutoSync(intervalMs = 5 * 60 * 1000): void {
  if (syncIntervalId) return

  syncIntervalId = setInterval(async () => {
    if (isSupabaseOnline()) {
      await syncStoreToCloud()
    }
  }, intervalMs)
}

export function stopAutoSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId)
    syncIntervalId = null
  }
}

// ═══════════════════════════════════════════════════
// Store 订阅：自动同步关键变更
// ═══════════════════════════════════════════════════

let unsubscribe: (() => void) | null = null

/**
 * 启动 Store 变更监听
 * 当关键字段变化时自动推送到 Supabase（防抖3秒）
 */
export function startStoreSyncWatcher(): void {
  if (unsubscribe) return

  let syncTimeout: ReturnType<typeof setTimeout> | null = null

  unsubscribe = useStore.subscribe(
    (state, prevState) => {
      // 检测关键字段变化
      const changed =
        state.points !== prevState.points ||
        state.coins !== prevState.coins ||
        state.streak !== prevState.streak ||
        state.constitution !== prevState.constitution ||
        state.currentWeight !== prevState.currentWeight

      if (changed && isSupabaseOnline()) {
        // 防抖：3秒内多次变更只同步一次
        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(() => {
          pushStoreToSupabase()
        }, 3000)
      }
    }
  )
}

export function stopStoreSyncWatcher(): void {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}
