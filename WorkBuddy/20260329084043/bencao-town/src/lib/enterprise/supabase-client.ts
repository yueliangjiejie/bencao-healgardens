/**
 * 企业版增强 Supabase Client
 * 基于现有 supabase.ts，添加：
 * - 多租户 Row Level Security 支持
 * - 企业版表类型化查询
 * - 统一错误处理
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Tenant,
  UserProfile,
  Challenge,
  ChallengeParticipant,
  ChallengeTeam,
  PointTransaction,
  TenantDailySnapshot,
  MonthlyReport,
  AuditLog,
} from './types';

// ─── 单例客户端 ─────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** 公共客户端（C端 + 员工端通用） */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 创建带租户上下文的客户端
 * 所有查询自动附加 tenant_id 过滤条件
 */
export function createTenantClient(tenantId: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'X-Tenant-Id': tenantId,
      },
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * 服务端角色客户端（仅服务端使用，绕过RLS）
 * ⚠️ 仅在 API Route / Server Action 中使用
 */
export function getServiceClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ─── 租户操作封装 ──────────────────────────

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('[Enterprise] getTenantBySlug error:', error.message);
    return null;
  }
  return data;
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error) {
    console.error('[Enterprise] getTenantById error:', error.message);
    return null;
  }
  return data;
}

// ─── 用户档案操作 ──────────────────────────

export async function getUserProfile(
  userId: string,
  tenantId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('[Enterprise] getUserProfile error:', error.message);
    return null;
  }
  return data;
}

export async function getUserProfileByEmail(
  email: string,
  tenantId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[Enterprise] getUserProfileByEmail error:', error.message);
  }
  return data ?? null;
}

/** 获取租户下所有活跃员工（HR用） */
export async function getTenantEmployees(
  tenantId: string,
  options?: { department?: string; page?: number; limit?: number }
): Promise<{ data: UserProfile[]; count: number }> {
  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (options?.department) {
    query = query.eq('department', options.department);
  }

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;

  const { data, error, count } = await query.range(from, from + limit - 1);

  if (error) {
    console.error('[Enterprise] getTenantEmployees error:', error.message);
    return { data: [], count: 0 };
  }

  return { data: data ?? [], count: count ?? 0 };
}

// ─── 挑战赛操作 ──────────────────────────

export async function getChallenges(
  tenantId: string,
  options?: { status?: string; includeArchived?: boolean }
): Promise<Challenge[]> {
  let query = supabase
    .from('challenges')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.status && !options.includeArchived) {
    query = query.eq('status', options.status);
  } else if (!options?.includeArchived) {
    query = query.neq('status', 'archived');
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Enterprise] getChallenges error:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getChallengeWithParticipants(
  challengeId: string,
  tenantId: string
): Promise<{ challenge: Challenge | null; participants: ChallengeParticipant[]; teams: ChallengeTeam[] }> {
  const [challengeResult, participantsResult, teamsResult] = await Promise.all([
    supabase.from('challenges').select('*').eq('id', challengeId).eq('tenant_id', tenantId).single(),
    supabase.from('challenge_participants').select('*').eq('challenge_id', challengeId).order('total_score', { ascending: false }),
    supabase.from('challenge_teams').select('*').eq('challenge_id', challengeId).order('total_score', { ascending: false }),
  ]);

  return {
    challenge: challengeResult.data ?? null,
    participants: participantsResult.data ?? [],
    teams: teamsResult.data ?? [],
  };
}

// ─── 积分操作 ─────────────────────────────

export async function addPoints(
  userId: string,
  tenantId: string,
  eventType: import('./types').PointEventType,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<PointTransaction | null> {
  // 先获取当前积分余额
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_points')
    .eq('id', userId)
    .single();

  const balanceAfter = (profile?.total_points ?? 0) + amount;

  const { data, error } = await supabase
    .from('point_transactions')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      event_type: eventType,
      amount,
      balance_after: balanceAfter,
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    console.error('[Enterprise] addPoints error:', error.message);
    return null;
  }

  // 更新用户总积分（乐观更新）
  await supabase
    .from('user_profiles')
    .update({ total_points: balanceAfter })
    .eq('id', userId);

  return data;
}

