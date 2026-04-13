'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhysiologyState } from '@/lib/physio-types'

interface Props {
  physiology: PhysiologyState
  day: number
}

// 身体区域映射
const BODY_REGIONS = [
  { id: 'head', label: '头部', cy: 15, rx: 12, ry: 14, system: 'neuroinflammation' },
  { id: 'chest', label: '心肺', cy: 42, rx: 16, ry: 12, system: 'cardio' },
  { id: 'upper_gut', label: '胃/上消化道', cy: 62, rx: 14, ry: 10, system: 'gut' },
  { id: 'lower_gut', label: '肠/下消化道', cy: 78, rx: 13, ry: 10, system: 'gut_lower' },
  { id: 'joints', label: '关节', cy: 95, rx: 18, ry: 8, system: 'autoimmune' },
  { id: 'adrenal', label: '肾上腺', cy: 55, rx: 5, ry: 4, system: 'hpa', offset: 'left' },
]

function getIntensity(physiology: PhysiologyState, system: string): number {
  switch (system) {
    case 'neuroinflammation': return physiology.immune.inflammation / 100 * 0.6 + (100 - physiology.neural.cognitiveReserve) / 100 * 0.4
    case 'cardio': return (100 - physiology.cardio.cardiacReserve) / 100 * 0.5 + physiology.cardio.bloodPressureLoad / 100 * 0.5
    case 'gut': return (100 - physiology.immune.gutIntegrity) / 100 * 0.7 + physiology.immune.inflammation / 100 * 0.3
    case 'gut_lower': return (100 - physiology.immune.gutIntegrity) / 100 * 0.8 + physiology.metabolic.adiposity / 100 * 0.2
    case 'autoimmune': return physiology.immune.autoimmunityRisk / 100 * 0.6 + physiology.immune.inflammation / 100 * 0.4
    case 'hpa': return (100 - physiology.neural.hpaRegulation) / 100 * 0.7 + physiology.chronic.oxidativeStress / 100 * 0.3
    default: return 0.3
  }
}

function getLayerData(physiology: PhysiologyState, layer: string) {
  if (layer === 'inflammation') {
    return {
      color: 'rgba(239, 68, 68, ',
      regions: BODY_REGIONS.map(r => ({
        ...r,
        intensity: getIntensity(physiology, r.system)
      }))
    }
  }
  if (layer === 'pain') {
    return {
      color: 'rgba(250, 204, 21, ',
      regions: [
        { ...BODY_REGIONS[0], intensity: (100 - physiology.neural.cognitiveReserve) / 100 * 0.5 },
        { ...BODY_REGIONS[2], intensity: (100 - physiology.immune.gutIntegrity) / 100 * 0.4 },
        { ...BODY_REGIONS[4], intensity: physiology.immune.autoimmunityRisk / 100 * 0.6 },
      ]
    }
  }
  // compensation layer
  return {
    color: 'rgba(59, 130, 246, ',
    regions: [
      { ...BODY_REGIONS.find(r => r.id === 'adrenal')!, intensity: (100 - physiology.neural.hpaRegulation) / 100 },
      { id: 'thyroid', label: '甲状腺', cy: 30, rx: 6, ry: 3, system: 'metabolic', intensity: (100 - physiology.metabolic.mitochondrialHealth) / 100 * 0.5 },
    ]
  }
}

