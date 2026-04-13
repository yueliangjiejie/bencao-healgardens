/**
 * 企业版模块统一导出
 *
 * 使用方式:
 * import { types, auth, constants, supabase as enterpriseDb } from '@/lib/enterprise';
 */

// 类型系统
export * from './types';

// 认证与权限
export {
  getAuthContext,
  getLightAuthContext,
  verifyToken,
  extractBearerToken,
  extractSessionCookie,
  requireRole,
  requirePermission,
  requireHR,
  validateTenant,
} from './auth';

export {
  successResponse,
  createdResponse,
  paginatedResponse,
  noContentResponse,
  apiError,
  unauthenticated,
  forbidden,
  notFound,
  badRequest,
  serverError,
} from './auth';

export {
  withAuth,
  withHR,
  withOptionalAuth,
  handleCORS,
  addCORSHeaders,
} from './api-handler';

// 常量
export {
  CHALLENGE_TEMPLATES,
  SUBSCRIPTION_PLANS,
  ROLE_PERMISSIONS,
  hasPermission,
  ApiErrorCode,
  ERROR_STATUS_MAP,
  PRIVACY_CONFIG,
  INDUSTRY_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  DEFAULT_TENANT_SETTINGS,
} from './constants';

// 数据库操作
export {
  supabase, // 原始客户端
  createTenantClient,
  getServiceClient,
  getTenantBySlug,
  getTenantById,
  getUserProfile,
  getUserProfileByEmail,
  getTenantEmployees,
  getChallenges,
  getChallengeWithParticipants,
  addPoints,
  getDashboardKPIs,
  getDepartmentDetails,
  createAuditLog,
} from './supabase-client';
