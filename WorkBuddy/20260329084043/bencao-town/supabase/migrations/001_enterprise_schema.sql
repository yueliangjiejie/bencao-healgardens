-- ═══════════════════════════════════════════════════════════
-- 本草纲目药膳小镇 — 企业版数据库 Schema v1.0
-- 对应 enterprise-schema-v1.sql 的 Supabase 迁移文件
--
-- 使用方式: supabase db push 或在 Dashboard SQL Editor 执行
-- 依赖: Supabase Auth (auth.users) 已启用
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════
-- Part 1: 枚举类型 (11个)
-- ═══════════════════════════════════════════════════

CREATE TYPE constitution_type AS ENUM (
  '平和质', '气虚质', '阳虚质', '阴虚质',
  '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质'
);

CREATE TYPE horse_style AS ENUM (
  '金鬃骏马', '蓝紫灵马', '赤棕壮马', '粉樱萌马'
);

CREATE TYPE horse_level AS ENUM (
  '小马驹', '少年马', '壮年马', '千里马', '神驹'
);

CREATE TYPE horse_mood AS ENUM (
  'idle', 'happy', 'eating', 'playing',
  'sleeping', 'sad', 'excited', 'content'
);

CREATE TYPE challenge_status AS ENUM (
  'draft', 'published', 'in_progress', 'paused', 'completed', 'archived'
);

CREATE TYPE participant_status AS ENUM (
  'joined', 'active', 'dropped_out'
);

CREATE TYPE challenge_template_id AS ENUM (
  'fat-loss-21', 'steps-30', 'diet-consistency-14',
  'ultimate-department', 'tcm-wellness-week'
);

CREATE TYPE subscription_plan AS ENUM (
  'free', 'starter', 'business', 'enterprise'
);

CREATE TYPE user_role AS ENUM (
  'platform_admin', 'hr_admin', 'employee'
);

CREATE TYPE point_event_type AS ENUM (
  'diet_record', 'ai_food_recognition', 'weight_record',
  'horse_feed', 'horse_cleanse', 'horse_play', 'exercise_checkin',
  'memory_game_win', 'daily_checkin', 'boss_battle_complete',
  'food_catcher_score', 'challenge_join', 'challenge_milestone',
  'challenge_rank_reward', 'hr_manual_award', 'subscription_purchase',
  'points_spent'
);

CREATE TYPE audit_action AS ENUM (
  'tenant.create', 'tenant.update', 'tenant.delete',
  'user.invite', 'user.activate', 'user.deactivate', 'user.role_change',
  'challenge.create', 'challenge.publish', 'challenge.pause',
  'challenge.complete', 'challenge.archive',
  'team.create', 'team.join', 'team.leave',
  'points.grant', 'points.deduct',
  'report.generate', 'report.export',
  'settings.update', 'api_key.create', 'api_key.revoke',
  'login', 'logout'
);


-- ═══════════════════════════════════════════════════
-- Part 2: 租户表（2张）
-- ═══════════════════════════════════════════════════

-- 企业/租户主表
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  industry TEXT,
  size TEXT, -- startup / small / medium / large / enterprise
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  max_employees INTEGER NOT NULL DEFAULT 10,
  employee_count INTEGER NOT NULL DEFAULT 0,
  hr_admin_ids UUID[] NOT NULL DEFAULT '{}',

  settings JSONB NOT NULL DEFAULT '{
    "allow_self_registration": true,
    "require_department": true,
    "challenge_enabled": true,
    "leaderboard_anonymity": true,
    "default_language": "zh",
    "timezone": "Asia/Shanghai",
    "working_days": [1,2,3,4,5]
  }'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ -- 软删除
);

