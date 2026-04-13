/**
 * HR Dashboard API v1.0
 *
 * GET /api/enterprise/tenants/[slug]/dashboard          — 总览KPI
 * GET /api/enterprise/tenants/[slug]/dashboard/departments — 部门详情
 * GET /api/enterprise/tenants/[slug]/dashboard/trends    — 趋势数据
 */

import { NextRequest } from 'next/server';
import { withHR } from '@/lib/enterprise/api-handler';
import {
  successResponse,
  badRequest,
  notFound,
  forbidden,
  unauthenticated,
  serverError,
} from '@/lib/enterprise/auth';
import { requireHR } from '@/lib/enterprise/auth';
import {
  getTenantBySlug,
  getTenantEmployees,
  getDashboardKPIs,
} from '@/lib/enterprise/supabase-client';
import type { AuthContext, DashboardKPIs, DepartmentDetail } from '@/lib/enterprise/types';
import { supabase } from '@/lib/supabase';

// ═══════════════════════════════════════════════════
// GET /dashboard — 总览 KPI
// ═══════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const ctx = await getAuthContextFromReq(request);
  if (!ctx) return unauthenticated();
  const hrCheck = requireHR(ctx);
  if (hrCheck) return hrCheck;

  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound('企业');
  if (tenant.id !== ctx.tenantId) return forbidden();

  // 获取最新快照的KPI
  const { kpis } = await getDashboardKPIs(tenant.id);

  // 补充实时数据（快照可能有延迟）
  const today = new Date().toISOString().slice(0, 10);

  // 今日活跃用户数（从健康日志）
  const { count: todayActive } = await supabase
    .from('daily_health_logs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .eq('log_date', today);

  // 本周活跃用户数
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const { data: weekLogs } = await supabase
    .from('daily_health_logs')
    .select('user_id, log_date')
    .eq('tenant_id', tenant.id)
    .gte('log_date', weekAgo);
  const uniqueWeeklyUsers = new Set(weekLogs?.map((l) => l.user_id)).size;

  // 进行中的挑战赛
  const { data: activeChallenges } = await supabase
    .from('challenges')
    .select('id, title, template_id, start_date, end_date, current_participants')
    .eq('tenant_id', tenant.id)
    .eq('status', 'in_progress');

  // 部门列表
  const { data: allEmployees } = await supabase
    .from('user_profiles')
    .select('department, primary_constitution')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .not('department', 'is', null);

  const departments = [...new Set(allEmployees?.map((e) => e.department))].filter(Boolean) as string[];
  const departmentStats = departments.map((dept) => {
    const members = allEmployees?.filter((e) => e.department === dept) ?? [];
    return {
      department: dept,
      member_count: members.length,
      active_today: null, // 需要额外查询
      avg_fitness: null as number | null,
      total_points: null as number | null,
    };
  });

  // 连续打卡排行（Top 5，匿名化处理：只显示昵称+部门）
  const { data: topStreakUsers } = await supabase
    .from('user_profiles')
    .select('display_name, department, streak_days, total_points, primary_constitution')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('streak_days', { ascending: false })
    .limit(5);

  // 体质分布
  const constitutionDist = allEmployees?.reduce<Record<string, number>>((acc, emp) => {
    const c = emp.primary_constitution || '未测试';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {}) ?? {};

  const dashboardData = {
    ...kpis,
    today_active: todayActive ?? 0,
    weekly_active_users: uniqueWeeklyUsers,
    active_challenges: activeChallenges ?? [],
    departments: departmentStats,
    top_streak_leaders: topStreakUsers?.map((u) => ({
      display_name: u.display_name,
      department: u.department,
      streak_days: u.streak_days,
      total_points: u.total_points,
      primary_constitution: u.primary_constitution,
    })) ?? [],
    constitution_distribution: constitutionDist,
    snapshot_fetched_at: kpis ? new Date().toISOString() : null,
  };

  return successResponse(dashboardData);
}

// ═══════════════════════════════════════════════════
// GET /dashboard/departments — 部门深度分析
// ═══════════════════════════════════════════════════

async function handleDepartmentDetail(
  request: NextRequest,
  slug: string,
  ctx: AuthContext
): Promise<Response> {
  const url = new URL(request.url);
  const department = url.searchParams.get('department');
  if (!department) {
    return badRequest('需要 department 查询参数');
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound('企业');

  // 该部门的员工列表（分页）
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 50);
  const { data: members, count } = await getTenantEmployees(tenant.id, {
    department,
    page,
    limit,
  });

  // 该部门的挑战赛参与情况
  const { data: deptParticipants } = await supabase
    .from('challenge_participants')
    .select(`
      challenge_id,
      status,
      total_score,
      days_active,
      challenges!inner(title, status, template_id)
    `)
    .in(
      'user_id',
      (await getTenantEmployees(tenant.id, { department, limit: 1000 })).data.map((u) => u.id)
    );

  // 按挑战赛分组统计
  const challengeMap = new Map<string, {
    title: string; template_id: string; status: string;
    participants: number; active: number; avg_score: number; scores: number[];
  }>();
  for (const p of deptParticipants ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ch = Array.isArray((p as any).challenges) ? (p as any).challenges[0] : (p as any).challenges;
    if (!ch) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = challengeMap.get(ch.title) || {
      title: ch.title,
      template_id: ch.template_id,
      status: ch.status,
      participants: 0,
      active: 0,
      avg_score: 0,
      scores: [] as number[],
    };

    existing.participants++;
    if (p.status === 'active') existing.active++;
    existing.scores.push(Number(p.total_score) || 0);
    challengeMap.set(ch.title, existing);
  }

  // 计算平均分
  for (const [_, stat] of challengeMap) {
    const s = stat as any;
    s.avg_score = s.scores.length > 0
      ? Math.round(s.scores.reduce((a: number, b: number) => a + b, 0) / s.scores.length)
      : 0;
    delete s.scores; // 不返回原始分数数组
  }

  return successResponse({
    department,
    total_members: count ?? 0,
    members: members.map((m) => ({
      display_name: m.display_name,
      employee_id: m.employee_id,
      position: m.position,
      primary_constitution: m.primary_constitution,
      horse_level: m.horse_level,
      horse_mood: m.horse_mood,
      total_points: m.total_points,
      streak_days: m.streak_days,
      last_activity: m.horse_last_interaction_at,
    })),
    challenge_participation: Array.from(challengeMap.values()),
    pagination: { page, limit, total: count },
  });
}

// ─── 辅助函数 ────────────────────────────────

async function getAuthContextFromReq(req: NextRequest) {
  const { getAuthContext } = await import('@/lib/enterprise/auth');
  return getAuthContext(req);
}