export default function BodyHeatmap({ physiology, day }: Props) {
  const [activeLayer, setActiveLayer] = useState<'inflammation' | 'pain' | 'compensation'>('inflammation')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const layerData = getLayerData(physiology, activeLayer)

  const getRegionNarrative = (regionId: string): string => {
    const region = BODY_REGIONS.find(r => r.id === regionId)
    if (!region) return ''
    const intensity = getIntensity(physiology, region.system)

    const narratives: Record<string, Record<string, string>> = {
      inflammation: {
        head: intensity > 0.5 ? '脑雾笼罩，神经炎症让你的思维像隔着一层毛玻璃' : '偶有头痛，注意力轻微下降',
        chest: intensity > 0.5 ? '心脏在超负荷运转，每次搏动都带着隐痛' : '胸闷感轻微，心脏储备尚可',
        upper_gut: intensity > 0.5 ? '胃黏膜炎症持续，消化功能明显受损' : '偶有胃部不适',
        lower_gut: intensity > 0.5 ? '肠屏障正在被侵蚀，毒素渗入血液' : '肠道偶有不适',
        joints: intensity > 0.5 ? '关节开始出现自身免疫攻击的迹象' : '关节偶有酸痛',
        adrenal: intensity > 0.5 ? '肾上腺过度透支，皮质醇分泌紊乱' : '肾上腺负担增加',
      },
      pain: {
        head: '太阳穴搏动性疼痛，压力直接写在这里',
        upper_gut: '上腹部隐隐作痛，尤其在焦虑时加剧',
        joints: '关节疼痛频率增加，晨僵现象出现',
      },
      compensation: {
        adrenal: '肾上腺正在为你透支运转，代价是长期的HPA轴失调',
        thyroid: '甲状腺代偿性加速，但不可持续',
      },
    }

    return narratives[activeLayer]?.[regionId] || `${region.label}区域活动度: ${Math.round(intensity * 100)}%`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-white">🫁 身体热力图</span>
        <span className="text-[9px] text-gray-500">Day {day}</span>
      </div>

      {/* 图层切换 */}
      <div className="flex gap-1 mb-3">
        {[
          { key: 'inflammation' as const, label: '🔥 炎症层', color: 'red' },
          { key: 'pain' as const, label: '⚡ 疼痛层', color: 'yellow' },
          { key: 'compensation' as const, label: '🔵 代偿层', color: 'blue' },
        ].map(layer => (
          <button
            key={layer.key}
            onClick={() => { setActiveLayer(layer.key); setSelectedRegion(null) }}
            className={`text-[9px] px-2 py-1 rounded-lg transition-colors ${
              activeLayer === layer.key
                ? `bg-${layer.color}-500/20 text-${layer.color}-400 border border-${layer.color}-500/30`
                : 'bg-white/5 text-gray-500'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* SVG人体热力图 */}
      <div className="relative flex justify-center">
        <svg width="160" height="130" viewBox="0 0 160 130" className="mx-auto">
          {/* 人体轮廓 */}
          <ellipse cx="80" cy="15" rx="14" ry="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
          <rect x="50" y="30" width="60" height="55" rx="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
          <rect x="55" y="85" width="50" height="25" rx="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          {/* 四肢简化 */}
          <line x1="50" y1="38" x2="30" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
          <line x1="110" y1="38" x2="130" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
          <line x1="60" y1="108" x2="50" y2="128" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />
          <line x1="100" y1="108" x2="110" y2="128" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />

          {/* 热力区域 */}
          {layerData.regions.map((region, i) => {
            const cx = region.offset === 'left' ? 65 : region.offset === 'right' ? 95 : 80
            const isSelected = selectedRegion === region.id

            return (
              <g key={region.id || i}>
                {/* 发光区域 */}
                <ellipse
                  cx={cx}
                  cy={region.cy}
                  rx={region.rx}
                  ry={region.ry}
                  fill={`${layerData.color}${Math.round(region.intensity * 0.5)})`}
                  stroke={`${layerData.color}${isSelected ? 0.8 : 0.3})`}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                  className="cursor-pointer transition-all"
                  onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
                />
                {/* 脉动动画（高强度区域） */}
                {region.intensity > 0.5 && (
                  <ellipse
                    cx={cx}
                    cy={region.cy}
                    rx={region.rx + 3}
                    ry={region.ry + 2}
                    fill="none"
                    stroke={`${layerData.color}0.2)`}
                    strokeWidth={1}
                  >
                    <animate attributeName="rx" values={`${region.rx + 2};${region.rx + 5};${region.rx + 2}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="ry" values={`${region.ry + 1};${region.ry + 3};${region.ry + 1}`} dur="2s" repeatCount="indefinite" />
                  </ellipse>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* 选中区域的叙事 */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-2.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-[10px] text-gray-300 leading-relaxed">
              {getRegionNarrative(selectedRegion)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
