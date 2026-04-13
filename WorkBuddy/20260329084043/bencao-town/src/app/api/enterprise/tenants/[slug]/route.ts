/**
 * 单个租户 API v1.0
 *
 * GET    /api/enterprise/tenants/[slug]  — 获取企业详情
 * PUT    /api/enterprise/tenants/[slug]  — 更新企业信息（HR）
 * DELETE /api/enterprise/tenants/[slug]  — 停用企业（平台管理员）
 */

import { NextRequest } from 'next/server';
import { withAuth, withHR } from '@/lib/enterprise/api-handler';
import {
  successResponse,
  notFound,
  badRequest,
  forbidden,
  serverError,
  unauthenticated,
} from '@/lib/enterprise/auth';
import { requireHR } from '@/lib/enterprise/auth';
import { supabase } from '@/lib/supabase';
import {
  getServiceClient,
  getTenantBySlug,
  createAuditLog,
} from '@/lib/enterprise/supabase-client';
import type { AuthContext, UpdateTenantRequest, Tenant } from '@/lib/enterprise/types';
import { ApiErrorCode } from '@/lib/enterprise/constants';

// ─── GET: 获取租户详情 ──────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const ctx = await getAuthContextFromReq(request);
  if (!ctx && request.method !== 'GET') return unauthenticated();

  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    return notFound('企业');
  }

  // 非管理员只能看到公开信息
  if (!ctx || ctx.role === 'employee') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hr_admin_ids, settings, ...publicInfo } = tenant;
    return successResponse(publicInfo);
  }

  // HR及以上可以看到完整信息 + 员工统计
  const { count: employeeCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .eq('is_active', true);

  return successResponse({
    ...tenant,
    actual_employee_count: employeeCount ?? 0,
  });
}

// ─── PUT: 更新租户信息（HR only）────────────

export async function PUT(
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
  if (tenant.id !== ctx.tenantId) return forbidden('只能管理自己的企业');

  let body: Partial<UpdateTenantRequest>;
  try {
    body = await request.json();
  } catch {
    return badRequest('无效的JSON格式');
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
  if (body.settings !== undefined) updateData.settings = { ...tenant.settings, ...body.settings };

  if (Object.keys(updateData).length === 0) {
    return badRequest('没有可更新的字段');
  }

  const { data, error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', tenant.id)
    .select()
    .single();

  if (error) return serverError(`更新失败: ${error.message}`);

  await createAuditLog({
    tenantId: tenant.id,
    actorId: ctx.userId,
    action: 'tenant.update',
    targetType: 'tenant',
    targetId: tenant.id,
    details: updateData,
  });

  return successResponse(data);
}

// ─── DELETE: 停用企业（platform_admin only）───

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const ctx = await getAuthContextFromReq(request);
  if (!ctx) return unauthenticated();
  if (ctx.role !== 'platform_admin') return forbidden('仅平台管理员可停用企业');

  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound('企业');

  // 软删除
  const { error } = await supabase
    .from('tenants')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', tenant.id);

  if (error) return serverError();

  await createAuditLog({
    tenantId: tenant.id,
    actorId: ctx.userId,
    action: 'tenant.delete',
    targetType: 'tenant',
    targetId: tenant.id,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return successResponse({ message: '企业已停用' } as any);
}

// ─── 辅助函数 ────────────────────────────────

async function getAuthContextFromReq(req: NextRequest) {
  const { getAuthContext } = await import('@/lib/enterprise/auth');
  return getAuthContext(req);
}
