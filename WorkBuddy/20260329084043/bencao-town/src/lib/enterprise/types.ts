/**
 * 企业版多租户类型系统 v1.0
 * 对应 enterprise-schema-v1.sql 的完整TypeScript类型定义
 *
 * 覆盖: 11枚举 + 22表 + API请求/响应 + 权限
 */

// ═══════════════════════════════════════════════════
// 枚举类型（对应 SQL ENUM）
// ═══════════════════════════════════════════════════

/** 王琦院士标准9种体质 */
export type ConstitutionType =
  | '平和质' | '气虚质' | '阳虚质' | '阴虚质'
  | '痰湿质' | '湿热质' | '血瘀质' | '气郁质' | '特禀质';

export const CONSTITUTION_TYPES: ConstitutionType[] = [
  '平和质', '气虚质', '阳虚质', '阴虚质',
  '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质',
];

export const CONSTITUTION_LABELS: Record<ConstitutionType, { en: string; color: string }> = {
  '平和质': { en: 'Balanced', color: '#10B981' },
  '气虚质': { en: 'Qi Deficiency', color: '#F59E0B' },
  '阳虚质': { en: 'Yang Deficiency', color: '#EF4444' },
  '阴虚质': { en: 'Yin Deficiency', color: '#EC4899' },
  '痰湿质': { en: 'Phlegm-Dampness', color: '#8B5CF6' },
  '湿热质': { en: 'Damp-Heat', color: '#F97316' },
  '血瘀质': { en: 'Blood Stasis', color: '#6366F1' },
  '气郁质': { en: 'Qi Stagnation', color: '#14B8A6' },
  '特禀质': { en: 'Special Constitution', color: '#06B6D4' },
};

/** 马匹风格 */
export type HorseStyle = '金鬃骏马' | '蓝紫灵马' | '赤棕壮马' | '粉樱萌马';

/** 马匹等级段位 */
export type HorseLevel = '小马驹' | '少年马' | '壮年马' | '千里马' | '神驹';

/** 马匹情感状态 */
export type HorseMood =
  | 'idle' | 'happy' | 'eating' | 'playing'
  | 'sleeping' | 'sad' | 'excited' | 'content';

/** 马匹毛色等级 */
export type HorseCoatLevel = 1 | 2 | 3 | 4 | 5;

/** 挑战赛状态机 */
export type ChallengeStatus =
  | 'draft'        // 草稿 - HR编辑中
  | 'published'    // 已发布 - 员工可见，可加入
  | 'in_progress' // 进行中
  | 'paused'      // 已暂停
  | 'completed';   // 已完成

/** 参与者状态 */
export type ParticipantStatus =
  | 'joined'       // 已加入
  | 'active'      // 活跃参与中
  | 'dropped_out'; // 退出

/** 挑战赛类型模板 */
export type ChallengeTemplateId =
  | 'fat-loss-21'
  | 'steps-30'
  | 'diet-consistency-14'
  | 'ultimate-department'
  | 'tcm-wellness-week';

/** 订阅计划 */
export type SubscriptionPlan = 'free' | 'starter' | 'business' | 'enterprise';

/** 用户角色 */
export type UserRole = 'platform_admin' | 'hr_admin' | 'employee';

/** 积分事件类型 */
export type PointEventType =
  | 'diet_record' | 'ai_food_recognition' | 'weight_record'
  | 'horse_feed' | 'horse_cleanse' | 'horse_play' | 'exercise_checkin'
  | 'memory_game_win' | 'daily_checkin' | 'boss_battle_complete'
  | 'food_catcher_score' | 'challenge_join' | 'challenge_milestone'
  | 'challenge_rank_reward' | 'hr_manual_award' | 'subscription_purchase'
  | 'points_spent';

/** 审计日志操作类型 */
export type AuditAction =
  | 'tenant.create' | 'tenant.update' | 'tenant.delete'
  | 'user.invite' | 'user.activate' | 'user.deactivate' | 'user.role_change'
  | 'challenge.create' | 'challenge.update' | 'challenge.publish' | 'challenge.pause'
  | 'challenge.complete' | 'challenge.archive'
  | 'team.create' | 'team.join' | 'team.leave'
  | 'points.grant' | 'points.deduct'
  | 'report.generate' | 'report.export'
  | 'settings.update' | 'api_key.create' | 'api_key.revoke'
  | 'login' | 'logout';

// ═══════════════════════════════════════════════════
// 核心实体接口（对应数据库表）
// ═══════════════════════════════════════════════════

