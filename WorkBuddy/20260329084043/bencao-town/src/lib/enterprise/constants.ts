/**
 * 企业版常量定义 v1.0
 * 挑战赛模板、订阅计划、定价、权限等
 */

import type {
  ChallengeTemplateId,
  SubscriptionPlan,
  UserRole,
} from './types';

// ═══════════════════════════════════════════════════
// 挑战赛预设模板
// ═══════════════════════════════════════════════════

/** 订阅计划信息（本文件内部使用） */
interface SubscriptionPlanInfo {
  id: SubscriptionPlan;
  name: string;
  nameEn: string;
  priceMonthly: number;
  priceYearly: number;
  maxEmployees: number; // -1 = unlimited
  features: string[];
  limitations: string[];
  recommended: boolean;
}

/** 扩展模板接口（本文件内部使用） */
interface ChallengeTemplate {
  id: ChallengeTemplateId;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  duration_days: number;
  team_based?: boolean;
  default_team_size_min?: number;
  default_team_size_max?: number;
  default_scoring_metrics: Array<{
    metric: string; label: string; weight: number;
    unit: string; direction: 'higher_better' | 'lower_better'; max_daily_score: number;
  }>;
  default_rewards: {
    points_1st: number; points_2nd: number; points_3rd: number;
    points_completion: number; coins_bonus: number; badges: string[];
    corporate_rewards?: string;
  };
  milestones: Array<{ day: number; label: string; points: number; badge: string }>;
}

