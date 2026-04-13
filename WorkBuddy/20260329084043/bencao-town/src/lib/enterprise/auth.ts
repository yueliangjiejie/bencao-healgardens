/**
 * 企业版认证工具 v1.0
 *
 * 功能:
 * - JWT Token 解析与验证 (Supabase Auth)
 * - Tenant 上下文提取
 * - 角色权限守卫
 * - 统一API响应构造
 */

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import type {
  ApiResponse,
  AuthContext,
  UserRole,
} from './types';
import { ApiErrorCode, hasPermission } from './constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ═══════════════════════════════════════════════════
// JWT & Session 解析
// ═══════════════════════════════════════════════════

export interface DecodedToken {
  sub: string;
  email: string;
  role?: string;
  exp?: number;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

/** 从请求头提取 Bearer Token */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/** 从 Cookie 提取 Supabase session（浏览器请求） */
export function extractSessionCookie(request: NextRequest): string | null {
  const cookies = request.cookies.getAll();
  const authCookie = cookies.find((c) =>
    c.name.includes('auth-token') || c.name.startsWith('sb-')
  );
  return authCookie?.value ?? null;
}

/** 验证 JWT token 并返回用户信息 */
export async function verifyToken(token: string): Promise<{
  user: DecodedToken | null;
  error: string | null;
}> {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error) return { user: null, error: error.message };
    if (!user) return { user: null, error: 'User not found' };

    return {
      user: {
        sub: user.id,
        email: user.email ?? '',
        role: user.role,
        app_metadata: user.app_metadata ?? {},
        user_metadata: user.user_metadata ?? {},
      },
      error: null,
    };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : 'Verification failed' };
  }
}

// ═══════════════════════════════════════════════════
// 认证上下文构建（核心）
// ═══════════════════════════════════════════════════

/**
 * 构建完整认证上下文：用户身份 + 租户ID + 角色
 * API Route 标准用法：
 * ```
 * export async function GET(req: NextRequest) {
 *   const ctx = await getAuthContext(req);
 *   if (!ctx) return unauthorizedResponse();
 *   // ctx.userId / ctx.tenantId / ctx.role 可用
 * }
 * ```
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const token = extractBearerToken(request) || extractSessionCookie(request);
  if (!token) return null;

  const { user, error } = await verifyToken(token);
  if (error || !user) return null;

  // 查询用户档案获取租户和角色
  const { data: profile, error: profileError } = await supabaseClient
    .from('user_profiles')
    .select('tenant_id, role, display_name, is_active')
    .eq('auth_id', user.sub)
    .single();

  if (profileError) {
    console.error('[Auth] Profile lookup error:', profileError.message);
    return null;
  }

  if (profile && !profile.is_active) {
    return null;
  }

  return {
    userId: user.sub,
    tenantId: profile?.tenant_id ?? '',
    role: (profile?.role as UserRole) ?? 'employee',
    email: user.email,
    displayName: profile?.display_name ?? (user.user_metadata?.display_name as string) ?? user.email.split('@')[0],
  };
}

/**
 * 轻量认证：仅验证token，不查DB
 * 用于公开/半公开端点
 */
export async function getLightAuthContext(
  request: NextRequest
): Promise<{ userId: string; email: string } | null> {
  const token = extractBearerToken(request) || extractSessionCookie(request);
  if (!token) return null;

  const { user, error } = await verifyToken(token);
  if (error || !user) return null;

  return { userId: user.sub, email: user.email };
}

// ═══════════════════════════════════════════════════
// 权限守卫
// ═══════════════════════════════════════════════════

/** 角色守卫 */
export function requireRole(ctx: AuthContext, allowedRoles: UserRole[]): Response | null {
  if (allowedRoles.includes(ctx.role)) return null;
  return forbidden('需要更高的权限级别');
}

/** 权限守卫 */
export function requirePermission(ctx: AuthContext, permission: string): Response | null {
  if (hasPermission(ctx.role, permission)) return null;
  return forbidden(`缺少权限: ${permission}`);
}

/** HR及以上角色守卫 */
export function requireHR(ctx: AuthContext): Response | null {
  return requireRole(ctx, ['platform_admin', 'hr_admin']);
}

/** 租户存在性检查 */
export async function validateTenant(tenantId: string): Promise<Response | null> {
  const { data, error } = await supabaseClient
    .from('tenants')
    .select('id, subscription_plan, is_active') // is_active 需要加字段或用 deleted_at 判断
    .eq('id', tenantId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return apiError(ApiErrorCode.TENANT_NOT_FOUND, '企业不存在', 404);
  }
  return null; // OK
}

// ═══════════════════════════════════════════════════
// 统一响应构造
// ═══════════════════════════════════════════════════

/** 成功响应 */
export function successResponse<T>(data: T, meta?: object): Response {
  return Response.json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

/** 分页成功响应 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  totalCount: number
): Response {
  return successResponse(data, {
    page,
    per_page: perPage,
    total_count: totalCount,
    total_pages: Math.ceil(totalCount / perPage),
  });
}

/** 创建成功响应（201） */
export function createdResponse<T>(data: T): Response {
  return Response.json({ success: true, data }, { status: 201 });
}

/** 无内容响应（204） */
export function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}

/** 错误响应 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number = 400,
  details?: unknown
): Response {
  return Response.json(
    {
      success: false,
      error: { code, message, details },
    },
    { status }
  );
}

/** 未授权（401） */
export function unauthenticated(message = '请先登录'): Response {
  return apiError(ApiErrorCode.UNAUTHORIZED, message, 401);
}

/** 禁止访问（403） */
export function forbidden(message = '无权执行此操作'): Response {
  return apiError(ApiErrorCode.FORBIDDEN, message, 403);
}

/** 未找到（404） */
export function notFound(resource = '资源'): Response {
  return apiError(ApiErrorCode.NOT_FOUND, `${resource}不存在`, 404);
}

/** 参数错误（400） */
export function badRequest(message = '请求参数有误', details?: unknown): Response {
  return apiError(ApiErrorCode.INVALID_REQUEST, message, 400, details);
}

/** 服务端错误（500） */
export function serverError(message = '服务器内部错误'): Response {
  return apiError(ApiErrorCode.UNKNOWN_ERROR, message, 500);
}

// ═══════════════════════════════════════════════════
// 辅助工具
// ═══════════════════════════════════════════════════

/**
 * 解析查询参数（带类型转换）
 */
export function parseQueryParams<T extends Record<string, string>>(
  url: URL,
  defaults: Partial<Record<keyof T, any>> = {}
): T {
  const params = url.searchParams;
  const result = {} as T;

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = params.get(key);
    if (value === null) {
      (result as any)[key] = defaultValue;
    } else if (typeof defaultValue === 'number') {
      (result as any)[key] = Number(value) as any;
    } else if (typeof defaultValue === 'boolean') {
      (result as any)[key] = (value === 'true' || value === '1') as any;
    } else {
      result[key as keyof T] = value as any;
    }
  }

  return result;
}

/**
 * 从请求中获取客户端IP地址
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * 从请求中获取 User-Agent
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') ?? 'unknown';
}
