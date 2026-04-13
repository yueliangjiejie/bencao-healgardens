'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PhysiologyState } from '@/lib/physio-types'

interface Props {
  physiology: PhysiologyState
  day: number
}

export default function HrvWaveform({ physiology, day }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [showBaseline, setShowBaseline] = useState(false)
  const [tooltip, setTooltip] = useState<string | null>(null)

  // HRV值映射（neural.hpaRegulation → HRV反比）
  const hrvValue = Math.max(15, Math.min(80, physiology.neural.hpaRegulation * 0.8 + 10))
  const rmssd = Math.round(hrvValue * 0.6 + Math.random() * 5)
  const sdnn = Math.round(hrvValue * 0.8 + Math.random() * 8)
  const lfHfRatio = (100 - physiology.neural.hpaRegulation) / 20

  // SomaticTranslation：将HRV数值转化为身体感受描述
  const getSomaticText = () => {
    if (hrvValue > 50) return '呼吸深长而均匀，肩颈放松，消化正常运作'
    if (hrvValue > 35) return '呼吸略浅，肩膀微耸，注意力开始涣散'
    if (hrvValue > 25) return '呼吸变浅变快，肩膀紧绷，消化暂停，口干'
    return '胸腔紧缩，下颌咬紧，视野轻微变窄，耳鸣感增强'
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    const width = canvas.width
    const height = canvas.height
    let offset = 0

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)'
      ctx.fillRect(0, 0, width, height)

      // 网格线
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.06)'
      ctx.lineWidth = 0.5
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // 健康基线（如果显示对比）
      if (showBaseline) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.25)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let x = 0; x < width; x++) {
          const t = (x + offset * 0.5) * 0.03
          const baseHrv = 55 // 健康基线
          const rrInterval = 60000 / 72 // 72bpm
          const variability = baseHrv * Math.sin(t) * 0.4
            + baseHrv * Math.sin(t * 2.7) * 0.2
            + baseHrv * Math.sin(t * 5.1) * 0.15
            + (Math.random() - 0.5) * 8
          const y = height / 2 + variability * (height / 200)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      // 当前HRV波形
      const waveColor = hrvValue > 40 ? '#22c55e' : hrvValue > 25 ? '#f59e0b' : '#ef4444'
      ctx.strokeStyle = waveColor
      ctx.lineWidth = 1.5
      ctx.shadowColor = waveColor
      ctx.shadowBlur = 4
      ctx.beginPath()

      const irregularity = (100 - hrvValue) / 100 // HRV越低，波形越规律（不健康）

      for (let x = 0; x < width; x++) {
        const t = (x + offset) * 0.025

        // 模拟RR间期序列（心跳间隔波动）
        const baselineRR = 60000 / (85 + (100 - physiology.cardio.autonomicBalance) * 0.3)
        const respiratorySinusArrhythmia = Math.sin(t * 0.8) * (hrvValue * 0.3) // 呼吸性窦性心律不齐
        const sympatheticVariation = Math.sin(t * 0.15) * (100 - physiology.neural.hpaRegulation) * 0.2
        const noise = (Math.random() - 0.5) * irregularity * 15

        // 早搏模拟（焦虑事件时）
        const prematureBeat = Math.random() < 0.02 && hrvValue < 30 ? (Math.random() - 0.5) * 25 : 0

        const totalVariation = respiratorySinusArrhythmia + sympatheticVariation + noise + prematureBeat
        const y = height / 2 + totalVariation * (height / 180)

        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      offset += 1.2
      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
    }
  }, [physiology, showBaseline, hrvValue])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white">📈 HRV波形</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBaseline(!showBaseline)}
            className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${
              showBaseline ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'
            }`}
          >
            {showBaseline ? '隐藏' : '对比'}基线
          </button>
        </div>
      </div>

      {/* 示波器显示区域 */}
      <div className="relative rounded-lg overflow-hidden" style={{ background: '#050508', border: '1px solid rgba(34,197,94,0.15)' }}>
        <canvas
          ref={canvasRef}
          width={320}
          height={100}
          className="w-full"
          style={{ imageRendering: 'auto' }}
        />

        {/* 扫描线效果 */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)'
          }}
        />

        {/* 叠加指标 */}
        <div className="absolute top-1 left-2 text-[8px] font-mono" style={{ color: hrvValue > 40 ? '#22c55e' : hrvValue > 25 ? '#f59e0b' : '#ef4444' }}>
          HRV: {Math.round(hrvValue)}ms
        </div>
        <div className="absolute top-1 right-2 text-[8px] font-mono text-gray-600">
          Day {day}
        </div>
      </div>

      {/* 次级指标 */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: 'RMSSD', value: `${rmssd}ms`, desc: '副交感活性' },
          { label: 'SDNN', value: `${sdnn}ms`, desc: '整体变异性' },
          { label: 'LF/HF', value: lfHfRatio.toFixed(1), desc: lfHfRatio > 3 ? '交感主导⚠️' : '平衡' },
        ].map(m => (
          <div key={m.label} className="text-center p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[9px] text-gray-500">{m.label}</p>
            <p className="text-xs font-bold text-white">{m.value}</p>
            <p className="text-[7px] text-gray-600">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* 身体感受翻译 */}
      <button
        onClick={() => setTooltip(tooltip ? null : getSomaticText())}
        className="w-full mt-2 p-2 rounded-lg text-left transition-colors"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[9px] text-cyan-400">🫀 点击感受当前身体状态</span>
        {tooltip && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-gray-300 mt-1 leading-relaxed"
          >
            {tooltip}
          </motion.p>
        )}
      </button>
    </motion.div>
  )
}
