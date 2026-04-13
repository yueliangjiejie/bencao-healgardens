/**
 * 员工管理 API v1.0
 *
 * GET  /api/enterprise/tenants/[slug]/employees     — 员工列表（HR）
 * POST /api/enterprise/tenants/[slug]/employees/import — CSV批量导入（HR）
 */

import { NextRequest } from 'next/server';
import { withHR } from '@/lib/enterprise/api-handler';
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  badRequest,
  notFound,
  apiError,
  forbidden,
  serverError,
} from '@/lib/enterprise/auth';
import {
  getTenantBySlug,
  getTenantEmployees,
  getUserProfileByEmail,
  createAuditLog,
  getServiceClient,
} from '@/lib/enterprise/supabase-client';
import type { AuthContext, CsvImportResult, UserProfile } from '@/lib/enterprise/types';
import { ApiErrorCode } from '@/lib/enterprise/constants';
import { PRIVACY_CONFIG } from '@/lib/enterprise/constants';

// ═══════════════════════════════════════════════════
// GET — 员工列表
// ═══════════════════════════════════════════════════

export const GET = withHR(
  async (request: NextRequest, ctx: AuthContext): Promise<Response> => {
    const slug = extractSlug(request);
    if (!slug) return badRequest('缺少企业slug');

    const tenant = await getTenantBySlug(slug);
    if (!tenant) return notFound('企业');
    if (tenant.id !== ctx.tenantId) return forbidden('只能查看自己企业的员工');

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);
    const department = url.searchParams.get('department') || undefined;

    const { data, count } = await getTenantEmployees(tenant.id, {
      department,
      page,
      limit,
    });

    // 隐私处理：员工数据对HR完全可见（管理需要），但对非HR接口应做匿名化
    // 此处为HR管理员接口，返回完整数据

    return paginatedResponse(data, page, limit, count);
  }
);

// ═══════════════════════════════════════════════════
// POST — CSV批量导入员工
// ═══════════════════════════════════════════════════

interface CsvImportRequestBody {
  /** Base64编码的CSV文件内容 */
  file_data: string;
  /** 列映射配置 */
  columns?: {
    name: string;
    email: string;
    employee_id?: string;
    department?: string;
    position?: string;
  };
}

/** 默认CSV列名映射 */
const DEFAULT_CSV_COLUMNS = {
  name: '姓名',
  email: '邮箱',
  employee_id: '工号',
  department: '部门',
  position: '职位',
};

export const POST = withHR(
  async (request: NextRequest, ctx: AuthContext): Promise<Response> => {
    const slug = extractSlug(request);
    if (!slug) return badRequest('缺少企业slug');

    const tenant = await getTenantBySlug(slug);
    if (!tenant) return notFound('企业');
    if (tenant.id !== ctx.tenantId) return forbidden();

    // 检查人数限制
    const currentCount = await getCurrentEmployeeCount(tenant.id);
    if (currentCount >= tenant.max_employees && tenant.max_employees > 0) {
      return apiError(ApiErrorCode.EMPLOYEE_LIMIT_REACHED,
        `已达人数上限(${tenant.max_employees})，请升级套餐`, 403);
    }

    let body: CsvImportRequestBody;
    try {
      body = await request.json();
    } catch {
      return badRequest('无效的JSON格式');
    }

    if (!body.file_data) {
      return badRequest('缺少file_data字段（Base64编码的CSV文件）');
    }

    try {
      const result = await processCsvImport(body, ctx, tenant);
      return createdResponse(result);
    } catch (err) {
      console.error('[CSV Import] Error:', err);
      return serverError(err instanceof Error ? err.message : undefined);
    }
  }
);

// ─── CSV 导入核心逻辑 ──────────────────────

