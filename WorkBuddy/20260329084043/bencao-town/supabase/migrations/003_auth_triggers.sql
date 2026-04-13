-- ═══════════════════════════════════════════════════════════
-- 本草纲目健康小镇 — Auth 触发器 + 个人租户自动创建
--
-- 策略：用户注册时自动创建"个人租户"，实现 C端/B端 统一数据模型
-- 依赖: 001 + 002 migrations 已执行
-- ═══════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════
-- Part 1: 个人租户自动创建函数
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_personal_tenant(p_user_id UUID, p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_slug TEXT;
BEGIN
  -- 生成唯一slug: user_{uuid前8位}
  v_slug := 'user_' || substr(p_user_id::text, 1, 8);
  
  INSERT INTO tenants (name, slug, industry, size, subscription_plan, max_employees, settings)
  VALUES (
    '个人空间', 
    v_slug, 
    'personal', 
    'personal',
    'free',
    1,
    jsonb_build_object(
      'allow_self_registration', false,
      'require_department', false,
      'challenge_enabled', false,
      'leaderboard_anonymity', false,
      'default_language', 'zh',
      'timezone', 'Asia/Shanghai',
      'is_personal_tenant', true
    )
  )
  RETURNING id INTO v_tenant_id;
  
  RETURN v_tenant_id;
END;
$$;


-- ═══════════════════════════════════════════════════
-- Part 2: 用户注册后自动创建 Profile
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_display_name TEXT;
BEGIN
  -- 从 email 或 metadata 提取显示名
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    '用户' || substr(NEW.id::text, 1, 4)
  );
  
  -- 创建个人租户
  v_tenant_id := create_personal_tenant(NEW.id, NEW.email);
  
  -- 创建用户档案
  INSERT INTO user_profiles (
    id, tenant_id, auth_id,
    display_name, email,
    role, is_active,
    total_points, total_coins, streak_days
  ) VALUES (
    NEW.id,
    v_tenant_id,
    NEW.id,
    v_display_name,
    NEW.email,
    'employee',
    true,
    0, 0, 0
  );
  
  -- 创建默认马匹（金鬃骏马）
  INSERT INTO horses (
    user_id, tenant_id,
    style, level, name,
    mood, coat_level, xp,
    satiety, clean, joy, fitness
  ) VALUES (
    NEW.id,
    v_tenant_id,
    '金鬃骏马',
    '小马驹',
    '小金',
    'happy',
    1,
    0,
    80, 80, 80, 60
  );
  
  -- 创建初始通知（欢迎消息）
  INSERT INTO notifications (user_id, type, title, body, icon)
  VALUES (
    NEW.id,
    'system',
    '欢迎来到本草纲目健康小镇！',
    '完成体质测试，领养你的专属马匹，开始养生之旅吧！',
    '🎉'
  );
  
  RETURN NEW;
END;
$$;

-- 绑定到 auth.users 表的 AFTER INSERT 触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ═══════════════════════════════════════════════════
-- Part 3: 积分自动发放触发器
-- ═══════════════════════════════════════════════════

-- 饮食记录 → 积分
CREATE OR REPLACE FUNCTION award_diet_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points INTEGER;
  v_event_type TEXT;
BEGIN
  -- AI识别+3, 手动+1
  v_points := CASE WHEN NEW.source = 'ai_recognition' THEN 3 ELSE 1 END;
  v_event_type := CASE WHEN NEW.source = 'ai_recognition' THEN 'ai_food_recognition' ELSE 'diet_record' END;
  
  -- 插入积分流水
  INSERT INTO point_transactions (user_id, tenant_id, event_type, amount, balance_after, reference_id, reference_type)
  SELECT NEW.user_id, NEW.tenant_id, v_event_type::point_event_type, v_points,
    p.total_points + v_points, NEW.id, 'diet_record'
  FROM user_profiles p WHERE p.id = NEW.user_id;
  
  -- 更新用户总积分和今日卡路里
  UPDATE user_profiles 
  SET total_points = total_points + v_points,
      today_calories = today_calories + NEW.calories
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_diet_record_created
  AFTER INSERT ON diet_records
  FOR EACH ROW EXECUTE FUNCTION award_diet_points();


-- 体重记录 → 积分
CREATE OR REPLACE FUNCTION award_weight_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO point_transactions (user_id, tenant_id, event_type, amount, balance_after, reference_id, reference_type)
  SELECT NEW.user_id, NEW.tenant_id, 'weight_record', 2,
    p.total_points + 2, NEW.id, 'weight_record'
  FROM user_profiles p WHERE p.id = NEW.user_id;
  
  UPDATE user_profiles 
  SET total_points = total_points + 2,
      weight_current = NEW.weight_kg
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_weight_record_created
  AFTER INSERT ON weight_records
  FOR EACH ROW EXECUTE FUNCTION award_weight_points();


-- ═══════════════════════════════════════════════════
-- Part 4: 成就种子数据
-- ═══════════════════════════════════════════════════

