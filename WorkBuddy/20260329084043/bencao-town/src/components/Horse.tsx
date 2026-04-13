'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore, HorseStyle, HorseMood } from '@/lib/store'
import { HORSE_EMOJI_MAP, HORSE_ACCESSORY_MAP, HORSE_IMAGE_MAP } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'
import { dataService } from '@/lib/data-service'

interface HorseProps {
  size?: 'sm' | 'md' | 'lg'
  showActions?: boolean
  showSpeech?: boolean
  speechText?: string
}

export default function Horse({ size = 'lg', showActions = true, showSpeech = true }: HorseProps) {
  const horse = useStore((s) => s.horse)
  const feedHorse = useStore((s) => s.feedHorse)
  const cleanHorse = useStore((s) => s.cleanHorse)
  const playWithHorse = useStore((s) => s.playWithHorse)
  const exerciseHorse = useStore((s) => s.exerciseHorse)
  const setHorseMood = useStore((s) => s.setHorseMood)
  const { t } = useTranslation()

  const [speech, setSpeech] = useState('')
  const [showBubble, setShowBubble] = useState(false)
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; y: number }[]>([])

  const sizeMap = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32' }
  const emoji = horse ? HORSE_EMOJI_MAP[horse.style] : '🐴'
  const image = horse ? HORSE_IMAGE_MAP[horse.style] : '/images/horses/horse-golden.png'
  const accessory = horse ? HORSE_ACCESSORY_MAP[horse.style] : '⭐'

  // 自动恢复idle情绪
  useEffect(() => {
    if (!horse || horse.mood === 'idle') return
    const timer = setTimeout(() => setHorseMood('idle'), 3000)
    return () => clearTimeout(timer)
  }, [horse?.mood, setHorseMood])

  const showSpeechBubble = useCallback((text: string) => {
    setSpeech(text)
    setShowBubble(true)
    setTimeout(() => setShowBubble(false), 2500)
  }, [])

  const spawnParticles = useCallback((emoji: string) => {
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      emoji,
      x: Math.random() * 120 - 60,
      y: -Math.random() * 40 - 20,
    }))
    setParticles((prev) => [...prev, ...newParticles])
    setTimeout(() => setParticles([]), 1200)
  }, [])

  const handleFeed = () => {
    feedHorse()
    dataService.horse.feed() // 持久化到打卡记录 + 云端
    showSpeechBubble(t.horse.speechFeed)
    spawnParticles('🌾')
  }

  const handleClean = () => {
    cleanHorse()
    dataService.horse.clean()
    showSpeechBubble(t.horse.speechClean)
    spawnParticles('✨')
  }

  const handlePlay = () => {
    playWithHorse()
    dataService.horse.play()
    showSpeechBubble(t.horse.speechPlay)
    spawnParticles('💖')
  }

  const handleExercise = () => {
    exerciseHorse()
    dataService.horse.exercise()
    showSpeechBubble(t.horse.speechExercise)
    spawnParticles('💪')
  }

  if (!horse) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className={`${sizeMap[size]} animate-bounce`}>
          <img
            src="/images/horses/horse-golden.png"
            alt="未领养"
            className="w-full h-full object-contain opacity-50"
          />
        </div>
        <p className="text-[var(--text-secondary)] text-sm">{t.horse.notAdopted}</p>
      </div>
    )
  }

  const moodAnimation: Record<HorseMood, string> = {
    idle: 'animate-[horseIdle_2.5s_ease-in-out_infinite]',
    happy: 'animate-[horseHappy_0.6s_cubic-bezier(0.34,1.56,0.64,1)_3]',
    eating: 'animate-[horseEating_0.8s_ease-in-out_4]',
    playing: 'animate-[horsePlaying_1.2s_ease-in-out_infinite]',
    sleeping: 'animate-[horseSleeping_3s_ease-in-out_infinite]',
    sad: 'animate-[horseSad_1.5s_ease-in-out_infinite]',
    excited: 'animate-[horseExcited_0.5s_ease-in-out_5]',
    content: 'animate-[horseContent_2s_ease-in-out_infinite]',
  }

  return (
    <div className="flex flex-col items-center">
      {/* 马匹名称和等级 */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs bg-[var(--gold)]/20 text-[var(--gold)] px-2 py-0.5 rounded-full font-bold">
            {horse.level}
          </span>
          <span className="text-[var(--text-primary)] font-bold">{horse.name}</span>
          <span className="text-sm">{accessory}</span>
        </div>
      </div>

      {/* 马匹展示区 */}
      <div className="relative">
        <div className={`${sizeMap[size]} ${moodAnimation[horse.mood]} select-none cursor-pointer
          transition-transform active:scale-90`}
          onClick={() => showSpeechBubble(t.horse.speechPoke)}
        >
          <img
            src={image}
            alt={horse.style}
            className="w-full h-full object-contain"
          />
        </div>

        {/* 对话气泡 */}
        {showSpeech && showBubble && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 animate-[fadeIn_0.3s_ease] whitespace-nowrap">
            <div className="bg-white/95 text-gray-800 text-xs px-3 py-1.5 rounded-xl shadow-lg font-medium">
              {speech}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/95 rotate-45" />
            </div>
          </div>
        )}

        {/* 粒子特效 */}
        {particles.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute left-1/2 top-1/2 text-lg animate-[particleFloat_1s_ease-out_forwards]"
                style={{
                  transform: `translate(${p.x}px, ${p.y}px)`,
                  opacity: 0,
                  animation: `particleFloat 1s ease-out forwards`,
                }}
              >
                {p.emoji}
              </span>
            ))}
          </div>
        )}

        {/* 状态条 */}
        <div className="mt-2 w-full max-w-[200px] space-y-1">
          {[
            { label: t.horse.statSatiety, value: horse.satiety, color: 'bg-orange-400' },
            { label: t.horse.statClean, value: horse.clean, color: 'bg-blue-400' },
            { label: t.horse.statJoy, value: horse.joy, color: 'bg-pink-400' },
            { label: t.horse.statFitness, value: horse.fitness, color: 'bg-green-400' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-1.5">
              <span className="text-[9px] text-[var(--text-secondary)] w-6">{stat.label}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                  style={{ width: `${stat.value}%` }}
                />
              </div>
              <span className="text-[9px] text-[var(--text-secondary)] w-6 text-right">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷操作按钮 */}
      {showActions && (
        <div className="grid grid-cols-4 gap-3 mt-4 w-full max-w-[320px]">
          {[
            { label: t.horse.actionFeed, icon: '🌾', action: handleFeed },
            { label: t.horse.actionClean, icon: '✨', action: handleClean },
            { label: t.horse.actionPlay, icon: '💖', action: handlePlay },
            { label: t.horse.actionExercise, icon: '💪', action: handleExercise },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl
                bg-white/5 hover:bg-white/10 active:scale-95
                border border-white/10 hover:border-[var(--gold)]/30
                transition-all duration-200"
            >
              <span className="text-xl">{btn.icon}</span>
              <span className="text-[10px] text-[var(--text-secondary)]">{btn.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