// ─── Dashboard 聚合数据 ────────────────────

export async function getDashboardKPIs(tenantId: string): Promise<{
  kpis: import('./types').DashboardKPIs | null;
}> {
  // 先取最新快照
  const { data: snapshot } = await supabase
    .from('tenant_daily_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (!snapshot) return { kpis: null };

  // 取当前进行中的挑战赛数
  const { count: activeChallenges } = await supabase
    .from('challenges')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'in_progress');

  // 取本周活跃用户数（近7天快照聚合）
  const { data: weekSnapshots } = await supabase
    .from('tenant_daily_snapshots')
    .select('active_users, snapshot_date')
    .eq('tenant_id', tenantId)
    .order('snapshot_date', { ascending: false })
    .limit(7);

  const uniqueActiveThisWeek = new Set(weekSnapshots?.map((s) => s.snapshot_date)).size;

  const kpis: import('./types').DashboardKPIs = {
    total_employees: snapshot.total_employees,
    active_today: snapshot.active_users,
    active_this_week: uniqueActiveThisWeek,
    avg_engagement: Math.round((snapshot.active_users / snapshot.total_employees) * 100),
    avg_fitness_score: Math.round(snapshot.avg_fitness),
    total_challenges_active: activeChallenges ?? 0,
    avg_weight_change_kg: 0, // 需要跨日期计算
    streak_leader: snapshot.top_performers[0]
      ? { name: snapshot.top_performers[0].display_name, days: 0 }
      : { name: '-', days: 0 },
    points_distributed_today: 0, // 需要从point_transactions计算
  };

  return { kpis };
}

export async function getDepartmentDetails(
  tenantId: string,
  department: string
): Promise<import('.').DepartmentDetail | null> {
  // 从最新快照中提取部门数据
  const { data: snapshot } = await supabase
    .from('tenant_daily_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (!snapshot) return null;

  const deptStat: Record<string, unknown> = (snapshot.department_stats as any[]).find((d: any) => d.department === department);
  if (!deptStat) return null;

  // 该部门成员排行
  const { data: members } = await supabase
    .from('user_profiles')
    .select('display_name, department, total_points, horse_mood, primary_constitution')
    .eq('tenant_id', tenantId)
    .eq('department', department)
    .eq('is_active', true)
    .order('total_points', { ascending: false })
    .limit(5);

  return {
    department: String(deptStat.department || ''),
    member_count: Number(deptStat.employee_count ?? 0),
    active_count: Number(deptStat.active_count ?? 0),
    participation_rate: (Number(deptStat.employee_count ?? 0)) > 0
      ? Math.round((Number(deptStat.active_count ?? 0) / Number(deptStat.employee_count)) * 100)
      : 0,
    avg_fitness: Math.round(Number(deptStat.avg_fitness ?? 0)),
    avg_weight_change: Number(deptStat.avg_weight_change ?? 0),
    total_points: Number(deptStat.total_points ?? 0),
    constitution_distribution: {} as Record<string, number>, // 需要从分布数据提取
    top_members: (members ?? []).slice(0, 5).map((m) => ({
      display_name: m.display_name,
      score: m.total_points,
      highlight: `${m.primary_constitution || '未测试'}`,
    })),
    challenge_standings: [],
  };
}

// ─── 审计日志 ─────────────────────────────

export async function createAuditLog(params: {
  tenantId: string;
  actorId: string;
  action: import('./types').AuditAction;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    tenant_id: params.tenantId,
    actor_id: params.actorId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    details: params.details ?? {},
  });

  if (error) {
    console.error('[Enterprise] createAuditLog error:', error.message);
  }
}