/** 租户（企业）表 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;                    // URL友好标识
  logo_url?: string;
  industry?: string;
  size?: string;                   // startup / small / medium / large / enterprise
  subscription_plan: SubscriptionPlan;
  subscription_expires_at?: string;
  max_employees: number;           // 套餐人数上限
  employee_count: number;          // 当前激活员工数
  hr_admin_ids: string[];          // HR管理员UUID数组
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  allow_self_registration: boolean;   // 允许员工自行注册
  require_department: boolean;        // 强制填写部门
  challenge_enabled: boolean;         // 开启挑战赛功能
  leaderboard_anonymity: boolean;     // 排行榜匿名(仅显示昵称)
  default_language: 'zh' | 'en';
  timezone: string;                  // Asia/Shanghai
  working_days: number[];            // [1,2,3,4,5] 周一到周五
  custom_welcome_message?: string;
}

/** 用户档案（企业版扩展） */
export interface UserProfile {
  id: string;
  tenant_id: string;
  auth_id: string;                 // Supabase Auth UUID
  display_name: string;
  avatar_url?: string;
  email: string;
  employee_id?: string;             // 工号
  department?: string;              // 部门
  position?: string;                // 职位
  role: UserRole;
  is_active: boolean;

  // 中医体质数据
  primary_constitution?: ConstitutionType;
  constitution_scores?: Record<ConstitutionType, number>; // 9维得分
  constitution_tested_at?: string;

  // 马匹数据
  horse_style: HorseStyle;
  horse_level: HorseLevel;
  horse_name?: string;
  horse_coat_level: HorseCoatLevel;
  horse_mood: HorseMood;
  horse_xp: number;
  horse_last_interaction_at?: string;

  // 统计字段
  total_points: number;
  total_coins: number;
  streak_days: number;
  longest_streak: number;
  weight_starting?: number;
  weight_current?: number;
  height_cm?: number;

  created_at: string;
  updated_at: string;
}

/** 马匹详情（独立表） */
export interface Horse {
  id: string;
  user_id: string;
  tenant_id: string;
  style: HorseStyle;
  level: HorseLevel;
  name: string;
  mood: HorseMood;
  coat_level: HorseCoatLevel;
  xp: number;
  accessories: string[];           // 已解锁配件
  created_at: string;
  updated_at: string;
}

/** 每日健康日志 */
export interface DailyHealthLog {
  id: string;
  user_id: string;
  tenant_id: string;
  log_date: string;                // YYYY-MM-DD
  calories_in?: number;            // 摄入热量
  calories_out?: number;           // 消耗热量
  water_glasses?: number;          // 喝水杯数
  steps_count?: number;            // 步数
  sleep_hours?: number;            // 睡眠时长
  weight_kg?: number;              // 当天体重
  diet_records_count: number;      // 饮食记录条数
  exercise_minutes: number;        // 运动分钟数
  fitness: number;                 // 体质度 0-100
  constitution_match_score: number; // 体质适配分 0-100
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════
// 挑战赛相关
// ═══════════════════════════════════════════════════

/** 挑战赛主表 */
export interface Challenge {
  id: string;
  tenant_id: string;
  created_by: string;              // HR admin UUID
  template_id: ChallengeTemplateId;
  title: string;
  description: string;
  cover_image_url?: string;
  status: ChallengeStatus;

  config: ChallengeConfig;
  rules: ChallengeRules;
  rewards: ChallengeRewards;

  start_date: string;
  end_date: string;
  max_participants?: number;
  current_participants: number;
  team_size_min?: number;
  team_size_max?: number;