export const CHALLENGE_TEMPLATES: Record<ChallengeTemplateId, ChallengeTemplate> = {
  'fat-loss-21': {
    id: 'fat-loss-21',
    name: '21天减脂训练营',
    nameEn: '21-Day Fat Loss Bootcamp',
    description: '通过饮食记录、运动打卡和AI体质适配饮食，在21天内养成健康减脂习惯',
    icon: '🔥',
    duration_days: 21,
    default_scoring_metrics: [
      { metric: 'diet_records_count', label: '饮食记录', weight: 30, unit: '次', direction: 'higher_better', max_daily_score: 30 },
      { metric: 'exercise_minutes', label: '运动时长', weight: 25, unit: '分钟', direction: 'higher_better', max_daily_score: 25 },
      { metric: 'calories_in', label: '热量摄入控制', weight: 20, unit: 'kcal', direction: 'lower_better', max_daily_score: 20 },
      { metric: 'constitution_match_score', label: '体质适配度', weight: 15, unit: '分', direction: 'higher_better', max_daily_score: 15 },
      { metric: 'streak_days', label: '连续打卡', weight: 10, unit: '天', direction: 'higher_better', max_daily_score: 10 },
    ],
    default_rewards: {
      points_1st: 500,
      points_2nd: 300,
      points_3rd: 150,
      points_completion: 100,
      coins_bonus: 200,
      badges: ['减脂达人', '21天挑战者'],
      corporate_rewards: '额外1天健康假',
    },
    milestones: [
      { day: 7, label: '第一周里程碑', points: 50, badge: '首周勇士' },
      { day: 14, label: '第二周里程碑', points: 100, badge: '双周坚持者' },
      { day: 21, label: '终极目标', points: 200, badge: '减脂冠军' },
    ],
  },

  'steps-30': {
    id: 'steps-30',
    name: '30天万步挑战',
    nameEn: '30-Day 10K Steps Challenge',
    description: '每天完成10000步，培养运动习惯，提升代谢水平',
    icon: '👟',
    duration_days: 30,
    default_scoring_metrics: [
      { metric: 'steps_count', label: '步数', weight: 60, unit: '步', direction: 'higher_better', max_daily_score: 60 },
      { metric: 'exercise_minutes', label: '主动运动', weight: 25, unit: '分钟', direction: 'higher_better', max_daily_score: 25 },
      { metric: 'streak_days', label: '连续天数', weight: 15, unit: '天', direction: 'higher_better', max_daily_score: 15 },
    ],
    default_rewards: {
      points_1st: 400,
      points_2nd: 250,
      points_3rd: 120,
      points_completion: 80,
      coins_bonus: 150,
      badges: ['步行王者', '万步达人'],
      corporate_rewards: '运动装备优惠券',
    },
    milestones: [
      { day: 10, label: '三分之一', points: 40, badge: '起步稳健' },
      { day: 20, label: '三分之二', points: 80, badge: '接近终点' },
      { day: 30, label: '完赛', points: 150, badge: '万步英雄' },
    ],
  },

  'diet-consistency-14': {
    id: 'diet-consistency-14',
    name: '14天饮食一致性挑战',
    nameEn: '14-Day Diet Consistency Challenge',
    description: '连续记录每餐饮食，AI分析营养均衡度和体质匹配度',
    icon: '🥗',
    duration_days: 14,
    default_scoring_metrics: [
      { metric: 'diet_records_count', label: '饮食记录数', weight: 35, unit: '次', direction: 'higher_better', max_daily_score: 35 },
      { metric: 'constitution_match_score', label: '体质适配分', weight: 30, unit: '分', direction: 'higher_better', max_daily_score: 30 },
      { metric: 'water_glasses', label: '饮水量', weight: 20, unit: '杯', direction: 'higher_better', max_daily_score: 20 },
      { metric: 'calories_in', label: '热量控制', weight: 15, unit: 'kcal', direction: 'lower_better', max_daily_score: 15 },
    ],
    default_rewards: {
      points_1st: 300,
      points_2nd: 180,
      points_3rd: 90,
      points_completion: 60,
      coins_bonus: 120,
      badges: ['饮食自律王', '营养达人'],
      corporate_rewards: '药膳食材礼包',
    },
    milestones: [
      { day: 5, label: '起步期', points: 30, badge: '五日坚持' },
      { day: 10, label: '稳定期', points: 60, badge: '十日自律' },
      { day: 14, label: '完赛', points: 100, badge: '饮食大师' },
    ],
  },

  'ultimate-department': {
    id: 'ultimate-department',
    name: '部门终极PK赛',
    nameEn: 'Ultimate Department Battle',
    description: '部门间综合健康PK，综合饮食、运动、体重变化多维度评分',
    icon: '🏆',
    duration_days: 28,
    team_based: true,
    default_team_size_min: 5,
    default_team_size_max: 50,
    default_scoring_metrics: [
      { metric: 'total_points', label: '总积分', weight: 30, unit: '分', direction: 'higher_better', max_daily_score: 30 },
      { metric: 'fitness', label: '体质度', weight: 20, unit: '分', direction: 'higher_better', max_daily_score: 20 },
      { metric: 'exercise_minutes', label: '运动分钟', weight: 20, unit: '分钟', direction: 'higher_better', max_daily_score: 20 },
      { metric: 'avg_weight_change', label: '平均减重(kg)', weight: 20, unit: 'kg', direction: 'higher_better', max_daily_score: 20 }, // 减重为正
      { metric: 'participation_rate', label: '参与率', weight: 10, unit: '%', direction: 'higher_better', max_daily_score: 10 },
    ],
    default_rewards: {
      points_1st: 800,
      points_2nd: 500,
      points_3rd: 250,
      points_completion: 150,
      coins_bonus: 500,
      badges: ['最强部门', '团队之星'],
      corporate_rewards: '部门团建基金 ¥3000 + 健康下午茶一周',
    },
    milestones: [
      { day: 7, label: '首周排行', points: 80, badge: '领跑者' },
      { day: 14, label: '中段冲刺', points: 150, badge: '稳定发挥' },
      { day: 21, label: '最后冲刺', points: 220, badge: '决赛圈' },
      { day: 28, label: '最终胜利', points: 350, badge: '部门之王' },
    ],
  },

  'tcm-wellness-week': {
    id: 'tcm-wellness-week',
    name: '中医养生周',
    nameEn: 'TCM Wellness Week',
    description: '以中医体质辨识为核心的一周养生体验：顺应节气饮食+经络穴位按摩+情志调节',
    icon: '🌿',
    duration_days: 7,
    default_scoring_metrics: [
      { metric: 'constitution_match_score', label: '体质适配饮食', weight: 35, unit: '分', direction: 'higher_better', max_daily_score: 35 },
      { metric: 'diet_records_count', label: '药膳食疗记录', weight: 25, unit: '次', direction: 'higher_better', max_daily_score: 25 },
      { metric: 'fitness', label: '整体体质度', weight: 20, unit: '分', direction: 'higher_better', max_daily_score: 20 },
      { metric: 'sleep_hours', label: '睡眠质量', weight: 10, unit: '小时', direction: 'higher_better', max_daily_score: 10 },
      { metric: 'water_glasses', label: '饮水习惯', weight: 10, unit: '杯', direction: 'higher_better', max_daily_score: 10 },
    ],
    default_rewards: {
      points_1st: 200,
      points_2nd: 120,
      points_3rd: 60,
      points_completion: 40,
      coins_bonus: 80,
      badges: ['养生达人', '中医传承者'],
      corporate_rewards: '中医体验券（推拿/艾灸1次）',
    },
    milestones: [
      { day: 3, label: '入门阶段', points: 20, badge: '初尝养生' },
      { day: 5, label: '进阶阶段', points: 40, badge: '渐入佳境' },
      { day: 7, label: '圆满完成', points: 80, badge: '养生大师' },
    ],
  },
};