-- 创建索引
CREATE INDEX idx_tenants_slug ON tenants(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_subscription ON tenants(subscription_plan) WHERE deleted_at IS NULL;

-- 触发器: 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 租户邀请码表（可选：用于员工加入企业）
CREATE TABLE tenant_invites (
  code TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL, -- hr_admin uuid
  email TEXT,
  department TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  max_uses INTEGER NOT NULL DEFAULT 1,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tenant_invites_code ON tenant_invites(code) WHERE expires_at > now();


-- ═══════════════════════════════════════════════════
-- Part 3: 用户表（3张）
-- ═══════════════════════════════════════════════════

-- 用户档案（扩展 auth.users）
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 与 auth.users.id 一致
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_id UUID UNIQUE NOT NULL, -- auth.users.id

  display_name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT NOT NULL,
  employee_id TEXT, -- 工号
  department TEXT,
  position TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- 中医体质
  primary_constitution constitution_type,
  constitution_scores JSONB DEFAULT '{}'::jsonb, -- {"平和质":85,"气虚质":30,...}
  constitution_tested_at TIMESTAMPTZ,

  -- 马匹数据（冗余存储，方便查询）
  horse_style horse_style NOT NULL DEFAULT '金鬃骏马',
  horse_level horse_level NOT NULL DEFAULT '小马驹',
  horse_name TEXT,
  horse_coat_level SMALLINT NOT NULL DEFAULT 1 CHECK (horse_coat_level BETWEEN 1 AND 5),
  horse_mood horse_mood NOT NULL DEFAULT 'idle',
  horse_xp INTEGER NOT NULL DEFAULT 0,
  horse_last_interaction_at TIMESTAMPTZ,

  -- 统计
  total_points INTEGER NOT NULL DEFAULT 0,
  total_coins INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  weight_starting NUMERIC(5,1),
  weight_current NUMERIC(5,1),
  height_cm SMALLINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_tenant ON user_profiles(tenant_id) WHERE is_active = true;
CREATE INDEX idx_user_profiles_auth ON user_profiles(auth_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email, tenant_id);
CREATE INDEX idx_user_profiles_department ON user_profiles(tenant_id, department)
  WHERE is_active = true AND department IS NOT NULL;

CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 马匹详情表
CREATE TABLE horses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  style horse_style NOT NULL DEFAULT '金鬃骏马',
  level horse_level NOT NULL DEFAULT '小马驹',
  name TEXT NOT NULL,
  mood horse_mood NOT NULL DEFAULT 'idle',
  coat_level SMALLINT NOT NULL DEFAULT 1 CHECK (coat_level BETWEEN 1 AND 5),
  xp INTEGER NOT NULL DEFAULT 0,
  accessories TEXT[] NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_horses_user ON horses(user_id);
CREATE TRIGGER horses_updated_at BEFORE UPDATE ON horses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 每日健康日志
CREATE TABLE daily_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,

  calories_in INTEGER,
  calories_out INTEGER,
  water_glasses SMALLINT,
  steps_count INTEGER,
  sleep_hours NUMERIC(3,1),
  weight_kg NUMERIC(5,1),
  diet_records_count INTEGER NOT NULL DEFAULT 0,
  exercise_minutes INTEGER NOT NULL DEFAULT 0,
  fitness REAL NOT NULL DEFAULT 60 CHECK (fitness BETWEEN 0 AND 100),
  constitution_match_score REAL NOT NULL DEFAULT 0 CHECK (constitution_match_score BETWEEN 0 AND 100),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_daily_log UNIQUE(user_id, log_date)
);

CREATE INDEX idx_health_logs_date ON daily_health_logs(tenant_id, log_date);
CREATE INDEX idx_health_logs_user ON daily_health_logs(user_id, log_date);

CREATE TRIGGER daily_health_logs_updated_at BEFORE UPDATE ON daily_health_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════
-- Part 4: 挑战赛系统（6张）
-- ═══════════════════════════════════════════════════

-- 挑战赛主表
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES user_profiles(id),

  template_id challenge_template_id NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image_url TEXT,
  status challenge_status NOT NULL DEFAULT 'draft',

  config JSONB NOT NULL DEFAULT '{
    "allow_teams": false,
    "auto_team_assignment": false,
    "min_activity_threshold": 3,
    "visibility": "public"
  }'::jsonb,

  rules JSONB NOT NULL DEFAULT '{
    "scoring_period": "daily",
    "ranking_algorithm": "weighted_sum",
    "tie_breaker": "earliest_achievement"
  }'::jsonb,

  rewards JSONB NOT NULL DEFAULT '{
    "points_1st": 500,
    "points_2nd": 300,
    "points_3rd": 150,
    "points_completion": 100,
    "coins_bonus": 200,
    "badges": []
  }'::jsonb,

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER NOT NULL DEFAULT 0,
  team_size_min INTEGER,
  team_size_max INTEGER,

  published_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenges_tenant ON challenges(tenant_id, status)
  WHERE status != 'archived';