  published_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChallengeConfig {
  allow_teams: boolean;
  auto_team_assignment: boolean;
  department_filter?: string[];    // 限定参与部门
  min_activity_threshold: number;  // 最低活跃天数
  visibility: 'public' | 'department_only' | 'invite_only';
}

export interface ChallengeRules {
  scoring_metrics: ScoringMetric[];
  scoring_period: 'daily' | 'weekly' | 'total';
  ranking_algorithm: 'weighted_sum' | 'improvement_rate' | 'milestone_based';
  tie_breaker: 'earliest_achievement' | 'random' | 'extra_points';
}

export interface ScoringMetric {
  metric: string;                  // 字段名
  label: string;
  weight: number;                  // 权重 0-100
  unit: string;
  direction: 'higher_better' | 'lower_better';
  max_daily_score: number;
}

export interface ChallengeRewards {
  points_1st: number;
  points_2nd: number;
  points_3rd: number;
  points_completion: number;
  coins_bonus: number;
  badges: string[];
  corporate_rewards?: string;      // 企业自定义奖励描述
}

/** 挑战赛团队 */
export interface ChallengeTeam {
  id: string;
  challenge_id: string;
  tenant_id: string;
  name: string;
  emoji?: string;
  department?: string;
  member_count: number;
  max_members: number;
  total_score: number;
  rank?: number;
  created_at: string;
}

/** 挑战赛参与者 */
export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  team_id?: string;
  user_id: string;
  tenant_id: string;
  status: ParticipantStatus;
  total_score: number;
  individual_rank?: number;
  team_rank?: number;
  days_active: number;
  last_activity_at?: string;
  joined_at: string;
  dropped_out_at?: string;
}

/** 每日挑战计分 */
export interface ChallengeScore {
  id: string;
  participant_id: string;
  challenge_id: string;
  tenant_id: string;
  score_date: string;
  metric_scores: Record<string, number>; // { steps: 85, diet: 90 }
  daily_total: number;
  bonus_points: number;
  notes?: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════
// 积分与交易
// ═══════════════════════════════════════════════════

/** 积分流水 */
export interface PointTransaction {
  id: string;
  user_id: string;
  tenant_id: string;
  event_type: PointEventType;
  amount: number;
  balance_after: number;
  reference_id?: string;           // 关联业务ID
  reference_type?: string;         // challenge/diet_log等
  description?: string;
  granted_by?: string;             // HR手动发放时记录
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ═══════════════════════════════════════════════════
// 报告与快照
// ═══════════════════════════════════════════════════

/** 每日租户快照（聚合数据） */
export interface TenantDailySnapshot {
  id: string;
  tenant_id: string;
  snapshot_date: string;
  total_employees: number;
  active_users: number;            // 当天有活动的用户
  avg_fitness: number;
  avg_calories_in: number;
  avg_calories_out: number;
  avg_steps: number;
  total_diet_records: number;
  total_exercise_minutes: number;
  constitution_distribution: Record<ConstitutionType, number>;
  department_stats: DepartmentStat[];
  top_performers: TopPerformerEntry[];
  created_at: string;
}

export interface DepartmentStat {
  department: string;
  employee_count: number;
  active_count: number;
  avg_fitness: number;
  avg_steps: number;
  avg_weight_change?: number;
  total_points: number;
}

export interface TopPerformerEntry {
  user_id: string;
  display_name: string;
  department: string;
  score: number;
  highlight_metric: string;
  highlight_value: number;
}

/** 月度报告 */
export interface MonthlyReport {
  id: string;
  tenant_id: string;
  report_month: string;            // YYYY-MM
  status: 'generating' | 'ready' | 'failed';
  file_url_pdf?: string;
  file_url_excel?: string;
  summary: MonthlyReportSummary;
  generated_at?: string;
  created_at: string;
}

export interface MonthlyReportSummary {
  total_employees: number;
  participation_rate: number;       // % 活跃率
  avg_attendance: number;          // 平均出勤天数
  avg_weight_change: number;       // 平均体重变化kg
  top_department: string;
  most_improved_user: string;
  health_insights: string[];
  recommendations: string[];
}

// ═══════════════════════════════════════════════════
// 审计日志
// ═══════════════════════════════════════════════════

export interface AuditLog {
  id: string;
  tenant_id: string;
  actor_id: string;                // 操作人UUID
  action: AuditAction;
  target_type?: string;             // tenant / user / challenge 等
  target_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════
// API 请求/响应类型
// ═══════════════════════════════════════════════════

/** 统一API响应格式 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ResponseMeta {
  page?: number;
  per_page?: number;
  total_count?: number;
  total_pages?: number;
}

// ─── Dashboard ──────────────────────────────

export interface DashboardKPIs {
  total_employees: number;
  active_today: number;
  active_this_week: number;
  avg_engagement: number;          // 0-100
  avg_fitness_score: number;
  total_challenges_active: number;
  avg_weight_change_kg: number;    // 正=减重
  streak_leader: { name: string; days: number };
  points_distributed_today: number;
}

export interface DepartmentDetail {
  department: string;
  member_count: number;
  active_count: number;
  participation_rate: number;
  avg_fitness: number;
  avg_weight_change: number;
  total_points: number;
  constitution_distribution: Record<ConstitutionType, number>;
  top_members: Array<{
    display_name: string;
    score: number;
    highlight: string;
  }>;
  challenge_standings: Array<{
    challenge_title: string;
    rank: number;
    score: number;
  }>;
}

// ─── 租户管理 ──────────────────────────────

export interface CreateTenantRequest {
  name: string;
  slug: string;
  industry?: string;
  size?: string;
  plan: SubscriptionPlan;
  admin_email: string;
  admin_display_name: string;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantRequest {
  name?: string;
  logo_url?: string;
  settings?: Partial<TenantSettings>;
}

// ─── CSV导入 ─────────────────────────────────

export interface CsvImportResult {
  total_rows: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

// ─── 挑战赛 ─────────────────────────────────

export interface CreateChallengeRequest {
  template_id: ChallengeTemplateId;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  config?: Partial<ChallengeConfig>;
  rules?: Partial<ChallengeRules>;
  rewards?: Partial<ChallengeRewards>;
  max_participants?: number;
  department_filter?: string[];
  team_size_min?: number;
  team_size_max?: number;
}

// ─── 认证上下文 ─────────────────────────────

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  displayName: string;
}
