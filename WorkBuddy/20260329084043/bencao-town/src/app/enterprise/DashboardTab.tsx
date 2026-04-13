'use client'

import {
  Users, Activity, TrendingUp, TrendingDown, Heart, Flame, Star, Crown, Zap,
} from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/enterprise/constants'

// ═══ Demo数据 ═══
const DEMO_TENANT = { name: '示例科技公司', slug: 'demo-tech', plan: 'business' as const, industry: '科技/互联网', employee_count: 156, max_employees: 200 }
const DEMO_KPIs = { total: 156, today: 89, week: 132, engagement: 72, fitness: 68, challenges: 3, weightChange: -1.2, streakLeader: { name: '张三', days: 45 }, pointsToday: 2450 }
const DEMO_DEPTS = [
  { department: '研发部', member_count: 52, active_count: 41, avg_fitness: 71, total_points: 12800 },
  { department: '产品部', member_count: 28, active_count: 23, avg_fitness: 74, total_points: 8600 },
  { department: '市场部', member_count: 24, active_count: 18, avg_fitness: 65, total_points: 6200 },
  { department: '运营部', member_count: 22, active_count: 19, avg_fitness: 69, total_points: 5800 },
  { department: '人力资源', member_count: 18, active_count: 15, avg_fitness: 73, total_points: 4800 },
  { department: '财务部', member_count: 12, active_count: 9, avg_fitness: 62, total_points: 3200 },
]

function KPICard({ icon: Icon, label, value, sub, trend, color }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; value: string | number
  sub?: string; trend?: 'up' | 'down' | null; color: string
}) {
  return (
    <div className="card p-3" style={{ background: `linear-gradient(135deg, ${color}12, ${color}06)` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon size={14} style={{ color }} />
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        {trend === 'up' && <TrendingUp size={12} style={{ color: '#10B981' }} />}
        {trend === 'down' && <TrendingDown size={12} style={{ color: '#EF4444' }} />}
      </div>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  )
}

function ProgressBar({ value, max, color = 'var(--gold)', height = 6 }: { value: number; max: number; color?: string; height?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'var(--bg-card)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function DashboardTab() {
  return (
    <div className="space-y-4">
      {/* 企业信息 */}
      <div className="card p-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/10 flex items-center justify-center text-2xl">🏢</div>
          <div className="flex-1">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{DEMO_TENANT.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                {SUBSCRIPTION_PLANS[DEMO_TENANT.plan].name}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{DEMO_TENANT.industry}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black" style={{ color: 'var(--gold)' }}>{DEMO_TENANT.employee_count}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>/ {DEMO_TENANT.max_employees}人</p>
          </div>
        </div>
        <div className="mt-2">
          <ProgressBar value={DEMO_TENANT.employee_count} max={DEMO_TENANT.max_employees} color="#8B5CF6" height={4} />
        </div>
      </div>

      {/* KPI */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>📊 今日概览</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <KPICard icon={Users} label="今日活跃" value={DEMO_KPIs.today} sub={`共${DEMO_KPIs.total}名员工`} color="#3B82F6" />
          <KPICard icon={Activity} label="周活跃率" value={`${Math.round(DEMO_KPIs.week / DEMO_KPIs.total * 100)}%`} sub={`${DEMO_KPIs.week}人活跃`} trend="up" color="#10B981" />
          <KPICard icon={Flame} label="平均参与度" value={`${DEMO_KPIs.engagement}%`} trend="up" color="#F59E0B" />
          <KPICard icon={Heart} label="体质度" value={DEMO_KPIs.fitness} sub="平均分" color="#EC4899" />
          <KPICard icon={TrendingDown} label="平均减重" value={`${DEMO_KPIs.weightChange}kg`} trend="down" color="#10B981" />
          <KPICard icon={Star} label="今日积分" value={`+${DEMO_KPIs.pointsToday}`} sub="已发放" color="#F59E0B" />
        </div>
      </div>

      {/* 打卡冠军 */}
      <div className="card p-3" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(245,158,11,0.04))' }}>
        <div className="flex items-center gap-2 mb-2">
          <Crown size={14} style={{ color: '#F59E0B' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--gold)' }}>连续打卡冠军</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10 flex items-center justify-center text-lg">👑</div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{DEMO_KPIs.streakLeader.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              已连续打卡 <span className="font-bold" style={{ color: '#F59E0B' }}>{DEMO_KPIs.streakLeader.days}</span> 天
            </p>
          </div>
        </div>
      </div>

      {/* 部门排行 */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>🏢 部门排行</h3>
        {DEMO_DEPTS.sort((a, b) => b.total_points - a.total_points).map((dept, i) => (
          <div key={dept.department} className="card p-2.5 mb-1.5 flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : ''}`}
              style={i > 2 ? { background: 'var(--bg-card)', color: 'var(--text-secondary)' } : {}}>
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{dept.department}</span>
                <span className="text-[10px] font-bold" style={{ color: '#F59E0B' }}>{dept.total_points.toLocaleString()}分</span>
              </div>
              <ProgressBar value={dept.active_count} max={dept.member_count} color={i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#F97316' : 'var(--text-secondary)'} height={3} />
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>{dept.active_count}/{dept.member_count}人活跃</span>
                <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>体质度 {dept.avg_fitness}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
