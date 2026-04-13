'use client'

import { useState } from 'react'
import {
  Building2, Search, Plus, Eye, Trash2, Edit3, Users, Crown,
  TrendingUp, ChevronRight, X, CheckCircle, AlertCircle, XCircle,
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, INDUSTRY_OPTIONS } from '@/lib/enterprise/constants'
import type { SubscriptionPlan } from '@/lib/enterprise/types'

// ═══ Demo数据 ═══
interface DemoTenant {
  id: string; name: string; slug: string; plan: SubscriptionPlan
  industry: string; size: string; employee_count: number; max_employees: number
  hr_admin_name: string; hr_admin_email: string; status: 'active' | 'suspended' | 'deleted'
  created_at: string; expires_at: string; monthly_revenue: number
}

const DEMO_TENANTS: DemoTenant[] = [
  { id: '1', name: '示例科技公司', slug: 'demo-tech', plan: 'business', industry: '科技/互联网', size: 'medium', employee_count: 156, max_employees: 200, hr_admin_name: '王管理', hr_admin_email: 'admin@demo.com', status: 'active', created_at: '2025-12-01', expires_at: '2026-12-01', monthly_revenue: 2808 },
  { id: '2', name: '健康药业集团', slug: 'health-pharma', plan: 'enterprise', industry: '医疗/健康', size: 'large', employee_count: 850, max_employees: -1, hr_admin_name: '李HR', hr_admin_email: 'hr@health.com', status: 'active', created_at: '2025-10-15', expires_at: '2026-10-15', monthly_revenue: 34000 },
  { id: '3', name: '绿动健身连锁', slug: 'green-fitness', plan: 'starter', industry: '零售/电商', size: 'small', employee_count: 35, max_employees: 50, hr_admin_name: '张总', hr_admin_email: 'zhang@green.com', status: 'active', created_at: '2026-01-20', expires_at: '2027-01-20', monthly_revenue: 280 },
  { id: '4', name: '智慧教育科技', slug: 'smart-edu', plan: 'business', industry: '教育/培训', size: 'medium', employee_count: 120, max_employees: 200, hr_admin_name: '刘主管', hr_admin_email: 'liu@smartedu.com', status: 'active', created_at: '2026-02-10', expires_at: '2027-02-10', monthly_revenue: 2160 },
  { id: '5', name: '东方保险', slug: 'east-insure', plan: 'starter', industry: '金融/保险', size: 'small', employee_count: 42, max_employees: 50, hr_admin_name: '赵经理', hr_admin_email: 'zhao@east.com', status: 'suspended', created_at: '2025-08-01', expires_at: '2026-02-01', monthly_revenue: 0 },
  { id: '6', name: '物流快运集团', slug: 'fast-logistics', plan: 'free', industry: '物流/运输', size: 'startup', employee_count: 8, max_employees: 10, hr_admin_name: '孙老板', hr_admin_email: 'sun@fast.com', status: 'active', created_at: '2026-03-01', expires_at: '2026-03-01', monthly_revenue: 0 },
  { id: '7', name: '新媒体传媒', slug: 'new-media', plan: 'starter', industry: '媒体/娱乐', size: 'small', employee_count: 28, max_employees: 50, hr_admin_name: '陈主编', hr_admin_email: 'chen@newmedia.com', status: 'deleted', created_at: '2025-06-01', expires_at: '2026-06-01', monthly_revenue: 0 },
  { id: '8', name: '金融创新科技', slug: 'fintech-inno', plan: 'enterprise', industry: '金融/保险', size: 'large', employee_count: 520, max_employees: -1, hr_admin_name: '周总监', hr_admin_email: 'zhou@fintech.com', status: 'active', created_at: '2025-11-01', expires_at: '2026-11-01', monthly_revenue: 20800 },
]

function StatusBadge({ status }: { status: DemoTenant['status'] }) {
  const config = {
    active: { icon: CheckCircle, color: '#10B981', label: '正常' },
    suspended: { icon: AlertCircle, color: '#F59E0B', label: '已暂停' },
    deleted: { icon: XCircle, color: '#EF4444', label: '已删除' },
  }
  const c = config[status]
  const Icon = c.icon
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: c.color }}>
      <Icon size={10} /> {c.label}
    </span>
  )
}

