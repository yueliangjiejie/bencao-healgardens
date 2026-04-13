'use client'

import { useState } from 'react'
import {
  Crown, TrendingUp, TrendingDown, CreditCard, Calendar, AlertTriangle,
  Building2, Users, ChevronRight, X, ArrowUpCircle, ArrowDownCircle, RefreshCw,
} from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/enterprise/constants'
import type { SubscriptionPlan } from '@/lib/enterprise/types'

// ═══ Demo数据 ═══
interface DemoSubscription {
  tenant_id: string; tenant_name: string; slug: string
  plan: SubscriptionPlan; employee_count: number; max_employees: number
  started_at: string; expires_at: string; auto_renew: boolean
  monthly_price: number; yearly_discount: number; status: 'active' | 'expiring' | 'expired' | 'trial'
  payment_method: string; last_payment: string; next_payment: string
}

const DEMO_SUBS: DemoSubscription[] = [
  { tenant_id: '1', tenant_name: '示例科技公司', slug: 'demo-tech', plan: 'business', employee_count: 156, max_employees: 200, started_at: '2025-12-01', expires_at: '2026-12-01', auto_renew: true, monthly_price: 2808, yearly_discount: 0, status: 'active', payment_method: '企业对公转账', last_payment: '2026-03-01', next_payment: '2026-04-01' },
  { tenant_id: '2', tenant_name: '健康药业集团', slug: 'health-pharma', plan: 'enterprise', employee_count: 850, max_employees: -1, started_at: '2025-10-15', expires_at: '2026-10-15', auto_renew: true, monthly_price: 34000, yearly_discount: 4000, status: 'active', payment_method: '年付合约', last_payment: '2025-10-15', next_payment: '2026-10-15' },
  { tenant_id: '3', tenant_name: '绿动健身连锁', slug: 'green-fitness', plan: 'starter', employee_count: 35, max_employees: 50, started_at: '2026-01-20', expires_at: '2027-01-20', auto_renew: true, monthly_price: 280, yearly_discount: 16, status: 'active', payment_method: '微信支付', last_payment: '2026-01-20', next_payment: '2027-01-20' },
  { tenant_id: '4', tenant_name: '智慧教育科技', slug: 'smart-edu', plan: 'business', employee_count: 120, max_employees: 200, started_at: '2026-02-10', expires_at: '2026-04-10', auto_renew: true, monthly_price: 2160, yearly_discount: 0, status: 'expiring', payment_method: '支付宝', last_payment: '2026-03-10', next_payment: '2026-04-10' },
  { tenant_id: '5', tenant_name: '东方保险', slug: 'east-insure', plan: 'starter', employee_count: 42, max_employees: 50, started_at: '2025-08-01', expires_at: '2026-02-01', auto_renew: false, monthly_price: 336, yearly_discount: 0, status: 'expired', payment_method: '企业对公转账', last_payment: '2025-12-01', next_payment: '—' },
  { tenant_id: '6', tenant_name: '物流快运集团', slug: 'fast-logistics', plan: 'free', employee_count: 8, max_employees: 10, started_at: '2026-03-01', expires_at: '2026-03-01', auto_renew: false, monthly_price: 0, yearly_discount: 0, status: 'trial', payment_method: '—', last_payment: '—', next_payment: '—' },
  { tenant_id: '8', tenant_name: '金融创新科技', slug: 'fintech-inno', plan: 'enterprise', employee_count: 520, max_employees: -1, started_at: '2025-11-01', expires_at: '2026-11-01', auto_renew: true, monthly_price: 20800, yearly_discount: 2400, status: 'active', payment_method: '年付合约', last_payment: '2025-11-01', next_payment: '2026-11-01' },
]

