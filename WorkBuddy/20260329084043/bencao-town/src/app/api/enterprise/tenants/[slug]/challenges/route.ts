/**
 * 挑战赛管理 API v1.0
 *
 * GET    /api/enterprise/tenants/[slug]/challenges  — 列出挑战赛（HR+员工）
 * POST   /api/enterprise/tenants/[slug]/challenges  — 创建挑战赛（HR only）
 */

import { NextRequest } from 'next/server';
import { withAuth, withHR } from '@/lib/enterprise/api-handler';
import {
  successResponse,
  createdResponse,
  badRequest,
  notFound,
  forbidden,
  unauthenticated,
  serverError,
  apiError,
} from '@/lib/enterprise/auth';
import { requireHR } from '@/lib/enterprise/auth';
import { supabase } from '@/lib/supabase';
import {
  getTenantBySlug,
  createAuditLog,
} from '@/lib/enterprise/supabase-client';
import type {
  AuthContext,
  Challenge,
  CreateChallengeRequest,
} from '@/lib/enterprise/types';
import { CHALLENGE_TEMPLATES, ApiErrorCode } from '@/lib/enterprise/constants';

// ═══════════════════════════════════════════════════
// GET — 挑战赛列表
// ═══════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const ctx = await getAuthContextFromReq(request);
  if (!ctx) return unauthenticated();

  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound('企业');

  // 员工只能看到 published / in_progress 的挑战赛
  const url = new URL(request.url);
  let statusFilter: string | null = null;
  if (ctx.role === 'employee') {
    statusFilter = url.searchParams.get('status');
    if (statusFilter && !['published', 'in_progress'].includes(statusFilter)) {
      return badRequest('员工只能查看已发布或进行中的挑战赛');
    }
  }

  let query = supabase
    .from('challenges')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  if (ctx.role === 'employee') {
    query = query.in('status', ['published', 'in_progress']);
  } else if (statusFilter) {
    query = query.eq('status', statusFilter);
  } else {
    query = query.neq('status', 'archived'); // HR默认不显示归档的
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Challenges] List error:', error.message);
    return serverError();
  }

  // 为每个挑战赛补充参与状态（如果是员工）
  if (ctx.role === 'employee' && data) {
    const challengeIds = data.map((c) => c.id);
    const { data: myParticipations } = await supabase
      .from('challenge_participants')
      .select('challenge_id, status')
      .eq('user_id', ctx.userId)
      .in('challenge_id', challengeIds);

    const participationMap = new Map(myParticipations?.map((p) => [p.challenge_id, p.status]));

    for (const challenge of data) {
      (challenge as any).my_status = participationMap.get(challenge.id) || null;
    }
  }

  return successResponse(data ?? []);
}

// ═══════════════════════════════════════════════════
// POST — 创建挑战赛（HR only）
// ═══════════════════════════════════════════════════

export async function POST(
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

  // 检查是否开启了挑战赛功能
  if (!(tenant.settings as any).challenge_enabled) {
    return apiError(ApiErrorCode.FORBIDDEN, '企业未开启挑战赛功能', 403);
  }

  let body: CreateChallengeRequest;
  try {
    body = await request.json();
  } catch {
    return badRequest('无效的JSON格式');
  }

  // 验证必填字段
  const { template_id, title, start_date, end_date } = body;
  if (!template_id || !title || !start_date || !end_date) {
    return badRequest('缺少必填字段: template_id, title, start_date, end_date', {
      required: ['template_id', 'title', 'start_date', 'end_date'],
      available_templates: Object.keys(CHALLENGE_TEMPLATES),
    });
  }

  // 验证模板是否存在
  const template = CHALLENGE_TEMPLATES[template_id];
  if (!template) {
    return badRequest(`无效的模板ID: ${template_id}`, {
      available_templates: Object.keys(CHALLENGE_TEMPLATES),
    });
  }

  // 验证日期
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const now = new Date();
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return badRequest('日期格式无效，请使用 YYYY-MM-DD');
  }
  if (endDate <= startDate) {
    return badRequest('结束日期必须晚于开始日期');
  }

  // 使用模板默认值填充配置
  const config = {
    allow_teams: template.team_based || body.config?.allow_teams || false,
    auto_team_assignment: body.config?.auto_team_assignment ?? template.team_based ?? false,
    min_activity_threshold: body.config?.min_activity_threshold ?? 3,
    visibility: body.config?.visibility ?? 'public',
    ...(body.config?.department_filter ? { department_filter: body.config.department_filter } : {}),
  };

  const rewards = {
    ...template.default_rewards,
    ...body.rewards,
  };

  const rules = {
    scoring_period: 'daily' as const,
    ranking_algorithm: 'weighted_sum' as const,
    tie_breaker: 'earliest_achievement' as const,
    scoring_metrics: template.default_scoring_metrics,
    ...(body.rules || {}),
  };

  try {
    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        tenant_id: tenant.id,
        created_by: ctx.userId,
        template_id,
        title,
        description: body.description || template.description,
        status: 'draft',
        config,
        rules,
        rewards,
        start_date: start_date,
        end_date: end_date,
        max_participants: body.max_participants,
        team_size_min: body.team_size_min || (template.team_based ? template.default_team_size_min : undefined),
        team_size_max: body.team_size_max || (template.team_based ? template.default_team_size_max : undefined),
      })
      .select()
      .single();

    if (error) {
      console.error('[Challenges] Create error:', error.message);
      return serverError(`创建失败: ${error.message}`);
    }

    // 审计日志
    await createAuditLog({
      tenantId: tenant.id,
      actorId: ctx.userId,
      action: 'challenge.create',
      targetType: 'challenge',
      targetId: challenge.id,
      details: { template_id, title },
    });

    return createdResponse(challenge);
  } catch (err) {
    console.error('[Challenges] Exception:', err);
    return serverError(err instanceof Error ? err.message : undefined);
  }
}

// ─── 辅助函数 ────────────────────────────────

async function getAuthContextFromReq(req: NextRequest) {
  const { getAuthContext } = await import('@/lib/enterprise/auth');
  return getAuthContext(req);
}
