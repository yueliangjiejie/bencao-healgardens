'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, LayoutDashboard, Users, Trophy, Settings } from 'lucide-react'
import DashboardTab from './DashboardTab'
import EmployeesTab from './EmployeesTab'
import ChallengesTab from './ChallengesTab'
import SettingsTab from './SettingsTab'

type TabId = 'dashboard' | 'employees' | 'challenges' | 'settings'
const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[] = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'employees', label: '员工', icon: Users },
  { id: 'challenges', label: '挑战赛', icon: Trophy },
  { id: 'settings', label: '设置', icon: Settings },
]

export default function EnterprisePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />
      case 'employees': return <EmployeesTab />
      case 'challenges': return <ChallengesTab />
      case 'settings': return <SettingsTab />
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
          <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>企业管理中心</h1>
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
                  background: isActive ? 'var(--gold)' : 'transparent',
                  color: isActive ? '#1A1A1A' : 'var(--text-secondary)',
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
