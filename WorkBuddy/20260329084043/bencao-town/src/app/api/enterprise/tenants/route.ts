/**
 * 租户管理 API v1.0
 *
 * POST /api/enterprise/tenants  — 创建企业（注册）
 * GET  /api/enterprise/tenants  — 列出租户（仅platform_admin）
 *
 * 注意: 单个租户的详情通过 slug 或 ID 查询
 */

import { NextRequest } from 'next/server';
import { withAuth, withHR } from '@/lib/enterprise/api-handler';
import {
  successResponse,
  createdResponse,
  badRequest,
  serverError,
  apiError,
  parseQueryParams,
} from '@/lib/enterprise/auth';
import { supabase } from '@/lib/supabase';
import {
  getServiceClient,
  createAuditLog,
  getTenantBySlug,
  getUserProfileByEmail,
  addPoints,
} from '@/lib/enterprise/supabase-client';
import { DEFAULT_TENANT_SETTINGS } from '@/lib/enterprise/constants';
import type { CreateTenantRequest, Tenant, UserProfile } from '@/lib/enterprise/types';
import type { AuthContext } from '@/lib/enterprise/types';
import { ApiErrorCode } from '@/lib/enterprise/constants';

// ═══════════════════════════════════════════════════
// POST — 创建企业（平台管理员或公开注册）
// ═══════════════════════════════════════════════════

export const POST = withAuth(
  async (request: NextRequest, ctx: AuthContext): Promise<Response> => {
    // 只有 platform_admin 可以直接创建，否则需要走邀请流程
    if (ctx.role !== 'platform_admin') {
      return apiError(ApiErrorCode.FORBIDDEN, '请联系平台管理员创建企业', 403);
    }

    let body: CreateTenantRequest;
    try {
      body = await request.json();
    } catch {
      return badRequest('无效的JSON格式');
    }

    // 验证必填字段
    const { name, slug, admin_email, admin_display_name, plan = 'free' } = body;
    if (!name || !slug || !admin_email) {
      return badRequest('缺少必填字段: name, slug, admin_email', {
        required: ['name', 'slug', 'admin_email', 'admin_display_name'],
      });
    }

    // Slug 格式验证
    if (!/^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$/.test(slug)) {
      return badRequest('Slug格式：小写字母数字和连字符，4-32字符', {
        example: 'my-company-2026',
        pattern: '^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$',
      });
    }

    // 检查 slug 是否已被占用
    const existing = await getTenantBySlug(slug);
    if (existing) {
      return apiError(ApiErrorCode.SLUG_ALREADY_EXISTS, `Slug "${slug}" 已被使用`, 409);
    }

    try {
      const serviceClient = getServiceClient();

      // 使用事务创建租户 + HR管理员用户
      const { data: tenant, error: tenantError } = await serviceClient
        .from('tenants')
        .insert({
          name,
          slug,
          industry: body.industry,
          size: body.size,
          subscription_plan: plan,
          max_employees: plan === 'free' ? 10 : plan === 'starter' ? 50 : plan === 'business' ? 200 : -1,
          hr_admin_ids: [], // 稍后填充
          settings: {
            ...DEFAULT_TENANT_SETTINGS,
            ...body.settings,
          },
        })
        .select()
        .single();

      if (tenantError) {
        console.error('[Tenant] Create error:', tenantError.message);
        return serverError(`创建失败: ${tenantError.message}`);
      }

      // 创建HR管理员档案
      const { data: adminProfile, error: profileError } = await serviceClient
        .from('user_profiles')
        .insert({
          auth_id: ctx.userId,
          tenant_id: tenant.id,
          display_name: admin_display_name || admin_email.split('@')[0],
          email: admin_email,
          role: 'hr_admin',
          is_active: true,
        })
        .select()
        .single();

      if (profileError) {
        // 回滚：删除已创建的租户
        await serviceClient.from('tenants').delete().eq('id', tenant.id);
        return serverError(`创建管理员失败: ${profileError.message}`);
      }

      // 更新租户的hr_admin_ids
      await serviceClient
        .from('tenants')
        .update({ hr_admin_ids: [adminProfile.id] })
        .eq('id', tenant.id);

      // 审计日志
      await createAuditLog({
        tenantId: tenant.id,
        actorId: ctx.userId,
        action: 'tenant.create',
        targetType: 'tenant',
        targetId: tenant.id,
        details: { name, slug, plan },
      });

      return createdResponse(tenant as unknown as Tenant);
    } catch (err) {
      console.error('[Tenant] Create exception:', err);
      return serverError(err instanceof Error ? err.message : undefined);
    }
  }
);

// ═══════════════════════════════════════════════════
// GET — 列出租户（仅平台管理员）
// ═══════════════════════════════════════════════════

export const GET = withAuth(
  async (request: NextRequest, ctx: AuthContext): Promise<Response> => {
    if (ctx.role !== 'platform_admin') {
      return apiError(ApiErrorCode.FORBIDDEN, '无权访问', 403);
    }

    const { page = 1, limit = 20, search } = parseQueryParams(new URL(request.url), {
      page: 1,
      limit: 20,
    });

    let query = supabase
      .from('tenants')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const from = (Number(page) - 1) * Number(limit);
    const { data, error, count } = await query.range(from, from + Number(limit) - 1);

    if (error) {
      console.error('[Tenant] List error:', error.message);
      return serverError();
    }

    return Response.json({
      success: true,
      data: data ?? [],
      meta: {
        page,
        per_page: limit,
        total_count: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / Number(limit)),
      },
    });
  }
);