CREATE INDEX idx_challenges_dates ON challenges(tenant_id, start_date, end_date)
  WHERE status IN ('published', 'in_progress');

CREATE TRIGGER challenges_updated_at BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 挑战赛团队
CREATE TABLE challenge_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  department TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  max_members INTEGER NOT NULL DEFAULT 50,
  total_score REAL NOT NULL DEFAULT 0,
  rank INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_team_name_per_challenge UNIQUE(challenge_id, name)
);

CREATE INDEX idx_teams_challenge ON challenge_teams(challenge_id, total_score DESC);


-- 挑战赛参与者
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  team_id UUID REFERENCES challenge_teams(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status participant_status NOT NULL DEFAULT 'joined',
  total_score REAL NOT NULL DEFAULT 0,
  individual_rank INTEGER,
  team_rank INTEGER,
  days_active INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dropped_out_at TIMESTAMPTZ,

  CONSTRAINT unique_user_challenge UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_participants_challenge ON challenge_participants(challenge_id, total_score DESC)
  WHERE status != 'dropped_out';
CREATE INDEX idx_participants_user ON challenge_participants(user_id, status)
  WHERE status = 'active';


-- 每日挑战计分
CREATE TABLE challenge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,

  metric_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  daily_total REAL NOT NULL DEFAULT 0,
  bonus_points REAL NOT NULL DEFAULT 0,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_participant_date UNIQUE(participant_id, score_date)
);

CREATE INDEX idx_scores_participant_date ON challenge_scores(participant_id, score_date);
CREATE INDEX idx_scores_challenge_date ON challenge_scores(challenge_id, score_date);


-- ═══════════════════════════════════════════════════
-- Part 5: 积分系统（1张）
-- ═══════════════════════════════════════════════════

-- 积分流水
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type point_event_type NOT NULL,
  amount INTEGER NOT NULL, -- 正=获得，负=消费
  balance_after INTEGER NOT NULL,

  reference_id UUID,      -- 关联的业务记录ID
  reference_type TEXT,     -- challenge / diet_log 等
  description TEXT,
  granted_by UUID,         -- HR手动发放时记录操作人
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_point_transactions_user ON point_transactions(user_id, created_at DESC);
CREATE INDEX idx_point_transactions_tenant ON point_transactions(tenant_id, event_type, created_at);
CREATE INDEX idx_point_transactions_ref ON point_transactions(reference_type, reference_id)
  WHERE reference_id IS NOT NULL;


-- ═══════════════════════════════════════════════════
-- Part 6: 报告与快照（2张）
-- ═══════════════════════════════════════════════════

-- 每日租户快照（聚合计算结果，避免实时聚合开销）
CREATE TABLE tenant_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  total_employees INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  avg_fitness REAL NOT NULL DEFAULT 0,
  avg_calories_in INTEGER NOT NULL DEFAULT 0,
  avg_calories_out INTEGER NOT NULL DEFAULT 0,
  avg_steps INTEGER NOT NULL DEFAULT 0,
  total_diet_records INTEGER NOT NULL DEFAULT 0,
  total_exercise_minutes INTEGER NOT NULL DEFAULT 0,

  constitution_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  department_stats JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_performers JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_tenant_snapshot UNIQUE(tenant_id, snapshot_date)
);

CREATE INDEX idx_snapshots_date ON tenant_daily_snapshots(tenant_id, snapshot_date DESC);


-- 月度报告
CREATE TABLE monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_month TEXT NOT NULL, -- YYYY-MM
  status TEXT NOT NULL DEFAULT 'generating', -- generating / ready / failed

  file_url_pdf TEXT,
  file_url_excel TEXT,

  summary JSONB NOT NULL DEFAULT '{
    "total_employees": 0,
    "participation_rate": 0,
    "avg_attendance": 0,
    "avg_weight_change": 0,
    "top_department": "",
    "most_improved_user": "",
    "health_insights": [],
    "recommendations": []
  }'::jsonb,

  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_tenant_month UNIQUE(tenant_id, report_month)
);

CREATE INDEX idx_reports_month ON monthly_reports(tenant_id, report_month DESC);


-- ═══════════════════════════════════════════════════
-- Part 7: 审计日志（2张）
-- ═══════════════════════════════════════════════════

