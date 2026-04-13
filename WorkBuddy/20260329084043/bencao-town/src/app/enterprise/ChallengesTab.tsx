'use client'

import { useState } from 'react'
import {
  Users, Trophy, Plus, Play, Pause, CheckCircle2, Clock,
  Zap, Calendar, ChevronRight, X, Edit3,
} from 'lucide-react'
import type { ChallengeStatus, ChallengeTemplateId } from '@/lib/enterprise/types'
import { CHALLENGE_TEMPLATES } from '@/lib/enterprise/constants'

interface DemoChallenge {
  id: string; template_id: ChallengeTemplateId; title: string; description: string
  status: ChallengeStatus; start_date: string; end_date: string
  current_participants: number; max_participants?: number
  rewards: { points_1st: number; coins_bonus: number; badges: string[]; corporate_rewards?: string }
}

const CHALLENGES: DemoChallenge[] = [
  { id: 'ch1', template_id: 'fat-loss-21', title: '21天减脂训练营（第3期）', description: '通过饮食记录、运动打卡和AI体质适配饮食，21天养成健康减脂习惯', status: 'in_progress', start_date: '2026-04-01', end_date: '2026-04-21', current_participants: 67, max_participants: 100, rewards: { points_1st: 500, coins_bonus: 200, badges: ['减脂达人'], corporate_rewards: '额外1天健康假' } },
  { id: 'ch2', template_id: 'steps-30', title: '30天万步挑战', description: '每天完成10000步，培养运动习惯', status: 'published', start_date: '2026-04-15', end_date: '2026-05-15', current_participants: 34, max_participants: 200, rewards: { points_1st: 400, coins_bonus: 150, badges: ['万步达人'], corporate_rewards: '运动装备优惠券' } },
  { id: 'ch3', template_id: 'ultimate-department', title: '部门终极PK赛（Q2）', description: '部门间综合健康PK，多维度评分', status: 'in_progress', start_date: '2026-04-01', end_date: '2026-04-28', current_participants: 120, rewards: { points_1st: 800, coins_bonus: 500, badges: ['最强部门'], corporate_rewards: '部门团建基金 ¥3000' } },
  { id: 'ch4', template_id: 'tcm-wellness-week', title: '中医养生体验周', description: '以中医体质辨识为核心的养生体验', status: 'completed', start_date: '2026-03-15', end_date: '2026-03-21', current_participants: 72, max_participants: 80, rewards: { points_1st: 200, coins_bonus: 80, badges: ['养生达人'], corporate_rewards: '中医体验券' } },
  { id: 'ch5', template_id: 'diet-consistency-14', title: '14天饮食自律挑战', description: '连续记录每餐饮食，AI分析营养均衡度', status: 'draft', start_date: '2026-05-01', end_date: '2026-05-14', current_participants: 0, max_participants: 60, rewards: { points_1st: 300, coins_bonus: 120, badges: ['饮食自律王'], corporate_rewards: '药膳食材礼包' } },
]

function getStatusConfig(status: ChallengeStatus) {
  const m: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: '草稿', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
    published: { label: '报名中', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    in_progress: { label: '进行中', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    paused: { label: '已暂停', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    completed: { label: '已完成', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  }
  return m[status] || m.draft
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function ChallengesTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)

  const filtered = CHALLENGES.filter(c => statusFilter === 'all' || c.status === statusFilter)
  const inProgress = CHALLENGES.filter(c => c.status === 'in_progress').length
  const totalParticipants = CHALLENGES.reduce((s, c) => s + c.current_participants, 0)

  return (
    <div className="space-y-3">
      {/* 统计 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#10B981' }}>{inProgress}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>进行中</p>
        </div>
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#3B82F6' }}>{CHALLENGES.length}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>总挑战赛</p>
        </div>
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#F59E0B' }}>{totalParticipants}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>总参与人次</p>
        </div>
      </div>

      {/* 创建按钮 */}
      <button onClick={() => setShowCreate(true)}
        className="card w-full p-3 flex items-center gap-3 hover:border-[var(--gold)] transition-all"
        style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(245,158,11,0.03))', border: '1px dashed rgba(255,215,0,0.3)' }}>
        <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/15 flex items-center justify-center">
          <Plus size={18} style={{ color: 'var(--gold)' }} />
        </div>
        <div className="flex-1 text-left">
          <span className="text-sm font-bold" style={{ color: 'var(--gold)' }}>创建新挑战赛</span>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>从5个预设模板中选择</p>
        </div>
      </button>

      {/* 状态筛选 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {['all', 'in_progress', 'published', 'draft', 'completed'].map(s => {
          const labelMap: Record<string, string> = { all: '全部', in_progress: '进行中', published: '报名中', draft: '草稿', completed: '已完成' }
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
              style={{ background: statusFilter === s ? 'var(--gold)' : 'var(--bg-card)', color: statusFilter === s ? '#1A1A1A' : 'var(--text-secondary)', border: statusFilter === s ? 'none' : '1px solid var(--border)' }}
            >{labelMap[s]}</button>
          )
        })}
      </div>

      {/* 挑战赛列表 */}
      {filtered.map(ch => {
        const tpl = CHALLENGE_TEMPLATES[ch.template_id]
        const statusCfg = getStatusConfig(ch.status)
        const progress = ch.max_participants ? Math.round(ch.current_participants / ch.max_participants * 100) : 0

        return (
          <div key={ch.id} className="card p-3">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl">{tpl?.icon || '🏆'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{ch.title}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                    {statusCfg.label}
                  </span>
                </div>
                <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{ch.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(ch.start_date)} - {fmtDate(ch.end_date)}</span>
              <span className="flex items-center gap-1"><Users size={10} /> {ch.current_participants}人{ch.max_participants ? `/${ch.max_participants}` : ''}</span>
            </div>

            {/* 参与进度 */}
            {ch.status !== 'draft' && (
              <div className="mb-2">
                <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'var(--bg-card)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: statusCfg.color }} />
                </div>
              </div>
            )}

            {/* 奖励 & 操作 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[9px] flex items-center gap-0.5" style={{ color: '#F59E0B' }}>
                  <Zap size={8} /> 冠军+{ch.rewards.points_1st}分
                </span>
                {ch.rewards.corporate_rewards && (
                  <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>🎁 {ch.rewards.corporate_rewards}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {ch.status === 'draft' && (
                  <button className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: 'var(--gold)', color: '#1A1A1A' }}>
                    发布
                  </button>
                )}
                {ch.status === 'in_progress' && (
                  <button className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                    暂停
                  </button>
                )}
                {ch.status === 'published' && (
                  <button className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                    开始
                  </button>
                )}
                {(ch.status === 'draft' || ch.status === 'published') && (
                  <button className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                    <Edit3 size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* 创建挑战赛弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-[430px] max-h-[80vh] rounded-t-2xl overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
            <div className="sticky top-0 px-4 pt-4 pb-3 flex items-center justify-between" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>选择挑战赛模板</h2>
              <button onClick={() => setShowCreate(false)}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
            </div>
            <div className="p-4 space-y-3">
              {Object.values(CHALLENGE_TEMPLATES).map(tpl => (
                <button key={tpl.id} className="card w-full p-3 text-left flex items-center gap-3 hover:border-[var(--gold)] transition-all"
                  onClick={() => setShowCreate(false)}>
                  <span className="text-3xl">{tpl.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{tpl.name}</p>
                    <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{tpl.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>{tpl.duration_days}天</span>
                      <span className="text-[9px]" style={{ color: '#F59E0B' }}>冠军+{tpl.default_rewards.points_1st}分</span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
