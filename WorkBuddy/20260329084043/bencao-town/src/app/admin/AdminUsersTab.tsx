'use client'

import { useState } from 'react'
import {
  Search, UserCheck, UserX, Shield, ChevronRight, X,
  Building2, Star, Flame, Calendar, Mail, Crown, Eye, Edit3, ToggleLeft,
} from 'lucide-react'
import type { ConstitutionType, UserRole } from '@/lib/enterprise/types'
import { CONSTITUTION_LABELS } from '@/lib/enterprise/types'

// ═══ Demo数据 ═══
interface DemoUser {
  id: string; name: string; email: string; avatar_emoji: string
  role: UserRole; tenant_id: string | null; tenant_name: string | null
  constitution: ConstitutionType | null; points: number; streak: number
  status: 'active' | 'inactive' | 'banned'
  last_active: string; created_at: string; total_diet_records: number; total_weight_records: number
}

const DEMO_USERS: DemoUser[] = [
  { id: 'u1', name: '王管理', email: 'admin@demo.com', avatar_emoji: '👤', role: 'hr_admin', tenant_id: '1', tenant_name: '示例科技公司', constitution: '平和质', points: 3200, streak: 52, status: 'active', last_active: '刚刚', created_at: '2025-12-01', total_diet_records: 145, total_weight_records: 48 },
  { id: 'u2', name: '张三', email: 'zhangsan@demo.com', avatar_emoji: '🏃', role: 'employee', tenant_id: '1', tenant_name: '示例科技公司', constitution: '气虚质', points: 2450, streak: 45, status: 'active', last_active: '10分钟前', created_at: '2025-12-05', total_diet_records: 128, total_weight_records: 42 },
  { id: 'u3', name: '李四', email: 'lisi@demo.com', avatar_emoji: '💪', role: 'employee', tenant_id: '1', tenant_name: '示例科技公司', constitution: '痰湿质', points: 2180, streak: 38, status: 'active', last_active: '1小时前', created_at: '2025-12-10', total_diet_records: 98, total_weight_records: 35 },
  { id: 'u4', name: '李HR', email: 'hr@health.com', avatar_emoji: '👩‍💼', role: 'hr_admin', tenant_id: '2', tenant_name: '健康药业集团', constitution: '平和质', points: 5100, streak: 60, status: 'active', last_active: '5分钟前', created_at: '2025-10-15', total_diet_records: 200, total_weight_records: 55 },
  { id: 'u5', name: '陈医生', email: 'chen@health.com', avatar_emoji: '👨‍⚕️', role: 'employee', tenant_id: '2', tenant_name: '健康药业集团', constitution: '阴虚质', points: 4800, streak: 55, status: 'active', last_active: '30分钟前', created_at: '2025-10-20', total_diet_records: 180, total_weight_records: 50 },
  { id: 'u6', name: '张总', email: 'zhang@green.com', avatar_emoji: '🏋️', role: 'hr_admin', tenant_id: '3', tenant_name: '绿动健身连锁', constitution: '湿热质', points: 1200, streak: 20, status: 'active', last_active: '2小时前', created_at: '2026-01-20', total_diet_records: 55, total_weight_records: 20 },
  { id: 'u7', name: '小明', email: 'xiaoming@gmail.com', avatar_emoji: '🎮', role: 'employee', tenant_id: null, tenant_name: null, constitution: '气郁质', points: 680, streak: 12, status: 'active', last_active: '3小时前', created_at: '2026-03-01', total_diet_records: 30, total_weight_records: 10 },
  { id: 'u8', name: '小红', email: 'xiaohong@qq.com', avatar_emoji: '🌸', role: 'employee', tenant_id: null, tenant_name: null, constitution: '血瘀质', points: 450, streak: 8, status: 'inactive', last_active: '3天前', created_at: '2026-02-14', total_diet_records: 15, total_weight_records: 5 },
  { id: 'u9', name: '违规用户', email: 'spammer@test.com', avatar_emoji: '🚫', role: 'employee', tenant_id: null, tenant_name: null, constitution: null, points: 0, streak: 0, status: 'banned', last_active: '1周前', created_at: '2026-03-10', total_diet_records: 0, total_weight_records: 0 },
  { id: 'u10', name: '周总监', email: 'zhou@fintech.com', avatar_emoji: '💼', role: 'hr_admin', tenant_id: '8', tenant_name: '金融创新科技', constitution: '痰湿质', points: 6800, streak: 65, status: 'active', last_active: '刚刚', created_at: '2025-11-01', total_diet_records: 220, total_weight_records: 60 },
  { id: 'u11', name: '超级管理员', email: 'super@bencao.app', avatar_emoji: '👑', role: 'platform_admin', tenant_id: null, tenant_name: null, constitution: null, points: 0, streak: 0, status: 'active', last_active: '刚刚', created_at: '2025-01-01', total_diet_records: 0, total_weight_records: 0 },
]

function RoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { color: string; label: string }> = {
    platform_admin: { color: '#EF4444', label: '平台管理员' },
    hr_admin: { color: '#8B5CF6', label: 'HR管理' },
    employee: { color: '#3B82F6', label: '员工' },
  }
  const c = config[role]
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${c.color}15`, color: c.color }}>
      {c.label}
    </span>
  )
}

function UserStatusBadge({ status }: { status: DemoUser['status'] }) {
  const config = {
    active: { color: '#10B981', label: '正常' },
    inactive: { color: '#6B7280', label: '不活跃' },
    banned: { color: '#EF4444', label: '已封禁' },
  }
  const c = config[status]
  return <span className="text-[9px] font-bold" style={{ color: c.color }}>{c.label}</span>
}

export default function AdminUsersTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null)

  const filtered = DEMO_USERS.filter(u => {
    const matchSearch = !searchTerm || u.name.includes(searchTerm) || u.email.includes(searchTerm)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const roleCounts = {
    total: DEMO_USERS.length,
    platform_admin: DEMO_USERS.filter(u => u.role === 'platform_admin').length,
    hr_admin: DEMO_USERS.filter(u => u.role === 'hr_admin').length,
    employee: DEMO_USERS.filter(u => u.role === 'employee').length,
    active: DEMO_USERS.filter(u => u.status === 'active').length,
    banned: DEMO_USERS.filter(u => u.status === 'banned').length,
  }

  return (
    <div className="space-y-3">
      {/* 概览 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#3B82F6' }}>{roleCounts.total}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>总用户</p>
        </div>
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#10B981' }}>{roleCounts.active}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>活跃用户</p>
        </div>
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#EF4444' }}>{roleCounts.banned}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>已封禁</p>
        </div>
      </div>

      {/* 搜索 */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <Search size={14} style={{ color: 'var(--text-secondary)' }} />
        <input
          type="text" placeholder="搜索用户名或邮箱..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {/* 角色筛选 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {([
          { key: 'all', label: '全部' },
          { key: 'platform_admin', label: `平台管理 (${roleCounts.platform_admin})` },
          { key: 'hr_admin', label: `HR管理 (${roleCounts.hr_admin})` },
          { key: 'employee', label: `员工 (${roleCounts.employee})` },
        ]).map(opt => (
          <button key={opt.key} onClick={() => setRoleFilter(opt.key)}
            className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ background: roleFilter === opt.key ? '#EF4444' : 'var(--bg-card)', color: roleFilter === opt.key ? '#FFF' : 'var(--text-secondary)', border: roleFilter === opt.key ? 'none' : '1px solid var(--border)' }}
          >{opt.label}</button>
        ))}
      </div>

      {/* 用户列表 */}
      <div className="text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
        共 {filtered.length} 名用户
      </div>
      {filtered.map(user => {
        const constInfo = user.constitution ? CONSTITUTION_LABELS[user.constitution] : null
        return (
          <div key={user.id} className="card p-3 flex items-center gap-3" style={{ cursor: 'pointer' }}
            onClick={() => setSelectedUser(user)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: `${user.role === 'platform_admin' ? '#EF4444' : user.role === 'hr_admin' ? '#8B5CF6' : '#3B82F6'}15` }}>
              {user.avatar_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                <RoleBadge role={user.role} />
                <UserStatusBadge status={user.status} />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Mail size={9} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                {user.tenant_name && (
                  <span className="text-[9px] flex items-center gap-0.5" style={{ color: '#8B5CF6' }}>
                    <Building2 size={8} /> {user.tenant_name}
                  </span>
                )}
                {user.constitution && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${constInfo?.color}15`, color: constInfo?.color }}>
                    {user.constitution}
                  </span>
                )}
                {user.points > 0 && (
                  <span className="text-[9px] flex items-center gap-0.5" style={{ color: '#F59E0B' }}>
                    <Star size={8} /> {user.points}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
          </div>
        )
      })}

      {/* ── 用户详情弹窗 ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-t-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedUser.avatar_emoji}</span>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selectedUser.name}</h3>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
            </div>

            {/* 基本信息卡片 */}
            <div className="card p-3 mb-3">
              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>账户信息</h4>
              {[
                { label: '角色', value: selectedUser.role === 'platform_admin' ? '👑 平台管理员' : selectedUser.role === 'hr_admin' ? 'HR管理员' : '普通员工' },
                { label: '所属企业', value: selectedUser.tenant_name || '无（个人用户）' },
                { label: '体质', value: selectedUser.constitution || '未测评' },
                { label: '状态', value: selectedUser.status === 'active' ? '✅ 正常' : selectedUser.status === 'inactive' ? '⏸️ 不活跃' : '🚫 已封禁' },
                { label: '注册时间', value: selectedUser.created_at },
                { label: '最后活跃', value: selectedUser.last_active },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* 活动数据 */}
            <div className="card p-3 mb-3">
              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>活动数据</h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-sm font-black" style={{ color: '#F59E0B' }}>{selectedUser.points}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>积分</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-sm font-black" style={{ color: '#EF4444' }}>{selectedUser.streak}天</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>连续</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-sm font-black" style={{ color: '#10B981' }}>{selectedUser.total_diet_records}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>饮食</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-sm font-black" style={{ color: '#3B82F6' }}>{selectedUser.total_weight_records}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>体重</p>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>管理操作</h4>
              {selectedUser.role !== 'platform_admin' && (
                <>
                  {/* 角色变更 */}
                  <div className="card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={14} style={{ color: '#8B5CF6' }} />
                      <div>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>角色变更</span>
                        <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>当前: {selectedUser.role === 'hr_admin' ? 'HR管理' : '员工'}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                      {selectedUser.role === 'hr_admin' ? '降为员工' : '升为HR'}
                    </button>
                  </div>
                  {/* 封禁/解封 */}
                  <div className="card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ToggleLeft size={14} style={{ color: selectedUser.status === 'banned' ? '#10B981' : '#EF4444' }} />
                      <div>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          {selectedUser.status === 'banned' ? '解除封禁' : '封禁用户'}
                        </span>
                        <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
                          {selectedUser.status === 'banned' ? '恢复用户正常使用' : '禁止用户登录和使用'}
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                      style={{ background: selectedUser.status === 'banned' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selectedUser.status === 'banned' ? '#10B981' : '#EF4444' }}>
                      {selectedUser.status === 'banned' ? '解封' : '封禁'}
                    </button>
                  </div>
                  {/* 企业绑定 */}
                  <div className="card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} style={{ color: '#3B82F6' }} />
                      <div>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>企业绑定</span>
                        <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
                          当前: {selectedUser.tenant_name || '无'}
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                      {selectedUser.tenant_id ? '变更' : '绑定'}
                    </button>
                  </div>
                </>
              )}
              {selectedUser.role === 'platform_admin' && (
                <div className="card p-3 text-center" style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>⚠️ 平台管理员账户不支持角色变更和封禁操作</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
