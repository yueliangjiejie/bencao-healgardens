'use client'

// ═══════════════════════════════════════════════════════════
// NumberDelta - 浮动数值动画组件
// 类似 Slay the Spire / Hades 的伤害/治疗飘字
// ═══════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from 'react'
import type { NumberDeltaConfig } from './FeedbackSystem'

interface NumberDeltaProps {
  config: NumberDeltaConfig
  onComplete: () => void
}

// 单个浮动数字
function FloatingDelta({ config, onComplete }: NumberDeltaProps) {
  const [progress, setProgress] = useState(0)
  const startTime = useRef(Date.now())
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const duration = config.duration
    const delay = config.delay

    const delayedStart = setTimeout(() => {
      startTime.current = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime.current
        const p = Math.min(elapsed / duration, 1)
        setProgress(p)

        if (p < 1) {
          frameRef.current = requestAnimationFrame(animate)
        } else {
          onComplete()
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(delayedStart)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [config.duration, config.delay, onComplete])

  // 计算轨迹
  const { x, y, opacity, scale } = getTrajectory(
    config.trajectory, progress, config.delta
  )

  const isNegative = config.delta < 0
  const sign = config.delta > 0 ? '+' : ''
  const isCritical = Math.abs(config.delta) >= 15

  return (
    <div
      className="pointer-events-none select-none"
      style={{
        position: 'fixed',
        left: `calc(50% + ${x}px)`,
        top: `calc(40% + ${y}px)`,
        transform: `scale(${scale})`,
        opacity,
        zIndex: 100,
        transition: 'none',
        filter: isCritical ? `drop-shadow(0 0 8px ${config.color})` : 'none',
      }}
    >
      {/* 主数值 */}
      <div className="flex items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: isCritical ? '28px' : '22px', fontWeight: 900, color: config.color }}>
          {config.icon} {sign}{config.delta}
        </span>
      </div>
      {/* 标签 */}
      <div className="text-center" style={{
        fontSize: '10px',
        color: config.color,
        opacity: 0.8,
        marginTop: '-2px',
        fontWeight: 700,
        letterSpacing: '1px',
      }}>
        {config.label}
      </div>

      {/* 暴击闪光 */}
      {isCritical && progress < 0.2 && (
        <div style={{
          position: 'absolute',
          inset: '-10px',
          background: `radial-gradient(circle, ${config.color}40 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'pulse 0.3s ease-out',
        }} />
      )}
    </div>
  )
}

// 轨迹计算
function getTrajectory(
  trajectory: NumberDeltaConfig['trajectory'],
  progress: number,
  delta: number
): { x: number; y: number; opacity: number; scale: number } {
  // 基础动画参数
  const easeOut = 1 - Math.pow(1 - progress, 3)
  const fadeOut = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1
  const popScale = progress < 0.15
    ? 0.5 + (progress / 0.15) * 0.8
    : progress < 0.3
      ? 1.3 - ((progress - 0.15) / 0.15) * 0.3
      : 1.0

  let x = 0
  let y = 0

  switch (trajectory) {
    case 'up':
      y = -easeOut * 60
      break
    case 'down':
      y = easeOut * 60
      break
    case 'left':
      x = -easeOut * 40
      y = -easeOut * 30
      break
    case 'right':
      x = easeOut * 40
      y = -easeOut * 30
      break
    case 'arc-left':
      x = -Math.sin(easeOut * Math.PI) * 50
      y = -easeOut * 50
      break
    case 'arc-right':
      x = Math.sin(easeOut * Math.PI) * 50
      y = -easeOut * 50
      break
  }

  // 正值向上偏移，负值向下
  if (trajectory === 'up' || trajectory === 'down') {
    y += delta > 0 ? -10 : 10
  }

  return {
    x,
    y,
    opacity: fadeOut,
    scale: popScale,
  }
}

// ─── 浮动动画容器 ───
interface NumberDeltaLayerProps {
  deltas: NumberDeltaConfig[]
  onClear: (index: number) => void
}

export default function NumberDeltaLayer({ deltas, onClear }: NumberDeltaLayerProps) {
  return (
    <>
      {/* 全局关键帧动画 */}
      <style jsx global>{`
        @keyframes delta-pop {
          0% { transform: scale(0.5); opacity: 0; }
          15% { transform: scale(1.3); opacity: 1; }
          30% { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        @keyframes critical-flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
      {deltas.map((delta, i) => (
        <FloatingDelta
          key={`delta-${i}-${delta.stat}-${delta.delta}`}
          config={delta}
          onComplete={() => onClear(i)}
        />
      ))}
    </>
  )
}
