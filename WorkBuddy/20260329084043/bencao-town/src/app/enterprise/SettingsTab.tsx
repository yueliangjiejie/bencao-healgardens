'use client'

import { useState } from 'react'
import {
  Building2, Shield, FileText, ChevronRight, Eye, EyeOff,
  Bell, Crown, CreditCard, Users, Globe, Clock,
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS, ROLE_PERMISSIONS } from '@/lib/enterprise/constants'
import type { SubscriptionPlan, UserRole } from '@/lib/enterprise/types'

// Demo 数据
const DEMO_TENANT = {
  name: '示例科技公司', slug: 'demo-tech', plan: 'business' as SubscriptionPlan,
  industry: '科技/互联网', size: 'medium', employee_count: 156, max_employees: 200,
  hr_admins: ['admin@demo.com'], created_at: '2025-12-01',
  settings: {
    allow_self_registration: true, require_department: true,
    challenge_enabled: true, leaderboard_anonymity: true,
    default_language: 'zh', timezone: 'Asia/Shanghai',
    working_days: [1, 2, 3, 4, 5],
  }
}

const AUDIT_LOGS = [
  { id: '1', action: 'challenge.create', actor: 'HR管理员', target: '14天饮食自律挑战', time: '2小时前', detail: '创建挑战赛草稿' },
  { id: '2', action: 'user.invite', actor: 'HR管理员', target: '冯十二', time: '1天前', detail: '邀请新员工加入' },
  { id: '3', action: 'challenge.publish', actor: 'HR管理员', target: '30天万步挑战', time: '3天前', detail: '发布挑战赛' },
  { id: '4', action: 'tenant.update', actor: '平台管理员', target: '企业设置', time: '1周前', detail: '升级到商业版套餐' },
  { id: '5', action: 'points.grant', actor: 'HR管理员', target: '研发部全员', time: '1周前', detail: '发放部门奖励积分 +50/人' },
  { id: '6', action: 'challenge.complete', actor: '系统', target: '中医养生体验周', time: '3周前', detail: '挑战赛自动完成，72人参与' },
  { id: '7', action: 'report.generate', actor: '系统', target: '2026年3月报告', time: '4周前', detail: '自动生成月度健康报告' },
]

function getActionLabel(action: string) {
  const map: Record<string, string> = {
    'tenant.create': '🏢 创建企业', 'tenant.update': '⚙️ 更新设置',
    'user.invite': '👤 邀请员工', 'user.activate': '✅ 激活员工',
    'challenge.create': '🏆 创建挑战赛', 'challenge.publish': '📢 发布挑战赛',
    'challenge.pause': '⏸️ 暂停挑战赛', 'challenge.complete': '✅ 完成挑战赛',
    'points.grant': '⭐ 发放积分', 'report.generate': '📊 生成报告',
  }
  return map[action] || action
}

type SubTab = 'info' | 'plan' | 'permissions' | 'audit'

