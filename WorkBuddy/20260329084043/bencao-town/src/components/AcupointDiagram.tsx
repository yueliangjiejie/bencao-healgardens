'use client'

/**
 * SVG 人体穴位配图组件
 * 根据穴位ID在人体轮廓上标注位置
 * 支持：头面部、上肢、躯干、下肢四个视图
 */

import { useState } from 'react'

type BodyView = 'front' | 'back' | 'head' | 'limbs'

interface AcupointDiagramProps {
  /** 穴位ID列表，如 ['zusanli', 'hegu'] */
  pointIds: string[]
  /** 当前高亮的穴位ID */
  activePoint?: string
  /** 点击穴位的回调 */
  onPointClick?: (pointId: string) => void
  /** 尺寸 */
  size?: number
}

// 穴位在人体各视图中的坐标映射
interface PointPosition {
  view: BodyView
  x: number  // SVG坐标系中的x
  y: number  // SVG坐标系中的y
  label: string
}

const POINT_POSITIONS: Record<string, PointPosition> = {
  // ── 头面部 ──
  baihui:    { view: 'head', x: 100, y: 12, label: '百会' },
  yintang:   { view: 'head', x: 100, y: 45, label: '印堂' },
  taiyang:   { view: 'head', x: 72, y: 55, label: '太阳' },
  // ── 上肢 ──
  hegu:      { view: 'limbs', x: 35, y: 70, label: '合谷' },
  neiguan:   { view: 'limbs', x: 85, y: 38, label: '内关' },
  lieque:    { view: 'limbs', x: 85, y: 50, label: '列缺' },
  // ── 下肢 ──
  zusanli:   { view: 'front', x: 62, y: 168, label: '足三里' },
  sanyinjiao:{ view: 'front', x: 58, y: 192, label: '三阴交' },
  taichong:  { view: 'limbs', x: 155, y: 195, label: '太冲' },
  fenglong:  { view: 'front', x: 72, y: 158, label: '丰隆' },
  xuehai:    { view: 'front', x: 55, y: 128, label: '血海' },
  // ── 躯干（正面）──
  zhongwan:  { view: 'front', x: 100, y: 80, label: '中脘' },
  guanyuan:  { view: 'front', x: 100, y: 100, label: '关元' },
  // ── 躯干（背面）──
  mingmen:   { view: 'back', x: 100, y: 95, label: '命门' },
  shenshu:   { view: 'back', x: 85, y: 95, label: '肾俞' },
  feishu:    { view: 'back', x: 85, y: 55, label: '肺俞' },
  // ── 足底 ──
  yongquan:  { view: 'limbs', x: 155, y: 72, label: '涌泉' },
}

// 获取包含指定穴位的最佳视图
function getBestView(pointIds: string[]): BodyView {
  const views: BodyView[] = []
  pointIds.forEach(id => {
    const pos = POINT_POSITIONS[id]
    if (pos) views.push(pos.view)
  })
  // 优先级: front > back > head > limbs
  if (views.includes('front')) return 'front'
  if (views.includes('back')) return 'back'
  if (views.includes('head')) return 'head'
  if (views.includes('limbs')) return 'limbs'
  return 'front'
}