INSERT INTO achievement_definitions (id, category, name_zh, name_en, description_zh, description_en, icon, tier, required_count, reward_points, reward_coins) VALUES
-- 打卡类
('streak_3', 'streak', '三日之约', '3-Day Streak', '连续打卡3天', 'Check in 3 days in a row', '🔥', 1, 3, 10, 5),
('streak_7', 'streak', '周周不落', 'Weekly Warrior', '连续打卡7天', 'Check in 7 days in a row', '💪', 2, 7, 50, 20),
('streak_14', 'streak', '两周常胜', 'Fortnight Champion', '连续打卡14天', 'Check in 14 days in a row', '⚡', 3, 14, 100, 50),
('streak_21', 'streak', '习惯养成', 'Habit Formed', '连续打卡21天', 'Check in 21 days in a row', '🏆', 4, 21, 200, 100),
('streak_30', 'streak', '月度王者', 'Monthly King', '连续打卡30天', 'Check in 30 days in a row', '👑', 5, 30, 500, 200),
-- 饮食类
('diet_first', 'diet', '初识百草', 'First Record', '记录第一餐', 'Record your first meal', '🍽️', 1, 1, 5, 0),
('diet_10', 'diet', '食养入门', 'Diet Novice', '记录10餐饮食', 'Record 10 meals', '🥗', 1, 10, 20, 10),
('diet_50', 'diet', '饮食达人', 'Diet Expert', '记录50餐饮食', 'Record 50 meals', '👩‍🍳', 2, 50, 100, 50),
('diet_100', 'diet', '百味人生', '100 Meals Master', '记录100餐饮食', 'Record 100 meals', '🍲', 3, 100, 300, 100),
('ai_recognize_first', 'diet', '慧眼识食', 'AI Eye', '首次使用AI识别食物', 'Use AI food recognition for the first time', '🤖', 1, 1, 10, 5),
-- 运动/马匹类
('exercise_first', 'exercise', '初出茅庐', 'First Exercise', '完成第一次运动打卡', 'Complete your first exercise check-in', '🏃', 1, 1, 10, 5),
('horse_feed_10', 'exercise', '贴心管家', 'Caring Owner', '喂马10次', 'Feed your horse 10 times', '🐴', 1, 10, 15, 10),
('horse_all_in_one', 'exercise', '全能骑手', 'All-Round Rider', '一天内完成喂食+清洁+玩耍+运动', 'Feed, clean, play, and exercise in one day', '🏇', 2, 1, 30, 15),
-- 游戏类
('game_first', 'game', '初试锋芒', 'Gamer Novice', '完成第一个游戏', 'Complete your first game', '🎮', 1, 1, 10, 5),
('boss_first', 'game', '初代猎人', 'Boss Slayer', '首次击败Boss', 'Defeat your first boss', '⚔️', 2, 1, 50, 25),
('memory_master', 'game', '记忆大师', 'Memory Master', '翻牌游戏通关3次', 'Win memory flip game 3 times', '🧠', 2, 3, 50, 20),
-- 知识类
('knowledge_first', 'knowledge', '学海无涯', 'First Lesson', '阅读第一张知识卡片', 'Read your first knowledge card', '📖', 1, 1, 5, 0),
('knowledge_50', 'knowledge', '博学多识', 'Knowledge Seeker', '阅读50张知识卡片', 'Read 50 knowledge cards', '📚', 2, 50, 100, 50),
('quiz_complete', 'knowledge', '知己知彼', 'Self-Knowledge', '完成体质测试', 'Complete constitution assessment', '🔬', 1, 1, 20, 10),
-- 特殊
('early_bird', 'special', '早起的鸟儿', 'Early Bird', '早上6点前打卡', 'Check in before 6 AM', '🌅', 1, 1, 15, 10),
('night_owl', 'special', '夜猫子', 'Night Owl', '晚上11点后记录饮食', 'Record a meal after 11 PM', '🦉', 1, 1, 10, 5),
('constitution_match', 'special', '对症下药', 'Perfect Match', '体质测试+舌诊结果一致', 'Quiz and tongue diagnosis match', '🎯', 2, 1, 30, 20);


-- ═══════════════════════════════════════════════════
-- Part 5: 商城种子数据
-- ═══════════════════════════════════════════════════

INSERT INTO shop_items (item_type, name_zh, description_zh, icon, price_points, price_coins, sort_order) VALUES
-- 食疗方
('recipe', '山药薏米粥', '健脾祛湿，适合痰湿质/湿热质', '🥣', 30, NULL, 1),
('recipe', '黄芪枸杞茶', '补气养血，适合气虚质', '🍵', 25, NULL, 2),
('recipe', '当归生姜羊肉汤', '温阳散寒，适合阳虚质', '🍲', 40, NULL, 3),
('recipe', '百合莲子羹', '滋阴润燥，适合阴虚质', '🥮', 35, NULL, 4),
('recipe', '玫瑰花茶', '疏肝解郁，适合气郁质', '🌸', 20, NULL, 5),
('recipe', '三七粉冲剂', '活血化瘀，适合血瘀质', '💊', 50, NULL, 6),
-- 马匹装扮
('horse_accessory', '星星马鞍', '闪耀的金色马鞍装饰', '⭐', NULL, 50, 10),
('horse_accessory', '灯笼铃铛', '传统红色铃铛', '🏮', NULL, 30, 11),
('horse_accessory', '金元宝挂件', '招财进宝', '💰', NULL, 80, 12),
('horse_accessory', '锦鲤旗', '幸运的锦鲤旗', '🐟', NULL, 60, 13),
('horse_accessory', '翡翠项圈', '温润翡翠项圈', '💚', NULL, 100, 14),
('horse_stable', '竹林马厩', '清幽的竹林风格马厩', '🎋', NULL, 120, 20),
('horse_stable', '云朵马厩', '梦幻的云端风格马厩', '☁️', NULL, 150, 21);


-- ═══════════════════════════════════════════════════
-- 统计:
-- 触发器: 4 (新用户注册、饮食积分、体重积分、马匹初始化)
-- 函数:   3 (create_personal_tenant, handle_new_user, award_diet_points, award_weight_points)
-- 种子数据: 22个成就定义 + 13个商城商品
-- ═══════════════════════════════════════════════════
