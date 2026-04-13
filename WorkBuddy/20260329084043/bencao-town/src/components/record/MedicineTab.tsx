'use client'

import { useState, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Pill, Camera, Sparkles, Loader2, CheckCircle2, AlertCircle, ChevronRight, ClipboardList, AlertTriangle, Plus } from 'lucide-react'

interface MedicineItem {
  name: string
  brand: string
  category: string
  purpose: string
  dosage: string
  precautions: string[]
  interactions: string
  storageNote: string
  confidence: number
}

function getConfidenceColor(c: number) {
  if (c >= 0.85) return 'text-green-500'
  if (c >= 0.7) return 'text-yellow-500'
  return 'text-orange-500'
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

export default function MedicineTab() {
  const { addPoints } = useStore()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<MedicineItem[] | null>(null)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const [list, setList] = useState<MedicineItem[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setScanning(true); setError(''); setResult(null)
    try {
      const base64 = await compressImage(file)
      const res = await fetch('/api/recognize-medicine', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type || 'image/jpeg' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '识别失败')
      setResult(data.result); setIsDemo(data.demo || false)
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally { setScanning(false) }
  }, [])

  const addToList = () => {
    if (!result) return
    setList(prev => [...prev, ...result])
    addPoints(2)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* 拍照入口 */}
      <label className="block cursor-pointer group">
        <div className="card p-4 bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-green-500/15
                       border-2 border-dashed border-teal-400/30 hover:border-teal-400/60 active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500
                          flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Pill size={22} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>拍照整理药盒</span>
                <Sparkles size={14} className="text-teal-400 animate-pulse" />
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>拍药盒自动识别药品名称、用途、注意事项</p>
            </div>
            <ChevronRight size={18} className="text-teal-400/50" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      </label>

      {scanning && (
        <div className="card text-center py-8">
          <Loader2 size={36} className="text-teal-400 animate-spin mx-auto mb-3" />
          <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>正在识别药品...</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>读取药盒信息 + 注意事项</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">识别失败</p>
            <p className="text-sm text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3 animate-fade-in">
          {isDemo && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              <p className="text-xs text-amber-300">演示模式，配置API Key后可使用真实识别</p>
            </div>
          )}
          {result.map((med, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{med.name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{med.brand} · {med.category}</p>
                </div>
                <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${getConfidenceColor(med.confidence)} bg-current/10`}>
                  {(med.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <ClipboardList size={14} className="text-teal-400 mt-0.5 shrink-0" />
                  <div><p className="text-xs font-bold text-teal-400">用途</p><p className="text-sm" style={{ color: 'var(--text-primary)' }}>{med.purpose}</p></div>
                </div>
                <div className="flex items-start gap-2">
                  <Pill size={14} className="text-blue-400 mt-0.5 shrink-0" />
                  <div><p className="text-xs font-bold text-blue-400">用法用量</p><p className="text-sm" style={{ color: 'var(--text-primary)' }}>{med.dosage}</p></div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-400">注意事项</p>
                    <ul className="text-sm space-y-0.5 mt-0.5">
                      {med.precautions.map((p, j) => <li key={j} style={{ color: 'var(--text-primary)' }}>• {p}</li>)}
                    </ul>
                  </div>
                </div>
                {med.interactions && (
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <div><p className="text-xs font-bold text-red-400">药物相互作用</p><p className="text-sm" style={{ color: 'var(--text-primary)' }}>{med.interactions}</p></div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <button onClick={addToList}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25">
            <CheckCircle2 size={18} /> 加入我的药品清单
          </button>
        </div>
      )}

      {list.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>📋 我的药品清单</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-teal-500/10 text-teal-400">{list.length}种药品</span>
          </div>
          <div className="space-y-2">
            {list.map((med, i) => (
              <div key={i} className="card flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Pill size={18} className="text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{med.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{med.purpose}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)]" style={{ color: 'var(--text-secondary)' }}>{med.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!result && !scanning && list.length === 0 && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">💊</p>
          <p className="text-base mb-1" style={{ color: 'var(--text-secondary)' }}>拍照整理家庭药箱</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>自动识别药品名称、用途、注意事项和药物相互作用</p>
        </div>
      )}
    </div>
  )
}
