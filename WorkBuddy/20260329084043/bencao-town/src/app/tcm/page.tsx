'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { BUILDINGS } from '@/lib/constants'
import dynamic from 'next/dynamic'
import { ChevronRight, Stethoscope, Sparkles } from 'lucide-react'

// 懒加载子视图 — 按需加载，减少初始包体积
const SyndromeView = dynamic(() => import('@/components/tcm/SyndromeView'), { ssr: false })
const AiDiagnosisView = dynamic(() => import('@/components/tcm/AiDiagnosisView'), { ssr: false })
const BuildingDetailView = dynamic(() => import('@/components/tcm/BuildingDetailView'), { ssr: false })

export default function TCMPage() {
  const { constitution, horse } = useStore()
  const { t } = useTranslation()
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [showSyndromeList, setShowSyndromeList] = useState(false)
  const [showAiDiagnosis, setShowAiDiagnosis] = useState(false)

  const userConstitution = constitution || '平和质'

  // ─── 证型知识视图 ───
  if (showSyndromeList) {
    return <SyndromeView onBack={() => setShowSyndromeList(false)} />
  }

  // ─── 智能辨证视图 ───
  if (showAiDiagnosis) {
    return <AiDiagnosisView onBack={() => setShowAiDiagnosis(false)} />
  }

  // ─── 建筑详情视图 ───
  if (selectedBuilding) {
    return (
      <BuildingDetailView
        buildingName={selectedBuilding}
        userConstitution={userConstitution}
        onBack={() => setSelectedBuilding(null)}
      />
    )
  }

  // ─── 建筑列表视图（默认） ───
  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t.tcm.title}</h1>
      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
        探索7大养生建筑，解锁知识卡片
      </p>

      {/* 证型知识入口 */}
      <button
        onClick={() => setShowSyndromeList(true)}
        className="card w-full text-left flex items-center gap-4 mb-3 bg-gradient-to-r from-[var(--gold)]/10 to-[var(--green)]/5"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--gold)]/20">
          <Stethoscope size={24} style={{ color: 'var(--gold)' }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: 'var(--gold)' }}>证型知识</span>
            <span className="tag bg-[var(--gold)]/20 text-[var(--gold)]">15种证型</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            气血津液辨证 · 脏腑辨证 · 六经辨证
          </p>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
      </button>

      {/* 智能辨证入口 */}
      <button
        onClick={() => setShowAiDiagnosis(true)}
        className="card w-full text-left flex items-center gap-4 mb-4"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--green)]/20">
          <Sparkles size={24} style={{ color: 'var(--green)' }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: 'var(--green)' }}>智能辨证</span>
            <span className="tag bg-[var(--green)]/20 text-[var(--green)]">AI辅助</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            描述症状，AI自动诊断证型 + 调理建议
          </p>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
      </button>

      <div className="space-y-3">
        {BUILDINGS.map((b) => {
          const isLocked = b.unlock === '壮年马' && horse?.level !== '壮年马' && horse?.level !== '千里马' && horse?.level !== '神驹'
          const isLocked2 = b.unlock === '少年马' && horse?.level === '小马驹'
          const locked = isLocked || isLocked2

          return (
            <button
              key={b.id}
              onClick={() => !locked && setSelectedBuilding(b.name)}
              disabled={locked}
              className={`card w-full text-left flex items-center gap-4 ${
                locked ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--gold)] active:scale-[0.98]'
              } transition-all`}
            >
              <span className="text-4xl">{b.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
                  {locked && <span className="tag bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]">🔒 {b.unlock}解锁</span>}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{b.desc}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs" style={{ color: 'var(--gold)' }}>适配{b.constitution}</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.seasonBonus}</span>
                </div>
              </div>
              {!locked && <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