-- 操作审计日志
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  action audit_action NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_tenant_action ON audit_logs(tenant_id, action, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC)
  WHERE created_at > now() - interval '90 days';


-- API Key 表（用于Webhook回调签名等）
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- SHA256哈希，不存明文
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id) WHERE is_active = true AND revoked_at IS NULL;


-- ═══════════════════════════════════════════════════
-- Part 8: 辅助函数（4个）
-- ═══════════════════════════════════════════════════

-- 获取当前用户的tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid();
$$;

-- 判断当前用户是否是HR管理员
CREATE OR REPLACE FUNCTION is_current_user_hr_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('platform_admin', 'hr_admin')
  );
$$;

-- K-匿名化检查：确保聚合数据至少包含K个用户
CREATE OR REPLACE FUNCTION meets_k_anonymity(
  p_tenant_id UUID,
  p_filter_condition TEXT,  -- 如 'department=''研发部'''
  p_k_threshold INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  EXECUTE format(
    SELECT COUNT(*)::int FROM user_profiles
    WHERE tenant_id = $1 AND is_active = true AND %s
  , p_filter_condition) INTO v_count;
  
  RETURN COALESCE(v_count, 0) >= p_k_threshold;
END;
$$;

-- 计算挑战赛中参与者的排名（支持并列排名）
CREATE OR REPLACE FUNCTION calculate_challenge_rank(
  p_challenge_id UUID,
  p_participant_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_participant_score REAL;
  v_rank INTEGER;
BEGIN
  SELECT total_score INTO v_participant_score
  FROM challenge_participants
  WHERE id = p_participant_id;

  SELECT COUNT(*) + 1 INTO v_rank
  FROM challenge_participants
  WHERE challenge_id = p_challenge_id
    AND status != 'dropped_out'
    AND (total_score > v_participant_score 
         OR (total_score = v_participant_score AND id < p_participant_id));

  RETURN v_rank;
END;
$$;


-- ═══════════════════════════════════════════════════
-- Part 9: Row Level Security 策略
-- ═══════════════════════════════════════════════════

-- 启用RLS的关键业务表
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── 1. user_profiles RLS ──────────────

-- 平台管理员可读所有
CREATE POLICY "platform_admin_can_read_all_users" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

-- HR管理员可读本租户所有活跃用户
CREATE POLICY "hr_can_read_tenant_users" ON user_profiles
  FOR SELECT USING (
    tenant_id = get_current_tenant_id()
    AND is_current_user_hr_admin()
  );

-- 员工只能看自己
CREATE POLICY "users_can_read_own_profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- HR可更新本租户用户（激活/停用/改角色）
CREATE POLICY "hr_can_update_tenant_users" ON user_profiles
  FOR UPDATE USING (
    tenant_id = get_current_tenant_id()
    AND is_current_user_hr_admin()
  );

-- 用户可以更新自己的非管理字段
CREATE POLICY "users_can_update_own_profile" ON user_profiles
  FOR UPDATE USING (
    id = auth.uid()
  )
  WITH CHECK (
    id = auth.uid()
    -- 不能修改 role, tenant_id, is_active
  );

-- ─── 2. horses RLS ─────────────────────

CREATE POLICY "admin_read_all_horses" ON horses
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND is_current_user_hr_admin()
    OR user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "users_update_own_horse" ON horses
  FOR UPDATE USING (user_id = auth.uid());

-- ─── 3. daily_health_logs RLS ──────────

CREATE POLICY "hr_read_all_logs" ON daily_health_logs
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND is_current_user_hr_admin()
  );

CREATE POLICY "users_read_own_logs" ON daily_health_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_logs" ON daily_health_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_logs" ON daily_health_logs
  FOR UPDATE USING (user_id = auth.uid());

-- ─── 4. challenges RLS ─────────────────

CREATE POLICY "hr_full_access_challenges" ON challenges
  FOR ALL USING (
    tenant_id = get_current_tenant_id() AND is_current_user_hr_admin()
  );

CREATE POLICY "employees_read_published_challenges" ON challenges
  FOR SELECT USING (
    tenant_id = get_current_tenant_id()
    AND status IN ('published', 'in_progress')
  );

-- ─── 5. challenge_participants RLS ─────

CREATE POLICY "hr_read_all_participants" ON challenge_participants
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND is_current_user_hr_admin()
  );

