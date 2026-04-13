'use client'

// ═══════════════════════════════════════════════════════════
// 慢性生存仪表盘 — 四维资源展示
// ═══════════════════════════════════════════════════════════

import { GameState } from '@/lib/physio-types'

export default function ChronicDashboard({ state, compact }: { state: GameState; compact?: boolean }) {
  const c = state.chronic
  if (!c) return null
  const r = c.resources

  const metrics = [
    {
      label: '医疗债务', icon: '💰', value: r.medicalDebt > 10000 ? `¥${(r.medicalDebt / 10000).toFixed(1)}万` : `¥${r.medicalDebt}`,
      score: Math.max(0, 100 - (r.medicalDebt / (r.monthlyIncome * 6)) * 100),
      color: r.medicalDebt > r.monthlyIncome * 6 ? '#ef4444' : r.medicalDebt > r.monthlyIncome * 3 ? '#f59e0b' : '#22c55e',
      sub: `月收入 ¥${r.monthlyIncome.toLocaleString()}`
    },
    {
      label: '关系资本', icon: '👥', value: `${r.relationshipCapital}/100`,
      score: r.relationshipCapital,
      color: r.relationshipCapital > 60 ? '#22c55e' : r.relationshipCapital > 40 ? '#f59e0b' : '#ef4444',
      sub: `可社交 ${r.socialDays}天/月`
    },
    {
      label: '意义感', icon: '💭', value: `${r.meaningScore}/100`,
      score: r.meaningScore,
      color: r.meaningScore > 50 ? '#22c55e' : r.meaningScore > 30 ? '#f59e0b' : '#ef4444',
      sub: r.meaningScore < 25 ? '⚠️ 低于安全线' : '在波动中寻找'
    },
    {
      label: '职场表现', icon: '💼', value: `${r.workPerformance}/100`,
      score: r.workPerformance,
      color: r.workPerformance > 60 ? '#22c55e' : r.workPerformance > 40 ? '#f59e0b' : '#ef4444',
      sub: r.disclosureLevel === 'hidden' ? '病情未公开' : r.disclosureLevel === 'partial' ? '部分公开' : '已完全公开'
    }
  ]

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {metrics.map(m => (
          <div key={m.label} className="card p-1.5 text-center">
            <span className="text-sm">{m.icon}</span>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: m.color }}>{m.score}</p>
            <p className="text-[7px] text-gray-500 leading-tight">{m.label}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400">📊 慢性生存仪表盘</h3>
        <span className="text-[10px] text-violet-400">
          月{c.month} · 依从{c.cumulativeAdherence}%
        </span>
      </div>
      {metrics.map(m => (
        <div key={m.label} className="card p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-white">{m.icon} {m.label}</span>
            <span className="text-sm font-bold" style={{ color: m.color }}>{m.value}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden mb-1">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(100, m.score))}%`, background: m.color }} />
          </div>
          <p className="text-[10px] text-gray-500">{m.sub}</p>
        </div>
      ))}

      {/* 依从率可视化 */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">💊 总体依从率</span>
          <span className={`text-sm font-bold ${c.cumulativeAdherence > 80 ? 'text-green-400' : c.cumulativeAdherence > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {c.cumulativeAdherence}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${c.cumulativeAdherence}%`,
              background: c.cumulativeAdherence > 80 ? '#22c55e' : c.cumulativeAdherence > 60 ? '#f59e0b' : '#ef4444'
            }} />
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          {c.cumulativeAdherence > 95 ? '完美依从 — 并发症风险最小化' :
           c.cumulativeAdherence > 70 ? '中等依从 — 疾病缓慢进展' :
           '⚠️ 依从不足 — 进入"旋转门"模式'}
        </p>
      </div>

      {/* 专家病人等级 */}
      <div className="card p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎓</span>
          <span className="text-sm font-bold text-white">专家病人 Lv.{c.expertPatientLevel}</span>
        </div>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2, 3].map(lvl => (
            <div key={lvl} className={`flex-1 h-1.5 rounded-full ${lvl <= c.expertPatientLevel ? 'bg-violet-500' : 'bg-gray-700'}`} />
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          {c.expertPatientLevel === 0 ? '你还是医疗系统的新手' :
           c.expertPatientLevel === 1 ? '你开始读懂检查报告' :
           c.expertPatientLevel === 2 ? '你比全科医生更懂你的病' :
           '你是自己身体的终极专家'}
        </p>
      </div>
    </div>
  )
}
