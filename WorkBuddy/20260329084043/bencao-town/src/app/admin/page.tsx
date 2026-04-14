'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, CreditCard, BarChart3, Shield, BookOpen } from 'lucide-react'
import AdminTenantsTab from './AdminTenantsTab'
import AdminUsersTab from './AdminUsersTab'
import AdminSubscriptionsTab from './AdminSubscriptionsTab'
import AdminStatsTab from './AdminStatsTab'
import AdminKnowledgeTab from './AdminKnowledgeTab'

type TabId = 'tenants' | 'users' | 'subscriptions' | 'stats' | 'knowledge'
const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[] = [
  { id: 'tenants', label: '企业管理', icon: Building2 },
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'subscriptions', label: '订阅', icon: CreditCard },
  { id: 'stats', label: '全局统计', icon: BarChart3 },
  { id: 'knowledge', label: '知识库', icon: BookOpen },
]

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('tenants')

  const renderTab = () => {
    switch (activeTab) {
      case 'tenants': return <AdminTenantsTab />
      case 'users': return <AdminUsersTab />
      case 'subscriptions': return <AdminSubscriptionsTab />
      case 'stats': return <AdminStatsTab />
      case 'knowledge': return <AdminKnowledgeTab />
    }
  }

  return (
    <div className="min-h-screen pb-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 px-4 pt-3 pb-2" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.push('/settings')} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> 返回
          </button>
          <div className="flex items-center gap-1.5">
            <Shield size={14} style={{ color: '#EF4444' }} />
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>平台管理中心</h1>
          </div>
          <div className="w-12" />
        </div>
        {/* Tab Bar */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: isActive ? '#EF4444' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-3">
        {renderTab()}
      </div>
    </div>
  )
}
