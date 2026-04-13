/**
 * 本草纲目药膳小镇 — Supabase 数据库类型定义
 * 
 * 自动生成模板，覆盖所有数据表
 * 与 migrations/001 + 002 + 003 对齐
 */

// ═══════════════════════════════════════════════════
// 枚举类型
// ═══════════════════════════════════════════════════

export type ConstitutionType = 
  | '平和质' | '气虚质' | '阳虚质' | '阴虚质'
  | '痰湿质' | '湿热质' | '血瘀质' | '气郁质' | '特禀质'

export type HorseStyle = '金鬃骏马' | '蓝紫灵马' | '赤棕壮马' | '粉樱萌马'
export type HorseLevel = '小马驹' | '少年马' | '壮年马' | '千里马' | '神驹'
export type HorseMood = 'idle' | 'happy' | 'eating' | 'playing' | 'sleeping' | 'sad' | 'excited' | 'content'
export type HorseFurLevel = '暗淡' | '普通' | '光泽' | '亮丽' | '金光闪闪'
export type HorseBodyType = '偏瘦' | '标准' | '偏胖'

export type ChallengeStatus = 'draft' | 'published' | 'in_progress' | 'paused' | 'completed' | 'archived'
export type ParticipantStatus = 'joined' | 'active' | 'dropped_out'
export type SubscriptionPlan = 'free' | 'starter' | 'business' | 'enterprise'
export type UserRole = 'platform_admin' | 'hr_admin' | 'employee'

export type DietRecordSource = 'ai_recognition' | 'manual' | 'import'
export type MealType = '早餐' | '午餐' | '晚餐' | '加餐' | '零食'
export type GameType = 'food_catcher' | 'memory_flip' | 'boss_battle' | 'daily_checkin' | 'physio_limit_acute' | 'physio_limit_chronic' | 'horse_race'
export type AchievementCategory = 'streak' | 'diet' | 'exercise' | 'game' | 'knowledge' | 'social' | 'special'
export type NotificationType = 'water_reminder' | 'exercise_reminder' | 'medicine_reminder' | 'checkin_reminder' | 'achievement_unlocked' | 'level_up' | 'challenge_invite' | 'system' | 'horse_mood'
export type ShopItemType = 'recipe' | 'horse_accessory' | 'horse_stable' | 'avatar_frame' | 'special'
export type PointEventType = 
  | 'diet_record' | 'ai_food_recognition' | 'weight_record'
  | 'horse_feed' | 'horse_cleanse' | 'horse_play' | 'exercise_checkin'
  | 'memory_game_win' | 'daily_checkin' | 'boss_battle_complete'
  | 'food_catcher_score' | 'challenge_join' | 'challenge_milestone'
  | 'challenge_rank_reward' | 'hr_manual_award' | 'subscription_purchase'
  | 'points_spent'

// ═══════════════════════════════════════════════════
// 数据表类型
// ═══════════════════════════════════════════════════

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  industry: string | null
  size: string | null
  subscription_plan: SubscriptionPlan
  subscription_expires_at: string | null
  max_employees: number
  employee_count: number
  hr_admin_ids: string[]
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface UserProfile {
  id: string
  tenant_id: string | null
  auth_id: string
  display_name: string
  avatar_url: string | null
  email: string
  employee_id: string | null
  department: string | null
  position: string | null
  role: UserRole
  is_active: boolean

  // 中医体质
  primary_constitution: ConstitutionType | null
  constitution_scores: Record<string, number> | null
  constitution_tested_at: string | null

  // 马匹摘要
  horse_style: HorseStyle
  horse_level: HorseLevel
  horse_name: string | null
  horse_coat_level: number
  horse_mood: HorseMood
  horse_xp: number
  horse_last_interaction_at: string | null

  // 统计
  total_points: number
  total_coins: number
  streak_days: number
  longest_streak: number
  weight_starting: number | null
  weight_current: number | null
  height_cm: number | null
  target_weight: number | null
  today_calories: number

  created_at: string
  updated_at: string
}

export interface Horse {
  id: string
  user_id: string
  tenant_id: string
  style: HorseStyle
  level: HorseLevel
  name: string
  mood: HorseMood
  coat_level: number
  xp: number
  accessories: string[]
  satiety: number
  clean: number
  joy: number
  fitness: number
  body_type: HorseBodyType
  fur_level: HorseFurLevel
  created_at: string
  updated_at: string
}

