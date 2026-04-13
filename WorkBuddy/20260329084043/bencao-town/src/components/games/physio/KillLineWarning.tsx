'use client'

// ═══════════════════════════════════════════════════════════
// KillLineWarning - 斩杀线警告系统（3阶段升级）
// amber(75-85): 琥珀色边框脉冲
// red(85-90): 红色闪烁 + 警报
// critical(90+): 紫黑滤镜 + 心跳
// ═══════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react'
import type { KillLineStage } from './FeedbackSystem'

interface KillLineWarningProps {
  stage: KillLineStage
  allostaticLoad: number
}

export default function KillLineWarning({ stage, allostaticLoad }: KillLineWarningProps) {
  const [pulsePhase, setPulsePhase] = useState(0)

  // 脉冲动画
  useEffect(() => {
    if (stage === 'safe') return
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 1) % 100)
    }, stage === 'critical' ? 200 : stage === 'red' ? 400 : 800)
    return () => clearInterval(interval)
  }, [stage])

  if (stage === 'safe') return null

  const pulseIntensity = Math.sin(pulsePhase / 100 * Math.PI * 2) * 0.5 + 0.5

  return (
    <>
      {/* 全局CSS关键帧 */}
      <style jsx global>{`
        @keyframes kill-line-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes kill-line-flash {
          0%, 100% { opacity: 0; }
          10% { opacity: 0.4; }
          20% { opacity: 0; }
          30% { opacity: 0.3; }
          40% { opacity: 0; }
        }
        @keyframes kill-line-critical {
          0%, 100% { opacity: 0.4; }
          25% { opacity: 0.7; }
          50% { opacity: 0.3; }
          75% { opacity: 0.6; }
        }
      `}</style>

      {/* 边框发光层 */}
      <div className="pointer-events-none" style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        ...getBorderStyle(stage, pulseIntensity),
      }} />

      {/* 紧急信息条 */}
      {(stage === 'amber' || stage === 'red' || stage === 'critical') && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 81,
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: stage === 'critical'
            ? 'linear-gradient(90deg, rgba(124,45,18,0.95), rgba(220,38,38,0.95), rgba(124,45,18,0.95))'
            : stage === 'red'
              ? 'linear-gradient(90deg, rgba(185,28,28,0.9), rgba(239,68,68,0.9), rgba(185,28,28,0.9))'
              : 'linear-gradient(90deg, rgba(120,53,15,0.85), rgba(245,158,11,0.85), rgba(120,53,15,0.85))',
          animation: stage === 'critical'
            ? 'kill-line-critical 1s infinite'
            : stage === 'red'
              ? 'kill-line-flash 2s infinite'
              : 'kill-line-pulse 2s infinite',
        }}>
          <span className="text-white text-xs font-black">
            {stage === 'critical' ? '💀 斩杀线临界' :
             stage === 'red' ? '🔴 生理系统告急' :
             '⚠️ 稳态负荷危险'}
          </span>
          <span className="text-white/80 text-xs font-bold">
            {allostaticLoad}/100
          </span>
          {stage === 'critical' && (
            <span className="text-yellow-300 text-[10px] font-bold animate-pulse">
              — 立即休息，否则不可逆！
            </span>
          )}
        </div>
      )}

      {/* 紫黑滤镜（仅critical阶段） */}
      {stage === 'critical' && (
        <div className="pointer-events-none" style={{
          position: 'fixed',
          inset: 0,
          zIndex: 79,
          background: `rgba(30, 10, 30, ${0.15 + pulseIntensity * 0.15})`,
          mixBlendMode: 'multiply',
        }} />
      )}
    </>
  )
}

function getBorderStyle(stage: KillLineStage, pulse: number) {
  switch (stage) {
    case 'amber':
      return {
        boxShadow: `inset 0 0 ${30 + pulse * 20}px rgba(245,158,11,${0.15 + pulse * 0.15})`,
      }
    case 'red':
      return {
        boxShadow: `inset 0 0 ${40 + pulse * 30}px rgba(239,68,68,${0.2 + pulse * 0.2})`,
      }
    case 'critical':
      return {
        boxShadow: `inset 0 0 ${60 + pulse * 40}px rgba(185,28,28,${0.3 + pulse * 0.25}), inset 0 0 ${20}px rgba(124,45,18,${0.2 + pulse * 0.15})`,
      }
    default:
      return {}
  }
}
