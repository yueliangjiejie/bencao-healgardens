'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as d3 from 'd3'
import { PhysiologyState } from '@/lib/physio-types'
import { calcAllostaticLoad } from '@/lib/physio-engine'

interface Props {
  physiology: PhysiologyState
  history?: PhysiologyState[]  // 过去7天的数据（残影）
  size?: number
}

// 六维指标：名称 + 提取函数（返回0-100）
const AXES = [
  { key: 'metabolic', label: '代谢', icon: '🔥', extract: (p: PhysiologyState) => 100 - p.metabolic.insulinSensitivity, inverse: false },
  { key: 'cardio', label: '心血管', icon: '❤️', extract: (p: PhysiologyState) => 100 - p.cardio.vascularElasticity, inverse: false },
  { key: 'immune', label: '免疫', icon: '🛡️', extract: (p: PhysiologyState) => p.immune.inflammation, inverse: false },
  { key: 'neural', label: '神经', icon: '🧠', extract: (p: PhysiologyState) => 100 - p.neural.hpaRegulation, inverse: false },
  { key: 'sleep', label: '睡眠', icon: '😴', extract: (p: PhysiologyState) => p.chronic.sleepPressure, inverse: false },
  { key: 'oxidative', label: '氧化应激', icon: '⚡', extract: (p: PhysiologyState) => p.chronic.oxidativeStress, inverse: false },
]

// 阈值线
const THRESHOLD = 60
const DANGER = 75

export default function AllostaticRadar({ physiology, history = [], size = 280 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    drawRadar()
  }, [physiology, history, size])

  const allostaticLoad = calcAllostaticLoad(physiology)

  // 获取颜色
  const getColor = (val: number) => {
    if (val < 30) return 'rgba(34, 197, 94, 0.3)'
    if (val < 50) return 'rgba(245, 158, 11, 0.3)'
    if (val < 70) return 'rgba(239, 68, 68, 0.3)'
    return 'rgba(220, 38, 38, 0.5)'
  }

  const getStrokeColor = (val: number) => {
    if (val < 30) return '#22c55e'
    if (val < 50) return '#f59e0b'
    if (val < 70) return '#ef4444'
    return '#dc2626'
  }

  const drawRadar = () => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const center = size / 2
    const radius = size / 2 - 30
    const angleSlice = (Math.PI * 2) / AXES.length

    const g = svg.append('g').attr('transform', `translate(${center}, ${center})`)

    // 背景网格圆
    const levels = [0.25, 0.5, 0.75, 1.0]
    levels.forEach((level, i) => {
      const r = radius * level
      g.append('polygon')
        .attr('points', AXES.map((_, j) => {
          const angle = angleSlice * j - Math.PI / 2
          return `${r * Math.cos(angle)},${r * Math.sin(angle)}`
        }).join(' '))
        .attr('fill', 'none')
        .attr('stroke', i === 2 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)')
        .attr('stroke-width', i === 2 ? 1.5 : 0.5)
        .attr('stroke-dasharray', i === 2 ? '4,4' : 'none')
    })

    // 阈值线标签
    g.append('text')
      .attr('x', radius * 0.75 + 4)
      .attr('y', -4)
      .attr('fill', 'rgba(239,68,68,0.5)')
      .attr('font-size', '8px')
      .text('警戒线')

    // 轴线
    AXES.forEach((_, i) => {
      const angle = angleSlice * i - Math.PI / 2
      g.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', radius * Math.cos(angle))
        .attr('y2', radius * Math.sin(angle))
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-width', 0.5)
    })

    // 轴标签
    AXES.forEach((axis, i) => {
      const angle = angleSlice * i - Math.PI / 2
      const labelR = radius + 18
      const x = labelR * Math.cos(angle)
      const y = labelR * Math.sin(angle)
      const val = axis.extract(physiology)
      const color = getStrokeColor(val)

      g.append('text')
        .attr('x', x).attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', color)
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .text(`${axis.icon} ${Math.round(val)}`)
    })

    // 历史残影（过去数据半透明）
    if (history.length > 0) {
      history.forEach((histState, hi) => {
        const opacity = 0.05 + (hi / history.length) * 0.1
        const points = AXES.map((axis, j) => {
          const angle = angleSlice * j - Math.PI / 2
          const val = axis.extract(histState) / 100
          const r = radius * Math.max(0.05, Math.min(1, val))
          return `${r * Math.cos(angle)},${r * Math.sin(angle)}`
        }).join(' ')

        g.append('polygon')
          .attr('points', points)
          .attr('fill', `rgba(245, 158, 11, ${opacity})`)
          .attr('stroke', 'none')
      })
    }

    // 当前状态多边形
    const currentPoints = AXES.map((axis, j) => {
      const angle = angleSlice * j - Math.PI / 2
      const val = axis.extract(physiology) / 100
      const r = radius * Math.max(0.05, Math.min(1, val))
      return `${r * Math.cos(angle)},${r * Math.sin(angle)}`
    }).join(' ')

    // 填充
    g.append('polygon')
      .attr('points', currentPoints)
      .attr('fill', getColor(allostaticLoad))
      .attr('stroke', getStrokeColor(allostaticLoad))
      .attr('stroke-width', 1.5)

    // 顶点圆点
    AXES.forEach((axis, j) => {
      const angle = angleSlice * j - Math.PI / 2
      const val = axis.extract(physiology) / 100
      const r = radius * Math.max(0.05, Math.min(1, val))
      g.append('circle')
        .attr('cx', r * Math.cos(angle))
        .attr('cy', r * Math.sin(angle))
        .attr('r', 3)
        .attr('fill', getStrokeColor(val))
        .attr('stroke', '#0a0a0f')
        .attr('stroke-width', 1)
    })

    // 72小时预测锥（模糊区域）
    const predictionFactor = 1.15
    const predPoints = AXES.map((axis, j) => {
      const angle = angleSlice * j - Math.PI / 2
      const val = Math.min(100, axis.extract(physiology) * predictionFactor) / 100
      const r = radius * Math.max(0.05, Math.min(1, val))
      return `${r * Math.cos(angle)},${r * Math.sin(angle)}`
    }).join(' ')

    g.append('polygon')
      .attr('points', predPoints)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(239,68,68,0.2)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="card p-4"
      style={{ borderColor: getStrokeColor(allostaticLoad) + '40' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white">🔬 稳态负荷雷达</span>
        <span className="text-[10px] text-gray-500">点击轴查看详情</span>
      </div>

      <div className="flex justify-center">
        <svg ref={svgRef} width={size} height={size} />
      </div>

      {/* 图例 */}
      <div className="flex justify-center gap-3 mt-1">
        {[
          { color: '#22c55e', label: '安全' },
          { color: '#f59e0b', label: '警戒' },
          { color: '#ef4444', label: '危险' },
          { color: 'rgba(245,158,11,0.3)', label: '历史轨迹' },
          { stroke: 'rgba(239,68,68,0.2)', label: '72h预测', dash: true },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            {item.dash ? (
              <div className="w-3 h-0 border-t border-dashed" style={{ borderColor: item.stroke }} />
            ) : (
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            )}
            <span className="text-[8px] text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