export interface DietRecord {
  id: string
  user_id: string
  tenant_id: string
  record_date: string
  meal_type: MealType
  source: DietRecordSource
  food_name: string
  food_name_en: string | null
  quantity: number
  unit: string
  calories: number
  protein: number | null
  fat: number | null
  carbs: number | null
  fiber: number | null
  ai_confidence: number | null
  ai_raw_response: Record<string, unknown> | null
  food_image_url: string | null
  food_nature: string | null
  food_flavor: string | null
  constitution_fit: Record<string, number> | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WeightRecord {
  id: string
  user_id: string
  tenant_id: string
  record_date: string
  weight_kg: number
  bmi: number | null
  body_fat_pct: number | null
  notes: string | null
  created_at: string
}

export interface ExerciseLog {
  id: string
  user_id: string
  tenant_id: string
  log_date: string
  exercise_type: string
  duration_minutes: number
  intensity: string
  calories_burned: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  notes: string | null
  created_at: string
}

export interface GameSession {
  id: string
  user_id: string
  tenant_id: string
  game_type: GameType
  started_at: string
  ended_at: string | null
  score: number
  level_reached: number
  is_completed: boolean
  points_earned: number
  coins_earned: number
  game_data: Record<string, unknown>
  created_at: string
}

export interface DailyCheckin {
  id: string
  user_id: string
  tenant_id: string
  checkin_date: string
  diet_recorded: boolean
  weight_recorded: boolean
  exercise_done: boolean
  water_glasses: number
  medicine_taken: boolean
  horse_fed: boolean
  horse_cleaned: boolean
  horse_played: boolean
  horse_exercised: boolean
  points_earned: number
  bonus_earned: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AchievementDefinition {
  id: string
  category: AchievementCategory
  name_zh: string
  name_en: string | null
  description_zh: string
  description_en: string | null
  icon: string
  tier: number
  required_count: number
  reward_points: number
  reward_coins: number
  is_secret: boolean
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  tenant_id: string
  achievement_id: string
  unlocked_at: string
  progress_count: number
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  icon: string | null
  reference_id: string | null
  reference_type: string | null
  action_url: string | null
  is_read: boolean
  read_at: string | null
  scheduled_at: string
  sent_at: string | null
  expires_at: string | null
  created_at: string
}

export interface KnowledgeProgress {
  id: string
  user_id: string
  tenant_id: string
  card_type: string
  card_id: string
  is_read: boolean
  read_count: number
  is_favorited: boolean
  last_read_at: string
  created_at: string
}

export interface ShopItem {
  id: string
  item_type: ShopItemType
  name_zh: string
  name_en: string | null
  description_zh: string
  description_en: string | null
  icon: string
  price_points: number | null
  price_coins: number | null
  constitution_restriction: ConstitutionType | null
  required_horse_level: HorseLevel | null
  is_active: boolean
  sort_order: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface ShopPurchase {
  id: string
  user_id: string
  tenant_id: string
  item_id: string
  paid_points: number
  paid_coins: number
  purchased_at: string
}

export interface ConstitutionAssessment {
  id: string
  user_id: string
  tenant_id: string
  method: string
  quiz_answers: number[] | null
  quiz_scores: Record<string, number> | null
  tongue_image_url: string | null
  tongue_analysis: Record<string, unknown> | null
  tongue_scores: Record<string, number> | null
  final_scores: Record<string, number>
  primary_constitution: ConstitutionType
  secondary_constitution: ConstitutionType | null
  organ_analysis: Record<string, number> | null
  created_at: string
}

export interface PointTransaction {
  id: string
  user_id: string
  tenant_id: string
  event_type: PointEventType
  amount: number
  balance_after: number
  reference_id: string | null
  reference_type: string | null
  description: string | null
  granted_by: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface DailyHealthLog {
  id: string
  user_id: string
  tenant_id: string
  log_date: string
  calories_in: number | null
  calories_out: number | null
  water_glasses: number | null
  steps_count: number | null
  sleep_hours: number | null
  weight_kg: number | null
  diet_records_count: number
  exercise_minutes: number
  fitness: number
  constitution_match_score: number
  notes: string | null
  created_at: string
  updated_at: string
}

// ═══════════════════════════════════════════════════
// Supabase 数据库 Schema 类型（用于类型化查询）
// ═══════════════════════════════════════════════════

export interface Database {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Tenant, 'id' | 'created_at'>> }
      user_profiles: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<Omit<UserProfile, 'id' | 'created_at'>> }
      horses: { Row: Horse; Insert: Omit<Horse, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Horse, 'id' | 'created_at'>> }
      diet_records: { Row: DietRecord; Insert: Omit<DietRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<DietRecord, 'id' | 'created_at'>> }
      weight_records: { Row: WeightRecord; Insert: Omit<WeightRecord, 'id' | 'created_at'>; Update: Partial<Omit<WeightRecord, 'id' | 'created_at'>> }
      exercise_logs: { Row: ExerciseLog; Insert: Omit<ExerciseLog, 'id' | 'created_at'>; Update: Partial<Omit<ExerciseLog, 'id' | 'created_at'>> }
      game_sessions: { Row: GameSession; Insert: Omit<GameSession, 'id' | 'created_at'>; Update: Partial<Omit<GameSession, 'id' | 'created_at'>> }
      daily_checkins: { Row: DailyCheckin; Insert: Omit<DailyCheckin, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<DailyCheckin, 'id' | 'created_at'>> }
      achievement_definitions: { Row: AchievementDefinition; Insert: Omit<AchievementDefinition, 'created_at'>; Update: Partial<Omit<AchievementDefinition, 'created_at'>> }
      user_achievements: { Row: UserAchievement; Insert: Omit<UserAchievement, 'unlocked_at'>; Update: Partial<UserAchievement> }
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Omit<Notification, 'id' | 'created_at'>> }
      knowledge_progress: { Row: KnowledgeProgress; Insert: Omit<KnowledgeProgress, 'id' | 'created_at'>; Update: Partial<Omit<KnowledgeProgress, 'id' | 'created_at'>> }
      shop_items: { Row: ShopItem; Insert: Omit<ShopItem, 'id' | 'created_at'>; Update: Partial<Omit<ShopItem, 'id' | 'created_at'>> }
      shop_purchases: { Row: ShopPurchase; Insert: Omit<ShopPurchase, 'id' | 'purchased_at'>; Update: never }
      constitution_assessments: { Row: ConstitutionAssessment; Insert: Omit<ConstitutionAssessment, 'id' | 'created_at'>; Update: never }
      point_transactions: { Row: PointTransaction; Insert: Omit<PointTransaction, 'id' | 'created_at'>; Update: never }
      daily_health_logs: { Row: DailyHealthLog; Insert: Omit<DailyHealthLog, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<DailyHealthLog, 'id' | 'created_at'>> }
    }
    Views: Record<string, never>
    Functions: {
      get_current_tenant_id: { Args: Record<string, never>; Returns: string }
      is_current_user_hr_admin: { Args: Record<string, never>; Returns: boolean }
    }
  }
}