export default function SettingsTab() {
  const [subTab, setSubTab] = useState<SubTab>('info')
  const plan = SUBSCRIPTION_PLANS[DEMO_TENANT.plan]

  return (
    <div className="space-y-3">
      {/* 子Tab */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {([
          { id: 'info' as SubTab, label: '企业信息', icon: Building2 },
          { id: 'plan' as SubTab, label: '订阅计划', icon: Crown },
          { id: 'permissions' as SubTab, label: '权限管理', icon: Shield },
          { id: 'audit' as SubTab, label: '审计日志', icon: FileText },
        ]).map(t => {
          const Icon = t.icon
          const active = subTab === t.id
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1"
              style={{ background: active ? 'var(--gold)' : 'var(--bg-card)', color: active ? '#1A1A1A' : 'var(--text-secondary)' }}
            >
              <Icon size={12} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── 企业信息 ── */}
      {subTab === 'info' && (
        <div className="space-y-3">
          <div className="card p-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/10 flex items-center justify-center text-3xl">🏢</div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{DEMO_TENANT.name}</h3>
                <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Slug: {DEMO_TENANT.slug}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: '行业', value: DEMO_TENANT.industry, icon: Building2 },
                { label: '规模', value: COMPANY_SIZE_OPTIONS.find(o => o.value === DEMO_TENANT.size)?.label || DEMO_TENANT.size, icon: Users },
                { label: '创建时间', value: DEMO_TENANT.created_at, icon: Clock },
                { label: 'HR管理员', value: DEMO_TENANT.hr_admins[0], icon: Shield },
                { label: '时区', value: DEMO_TENANT.settings.timezone, icon: Globe },
                { label: '工作日', value: '周一至周五', icon: Clock },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <item.icon size={12} style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 功能开关 */}
          <div className="card p-3">
            <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>⚙️ 功能设置</h4>
            {[
              { label: '允许员工自行注册', value: DEMO_TENANT.settings.allow_self_registration },
              { label: '强制填写部门', value: DEMO_TENANT.settings.require_department },
              { label: '挑战赛功能', value: DEMO_TENANT.settings.challenge_enabled },
              { label: '排行榜匿名', value: DEMO_TENANT.settings.leaderboard_anonymity },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                <div className={`w-8 h-4 rounded-full relative transition-all ${item.value ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${item.value ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 订阅计划 ── */}
      {subTab === 'plan' && (
        <div className="space-y-3">
          {/* 当前计划 */}
          <div className="card p-3" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.04))' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown size={16} style={{ color: '#8B5CF6' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>当前计划</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                {plan.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>月付价格</p>
                <p className="text-lg font-black" style={{ color: '#8B5CF6' }}>¥{plan.priceMonthly}<span className="text-[10px] font-normal">/人/月</span></p>
              </div>
              <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>人数上限</p>
                <p className="text-lg font-black" style={{ color: '#8B5CF6' }}>{plan.maxEmployees === -1 ? '∞' : plan.maxEmployees}</p>
              </div>
            </div>
          </div>

          {/* 所有计划 */}
          {Object.values(SUBSCRIPTION_PLANS).map(p => {
            const isCurrent = p.id === DEMO_TENANT.plan
            return (
              <div key={p.id} className={`card p-3 ${isCurrent ? 'border-[var(--gold)]' : ''}`}
                style={isCurrent ? { background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(245,158,11,0.03))' } : {}}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                    {p.recommended && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,215,0,0.15)', color: '#F59E0B' }}>推荐</span>}
                    {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>当前</span>}
                  </div>
                  <span className="text-base font-black" style={{ color: isCurrent ? 'var(--gold)' : 'var(--text-primary)' }}>
                    ¥{p.priceMonthly}<span className="text-[9px] font-normal">/人/月</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {p.features.slice(0, 4).map((f, i) => (
                    <span key={i} className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>✓ {f}</span>
                  ))}
                  {p.features.length > 4 && (
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>+{p.features.length - 4}项</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 权限管理 ── */}
      {subTab === 'permissions' && (
        <div className="space-y-3">
          {(['platform_admin', 'hr_admin', 'employee'] as UserRole[]).map(role => {
            const perms = ROLE_PERMISSIONS[role]
            const roleInfo: Record<string, { label: string; color: string; desc: string }> = {
              platform_admin: { label: '平台管理员', color: '#EF4444', desc: '拥有所有权限' },
              hr_admin: { label: 'HR管理员', color: '#8B5CF6', desc: '管理企业、员工、挑战赛' },
              employee: { label: '普通员工', color: '#3B82F6', desc: '个人数据记录与查看' },
            }
            const info = roleInfo[role]
            return (
              <div key={role} className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} style={{ color: info.color }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{info.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${info.color}15`, color: info.color }}>
                    {perms.length === 1 && perms[0] === '*' ? '全部权限' : `${perms.length}项权限`}
                  </span>
                </div>
                <p className="text-[10px] mb-2" style={{ color: 'var(--text-secondary)' }}>{info.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {(perms[0] === '*' ? ['全部操作'] : perms).map(p => (
                    <span key={p} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 审计日志 ── */}
      {subTab === 'audit' && (
        <div className="space-y-2">
          <div className="text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
            最近 {AUDIT_LOGS.length} 条操作记录
          </div>
          {AUDIT_LOGS.map(log => (
            <div key={log.id} className="card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {getActionLabel(log.action)}
                </span>
                <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>{log.time}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                <span>操作人: {log.actor}</span>
                <span>·</span>
                <span>对象: {log.target}</span>
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>{log.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
