-- ═══════════════════════════════════════════════════════════
-- 本草纲目健康小镇 — C端功能扩展表
-- 
-- 策略：每个独立用户注册时自动创建一个"个人租户"，
--       复用企业版 schema (001) 的 profiles/horses/points 等表，
--       仅新增 C端特有的业务表。
--
-- 依赖: 001_enterprise_schema.sql 已执行
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════
-- Part 1: 新增枚举类型
-- ═══════════════════════════════════════════════════

CREATE TYPE diet_record_source AS ENUM (
  'ai_recognition', 'manual', 'import'
);

CREATE TYPE meal_type AS ENUM (
  '早餐', '午餐', '晚餐', '加餐', '零食'
);

CREATE TYPE game_type AS ENUM (
  'food_catcher', 'memory_flip', 'boss_battle', 'daily_checkin',
  'physio_limit_acute', 'physio_limit_chronic', 'horse_race'
);

CREATE TYPE achievement_category AS ENUM (
  'streak', 'diet', 'exercise', 'game', 'knowledge', 'social', 'special'
);

CREATE TYPE notification_type AS ENUM (
  'water_reminder', 'exercise_reminder', 'medicine_reminder',
  'checkin_reminder', 'achievement_unlocked', 'level_up',
  'challenge_invite', 'system', 'horse_mood'
);

CREATE TYPE horse_fur_level AS ENUM (
  '暗淡', '普通', '光泽', '亮丽', '金光闪闪'
);

CREATE TYPE horse_body_type AS ENUM (
  '偏瘦', '标准', '偏胖'
);


-- ═══════════════════════════════════════════════════
-- Part 2: 饮食记录表
-- ═══════════════════════════════════════════════════

CREATE TABLE diet_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  record_date DATE NOT NULL DEFAULT current_date,
  meal_type meal_type NOT NULL DEFAULT '午餐',
  source diet_record_source NOT NULL DEFAULT 'manual',

  -- 食物信息
  food_name TEXT NOT NULL,
  food_name_en TEXT,
  quantity NUMERIC(6,1) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT '份',
  
  -- 营养数据
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(5,1),
  fat NUMERIC(5,1),
  carbs NUMERIC(5,1),
  fiber NUMERIC(5,1),
  
  -- AI识别结果
  ai_confidence REAL,
  ai_raw_response JSONB,
  food_image_url TEXT,
  
  -- 中医属性
  food_nature TEXT,          -- 寒/凉/平/温/热
  food_flavor TEXT,          -- 酸/苦/甘/辛/咸
  constitution_fit JSONB DEFAULT '{}'::jsonb,  -- {"气虚质": 0.8, "湿热质": -0.3, ...}
  
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diet_records_user_date ON diet_records(user_id, record_date DESC);
CREATE INDEX idx_diet_records_tenant_date ON diet_records(tenant_id, record_date DESC);

CREATE TRIGGER diet_records_updated_at BEFORE UPDATE ON diet_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════
-- Part 3: 体重记录表
-- ═══════════════════════════════════════════════════

CREATE TABLE weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  record_date DATE NOT NULL DEFAULT current_date,
  weight_kg NUMERIC(5,1) NOT NULL,
  bmi NUMERIC(4,1),
  body_fat_pct NUMERIC(4,1),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_weight_date UNIQUE(user_id, record_date)
);

CREATE INDEX idx_weight_records_user ON weight_records(user_id, record_date DESC);


-- ═══════════════════════════════════════════════════
-- Part 4: 运动日志表
-- ═══════════════════════════════════════════════════

CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  log_date DATE NOT NULL DEFAULT current_date,
  exercise_type TEXT NOT NULL,        -- 跑步/游泳/瑜伽/散步/骑行/其他
  duration_minutes INTEGER NOT NULL,
  intensity TEXT NOT NULL DEFAULT 'moderate',  -- low/moderate/high/extreme
  calories_burned INTEGER,
  
  -- 心率数据（如果可用）
  avg_heart_rate SMALLINT,
  max_heart_rate SMALLINT,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercise_logs_user_date ON exercise_logs(user_id, log_date DESC);


-- ═══════════════════════════════════════════════════
-- Part 5: 游戏会话表
-- ═══════════════════════════════════════════════════

CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  game_type game_type NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  
  -- 游戏结果
  score INTEGER NOT NULL DEFAULT 0,
  level_reached SMALLINT NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  
  -- 奖励
  points_earned INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  
  -- 详细数据（不同游戏类型有不同结构）
  game_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_sessions_user ON game_sessions(user_id, game_type, created_at DESC);
CREATE INDEX idx_game_sessions_type_score ON game_sessions(game_type, score DESC)
  WHERE is_completed = true;


-- ═══════════════════════════════════════════════════
-- Part 6: 每日打卡表
-- ═══════════════════════════════════════════════════

CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  checkin_date DATE NOT NULL DEFAULT current_date,
  
  -- 打卡项目
  diet_recorded BOOLEAN NOT NULL DEFAULT false,
  weight_recorded BOOLEAN NOT NULL DEFAULT false,
  exercise_done BOOLEAN NOT NULL DEFAULT false,
  water_glasses SMALLINT NOT NULL DEFAULT 0,
  medicine_taken BOOLEAN NOT NULL DEFAULT false,
  
  -- 马匹互动
  horse_fed BOOLEAN NOT NULL DEFAULT false,
  horse_cleaned BOOLEAN NOT NULL DEFAULT false,
  horse_played BOOLEAN NOT NULL DEFAULT false,
  horse_exercised BOOLEAN NOT NULL DEFAULT false,
  
  -- 打卡积分
  points_earned INTEGER NOT NULL DEFAULT 0,
  bonus_earned INTEGER NOT NULL DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_checkin_date UNIQUE(user_id, checkin_date)
);

CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, checkin_date DESC);

CREATE TRIGGER daily_checkins_updated_at BEFORE UPDATE ON daily_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════
-- Part 7: 成就系统表
-- ═══════════════════════════════════════════════════

-- 成就定义（全局）
CREATE TABLE achievement_definitions (
  id TEXT PRIMARY KEY,  -- 如 'streak_7', 'diet_100', 'first_boss'
  category achievement_category NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  description_zh TEXT NOT NULL,
  description_en TEXT,
  icon TEXT NOT NULL,           -- emoji 或图标名
  tier SMALLINT NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 5),
  required_count INTEGER NOT NULL DEFAULT 1,
  reward_points INTEGER NOT NULL DEFAULT 0,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  is_secret BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 用户成就解锁记录
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress_count INTEGER NOT NULL DEFAULT 0,
  
  CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id, unlocked_at DESC);
CREATE INDEX idx_user_achievements_tenant ON user_achievements(tenant_id, achievement_id);


-- ═══════════════════════════════════════════════════
-- Part 8: 通知表
-- ═══════════════════════════════════════════════════

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  icon TEXT,
  
  -- 关联数据
  reference_id UUID,
  reference_type TEXT,
  action_url TEXT,
  
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- 调度
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, scheduled_at DESC)
  WHERE is_read = false;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, scheduled_at DESC);


-- ═══════════════════════════════════════════════════
-- Part 9: 知识学习进度表
-- ═══════════════════════════════════════════════════

CREATE TABLE knowledge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  card_type TEXT NOT NULL,         -- 'constitution' / 'syndrome' / 'food' / 'recipe'
  card_id TEXT NOT NULL,           -- 卡片标识
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_count INTEGER NOT NULL DEFAULT 0,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_card UNIQUE(user_id, card_type, card_id)
);

CREATE INDEX idx_knowledge_user ON knowledge_progress(user_id, card_type, last_read_at DESC);


-- ═══════════════════════════════════════════════════
-- Part 10: 商城交易表
-- ═══════════════════════════════════════════════════

CREATE TYPE shop_item_type AS ENUM (
  'recipe', 'horse_accessory', 'horse_stable', 'avatar_frame', 'special'
);

CREATE TABLE shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type shop_item_type NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  description_zh TEXT NOT NULL,
  description_en TEXT,
  icon TEXT NOT NULL,
  
  price_points INTEGER,           -- 积分价格（NULL=不可用积分购买）
  price_coins INTEGER,            -- 马粮币价格（NULL=不可用马粮币购买）
  
  constitution_restriction constitution_type,  -- 限特定体质
  required_horse_level horse_level,             -- 限马匹等级
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  item_id UUID NOT NULL REFERENCES shop_items(id),
  paid_points INTEGER NOT NULL DEFAULT 0,
  paid_coins INTEGER NOT NULL DEFAULT 0,
  
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchases_user ON shop_purchases(user_id, purchased_at DESC);


-- ═══════════════════════════════════════════════════
-- Part 11: 体质测评结果表
-- ═══════════════════════════════════════════════════

CREATE TABLE constitution_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- 测评方式
  method TEXT NOT NULL DEFAULT 'quiz',  -- quiz / tongue / combined
  
  -- 答题结果
  quiz_answers JSONB,                    -- [0,2,1,0,...] 27题答案
  quiz_scores JSONB NOT NULL,           -- {"平和质":85, "气虚质":30, ...}
  
  -- 舌诊结果
  tongue_image_url TEXT,
  tongue_analysis JSONB,                -- AI舌诊原始结果
  tongue_scores JSONB,                  -- 舌诊体质得分
  
  -- 最终结果
  final_scores JSONB NOT NULL,          -- 合并后的最终得分
  primary_constitution constitution_type NOT NULL,
  secondary_constitution constitution_type,
  
  -- 五脏分析
  organ_analysis JSONB,                 -- {heart:75, spleen:60, kidney:50, liver:45}
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_user ON constitution_assessments(user_id, created_at DESC);