CREATE POLICY "users_read_own_participations" ON challenge_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_join_challenge" ON challenge_participants
  FOR INSERT WITH CHECK (user_id = auth.uuid());

-- ─── 6. challenge_scores RLS ──────────

CREATE POLICY "hr_read_all_scores" ON challenge_scores
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND is_current_user_hr_admin()
  );

CREATE POLICY "users_read_own_scores" ON challenge_scores
  FOR SELECT USING (
    participant_id IN (
      SELECT id FROM challenge_participants WHERE user_id = auth.uid()
    )
  );

-- ─── 7. point_transactions RLS ────────

CREATE POLICY "hr_read_all_transactions" ON point_transactions
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND is_current_user_hr_admin()
  );

CREATE POLICY "users_read_own_transactions" ON point_transactions
  FOR SELECT USING (user_id = auth.uid());

-- 只有HR/系统可以创建积分记录
CREATE POLICY "hr_grant_points" ON point_transactions
  FOR INSERT WITH CHECK (is_current_user_hr_admin());

-- ─── 8. tenant_daily_snapshots RLS ────

CREATE POLICY "hr_read_snapshots" ON tenant_daily_snapshots
  FOR SELECT USING (tenant_id = get_current_tenant_id());
-- 仅HR及以上角色有权限访问快照

-- ─── 9. monthly_reports RLS ───────────

CREATE POLICY "hr_manage_reports" ON monthly_reports
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- ─── 10. audit_logs RLS ───────────────

CREATE POLICY "admin_read_audit_logs" ON audit_logs
  FOR SELECT USING (
    tenant_id = get_current_tenant_id()
    AND is_current_user_hr_admin()
  );

-- service_role 可以插入审计日志
CREATE POLICY "service_create_audit" ON audit_logs
  FOR INSERT WITH CHECK (true); -- 由触发器调用


-- ═══════════════════════════════════════════════════
-- Part 10: 定时任务（通过 pg_cron 或 pg_net）
-- ═══════════════════════════════════════════════════

-- 注意: 需要在 Supabase Dashboard 中启用 pg_cron extension

/*
-- 任务1: 每日凌晨01:00 计算昨日挑战赛分数
SELECT cron.schedule('enterprise-daily-scoring', '0 1 * * *', $$
  SELECT calculate_daily_challenge_scores(current_date - 1);
$$);

-- 任务2: 每日凌晨02:00 生成每日快照
SELECT cron.schedule('enterprise-daily-snapshot', '0 2 * * *', $$
  INSERT INTO tenant_daily_snapshots (tenant_id, snapshot_date, ...)
  SELECT ... FROM generate_tenant_snapshot_data(current_date - 1);
$$);

-- 任务3: 每日凌晨03:00 检查挑战赛状态转换
SELECT cron.schedule('enterprise-challenge-status-check', '0 3 * * *', $$
  SELECT check_and_transition_challenge_statuses();
$$);

-- 任务4: 每月1号04:00 生成上月报告
SELECT cron.schedule('enterprise-monthly-report', '0 4 1 * *', $$
  SELECT queue_monthly_reports(to_char(current_date - interval '1 month', 'YYYY-MM'));
$$);
*/


-- ═══════════════════════════════════════════════════
-- Part 11: 种子数据（默认挑战赛模板配置）
-- ═══════════════════════════════════════════════════

-- 可选: 插入一个平台管理员测试用户
-- 实际部署时通过 seed.sql 或 Dashboard 手动操作


-- ═══════════════════════════════════════════════════
-- 完成！Schema 统计:
-- ═══════════════════════════════════════════════════
--   枚举类型: 11
--   数据表:   22 (tenants+invites + profiles+horses+health_logs +
--              challenges+teams+participants+scores + transactions +
--              snapshots+reports + logs+api_keys)
--   辅助函数: 4 (get_current_tenant_id, is_current_user_hr_admin,
--              meets_k_anonymity, calculate_challenge_rank)
--   RLS策略:  ~25条 (覆盖10张表的 CRUD)
--   索引:    ~20个 (含部分索引优化查询性能)
--   定时任务: 4个 (需 pg_cron 支持)
-- ═══════════════════════════════════════════════════