// ═══════════════════════════════════════════════════
// 订阅计划与定价 (CNY/人/月)
// ═══════════════════════════════════════════════════

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanInfo> = {
  free: {
    id: 'free',
    name: '免费版',
    nameEn: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    maxEmployees: 10,
    features: [
      '最多10名员工',
      '基础健康数据记录',
      '个人体质测评',
      '马匹养成基础功能',
      '社区互动',
    ],
    limitations: ['无企业Dashboard', '无挑战赛功能', '无数据报告'],
    recommended: false,
  },

  starter: {
    id: 'starter',
    name: '创业版',
    nameEn: 'Starter',
    priceMonthly: 8,
    priceYearly: 80,
    maxEmployees: 50,
    features: [
      '最多50名员工',
      'HR Dashboard基础版',
      '每月1个活跃挑战赛',
      '月度健康报告(自动生成)',
      'CSV员工批量导入',
      '匿名化数据聚合',
      '邮件支持',
    ],
    limitations: ['仅1位HR管理员', '无API访问', '报告保留3个月'],
    recommended: true,
  },

  business: {
    id: 'business',
    name: '商业版',
    nameEn: 'Business',
    priceMonthly: 18,
    priceYearly: 180,
    maxEmployees: 200,
    features: [
      '最多200名员工',
      'HR Dashboard完整版',
      '无限挑战赛 + 5个自定义模板',
      '周报 + 月度深度报告(PDF/Excel)',
      '部门级数据分析',
      'SSO单点登录支持',
      '优先客服支持',
      'Webhook事件回调',
      '自定义品牌Logo',
    ],
    limitations: ['API限流1000次/天', '无数据洞察服务'],
    recommended: false,
  },

  enterprise: {
    id: 'enterprise',
    name: '企业版',
    nameEn: 'Enterprise',
    priceMonthly: 40,
    priceYearly: 400,
    maxEmployees: -1, // 无限制
    features: [
      '无员工数量上限',
      '全部商业版功能',
      '无限自定义模板',
      '实时数据大屏',
      '完整API访问(无限调用)',
      '专属客户成功经理',
      'SLA 99.9%保障',
      '私有部署选项',
      '数据洞察服务(定制报告)',
      '合规审计日志',
      'HIPAA兼容(可选)',
    ],
    limitations: [],
    recommended: false,
  },
};

// ═══════════════════════════════════════════════════
// 权限矩阵
// ═══════════════════════════════════════════════════

