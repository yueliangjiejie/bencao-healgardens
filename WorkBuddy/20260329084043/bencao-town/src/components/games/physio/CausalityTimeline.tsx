'use client'

// ═══════════════════════════════════════════════════════════
// CausalityTimeline - 因果链时间线
// 右侧边栏垂直时间线：左行为 → 中间转换 → 右生理
// 将今天的症状追溯到过去的选择
// ═══════════════════════════════════════════════════════════

import React, { useState } from 'react'
import type { DelayedEffect, Scar, GameState } from '@/lib/physio-types'

interface CausalityTimelineProps {
  state: GameState
  onTrace?: (id: string) => void
}

interface CausalNode {
  id: string
  day: number
  type: 'choice' | 'delayed' | 'scar' | 'threshold'
  title: string
  description: string
  relatedEffects: string[]
  color: string
  icon: string
}

export default function CausalityTimeline({ state, onTrace }: CausalityTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 从游戏状态构建因果节点
  const nodes = buildCausalNodes(state)

  if (nodes.length === 0) {
    return (
      <div className="p-3 rounded-lg" style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p className="text-[10px] text-gray-500 text-center">暂无因果链数据</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-bold text-gray-500">🔗 因果链</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
          {nodes.length}个节点
        </span>
      </div>

      <div className="relative pl-4">
        {/* 垂直线 */}
        <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{
          background: 'linear-gradient(180deg, rgba(6,182,212,0.3), rgba(6,182,212,0.05))',
        }} />

        {nodes.map((node, i) => {
          const isExpanded = expandedId === node.id
          return (
            <div key={node.id} className="relative mb-2 last:mb-0">
              {/* 时间线节点 */}
              <div className="absolute left-[-4px] top-1 w-3 h-3 rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: node.color,
                  background: isExpanded ? node.color : 'rgba(15,15,25,0.9)',
                }}>
                <div className="w-1 h-1 rounded-full" style={{ background: node.color }} />
              </div>

              {/* 内容卡 */}
              <div className="ml-4">
                <button
                  className="w-full text-left p-2 rounded-lg transition-all active:scale-[0.97]"
                  style={{
                    background: isExpanded ? `${node.color}10` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isExpanded ? `${node.color}30` : 'rgba(255,255,255,0.06)'}`,
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : node.id)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px]">{node.icon}</span>
                    <span className="text-[9px] font-bold" style={{ color: node.color }}>
                      Day {node.day}
                    </span>
                    <span className="text-[10px] text-gray-300 truncate flex-1">{node.title}</span>
                  </div>

                  {isExpanded && (
                    <div className="mt-1.5 pt-1.5" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                      <p className="text-[9px] text-gray-400 leading-relaxed">{node.description}</p>
                      {node.relatedEffects.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {node.relatedEffects.map((eff, j) => (
                            <span key={j} className="text-[8px] px-1 py-0.5 rounded" style={{
                              background: `${node.color}15`,
                              color: node.color,
                            }}>
                              {eff}
                            </span>
                          ))}
                        </div>
                      )}
                      {onTrace && (
                        <button onClick={(e) => { e.stopPropagation(); onTrace(node.id) }}
                          className="text-[8px] text-cyan-400 mt-1.5">
                          🔍 追踪此因果链
                        </button>
                      )}
                    </div>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildCausalNodes(state: GameState): CausalNode[] {
  const nodes: CausalNode[] = []

  // 从延迟效果栈构建
  for (const d of state.delayedStack) {
    const isTriggered = d.applied
    nodes.push({
      id: d.id,
      day: d.triggerDay,
      type: isTriggered ? 'delayed' : 'choice',
      title: d.cause,
      description: d.notification,
      relatedEffects: Object.entries(d.effects).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`),
      color: isTriggered ? '#ef4444' : '#f59e0b',
      icon: isTriggered ? '⚡' : '⏳',
    })
  }

  // 从疤痕构建
  for (const s of state.scars) {
    nodes.push({
      id: s.id,
      day: s.day,
      type: 'scar',
      title: s.name,
      description: s.description,
      relatedEffects: Object.entries(s.debuff).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`),
      color: '#991b1b',
      icon: '💀',
    })
  }

  // 按天排序（最近的在上面）
  nodes.sort((a, b) => b.day - a.day)

  return nodes
}