function SubStatusBadge({ status }: { status: DemoSubscription['status'] }) {
  const config = {
    active: { color: '#10B981', label: '✅ 正常', bg: 'rgba(16,185,129,0.1)' },
    expiring: { color: '#F59E0B', label: '⚠️ 即将到期', bg: 'rgba(245,158,11,0.1)' },
    expired: { color: '#EF4444', label: '❌ 已过期', bg: 'rgba(239,68,68,0.1)' },
    trial: { color: '#6B7280', label: '🆓 免费版', bg: 'rgba(107,114,128,0.1)' },
  }
  const c = config[status]
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

export default function AdminSubscriptionsTab() {
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSub, setSelectedSub] = useState<DemoSubscription | null>(null)

  const filtered = DEMO_SUBS.filter(s => {
    const matchPlan = planFilter === 'all' || s.plan === planFilter
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchPlan && matchStatus
  })

  // 汇总统计
  const totalMonthlyRevenue = DEMO_SUBS.filter(s => s.status === 'active' || s.status === 'expiring').reduce((sum, s) => sum + s.monthly_price, 0)
  const activePaidCount = DEMO_SUBS.filter(s => s.status === 'active' && s.plan !== 'free').length
  const expiringCount = DEMO_SUBS.filter(s => s.status === 'expiring').length
  const expiredCount = DEMO_SUBS.filter(s => s.status === 'expired').length
  const totalCoveredEmployees = DEMO_SUBS.filter(s => s.status === 'active').reduce((sum, s) => sum + s.employee_count, 0)
  const planDistribution: Record<string, number> = {}
  DEMO_SUBS.forEach(s => { planDistribution[s.plan] = (planDistribution[s.plan] || 0) + 1 })

  return (
    <div className="space-y-3">
      {/* 营收概览 */}
      <div className="card p-3" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.06))' }}>
        <div className="flex items-center gap-2 mb-2">
          <Crown size={16} style={{ color: '#8B5CF6' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>月度营收概览</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>月营收</p>
            <p className="text-lg font-black" style={{ color: '#8B5CF6' }}>¥{(totalMonthlyRevenue / 1000).toFixed(1)}k</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>覆盖员工</p>
            <p className="text-lg font-black" style={{ color: '#3B82F6' }}>{totalCoveredEmployees.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>付费企业</p>
            <p className="text-lg font-black" style={{ color: '#10B981' }}>{activePaidCount}</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>即将到期</p>
            <p className="text-lg font-black" style={{ color: '#F59E0B' }}>{expiringCount}</p>
          </div>
        </div>
      </div>

      {/* 计划分布 */}
      <div className="card p-3">
        <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>计划分布</h4>
        <div className="space-y-2">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
            const count = planDistribution[key] || 0
            const pct = Math.round((count / DEMO_SUBS.length) * 100)
            const color = key === 'enterprise' ? '#8B5CF6' : key === 'business' ? '#3B82F6' : key === 'starter' ? '#10B981' : '#6B7280'
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[11px] font-bold w-16" style={{ color: 'var(--text-primary)' }}>{plan.name}</span>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: 'var(--bg-card)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 5)}%`, background: color }} />
                </div>
                <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {(['all', 'active', 'expiring', 'expired', 'trial'] as const).map(s => {
          const labels: Record<string, string> = { all: '全部', active: '正常', expiring: '即将到期', expired: '已过期', trial: '免费' }
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
              style={{ background: statusFilter === s ? '#EF4444' : 'var(--bg-card)', color: statusFilter === s ? '#FFF' : 'var(--text-secondary)', border: statusFilter === s ? 'none' : '1px solid var(--border)' }}
            >{labels[s]}</button>
          )
        })}
      </div>

      {/* 订阅列表 */}
      <div className="text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
        共 {filtered.length} 个订阅
      </div>
      {filtered.map(sub => {
        const planInfo = SUBSCRIPTION_PLANS[sub.plan]
        const planColor = sub.plan === 'enterprise' ? '#8B5CF6' : sub.plan === 'business' ? '#3B82F6' : sub.plan === 'starter' ? '#10B981' : '#6B7280'
        return (
          <div key={sub.tenant_id} className="card p-3" style={{ cursor: 'pointer' }}
            onClick={() => setSelectedSub(sub)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: `${planColor}15` }}>
                {sub.plan === 'enterprise' ? '👑' : sub.plan === 'business' ? '💼' : sub.plan === 'starter' ? '🌱' : '🆓'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{sub.tenant_name}</span>
                  <SubStatusBadge status={sub.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${planColor}15`, color: planColor }}>
                    {planInfo.name}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{sub.employee_count}人</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold" style={{ color: '#F59E0B' }}>
                    ¥{sub.monthly_price > 0 ? sub.monthly_price.toLocaleString() + '/月' : '免费'}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
                    到期: {sub.expires_at}
                  </span>
                  {sub.auto_renew && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>自动续费</span>
                  )}
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>
        )
      })}

      {/* ── 订阅详情弹窗 ── */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-t-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selectedSub.tenant_name} · 订阅管理</h3>
              <button onClick={() => setSelectedSub(null)}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
            </div>

            {/* 当前订阅信息 */}
            <div className="card p-3 mb-3" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.04))' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown size={16} style={{ color: '#8B5CF6' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{SUBSCRIPTION_PLANS[selectedSub.plan].name}</span>
                </div>
                <SubStatusBadge status={selectedSub.status} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>月付金额</p>
                  <p className="text-base font-black" style={{ color: '#8B5CF6' }}>¥{selectedSub.monthly_price > 0 ? selectedSub.monthly_price.toLocaleString() : '免费'}</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>员工容量</p>
                  <p className="text-base font-black" style={{ color: '#3B82F6' }}>{selectedSub.employee_count}/{selectedSub.max_employees === -1 ? '∞' : selectedSub.max_employees}</p>
                </div>
              </div>
            </div>

            {/* 支付信息 */}
            <div className="card p-3 mb-3">
              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>支付信息</h4>
              {[
                { label: '支付方式', value: selectedSub.payment_method },
                { label: '上次付款', value: selectedSub.last_payment },
                { label: '下次付款', value: selectedSub.next_payment },
                { label: '自动续费', value: selectedSub.auto_renew ? '✅ 已开启' : '❌ 未开启' },
                { label: '开始日期', value: selectedSub.started_at },
                { label: '到期日期', value: selectedSub.expires_at },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* 操作 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>操作</h4>
              {selectedSub.plan !== 'enterprise' && (
                <button className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <ArrowUpCircle size={14} /> 升级计划
                </button>
              )}
              {selectedSub.plan !== 'free' && selectedSub.plan !== 'enterprise' && (
                <button className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  <ArrowDownCircle size={14} /> 降级计划
                </button>
              )}
              {selectedSub.status === 'expired' && (
                <button className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <RefreshCw size={14} /> 手动续费
                </button>
              )}
              <button className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                <CreditCard size={14} /> 延长到期时间
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
