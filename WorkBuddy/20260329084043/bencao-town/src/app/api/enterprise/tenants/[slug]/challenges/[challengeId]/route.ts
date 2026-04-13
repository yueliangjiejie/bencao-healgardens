/**
 * 单个挑战赛操作 API v1.0
 *
 * GET    — 获取挑战赛详情（含参与者+排行）
 * PUT    — 更新挑战赛（HR only，draft状态）
 * PATCH  — 状态转换：publish/pause/complete/archive（HR）
 * DELETE — 删除草稿（HR）
 */

import { NextRequest } from 'next/server';
import { withAuth, withHR } from '@/lib/enterprise/api-handler';
import {
  successResponse,
  createdResponse,
  noContentResponse,
  badRequest,
  notFound,
  forbidden,
  unauthenticated,
  apiError,
  serverError,
} from '@/lib/enterprise/auth';
import { supabase } from '@/lib/supabase';
import {
  getTenantBySlug,
  getChallengeWithParticipants,
  createAuditLog,
} from '@/lib/enterprise/supabase-client';
import { requireHR } from '@/lib/enterprise/auth';
import type { AuthContext, Challenge, ChallengeParticipant, ChallengeTeam } from '@/lib/enterprise/types';
import { ApiErrorCode } from '@/lib/enterprise/constants';

type RouteContext = { params: Promise<{ slug: string; challengeId: string }> };

// ─── GET: 挑战赛详情 + 排行榜 ────────────────

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const ctx = await getAuthCtx(request);
  if (!ctx) return unauthenticated();

  const { slug, challengeId } = await context.params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound('企业');

  const { challenge, participants, teams } = await getChallengeWithParticipants(challengeId, tenant.id);
  if (!challenge) return notFound('挑战赛');

  // 员工只能看 published/in_progress 的
  if (ctx.role === 'employee' && !['published', 'in_progress'].includes(challenge.status)) {
    return forbidden();
  }

  // 当前用户的参与状态
  let myParticipation: ChallengeParticipant | null = null;
  if (ctx.role === 'employee') {
    const { data } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', ctx.userId)
      .maybeSingle();
    myParticipation = data ?? null;
  }

  return successResponse({
    ...challenge,
    my_status: myParticipation?.status || null,
    my_score: myParticipation?.total_score || 0,
    my_rank: myParticipation?.individual_rank || null,
    participants: ctx.role !== 'employee'
      ? participants.map(p => ({
          id: p.id,
          display_name: p.user_id,
          status: p.status,
          total_score: p.total_score,
          rank: p.individual_rank,
          days_active: p.days_active,
        }))
      : participants
          .filter(p => p.status !== 'dropped_out')
          .sort((a, b) => b.total_score - a.total_score)
          .slice(0, 10)
          .map((p, i) => ({ rank: i + 1, score: Math.round(p.total_score), department: '' })),
    teams,
    participant_count: participants.filter(p => p.status !== 'dropped_out').length,
  });
}

// ─── PUT: 更新草稿 ─────────────────────────────

export async function PUT(request: NextRequest, context: RouteContext): Promise<Response> {
  const ctx = await getAuthCtx(request);
  if (!ctx) return unauthenticated();
  const hrCheck = requireHR(ctx);
  if (hrCheck) return hrCheck;

  const { slug, challengeId } = await context.params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound('企业');
  if (tenant.id !== ctx.tenantId) return forbidden();

  const { data: existing } = await supabase
    .from('challenges')
    .select('id, status')
    .eq('id', challengeId)
    .single();

  if (!existing) return notFound('挑战赛');
  if (existing.status !== 'draft') {
    return badRequest('只能编辑草稿状态的挑战赛');
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return badRequest('无效的JSON格式'); }

  const allowedFields = ['title', 'description', 'start_date', 'end_date', 'max_participants',
    'config', 'rules', 'rewards', 'team_size_min', 'team_size_max', 'cover_image_url'];
  const updateData: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return badRequest('没有可更新的字段', { allowed_fields: allowedFields });
  }

  const { data, error } = await supabase
    .from('challenges')
    .update(updateData)
    .eq('id', challengeId)
    .select()
    .single();

  if (error) return serverError(`更新失败: ${error.message}`);

  await createAuditLog({ tenantId: tenant.id, actorId: ctx.userId, action: 'challenge.update',
    targetType: 'challenge', targetId: challengeId, details: { updated_fields: Object.keys(updateData) } });

  return successResponse(data);
}

