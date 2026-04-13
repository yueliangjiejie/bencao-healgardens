/**
 * API Route 辅助封装
 * 提供统一的 withAuth / withHR / 等高阶函数
 * 减少每个API Route中的重复代码
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getAuthContext,
  requireHR,
  unauthenticated,
  forbidden,
  serverError,
  getClientIP,
  getUserAgent,
} from './auth';
import type { AuthContext } from './types';

// ═══════════════════════════════════════════════════
// 认证包装器
// ═══════════════════════════════════════════════════

export interface ApiHandlerOptions {
  /** 是否需要认证（默认true） */
  requireAuth?: boolean;
  /** 是否要求HR及以上角色 */
  requireHrRole?: boolean;
}

type AuthenticatedHandler = (
  request: NextRequest,
  ctx: AuthContext
) => Promise<Response>;

type UnauthenticatedHandler = (request: NextRequest) => Promise<Response>;

/**
 * 需要认证的 API Route 包装器
 *
 * @example
 * ```ts
 * export const GET = withAuth(async (req, ctx) => {
 *   // ctx.userId, ctx.tenantId, ctx.role 全部可用
 *   return successResponse({ data: 'hello' });
 * }, { requireHrRole: true });
 * ```
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: ApiHandlerOptions = {}
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest) => {
    try {
      const ctx = await getAuthContext(request);

      if (!ctx) {
        if (options.requireAuth === false) {
          return (handler as UnauthenticatedHandler)(request);
        }
        return unauthenticated();
      }

      if (options.requireHrRole) {
        const hrCheck = requireHR(ctx);
        if (hrCheck) return hrCheck;
      }

      return handler(request, ctx);
    } catch (err) {
      console.error('[withAuth] Unexpected error:', err);
      return serverError(err instanceof Error ? err.message : undefined);
    }
  };
}

/**
 * HR专属路由包装器（requireHrRole=true 的简写）
 */
export function withHR(
  handler: AuthenticatedHandler
): (request: NextRequest) => Promise<Response> {
  return withAuth(handler, { requireHrRole: true });
}

/**
 * 公开路由包装器（不需要认证，但可选获取用户信息）
 */
export function withOptionalAuth(
  handler: (
    request: NextRequest,
    ctx: AuthContext | null
  ) => Promise<Response>
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest) => {
    try {
      const ctx = await getAuthContext(request); // 可能是null
      return handler(request, ctx);
    } catch (err) {
      console.error('[withOptionalAuth] Error:', err);
      return serverError();
    }
  };
}

/**
 * CORS 预检处理
 */
export function handleCORS(request: NextRequest, allowedOrigins?: string[]): Response | null {
  const origin = request.headers.get('origin');

  // 生产环境应该严格限制 allowedOrigins
  const isAllowed = !allowedOrigins ||
    allowedOrigins.includes(origin ?? '') ||
    process.env.NODE_ENV === 'development';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin ?? '*' : '',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Tenant-Id',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null; // 不是预检请求，继续处理
}

/** 添加 CORS 响应头到任意 Response */
export function addCORSHeaders(response: Response, request: NextRequest): Response {
  const origin = request.headers.get('origin');
  const newHeaders = new Headers(response.headers);

  if (origin) {
    newHeaders.set('Access-Control-Allow-Origin', origin);
    newHeaders.set('Vary', 'Origin');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