async function processCsvImport(
  body: CsvImportRequestBody,
  ctx: AuthContext,
  tenant: { id: string; name: string }
): Promise<CsvImportResult> {
  const columns = { ...DEFAULT_CSV_COLUMNS, ...body.columns };

  // 解析Base64
  let csvText: string;
  try {
    csvText = atob(body.file_data.replace(/^data:text\/csv;base64,/, '').replace(/^data:application\/vnd.ms-excel;base64,/, ''));
  } catch {
    throw new Error('Base64解码失败，请确认文件格式正确');
  }

  // 简易CSV解析
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    throw new Error('CSV文件为空或格式不正确');
  }

  // 查找表头行索引
  const headerRowIdx = findHeaderRow(rows, columns);
  if (headerRowIdx < 0) {
    throw new Error(`未找到表头行，请确保包含以下列名之一: ${Object.values(columns).join('/')}`);
  }

  const headers = rows[headerRowIdx];
  const colIndexMap = buildColumnIndexMap(headers, columns);

  const serviceClient = getServiceClient();
  const result: CsvImportResult = {
    total_rows: rows.length - headerRowIdx - 1,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  // 检查剩余容量
  const currentCount = await getCurrentEmployeeCount(tenant.id);
  const remainingSlots = (tenant as any).max_employees > 0
    ? (tenant as any).max_employees - currentCount
    : Infinity;

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2 || !row.join('').trim()) continue; // 跳过空行

    const rowNumber = i + 1;

    try {
      const name = row[colIndexMap.name]?.trim();
      const email = row[colIndexMap.email]?.trim()?.toLowerCase();
      const employee_id = colIndexMap.employee_id >= 0 ? (row[colIndexMap.employee_id]?.trim() ?? null) : null;
      const department = colIndexMap.department >= 0 ? (row[colIndexMap.department]?.trim() ?? null) : null;
      const position = colIndexMap.position >= 0 ? (row[colIndexMap.position]?.trim() ?? null) : null;

      // 验证必填字段
      if (!name || !email) {
        result.skipped++;
        result.errors.push({ row: rowNumber, reason: '缺少姓名或邮箱' });
        continue;
      }

      // 验证邮箱格式
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        result.skipped++;
        result.errors.push({ row: rowNumber, reason: `邮箱格式无效: ${email}` });
        continue;
      }

      // 检查是否已存在
      const existing = await getUserProfileByEmail(email, tenant.id);
      if (existing) {
        result.skipped++;
        result.errors.push({ row: rowNumber, reason: `该邮箱已被注册: ${email}` });
        continue;
      }

      // 检查人数上限
      if (result.imported >= remainingSlots) {
        result.skipped++;
        result.errors.push({ row: rowNumber, reason: '已达人数上限' });
        continue;
      }

      // 创建用户档案（注意：此时用户尚未注册Auth，状态待激活）
      const { error: insertError } = await serviceClient
        .from('user_profiles')
        .insert({
          tenant_id: tenant.id,
          auth_id: generatePlaceholderUUID(), // 待注册时更新
          display_name: name,
          email,
          employee_id,
          department,
          position,
          role: 'employee',
          is_active: false, // 未注册激活前不活跃
        });

      if (insertError) {
        result.skipped++;
        result.errors.push({
          row: rowNumber,
          reason: insertError.message.includes('duplicate')
            ? '重复记录'
            : insertError.message.slice(0, 80),
        });
        continue;
      }

      result.imported++;

  // 更新企业员工计数（忽略错误，由快照任务修正）
  try {
    await serviceClient.rpc('increment_tenant_count', { p_tenant_id: tenant.id });
  } catch { /* ignore */ }
    } catch (rowErr) {
      result.skipped++;
      result.errors.push({
        row: rowNumber,
        reason: rowErr instanceof Error ? rowErr.message : '未知错误',
      });
    }
  }

  // 审计日志
  await createAuditLog({
    tenantId: tenant.id,
    actorId: ctx.userId,
    action: 'user.invite',
    details: {
      method: 'csv_import',
      total_rows: result.total_rows,
      imported: result.imported,
      skipped: result.skipped,
    },
  });

  return result;
}

// ─── 辅助函数 ────────────────────────────────

function extractSlug(req: NextRequest): string | null {
  // 从 pathname 中提取 [slug] 参数
  const match = req.nextUrl.pathname.match(/\/tenants\/([^/]+)/);
  return match?.[1] ?? null;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentCell += '"';
          i++; // 跳过转义引号
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && i + 1 < text.length && text[i + 1] === '\n')) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++; // 跳过 \r\n 的 \n
      } else if (char !== '\r') {
        currentCell += char;
      }
    }
  }

  // 处理最后一行（如果没有换行结尾）
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows;
}

function findHeaderRow(
  rows: string[][],
  columns: typeof DEFAULT_CSV_COLUMNS
): number {
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i].map((c) => c.trim().replace(/^\uFEFF/, '')); // BOM
    const hasRequiredColumns =
      row.some((c) => c === columns.name || c.toLowerCase().includes('名')) &&
      row.some((c) => c === columns.email || c.toLowerCase().includes('邮') || c.toLowerCase().includes('mail') || c.toLowerCase() === 'email');

    if (hasRequiredColumns) return i;
  }
  return -1;
}

function buildColumnIndexMap(
  headers: string[],
  columns: typeof DEFAULT_CSV_COLUMNS
): Record<string, number> {
  const map: Record<string, number> = { name: -1, email: -1, employee_id: -1, department: -1, position: -1 };

  headers.forEach((header, idx) => {
    const h = header.trim().toLowerCase();
    for (const [key, cnName] of Object.entries(columns)) {
      if (
        h === cnName ||
        h === cnName.toLowerCase() ||
        h.includes(cnName) ||
        h === key ||
        h === key.toLowerCase()
      ) {
        map[key] = idx;
        break;
      }
    }
  });

  return map;
}

function generatePlaceholderUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function getCurrentEmployeeCount(tenantId: string): Promise<number> {
  const { supabase } = await import('@/lib/supabase');
  const { count } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_active', true);
  return count ?? 0;
}