// ── 正面人体轮廓 SVG ──
function FrontBody({ activePoint, onPointClick, visiblePoints, pulsePoint }: {
  activePoint?: string
  onPointClick?: (id: string) => void
  visiblePoints: string[]
  pulsePoint?: string
}) {
  return (
    <svg viewBox="0 0 200 220" className="w-full h-full">
      {/* 人体轮廓 */}
      <g stroke="currentColor" fill="none" strokeWidth="1.5" opacity="0.3" className="text-emerald-600">
        {/* 头 */}
        <ellipse cx="100" cy="18" rx="18" ry="20" />
        {/* 颈 */}
        <line x1="100" y1="38" x2="100" y2="48" />
        {/* 躯干 */}
        <path d="M72 48 Q72 48 65 58 L58 100 L60 110 L72 120 L75 135 L78 145 Q78 155 80 160" />
        <path d="M128 48 Q128 48 135 58 L142 100 L140 110 L128 120 L125 135 L122 145 Q122 155 120 160" />
        {/* 肩到手臂 */}
        <path d="M72 48 L45 58 L35 75 L28 90 L25 105" />
        <path d="M128 48 L155 58 L165 75 L172 90 L175 105" />
        {/* 腿 */}
        <path d="M80 160 L78 175 L76 190 L75 205 L78 215" />
        <path d="M120 160 L122 175 L124 190 L125 205 L122 215" />
        {/* 中线 */}
        <line x1="100" y1="48" x2="100" y2="155" opacity="0.15" />
      </g>

      {/* 穴位点 */}
      {visiblePoints.map(id => {
        const pos = POINT_POSITIONS[id]
        if (!pos || pos.view !== 'front') return null
        const isActive = id === activePoint
        const isPulsing = id === pulsePoint
        return (
          <g key={id} onClick={() => onPointClick?.(id)} className="cursor-pointer">
            {/* 脉冲动画 */}
            {isPulsing && (
              <circle cx={pos.x} cy={pos.y} r="8" fill="none" stroke="#10B981" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="r" from="6" to="16" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={pos.x} cy={pos.y} r={isActive ? 6 : 4.5}
              fill={isActive ? '#10B981' : '#34D399'}
              stroke={isActive ? '#059669' : '#10B981'}
              strokeWidth={isActive ? 2 : 1.5}
              className="transition-all duration-200"
            />
            <text x={pos.x + (pos.x > 100 ? 10 : -10)} y={pos.y + 4}
              textAnchor={pos.x > 100 ? 'start' : 'end'}
              className="fill-current text-[8px] font-bold"
              style={{ fill: isActive ? '#059669' : '#6B7280' }}
            >
              {pos.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── 背面人体轮廓 SVG ──
function BackBody({ activePoint, onPointClick, visiblePoints, pulsePoint }: {
  activePoint?: string
  onPointClick?: (id: string) => void
  visiblePoints: string[]
  pulsePoint?: string
}) {
  return (
    <svg viewBox="0 0 200 220" className="w-full h-full">
      <g stroke="currentColor" fill="none" strokeWidth="1.5" opacity="0.3" className="text-emerald-600">
        <ellipse cx="100" cy="18" rx="18" ry="20" />
        <line x1="100" y1="38" x2="100" y2="48" />
        {/* 背面躯干 */}
        <path d="M72 48 Q72 48 68 58 L62 100 L64 110 L72 120 L76 135 L80 155" />
        <path d="M128 48 Q128 48 132 58 L138 100 L136 110 L128 120 L124 135 L120 155" />
        <path d="M72 48 L45 58 L35 75 L28 90 L25 105" />
        <path d="M128 48 L155 58 L165 75 L172 90 L175 105" />
        <path d="M80 155 L78 175 L76 190 L75 205 L78 215" />
        <path d="M120 155 L122 175 L124 190 L125 205 L122 215" />
        {/* 脊柱线 */}
        <line x1="100" y1="48" x2="100" y2="155" opacity="0.2" strokeDasharray="4 3" />
      </g>

      {visiblePoints.map(id => {
        const pos = POINT_POSITIONS[id]
        if (!pos || pos.view !== 'back') return null
        const isActive = id === activePoint
        const isPulsing = id === pulsePoint
        return (
          <g key={id} onClick={() => onPointClick?.(id)} className="cursor-pointer">
            {isPulsing && (
              <circle cx={pos.x} cy={pos.y} r="8" fill="none" stroke="#10B981" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="r" from="6" to="16" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={pos.x} cy={pos.y} r={isActive ? 6 : 4.5}
              fill={isActive ? '#10B981' : '#34D399'}
              stroke={isActive ? '#059669' : '#10B981'}
              strokeWidth={isActive ? 2 : 1.5}
            />
            <text x={pos.x + (pos.x > 100 ? 10 : -10)} y={pos.y + 4}
              textAnchor={pos.x > 100 ? 'start' : 'end'}
              className="fill-current text-[8px] font-bold"
              style={{ fill: isActive ? '#059669' : '#6B7280' }}
            >
              {pos.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── 头部特写 SVG ──
function HeadDetail({ activePoint, onPointClick, visiblePoints, pulsePoint }: {
  activePoint?: string
  onPointClick?: (id: string) => void
  visiblePoints: string[]
  pulsePoint?: string
}) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* 头部轮廓 */}
      <g stroke="currentColor" fill="none" strokeWidth="2" opacity="0.3" className="text-emerald-600">
        {/* 头型 */}
        <ellipse cx="100" cy="90" rx="55" ry="65" />
        {/* 眼睛 */}
        <ellipse cx="78" cy="85" rx="12" ry="6" />
        <ellipse cx="122" cy="85" rx="12" ry="6" />
        {/* 鼻子 */}
        <path d="M100 80 L100 105 L95 110 Q100 115 105 110" />
        {/* 嘴 */}
        <path d="M88 125 Q100 132 112 125" />
        {/* 耳朵 */}
        <path d="M45 75 Q38 85 42 100 Q45 108 50 105" />
        <path d="M155 75 Q162 85 158 100 Q155 108 150 105" />
        {/* 头发线 */}
        <path d="M50 60 Q75 30 100 25 Q125 30 150 60" opacity="0.2" />
      </g>

      {visiblePoints.map(id => {
        const pos = POINT_POSITIONS[id]
        if (!pos || pos.view !== 'head') return null
        // 头部特写需要放大坐标
        const scale = 1.8
        const ox = (pos.x - 100) * scale + 100
        const oy = (pos.y - 10) * scale + 25
        const isActive = id === activePoint
        const isPulsing = id === pulsePoint
        return (
          <g key={id} onClick={() => onPointClick?.(id)} className="cursor-pointer">
            {isPulsing && (
              <circle cx={ox} cy={oy} r="10" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.6">
                <animate attributeName="r" from="8" to="20" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={ox} cy={oy} r={isActive ? 8 : 6}
              fill={isActive ? '#10B981' : '#34D399'}
              stroke={isActive ? '#059669' : '#10B981'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <text x={ox + 14} y={oy + 4}
              className="fill-current text-[10px] font-bold"
              style={{ fill: isActive ? '#059669' : '#374151' }}
            >
              {pos.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── 四肢特写 SVG ──
function LimbsDetail({ activePoint, onPointClick, visiblePoints, pulsePoint }: {
  activePoint?: string
  onPointClick?: (id: string) => void
  visiblePoints: string[]
  pulsePoint?: string
}) {
  return (
    <svg viewBox="0 0 200 220" className="w-full h-full">
      {/* 左：手部 */}
      <g stroke="currentColor" fill="none" strokeWidth="1.5" opacity="0.3" className="text-emerald-600">
        <text x="50" y="10" className="text-[9px] fill-current" textAnchor="middle" style={{ fill: '#9CA3AF' }}>手部</text>
        {/* 手臂 */}
        <path d="M50 15 L50 40 L45 55 L40 70 L35 85" />
        <path d="M50 15 L55 40 L60 55 L65 70 L70 85" />
        {/* 手掌 */}
        <path d="M35 85 Q50 95 70 85" />
        {/* 手指 */}
        <path d="M35 85 L30 100" />
        <path d="M42 90 L38 105" />
        <path d="M50 92 L50 108" />
        <path d="M58 90 L62 105" />
        <path d="M65 85 L70 100" />
        {/* 虎口标注 */}
        <path d="M37 88 Q42 82 47 88" strokeDasharray="2 2" opacity="0.5" />
      </g>

      {/* 右：手臂内侧 */}
      <g stroke="currentColor" fill="none" strokeWidth="1.5" opacity="0.3" className="text-emerald-600">
        <text x="150" y="10" className="text-[9px] fill-current" textAnchor="middle" style={{ fill: '#9CA3AF' }}>手臂内侧</text>
        <path d="M130 15 L130 50 L125 65 L120 80 L118 95" />
        <path d="M130 15 L135 50 L140 65 L145 80 L148 95" />
        <line x1="130" y1="15" x2="130" y2="95" opacity="0.1" />
      </g>

      {/* 下方：足部 */}
      <g stroke="currentColor" fill="none" strokeWidth="1.5" opacity="0.3" className="text-emerald-600">
        <text x="50" y="120" className="text-[9px] fill-current" textAnchor="middle" style={{ fill: '#9CA3AF' }}>足底</text>
        {/* 脚底轮廓 */}
        <ellipse cx="50" cy="155" rx="25" ry="35" />
        <path d="M30 145 Q50 140 70 145" opacity="0.2" />

        <text x="150" y="120" className="text-[9px] fill-current" textAnchor="middle" style={{ fill: '#9CA3AF' }}>足背</text>
        <ellipse cx="150" cy="155" rx="25" ry="35" />
        {/* 脚趾 */}
        <path d="M130 130 L127 122" />
        <path d="M138 128 L136 120" />
        <path d="M150 127 L150 119" />
        <path d="M162 128 L164 120" />
        <path d="M170 130 L173 122" />
      </g>

      {visiblePoints.map(id => {
        const pos = POINT_POSITIONS[id]
        if (!pos || pos.view !== 'limbs') return null
        const isActive = id === activePoint
        const isPulsing = id === pulsePoint
        return (
          <g key={id} onClick={() => onPointClick?.(id)} className="cursor-pointer">
            {isPulsing && (
              <circle cx={pos.x} cy={pos.y} r="8" fill="none" stroke="#10B981" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="r" from="6" to="16" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={pos.x} cy={pos.y} r={isActive ? 6 : 4.5}
              fill={isActive ? '#10B981' : '#34D399'}
              stroke={isActive ? '#059669' : '#10B981'}
              strokeWidth={isActive ? 2 : 1.5}
            />
            <text x={pos.x + (pos.x > 100 ? 10 : -10)} y={pos.y + 4}
              textAnchor={pos.x > 100 ? 'start' : 'end'}
              className="fill-current text-[8px] font-bold"
              style={{ fill: isActive ? '#059669' : '#6B7280' }}
            >
              {pos.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── 主组件 ──
export default function AcupointDiagram({ pointIds, activePoint, onPointClick, size = 280 }: AcupointDiagramProps) {
  const [currentView, setCurrentView] = useState<BodyView>(getBestView(pointIds))

  const views: { id: BodyView; label: string; icon: string }[] = [
    { id: 'front', label: '正面', icon: '🧍' },
    { id: 'back', label: '背面', icon: '🔙' },
    { id: 'head', label: '头部', icon: '🗣️' },
    { id: 'limbs', label: '四肢', icon: '🤲' },
  ]

  const renderView = () => {
    switch (currentView) {
      case 'front':
        return <FrontBody activePoint={activePoint} onPointClick={onPointClick} visiblePoints={pointIds} pulsePoint={activePoint} />
      case 'back':
        return <BackBody activePoint={activePoint} onPointClick={onPointClick} visiblePoints={pointIds} pulsePoint={activePoint} />
      case 'head':
        return <HeadDetail activePoint={activePoint} onPointClick={onPointClick} visiblePoints={pointIds} pulsePoint={activePoint} />
      case 'limbs':
        return <LimbsDetail activePoint={activePoint} onPointClick={onPointClick} visiblePoints={pointIds} pulsePoint={activePoint} />
    }
  }

  return (
    <div className="flex flex-col items-center gap-2" style={{ maxWidth: size }}>
      {/* 视图切换 */}
      <div className="flex gap-1 px-2 py-1 rounded-lg" style={{ background: 'var(--bg-card)' }}>
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => setCurrentView(v.id)}
            className="px-2 py-1 text-xs rounded-md transition-all"
            style={{
              background: currentView === v.id ? '#10B981' : 'transparent',
              color: currentView === v.id ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* SVG 图 */}
      <div className="relative w-full rounded-xl overflow-hidden border"
        style={{
          background: 'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(52,211,153,0.02) 100%)',
          borderColor: 'rgba(16,185,129,0.2)',
          height: size * 1.1,
        }}
      >
        {renderView()}
      </div>
    </div>
  )
}