// ─── PATCH: 状态转换 ──────────────────────────

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  const ctx = await getAuthCtx(request);
  if (!ctx) return unauthenticated();
  const hrCheck = requireHR(ctx);
  if (hrCheck) return hrCheck;

  const { slug, challengeId } = await context.params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound('企业');
  if (tenant.id !== ctx.tenantId) return forbidden();

  let body: { action: string };
  try { body = await request.json(); }
  catch { return badRequest('需要 { action: "publish" | "pause" | "complete" | "archive" }'); }

  const validActions = ['publish', 'pause', 'unpause', 'complete', 'archive'];
  const action = body.action;
  if (!validActions.includes(action)) {
    return badRequest(`无效的操作: ${action}`, { valid_actions: validActions });
  }

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (!challenge) return notFound('挑战赛');

  // 状态机校验
  const transitions: Record<string, string[]> = {
    draft: ['publish'],
    published: ['pause', 'unpause'],
    in_progress: ['pause', 'complete'],
    paused: ['unpause', 'archive'],
    completed: ['archive'],
    archived: [],
  };

  const currentTransitions = transitions[challenge.status] || [];
  if (!currentTransitions.includes(action)) {
    return apiError(ApiErrorCode.INVALID_REQUEST,
      `当前状态 "${challenge.status}" 不允许执行 "${action}" 操作`, 400);
  }

  const newStatusMap: Record<string, string> = {
    publish: 'published', unpause: 'in_progress', pause: 'paused',
    complete: 'completed', archive: 'archived' };
  const newStatus = newStatusMap[action];

  const updateFields: Record<string, unknown> = { status: newStatus };

  if (action === 'publish') updateFields.published_at = new Date().toISOString();
  if (action === 'complete') updateFields.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('challenges')
    .update(updateFields)
    .eq('id', challengeId)
    .select()
    .single();

  if (error) return serverError(`操作失败: ${error.message}`);

  await createAuditLog({
    tenantId: tenant.id, actorId: ctx.userId,
    action: `challenge.${action}` as any,
    targetType: 'challenge', targetId: challengeId,
    details: { from: challenge.status, to: newStatus },
  });

  return successResponse(data);
}

// ─── DELETE: 删除草稿 ─────────────────────────

export async function DELETE(request: NextRequest, context: RouteContext): Promise<Response> {
  const ctx = await getAuthCtx(request);
  if (!ctx) return unauthenticated();
  const hrCheck = requireHR(ctx);
  if (hrCheck) return hrCheck;

  const { slug, challengeId } = await context.params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound('企业');
  if (tenant.id !== ctx.tenantId) return forbidden();

  const { data: existing } = await supabase
    .from('challenges')
    .select('status')
    .eq('id', challengeId)
    .single();

  if (!existing) return notFound('挑战赛');
  if (existing.status !== 'draft') {
    return apiError(ApiErrorCode.INVALID_REQUEST, '只能删除草稿状态的挑战赛', 400);
  }

  const { error } = await supabase.from('challenges').delete().eq('id', challengeId);

  if (error) return serverError();
  await createAuditLog({ tenantId: tenant.id, actorId: ctx.userId,
    action: 'challenge.archive', targetType: 'challenge', targetId: challengeId });

  return noContentResponse();
}

// ─── 辅助函数 ────────────────────────────────

async function getAuthCtx(req: NextRequest) {
  const { getAuthContext } = await import('@/lib/enterprise/auth');
  return getAuthContext(req);
}