/** 每种角色可执行的操作 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  platform_admin: [
    '*',
  ],
  hr_admin: [
    'tenant:read', 'tenant:update',
    'user:list', 'user:invite', 'user:activate', 'user:deactivate', 'user:role_change',
    'challenge:create', 'challenge:read', 'challenge:update', 'challenge:publish',
    'challenge:pause', 'challenge:complete', 'challenge:archive',
    'team:create', 'team:read',
    'points:grant', 'points:deduct',
    'report:generate', 'report:read', 'report:export',
    'dashboard:read',
    'settings:read', 'settings:update',
  ],
  employee: [
    'profile:read', 'profile:update',
    'health_log:create', 'health_log:read_own',
    'challenge:list', 'challenge:join', 'challenge:leave',
    'team:join', 'team:leave',
    'points:read_own',
    'dashboard:read_own',
  ],
};

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes('*') || permissions.includes(permission);
}

// ═══════════════════════════════════════════════════
// API错误码
// ═══════════════════════════════════════════════════

export enum ApiErrorCode {
  // 通用
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // 认证
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',

  // 租户
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  TENANT_LIMIT_REACHED = 'TENANT_LIMIT_REACHED',
  SLUG_ALREADY_EXISTS = 'SLUG_ALREADY_EXISTS',

  // 用户
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  EMPLOYEE_LIMIT_REACHED = 'EMPLOYEE_LIMIT_REACHED',

  // 挑战赛
  CHALLENGE_NOT_FOUND = 'CHALLENGE_NOT_FOUND',
  CHALLENGE_ALREADY_STARTED = 'CHALLENGE_ALREADY_STARTED',
  CHALLENGE_FULL = 'CHALLENGE_FULL',
  ALREADY_JOINED = 'ALREADY_JOINED',
  NOT_JOINED = 'NOT_JOINED',
  TEAM_FULL = 'TEAM_FULL',

  // 积分
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',

  // 文件上传
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

  // Rate Limit
  RATE_LIMITED = 'RATE_LIMITED',
}

/** HTTP状态码到错误码的映射 */
export const ERROR_STATUS_MAP: Record<number, ApiErrorCode> = {
  400: ApiErrorCode.INVALID_REQUEST,
  401: ApiErrorCode.UNAUTHORIZED,
  403: ApiErrorCode.FORBIDDEN,
  404: ApiErrorCode.NOT_FOUND,
  409: ApiErrorCode.USER_ALREADY_EXISTS,
  429: ApiErrorCode.RATE_LIMITED,
  500: ApiErrorCode.UNKNOWN_ERROR,
}

// ═══════════════════════════════════════════════════
// 隐私配置
// ═══════════════════════════════════════════════════

/** K-匿名参数 */
export const PRIVACY_CONFIG = {
  /** 最小匿名集合大小 — 聚合数据至少K个用户才输出 */
  K_ANONYMITY_THRESHOLD: 5,

  /** 排行榜最小显示人数 */
  LEADERBOARD_MIN_SIZE: 5,

  /** 部门数据最小显示人数 */
  DEPARTMENT_MIN_SIZE: 3,

  /** 数据导出最小用户数 */
  EXPORT_MIN_USERS: 10,
} as const;

// ═══════════════════════════════════════════════════
// 行业分类选项
// ═══════════════════════════════════════════════════

export const INDUSTRY_OPTIONS = [
  '科技/互联网',
  '金融/保险',
  '制造/工业',
  '教育/培训',
  '医疗/健康',
  '零售/电商',
  '政府/公共事业',
  '咨询/专业服务',
  '媒体/娱乐',
  '房地产',
  '物流/运输',
  '其他',
] as const;

export const COMPANY_SIZE_OPTIONS = [
  { value: 'startup', label: '初创公司 (1-10人)' },
  { value: 'small', label: '小型企业 (11-50人)' },
  { value: 'medium', label: '中型企业 (51-200人)' },
  { value: 'large', label: '大型企业 (201-1000人)' },
  { value: 'enterprise', label: '超大型企业 (1000+人)' },
] as const;

// ═══════════════════════════════════════════════════
// 默认租户设置
// ═══════════════════════════════════════════════════

export const DEFAULT_TENANT_SETTINGS = {
  allow_self_registration: true,
  require_department: true,
  challenge_enabled: true,
  leaderboard_anonymity: true,
  default_language: 'zh' as const,
  timezone: 'Asia/Shanghai',
  working_days: [1, 2, 3, 4, 5],
};
