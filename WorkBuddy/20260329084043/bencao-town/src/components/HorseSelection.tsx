'use client'

import { useState } from 'react'
import { Check, Star } from 'lucide-react'

export type HorseStyle = 'golden' | 'purple' | 'brown' | 'pink'

interface HorseStyleConfig {
  id: HorseStyle
  name: string
  nameEn: string
  emoji: string
  image: string
  description: string
  descriptionEn: string
  accessory: string
  trait: string
  bonus: string
}

const HORSE_STYLES: HorseStyleConfig[] = [
  {
    id: 'golden',
    name: '金鬃骏马',
    nameEn: 'Golden Mane',
    emoji: '🐴',
    image: '/images/horses/horse-golden.png',
    description: '闪耀的金色鬃毛，象征光明与希望',
    descriptionEn: 'Shimmering golden mane, symbolizing light and hope',
    accessory: '星星配件',
    trait: '活力四射',
    bonus: '运动积分 +20%',
  },
  {
    id: 'purple',
    name: '蓝紫灵马',
    nameEn: 'Purple Spirit',
    emoji: '🦄',
    image: '/images/horses/horse-purple.png',
    description: '神秘的蓝紫光泽，拥有治愈之力',
    descriptionEn: 'Mysterious blue-purple glow with healing power',
    accessory: '葫芦配件',
    trait: '灵气逼人',
    bonus: '体质评估精度 +15%',
  },
  {
    id: 'brown',
    name: '赤棕壮马',
    nameEn: 'Brown Strength',
    emoji: '🐎',
    image: '/images/horses/horse-brown.png',
    description: '坚实的棕色身躯，力量与稳健的象征',
    descriptionEn: 'Solid brown body, symbolizing strength and stability',
    accessory: '金元宝配件',
    trait: '厚德载物',
    bonus: '商城折扣 -10%',
  },
  {
    id: 'pink',
    name: '粉樱萌马',
    nameEn: 'Pink Cherry',
    emoji: '🎀',
    image: '/images/horses/horse-pink.png',
    description: '粉色的樱花色调，带来温暖与幸运',
    descriptionEn: 'Pink cherry blossom tone, bringing warmth and luck',
    accessory: '锦鲤配件',
    trait: '萌动人心',
    bonus: '社交积分 +25%',
  },
]

interface HorseSelectionProps {
  currentStyle?: HorseStyle
  onSelect: (style: HorseStyle) => void
  isZh?: boolean
}

export default function HorseSelection({ currentStyle = 'golden', onSelect, isZh = true }: HorseSelectionProps) {
  const [selected, setSelected] = useState<HorseStyle>(currentStyle)
  const [confirmed, setConfirmed] = useState(false)

  const handleSelect = (style: HorseStyle) => {
    setSelected(style)
    setConfirmed(false)
  }

  const handleConfirm = () => {
    onSelect(selected)
    setConfirmed(true)
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {isZh ? '选择你的马' : 'Choose Your Horse'}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {isZh ? '不同的风格带来不同的特性与加成' : 'Different styles offer different traits and bonuses'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {HORSE_STYLES.map((horse) => (
          <button
            key={horse.id}
            onClick={() => handleSelect(horse.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-300
              ${
                selected === horse.id
                  ? 'border-[var(--gold)] bg-[var(--bg-secondary)] shadow-lg scale-105'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--gold-light)]'
              }
            `}
          >
            {/* 选中标记 */}
            {selected === horse.id && confirmed && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--gold)] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* 马匹预览 */}
            <div className="relative w-20 h-20 mx-auto mb-2">
              <img
                src={horse.image}
                alt={isZh ? horse.name : horse.nameEn}
                className={`w-full h-full object-contain transition-transform duration-300 ${
                  selected === horse.id ? 'scale-110' : ''
                }`}
              />
            </div>

            {/* 名称 */}
            <div className="text-sm font-bold text-[var(--text-primary)] mb-1">
              {isZh ? horse.name : horse.nameEn}
            </div>

            {/* 配件 */}
            <div className="text-xs text-[var(--text-secondary)] mb-2">
              {horse.accessory}
            </div>

            {/* 特质 */}
            <div className="text-xs font-semibold text-[var(--gold)] mb-1">
              <Star className="w-3 h-3 inline mr-1" />
              {horse.trait}
            </div>

            {/* 加成 */}
            <div className="text-xs text-[var(--green)] bg-[var(--bg-primary)] px-2 py-1 rounded">
              {horse.bonus}
            </div>
          </button>
        ))}
      </div>

      {/* 描述 */}
      {selected && (
        <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border)]">
          <div className="text-sm text-[var(--text-secondary)]">
            {isZh ? HORSE_STYLES.find((h) => h.id === selected)!.description : HORSE_STYLES.find((h) => h.id === selected)!.descriptionEn}
          </div>
        </div>
      )}

      {/* 确认按钮 */}
      <button
        onClick={handleConfirm}
        disabled={confirmed}
        className={`
          w-full py-3 rounded-lg font-bold transition-all duration-300
          ${
            confirmed
              ? 'bg-[var(--green)] text-white cursor-not-allowed'
              : 'bg-[var(--gold)] text-white hover:bg-[var(--gold-light)] active:scale-95'
          }
        `}
      >
        {confirmed ? (isZh ? '已确认' : 'Confirmed') : (isZh ? '确认选择' : 'Confirm Selection')}
      </button>
    </div>
  )
}
