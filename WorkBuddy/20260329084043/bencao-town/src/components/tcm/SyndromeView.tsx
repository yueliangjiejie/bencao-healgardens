'use client'

import { useState } from 'react'
import { SYNDROME_RULES } from '@/lib/syndrome-diagnosis-rules'
import { ArrowLeft, BookOpen, Star, Stethoscope } from 'lucide-react'

interface Props {
  onBack: () => void
}

export default function SyndromeView({ onBack }: Props) {
  const [selectedSyndrome, setSelectedSyndrome] = useState<string | null>(null)

  // 证型详情
  if (selectedSyndrome) {
    const syndrome = SYNDROME_RULES[selectedSyndrome]
    if (!syndrome) return null

    return (
      <div className="fullscreen-panel">
        <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
          <button onClick={() => setSelectedSyndrome(null)}>
            <ArrowLeft size={22} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{syndrome.name}</h2>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{syndrome.system}</span>
          </div>
          <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">{syndrome.code}</span>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} style={{ color: 'var(--gold)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>证型定义</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{syndrome.definition}</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>主症</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--gold)]/20 text-[var(--gold)]">
                {syndrome.primarySymptoms.length}项 · 必选{syndrome.primarySymptoms.filter(s => s.required).length}项
              </span>
            </div>
            <div className="space-y-2">
              {syndrome.primarySymptoms.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  {s.required && <span className="text-red-400 text-xs">★</span>}
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.symptom}</span>
                  <span className="text-xs ml-auto px-2 py-0.5 rounded-full bg-[var(--text-secondary)]/10" style={{ color: 'var(--text-secondary)' }}>
                    权重{(s.weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>次症</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--text-secondary)]/10" style={{ color: 'var(--text-secondary)' }}>
                {syndrome.secondarySymptoms.length}项
              </span>
            </div>
            <div className="space-y-2">
              {syndrome.secondarySymptoms.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.symptom}</span>
                  <span className="text-xs ml-auto px-2 py-0.5 rounded-full bg-[var(--text-secondary)]/10" style={{ color: 'var(--text-secondary)' }}>
                    权重{(s.weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>舌脉要点</span>
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>舌象：</span>
                {syndrome.tonguePulse.tongueDetail.tongueColor}·{syndrome.tonguePulse.tongueDetail.tongueShape}·{syndrome.tonguePulse.tongueDetail.coating}
                {syndrome.tonguePulse.tongueDetail.special && `（${syndrome.tonguePulse.tongueDetail.special}）`}
              </div>
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>脉象：</span>
                {syndrome.tonguePulse.pulse}
              </div>
              {syndrome.tonguePulse.luoDalunNote && (
                <div className="card bg-[var(--gold)]/5 border-[var(--gold)]/30 mt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Star size={12} style={{ color: 'var(--gold)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>罗大伦临床精要</span>
                  </div>
                  <p className="text-xs leading-relaxed">{syndrome.tonguePulse.luoDalunNote}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>调理建议</span>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold mb-1 block" style={{ color: 'var(--gold)' }}>食疗方案</span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{syndrome.careAdvice.diet}</p>
              </div>
              <div>
                <span className="text-xs font-bold mb-1 block" style={{ color: 'var(--gold)' }}>推荐方药</span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{syndrome.careAdvice.herbs}</p>
              </div>
              <div>
                <span className="text-xs font-bold mb-1 block" style={{ color: 'var(--gold)' }}>生活方式</span>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{syndrome.careAdvice.lifestyle}</p>
              </div>
              {syndrome.careAdvice.acupoints && (
                <div>
                  <span className="text-xs font-bold mb-1 block" style={{ color: 'var(--gold)' }}>穴位推荐</span>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{syndrome.careAdvice.acupoints}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-[var(--text-secondary)]/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>权威出处</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{syndrome.source}</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>关联体质</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {syndrome.constitutionMapping.map((c, i) => (
                <span key={i} className="tag bg-[var(--gold)]/15 text-[var(--gold)]">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 证型列表
  const syndromes = Object.values(SYNDROME_RULES)

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b border-[var(--border)] -mx-4 bg-[var(--bg-primary)]">
        <button onClick={onBack}>
          <ArrowLeft size={22} style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>证型知识</h2>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{syndromes.length}种基础证型</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {syndromes.map((s) => (
          <button
            key={s.code}
            onClick={() => setSelectedSyndrome(s.code)}
            className="card w-full text-left py-4 hover:border-[var(--gold)] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">{s.system}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
            </div>
            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{s.definition}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                主症{Math.ceil(s.diagnosticCriteria.minPrimary)}+项
              </span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-secondary)]/30" />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                次症{s.diagnosticCriteria.minSecondary}+项
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
