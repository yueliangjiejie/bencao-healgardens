'use client'

import { useState } from 'react'
import { ArrowLeft, BookOpen, Star } from 'lucide-react'
import { BUILDINGS } from '@/lib/constants'
import { HEALTH_CARDS, CONSTITUTION_DATA } from '@/lib/health-cards'

interface Props {
  buildingName: string
  userConstitution: string
  onBack: () => void
}

export default function BuildingDetailView({ buildingName, userConstitution, onBack }: Props) {
  const [showCards, setShowCards] = useState(false)
  const [cardIndex, setCardIndex] = useState(0)

  const cards = HEALTH_CARDS[buildingName] || []
  const building = BUILDINGS.find((b) => b.name === buildingName)
  const currentCard = cards[cardIndex]

  // 养生评分
  const getHealthScore = (): number => {
    const data = CONSTITUTION_DATA[buildingName]
    if (!data) return 60
    const match = data[userConstitution]
    if (match) return match.score
    const scores = Object.values(data).map(d => d.score)
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 0.7)
  }

  const getConstitutionTips = (): string => {
    const data = CONSTITUTION_DATA[buildingName]
    if (!data) return '暂无适配建议'
    const match = data[userConstitution]
    return match ? match.tips : '根据自身体质选择适合的方案'
  }

  const score = getHealthScore()
  const tips = getConstitutionTips()

  return (
    <div className="fullscreen-panel">
      {/* 头部 */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b border-[var(--border)]"
        style={{ background: 'var(--bg-primary)' }}>
        <button onClick={onBack}>
          <ArrowLeft size={22} style={{ color: 'var(--text-primary)' }} />
        </button>
        <span className="text-2xl">{building?.emoji}</span>
        <div className="flex-1">
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{buildingName}</h2>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{building?.desc}</span>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>养生评分</p>
          <p className="text-lg font-bold" style={{ color: score >= 80 ? 'var(--green)' : 'var(--gold)' }}>{score}</p>
        </div>
      </div>

      {/* 体质适配提示 */}
      <div className="mx-4 mt-4 card bg-gradient-to-r from-[var(--gold)]/10 to-[var(--green)]/5">
        <div className="flex items-center gap-2 mb-1">
          <Star size={14} style={{ color: 'var(--gold)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>{userConstitution}适配建议</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{tips}</p>
      </div>

      {/* 知识卡片区域 */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: 'var(--gold)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>知识卡片</span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {cardIndex + 1} / {cards.length}
          </span>
        </div>

        {currentCard && (
          <div className="card mb-3 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">{currentCard.tag}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{currentCard.title}</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
              {currentCard.content}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCardIndex(Math.max(0, cardIndex - 1))}
            disabled={cardIndex === 0}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--bg-card)] border border-[var(--border)] disabled:opacity-30"
            style={{ color: 'var(--text-primary)' }}
          >
            上一张
          </button>
          <div className="flex gap-1">
            {cards.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === cardIndex ? 'bg-[var(--gold)] w-3' : 'bg-[var(--text-secondary)]/30'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setCardIndex(Math.min(cards.length - 1, cardIndex + 1))}
            disabled={cardIndex === cards.length - 1}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--bg-card)] border border-[var(--border)] disabled:opacity-30"
            style={{ color: 'var(--text-primary)' }}
          >
            下一张
          </button>
        </div>
      </div>

      {/* 全部卡片列表 */}
      <div className="px-4 mt-6 mb-8">
        <button
          onClick={() => setShowCards(!showCards)}
          className="w-full text-center text-sm font-bold py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]"
          style={{ color: 'var(--gold)' }}
        >
          {showCards ? '收起全部卡片' : `查看全部${cards.length}张卡片`}
        </button>

        {showCards && (
          <div className="space-y-2 mt-3 animate-fade-in">
            {cards.map((card, i) => (
              <button
                key={i}
                onClick={() => { setCardIndex(i); setShowCards(false) }}
                className={`card w-full text-left py-3 ${i === cardIndex ? 'border-[var(--gold)]' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">{card.tag}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{card.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
