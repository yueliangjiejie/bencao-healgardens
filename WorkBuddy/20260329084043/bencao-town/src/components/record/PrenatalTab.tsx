'use client'

import { useState, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Baby, Sparkles, Loader2, AlertCircle, ChevronRight, Syringe, CalendarCheck } from 'lucide-react'

interface PrenatalResult {
  reportType: string
  gestationalWeek: number
  indicators: { name: string; value: string; normal: string; status: string; note?: string }[]
  abnormalCount: number
  advice: string[]
  vaccineReminders: { vaccine: string; weekRange: string; note: string; urgent: boolean }[]
  nextCheckup: { time: string; items: string[] }
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      const MAX = 800
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
        else { w = Math.round((w * MAX) / h); h = MAX }
      }
      canvas.width = w; canvas.height = h
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1])
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function PrenatalTab() {
  const { addPoints } = useStore()
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<PrenatalResult | null>(null)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const [week, setWeek] = useState('')
  const [savedResults, setSavedResults] = useState<PrenatalResult[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setAnalyzing(true); setError(''); setResult(null)
    try {
      const base64 = await compressImage(file)
      const res = await fetch('/api/analyze-prenatal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type || 'image/jpeg', gestationalWeek: parseInt(week) || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '分析失败')
      setResult(data.result); setIsDemo(data.demo || false); addPoints(3)
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally { setAnalyzing(false) }
  }, [week, addPoints])

  const saveResult = () => {
    if (!result) return
    setSavedResults(prev => [result, ...prev])
    setResult(null); if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* 孕周输入 */}
      <div className="card p-4">
        <label className="text-sm font-bold block mb-2" style={{ color: 'var(--text-primary)' }}>当前孕周（选填）</label>
        <div className="flex items-center gap-2">
          <input type="number" value={week} onChange={e => setWeek(e.target.value)}
            placeholder="如：20" min={1} max={42}
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]" />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>周</span>
        </div>
      </div>

      {/* 拍照入口 */}
      <label className="block cursor-pointer group">
        <div className="card p-4 bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-red-500/15
                       border-2 border-dashed border-pink-400/30 hover:border-pink-400/60 active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500
                          flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Baby size={22} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>拍照分析产检报告</span>
                <Sparkles size={14} className="text-pink-400 animate-pulse" />
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>拍产检单自动解读指标 + 疫苗提醒</p>
            </div>
            <ChevronRight size={18} className="text-pink-400/50" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      </label>

      {analyzing && (
        <div className="card text-center py-8">
          <Loader2 size={36} className="text-pink-400 animate-spin mx-auto mb-3" />
          <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>正在分析产检报告...</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>解读指标 · 疫苗提醒 · 产检规划</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div><p className="text-sm font-medium text-red-300">分析失败</p><p className="text-sm text-red-400/80 mt-1">{error}</p></div>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-fade-in">
          {isDemo && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" /><p className="text-xs text-amber-300">演示模式</p>
            </div>
          )}

          {/* 报告信息 */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{result.reportType}</p>
                {result.gestationalWeek > 0 && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>孕{result.gestationalWeek}周</p>}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                result.abnormalCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'
              }`}>
                {result.abnormalCount > 0 ? `${result.abnormalCount}项异常` : '指标正常'}
              </span>
            </div>
            {result.indicators.length > 0 && (
              <div className="space-y-2 mt-3">
                {result.indicators.map((ind, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    ind.status === 'high' ? 'bg-red-500/5 border border-red-500/10' :
                    ind.status === 'low' ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-[var(--bg-secondary)]'
                  }`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ind.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>正常：{ind.normal}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        ind.status === 'high' ? 'text-red-400' : ind.status === 'low' ? 'text-amber-400' : 'text-green-400'
                      }`}>{ind.value}{ind.status === 'high' ? ' ↑' : ind.status === 'low' ? ' ↓' : ''}</span>
                      {ind.note && <p className="text-xs text-amber-400 mt-0.5">{ind.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 建议 */}
          {result.advice.length > 0 && (
            <div className="card p-4 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-red-500/10 border-pink-500/20">
              <div className="flex items-center gap-2 mb-2"><span className="text-lg">💡</span><span className="text-sm font-bold text-pink-400">健康建议</span></div>
              <ul className="space-y-1.5">
                {result.advice.map((a, i) => <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-primary)' }}><span className="text-pink-400 mt-0.5">•</span>{a}</li>)}
              </ul>
            </div>
          )}

          {/* 疫苗提醒 */}
          {result.vaccineReminders.length > 0 && (
            <div className="card p-4 border-amber-500/20">
              <div className="flex items-center gap-2 mb-2"><Syringe size={16} className="text-amber-400" /><span className="text-sm font-bold text-amber-400">💉 疫苗提醒</span></div>
              <div className="space-y-2">
                {result.vaccineReminders.map((v, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${v.urgent ? 'bg-amber-500/10' : 'bg-[var(--bg-secondary)]'}`}>
                    <Syringe size={14} className={v.urgent ? 'text-red-400 mt-0.5' : 'text-amber-400 mt-0.5'} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{v.vaccine}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{v.weekRange} · {v.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 下次产检 */}
          {result.nextCheckup && (
            <div className="card p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
              <div className="flex items-center gap-2 mb-2"><CalendarCheck size={16} className="text-blue-400" /><span className="text-sm font-bold text-blue-400">📅 下次产检</span></div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{result.nextCheckup.time}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.nextCheckup.items.map((item, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">{item}</span>
                ))}
              </div>
            </div>
          )}

          <button onClick={saveResult}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25">
            保存到产检记录
          </button>
        </div>
      )}

      {/* 历史产检记录 */}
      {savedResults.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📋 产检记录</h2>
          <div className="space-y-2">
            {savedResults.map((r, i) => (
              <div key={i} className="card flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                  <Baby size={18} className="text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{r.reportType}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {r.gestationalWeek > 0 ? `孕${r.gestationalWeek}周` : ''} {r.abnormalCount > 0 ? `${r.abnormalCount}项异常` : '指标正常'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!result && !analyzing && savedResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">🤰</p>
          <p className="text-base mb-1" style={{ color: 'var(--text-secondary)' }}>拍照分析产检报告</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>自动解读指标、提醒疫苗、规划产检时间</p>
        </div>
      )}
    </div>
  )
}
