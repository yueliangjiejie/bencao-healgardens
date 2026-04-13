'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GameState } from '@/lib/physio-types'

interface Props {
  state: GameState
  children: React.ReactNode
}

// 情感化UI效果：根据生理状态修改全局视觉效果
export default function SomaticEffects({ state, children }: Props) {
  const [effects, setEffects] = useState({
    vignetteOpacity: 0,
    saturation: 100,
    screenShake: false,
    blur: 0,
    redTint: 0,
    contrast: 100,
  })

  useEffect(() => {
    const p = state.physiology
    const al = p.chronic.allostaticLoad

    // 隧道视觉（视野变暗）— 压力大时
    const vignetteOpacity = Math.max(0, Math.min(0.5, (al - 50) / 100))

    // 色彩饱和度 — SSRI副作用 / 抑郁状态
    let saturation = 100
    if (p.neural.cognitiveReserve < 30) saturation = 75
    if (p.neural.hpaRegulation < 25) saturation = 60

    // 屏幕抖动 — 心悸 / 脑震颤
    const screenShake = p.cardio.autonomicBalance < 25 || (p.neural.cognitiveReserve < 20 && Math.random() < 0.1)

    // 模糊 — 脑雾
    const blur = p.neural.cognitiveReserve < 35 ? Math.min(2, (35 - p.neural.cognitiveReserve) / 10) : 0

    // 红色滤镜 — 高血压 / 愤怒
    const redTint = p.cardio.bloodPressureLoad > 70 ? Math.min(0.1, (p.cardio.bloodPressureLoad - 70) / 200) : 0

    // 对比度 — 疲劳时降低
    const contrast = p.metabolic.mitochondrialHealth < 40 ? 90 : 100

    setEffects({ vignetteOpacity, saturation, screenShake, blur, redTint, contrast })
  }, [state])

  return (
    <div className="relative" style={{
      filter: `saturate(${effects.saturation}%) contrast(${effects.contrast}%)${effects.blur > 0 ? ` blur(${effects.blur}px)` : ''}`,
      transition: 'filter 1s ease-out',
    }}>
      {/* 屏幕抖动 */}
      {effects.screenShake && (
        <style>{`
          @keyframes somatic-shake {
            0%, 100% { transform: translateX(0) translateY(0); }
            25% { transform: translateX(-1px) translateY(0.5px); }
            50% { transform: translateX(1px) translateY(-0.5px); }
            75% { transform: translateX(-0.5px) translateY(1px); }
          }
        `}</style>
      )}

      {children}

      {/* 隧道视觉覆盖层 */}
      {effects.vignetteOpacity > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50" style={{
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${effects.vignetteOpacity}) 100%)`,
          transition: 'background 2s ease',
        }} />
      )}

      {/* 红色滤镜 */}
      {effects.redTint > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50" style={{
          background: `rgba(239, 68, 68, ${effects.redTint})`,
          transition: 'background 2s ease',
        }} />
      )}
    </div>
  )
}
