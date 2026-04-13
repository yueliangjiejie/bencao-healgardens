'use client'

import {
  Building2, Users, Activity, Heart, Flame, Star,
  Crown, BarChart3,
} from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/enterprise/constants'

// ═══ Demo数据 ═══
const PLATFORM_STATS = {
  totalTenants: 8,
  activeTenants: 6,
  totalUsers: 2847,
  activeUsersToday: 892,
  activeUsersWeek: 1654,
  activeUsersMonth: 2310,
  dauMauRatio: 38.6,
  avgSessionMinutes: 12.5,
  newUsersThisWeek: 148,
  newUsersThisMonth: 562,
  retention_7d: 68,
  retention_30d: 42,
  totalPointsIssued: 245800,
  totalPointsRedeemed: 89200,
  totalChallenges: 45,
  activeChallenges: 12,
  challengeParticipants: 1856,
  constitutionDistribution: [
    { name: '平和质', count: 320, pct: 11.2, color: '#10B981' },
    { name: '气虚质', count: 485, pct: 17.0, color: '#F59E0B' },
    { name: '阳虚质', count: 380, pct: 13.3, color: '#EF4444' },
    { name: '阴虚质', count: 290, pct: 10.2, color: '#EC4899' },
    { name: '痰湿质', count: 520, pct: 18.3, color: '#8B5CF6' },
    { name: '湿热质', count: 310, pct: 10.9, color: '#F97316' },
    { name: '血瘀质', count: 245, pct: 8.6, color: '#6366F1' },
    { name: '气郁质', count: 210, pct: 7.4, color: '#14B8A6' },
    { name: '特禀质', count: 87, pct: 3.1, color: '#06B6D4' },
  ],
  revenueMonthly: [
    { month: '2025-10', amount: 18500 },
    { month: '2025-11', amount: 42000 },
    { month: '2025-12', amount: 52300 },
    { month: '2026-01', amount: 48800 },
    { month: '2026-02', amount: 55200 },
    { month: '2026-03', amount: 58048 },
  ],
  topTenants: [
    { name: '健康药业集团', employees: 850, revenue: 34000, plan: 'enterprise' },
    { name: '金融创新科技', employees: 520, revenue: 20800, plan: 'enterprise' },
    { name: '示例科技公司', employees: 156, revenue: 2808, plan: 'business' },
    { name: '智慧教育科技', employees: 120, revenue: 2160, plan: 'business' },
    { name: '东方保险', employees: 42, revenue: 0, plan: 'starter' },
  ],
  featureUsage: [
    { feature: 'AI食物识别', usage: 1245, growth: 12 },
    { feature: '体质测评', usage: 892, growth: 8 },
    { feature: 'AI舌诊', usage: 634, growth: 25 },
    { feature: '挑战赛参与', usage: 1856, growth: 15 },
    { feature: '饮食记录', usage: 2100, growth: 5 },
    { feature: '体重记录', usage: 890, growth: -2 },
  ],
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'var(--bg-card)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function AdminStatsTab() {
  const maxRevenue = Math.max(...PLATFORM_STATS.revenueMonthly.map(m => m.amount))
  const maxFeatureUsage = Math.max(...PLATFORM_STATS.featureUsage.map(f => f.usage))

  return (
    <div className="space-y-3">
      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card p-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.04))' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Building2 size={12} style={{ color: '#6366F1' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>企业</span>
          </div>
          <p className="text-2xl font-black" style={{ color: '#6366F1' }}>{PLATFORM_STATS.totalTenants}</p>
          <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>{PLATFORM_STATS.activeTenants}家活跃</p>
        </div>
        <div className="card p-3" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Users size={12} style={{ color: '#10B981' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>总用户</span>
          </div>
          <p className="text-2xl font-black" style={{ color: '#10B981' }}>{PLATFORM_STATS.totalUsers.toLocaleString()}</p>
          <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>本周+{PLATFORM_STATS.newUsersThisWeek}</p>
        </div>
        <div className="card p-3" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.04))' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Activity size={12} style={{ color: '#F59E0B' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>DAU</span>
          </div>
          <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>{PLATFORM_STATS.activeUsersToday}</p>
          <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>DAU/MAU {PLATFORM_STATS.dauMauRatio}%</p>
        </div>
        <div className="card p-3" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Flame size={12} style={{ color: '#EF4444' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>挑战赛</span>
          </div>
          <p className="text-2xl font-black" style={{ color: '#EF4444' }}>{PLATFORM_STATS.activeChallenges}</p>
          <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>{PLATFORM_STATS.challengeParticipants}人参与</p>
        </div>
      </div>

      {/* 用户增长 & 留存 */}
      <div className="card p-3">
        <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>📈 用户增长与留存</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <p className="text-sm font-black" style={{ color: '#10B981' }}>+{PLATFORM_STATS.newUsersThisWeek}</p>
            <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>本周新增</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <p className="text-sm font-black" style={{ color: '#3B82F6' }}>{PLATFORM_STATS.retention_7d}%</p>
            <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>7日留存</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <p className="text-sm font-black" style={{ color: '#8B5CF6' }}>{PLATFORM_STATS.retention_30d}%</p>
            <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>30日留存</p>
          </div>
        </div>
      </div>

      {/* 营收趋势 */}
      <div className="card p-3">
        <h4 className="text-xs font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>💰 月度营收趋势</h4>
        <div className="space-y-1.5">
          {PLATFORM_STATS.revenueMonthly.map(m => {
            const pct = (m.amount / maxRevenue) * 100
            return (
              <div key={m.month} className="flex items-center gap-2">
                <span className="text-[10px] w-16 shrink-0" style={{ color: 'var(--text-secondary)' }}>{m.month.slice(5)}月</span>
                <div className="flex-1">
                  <MiniBar value={m.amount} max={maxRevenue} color="#8B5CF6" />
                </div>
                <span className="text-[10px] font-bold w-16 text-right" style={{ color: '#8B5CF6' }}>¥{(m.amount / 1000).toFixed(1)}k</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 体质分布 */}
      <div className="card p-3">
        <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>🫀 全平台体质分布</h4>
        {PLATFORM_STATS.constitutionDistribution
          .sort((a, b) => b.count - a.count)
          .map(c => (
          <div key={c.name} className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] w-14 shrink-0" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
            <div className="flex-1">
              <MiniBar value={c.count} max={520} color={c.color} />
            </div>
            <span className="text-[10px] font-bold w-10 text-right" style={{ color: c.color }}>{c.pct}%</span>
          </div>
        ))}
      </div>

      {/* 功能使用 */}
      <div className="card p-3">
        <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>⚡ 功能使用排行</h4>
        {PLATFORM_STATS.featureUsage
          .sort((a, b) => b.usage - a.usage)
          .map(f => (
          <div key={f.feature} className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] w-20 shrink-0" style={{ color: 'var(--text-primary)' }}>{f.feature}</span>
            <div className="flex-1">
              <MiniBar value={f.usage} max={maxFeatureUsage} color={f.growth >= 0 ? '#10B981' : '#EF4444'} />
            </div>
            <span className="text-[10px] w-10 text-right" style={{ color: 'var(--text-secondary)' }}>{f.usage}</span>
            <span className="text-[9px] w-10 text-right font-bold" style={{ color: f.growth >= 0 ? '#10B981' : '#EF4444' }}>
              {f.growth >= 0 ? '+' : ''}{f.growth}%
            </span>
          </div>
        ))}
      </div>

      {/* Top企业 */}
      <div className="card p-3">
        <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>🏢 Top企业</h4>
        {PLATFORM_STATS.topTenants.map((t, i) => {
          const planColor = t.plan === 'enterprise' ? '#8B5CF6' : t.plan === 'business' ? '#3B82F6' : t.plan === 'starter' ? '#10B981' : '#6B7280'
          return (
            <div key={t.name} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : ''}`}
                style={i > 2 ? { background: 'var(--bg-card)', color: 'var(--text-secondary)' } : {}}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
                <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>{t.employees}人 · <span style={{ color: planColor }}>{SUBSCRIPTION_PLANS[t.plan as keyof typeof SUBSCRIPTION_PLANS]?.name}</span></span>
              </div>
              <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>¥{(t.revenue / 1000).toFixed(1)}k</span>
            </div>
          )
        })}
      </div>

      {/* 积分经济 */}
      <div className="card p-3">
        <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>⭐ 积分经济</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <p className="text-sm font-black" style={{ color: '#F59E0B' }}>{PLATFORM_STATS.totalPointsIssued.toLocaleString()}</p>
            <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>已发放积分</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <p className="text-sm font-black" style={{ color: '#3B82F6' }}>{PLATFORM_STATS.totalPointsRedeemed.toLocaleString()}</p>
            <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>已兑换积分</p>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>兑换率</span>
            <span className="text-[10px] font-bold" style={{ color: '#F59E0B' }}>
              {((PLATFORM_STATS.totalPointsRedeemed / PLATFORM_STATS.totalPointsIssued) * 100).toFixed(1)}%
            </span>
          </div>
          <MiniBar value={PLATFORM_STATS.totalPointsRedeemed} max={PLATFORM_STATS.totalPointsIssued} color="#F59E0B" />
        </div>
      </div>
    </div>
  )
}