-- ═══════════════════════════════════════════════════
-- Part 12: RLS 策略（新增表）
-- ═══════════════════════════════════════════════════

ALTER TABLE diet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitution_assessments ENABLE ROW LEVEL SECURITY;

-- diet_records: 用户只能操作自己的记录
CREATE POLICY "users_read_own_diet" ON diet_records
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_diet" ON diet_records
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_diet" ON diet_records
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "users_delete_own_diet" ON diet_records
  FOR DELETE USING (user_id = auth.uid());
-- HR可读
CREATE POLICY "hr_read_diet" ON diet_records
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND is_current_user_hr_admin()
  );

-- weight_records: 同上
CREATE POLICY "users_read_own_weight" ON weight_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_weight" ON weight_records FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_weight" ON weight_records FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "users_delete_own_weight" ON weight_records FOR DELETE USING (user_id = auth.uid());

-- exercise_logs: 同上
CREATE POLICY "users_read_own_exercise" ON exercise_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_exercise" ON exercise_logs FOR INSERT WITH CHECK (user_id = auth.uid());

-- game_sessions: 同上
CREATE POLICY "users_read_own_games" ON game_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_games" ON game_sessions FOR INSERT WITH CHECK (user_id = auth.uid());

-- daily_checkins: 同上
CREATE POLICY "users_read_own_checkins" ON daily_checkins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_checkins" ON daily_checkins FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_checkins" ON daily_checkins FOR UPDATE USING (user_id = auth.uid());

-- user_achievements: 用户可读自己的，系统可插入
CREATE POLICY "users_read_own_achievements" ON user_achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "system_insert_achievements" ON user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());

-- notifications: 用户可读/更新自己的
CREATE POLICY "users_read_own_notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- knowledge_progress: 同上
CREATE POLICY "users_read_own_knowledge" ON knowledge_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_knowledge" ON knowledge_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_knowledge" ON knowledge_progress FOR UPDATE USING (user_id = auth.uid());

-- shop_purchases: 同上
CREATE POLICY "users_read_own_purchases" ON shop_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_purchases" ON shop_purchases FOR INSERT WITH CHECK (user_id = auth.uid());

-- constitution_assessments: 同上
CREATE POLICY "users_read_own_assessments" ON constitution_assessments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_assessments" ON constitution_assessments FOR INSERT WITH CHECK (user_id = auth.uid());

-- achievement_definitions: 全局只读
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_achievements" ON achievement_definitions FOR SELECT USING (true);

-- shop_items: 全局只读
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_shop" ON shop_items FOR SELECT USING (true);


-- ═══════════════════════════════════════════════════
-- Part 13: 马匹详情扩展（添加缺失字段）
-- ═══════════════════════════════════════════════════

-- 为 horses 表添加 C端 需要的完整字段
ALTER TABLE horses ADD COLUMN IF NOT EXISTS satiety SMALLINT NOT NULL DEFAULT 80 CHECK (satiety BETWEEN 0 AND 100);
ALTER TABLE horses ADD COLUMN IF NOT EXISTS clean SMALLINT NOT NULL DEFAULT 80 CHECK (clean BETWEEN 0 AND 100);
ALTER TABLE horses ADD COLUMN IF NOT EXISTS joy SMALLINT NOT NULL DEFAULT 80 CHECK (joy BETWEEN 0 AND 100);
ALTER TABLE horses ADD COLUMN IF NOT EXISTS fitness SMALLINT NOT NULL DEFAULT 60 CHECK (fitness BETWEEN 0 AND 100);
ALTER TABLE horses ADD COLUMN IF NOT EXISTS body_type horse_body_type NOT NULL DEFAULT '标准';
ALTER TABLE horses ADD COLUMN IF NOT EXISTS fur_level horse_fur_level NOT NULL DEFAULT '普通';

-- 为 user_profiles 添加一些 C端 字段
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS height_cm SMALLINT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_weight NUMERIC(5,1);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS today_calories INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ALTER COLUMN tenant_id DROP NOT NULL;  -- 独立用户可以为空（但注册时自动创建个人租户）


-- ═══════════════════════════════════════════════════
-- Schema 统计:
-- ═══════════════════════════════════════════════════
-- 新增枚举:    6 (diet_record_source, meal_type, game_type, 
--                achievement_category, notification_type, horse_fur_level,
--                horse_body_type, shop_item_type)
-- 新增表:     13 (diet_records, weight_records, exercise_logs,
--                game_sessions, daily_checkins, achievement_definitions,
--                user_achievements, notifications, knowledge_progress,
--                shop_items, shop_purchases, constitution_assessments)
-- RLS策略:    ~25条
-- 表扩展:     horses (+6字段), user_profiles (+3字段)
-- ═══════════════════════════════════════════════════
