'use client'

// ═══════════════════════════════════════════════════════════
// PhysiologicalRipple - 全屏生理反馈层
// 心跳屏幕缩放 / 隧道视觉 / 压力暗边 / 肾上腺素闪光
// ═══════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react'
import type { RippleEffect } from './FeedbackSystem'

interface RippleLayerProps {
  ripples: RippleEffect[]
}

// 单个涟漪效果
function RippleOverlay({ ripple }: { ripple: RippleEffect }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    let frame: number

    const animate = () => {
      const elapsed = Date.now() - start
      const p = Math.min(elapsed / ripple.duration, 1)
      setProgress(p)
      if (p < 1) {
        frame = requestAnimationFrame(animate)
      }
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [ripple.duration])

  if (progress >= 1) return null

  // 进入+退出缓动
  const fadeIn = Math.min(progress / 0.15, 1)
  const fadeOut = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1
  const opacity = fadeIn * fadeOut * ripple.intensity

  return (
    <div className="pointer-events-none" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 90,
    }}>
      {renderEffect(ripple.type, opacity, progress, ripple.color)}
    </div>
  )
}

function renderEffect(
  type: RippleEffect['type'],
  opacity: number,
  progress: number,
  color?: string
) {
  switch (type) {
    case 'heartbeat':
      // 屏幕微缩放模拟心跳
      const beatScale = 1 + Math.sin(progress * Math.PI * 4) * 0.008 * (1 - progress)
      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${beatScale})`,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(239,68,68,${opacity * 0.3}) 100%)`,
        }} />
      )

    case 'tunnel-vision':
      // 隧道视觉暗角
      const tunnelOpacity = opacity * (1 - progress * 0.5)
      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${tunnelOpacity * 0.7}) 100%)`,
        }} />
      )

    case 'stress-darken':
      // 压力暗边
      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          boxShadow: `inset 0 0 ${100 * opacity}px ${50 * opacity}px ${color || 'rgba(0,0,0,0.5)'}`,
        }} />
      )

    case 'adrenaline-flash':
      // 肾上腺素白闪
      const flashOpacity = progress < 0.1 ? opacity * (progress / 0.1) : opacity * (1 - (progress - 0.1) / 0.9)
      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(255,255,255,${flashOpacity * 0.15})`,
        }} />
      )

    case 'inflammation-glow':
      // 炎症红色光晕
      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, rgba(239,68,68,${opacity * 0.1}) 0%, rgba(239,68,68,${opacity * 0.2}) 50%, transparent 100%)`,
        }} />
      )

    default:
      return null
  }
}

export default function PhysiologicalRippleLayer({ ripples }: RippleLayerProps) {
  if (ripples.length === 0) return null

  return (
    <>
      {ripples.map((ripple, i) => (
        <RippleOverlay key={`ripple-${i}-${ripple.type}`} ripple={ripple} />
      ))}
    </>
  )
}