export default function AdminTenantsTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<DemoTenant | null>(null)

  const filtered = DEMO_TENANTS.filter(t => {
    const matchSearch = !searchTerm || t.name.includes(searchTerm) || t.slug.includes(searchTerm)
    const matchPlan = planFilter === 'all' || t.plan === planFilter
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchPlan && matchStatus
  })

  const totalRevenue = DEMO_TENANTS.filter(t => t.status === 'active').reduce((s, t) => s + t.monthly_revenue, 0)
  const activeCount = DEMO_TENANTS.filter(t => t.status === 'active').length
  const totalEmployees = DEMO_TENANTS.filter(t => t.status === 'active').reduce((s, t) => s + t.employee_count, 0)

  return (
    <div className="space-y-3">
      {/* 概览统计 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#10B981' }}>{activeCount}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>活跃企业</p>
        </div>
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#3B82F6' }}>{totalEmployees}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>总员工数</p>
        </div>
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#F59E0B' }}>¥{(totalRevenue / 1000).toFixed(1)}k</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>月营收</p>
        </div>
      </div>

      {/* 搜索 & 创建 */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text" placeholder="搜索企业名或Slug..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold shrink-0" style={{ background: '#EF4444', color: '#FFFFFF' }}>
          <Plus size={12} /> 新建
        </button>
      </div>

      {/* 筛选 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        <button onClick={() => setPlanFilter('all')}
          className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
          style={{ background: planFilter === 'all' ? '#EF4444' : 'var(--bg-card)', color: planFilter === 'all' ? '#FFF' : 'var(--text-secondary)', border: planFilter === 'all' ? 'none' : '1px solid var(--border)' }}
        >全部计划</button>
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
          <button key={key} onClick={() => setPlanFilter(key)}
            className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ background: planFilter === key ? '#EF4444' : 'var(--bg-card)', color: planFilter === key ? '#FFF' : 'var(--text-secondary)', border: planFilter === key ? 'none' : '1px solid var(--border)' }}
          >{plan.name}</button>
        ))}
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-1.5">
        {(['all', 'active', 'suspended', 'deleted'] as const).map(s => {
          const labels: Record<string, string> = { all: '全部状态', active: '正常', suspended: '暂停', deleted: '已删' }
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: statusFilter === s ? 'var(--gold)' : 'var(--bg-card)', color: statusFilter === s ? '#1A1A1A' : 'var(--text-secondary)' }}
            >{labels[s]}</button>
          )
        })}
      </div>

      {/* 企业列表 */}
      <div className="text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
        共 {filtered.length} 家企业
      </div>
      {filtered.map(tenant => {
        const planInfo = SUBSCRIPTION_PLANS[tenant.plan]
        return (
          <div key={tenant.id} className="card p-3"
            onClick={() => setSelectedTenant(tenant)} style={{ cursor: 'pointer' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))' }}>
                🏢
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{tenant.name}</span>
                  <StatusBadge status={tenant.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{tenant.industry}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>·</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{tenant.employee_count}人</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${tenant.plan === 'enterprise' ? '#8B5CF6' : tenant.plan === 'business' ? '#3B82F6' : tenant.plan === 'starter' ? '#10B981' : '#6B7280'}15`, color: tenant.plan === 'enterprise' ? '#8B5CF6' : tenant.plan === 'business' ? '#3B82F6' : tenant.plan === 'starter' ? '#10B981' : '#6B7280' }}>
                    {planInfo.name}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>¥{tenant.monthly_revenue > 0 ? tenant.monthly_revenue.toLocaleString() + '/月' : '免费'}</span>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>
        )
      })}

      {/* ── 企业详情弹窗 ── */}
      {selectedTenant && !showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-t-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selectedTenant.name}</h3>
              <button onClick={() => setSelectedTenant(null)}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
            </div>

            {/* 基本信息 */}
            <div className="card p-3 mb-3">
              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>基本信息</h4>
              {[
                { label: 'Slug', value: selectedTenant.slug },
                { label: '行业', value: selectedTenant.industry },
                { label: 'HR管理员', value: `${selectedTenant.hr_admin_name} (${selectedTenant.hr_admin_email})` },
                { label: '创建时间', value: selectedTenant.created_at },
                { label: '到期时间', value: selectedTenant.expires_at },
                { label: '状态', value: selectedTenant.status === 'active' ? '✅ 正常' : selectedTenant.status === 'suspended' ? '⚠️ 已暂停' : '❌ 已删除' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* 订阅信息 */}
            <div className="card p-3 mb-3">
              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>订阅信息</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>当前计划</p>
                  <p className="text-sm font-black" style={{ color: '#8B5CF6' }}>{SUBSCRIPTION_PLANS[selectedTenant.plan].name}</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>员工数</p>
                  <p className="text-sm font-black" style={{ color: '#3B82F6' }}>{selectedTenant.employee_count}/{selectedTenant.max_employees === -1 ? '∞' : selectedTenant.max_employees}</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>月营收</p>
                  <p className="text-sm font-black" style={{ color: '#F59E0B' }}>¥{selectedTenant.monthly_revenue > 0 ? selectedTenant.monthly_revenue.toLocaleString() : '—'}</p>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              {selectedTenant.status === 'active' && (
                <button className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertCircle size={12} /> 暂停企业
                </button>
              )}
              {selectedTenant.status === 'suspended' && (
                <button className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle size={12} /> 恢复企业
                </button>
              )}
              {selectedTenant.status !== 'deleted' && (
                <button className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Trash2 size={12} /> 删除企业
                </button>
              )}
              <button className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                <Edit3 size={12} /> 编辑信息
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 创建企业弹窗 ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-t-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>🏢 创建新企业</h3>
              <button onClick={() => setShowCreateModal(false)}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: '企业名称', placeholder: '请输入企业全称' },
                { label: 'Slug标识', placeholder: '英文+短横线，如 my-company' },
                { label: 'HR管理员邮箱', placeholder: 'hr@company.com' },
                { label: 'HR管理员姓名', placeholder: '请输入HR管理员姓名' },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>{field.label}</label>
                  <input type="text" placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-transparent outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>行业</label>
                <select className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {INDUSTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>初始订阅计划</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                    <div key={key} className="card p-2.5 cursor-pointer" style={{ border: key === 'starter' ? '2px solid var(--gold)' : '1px solid var(--border)' }}>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>¥{plan.priceMonthly}/人/月 · {plan.maxEmployees === -1 ? '不限' : `${plan.maxEmployees}人`}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ background: '#EF4444', color: '#FFFFFF' }}>
                创建企业
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
