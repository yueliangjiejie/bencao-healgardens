'use client'

import { useState } from 'react'
import { ArrowLeft, Sparkles, Send } from 'lucide-react'

interface Props {
  onBack: () => void
}

export default function AiDiagnosisView({ onBack }: Props) {
  const [symptomInput, setSymptomInput] = useState('')
  const [diagnosing, setDiagnosing] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null)

  const handleDiagnose = async () => {
    if (!symptomInput.trim()) return

    setDiagnosing(true)
    try {
      const res = await fetch('/api/syndrome-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomInput,
        }),
      })
      const data = await res.json()
      setDiagnosisResult(data)
    } catch (err) {
      console.error('Diagnosis error:', err)
      setDiagnosisResult({
        success: false,
        error: '诊断失败，请重试',
      })
    } finally {
      setDiagnosing(false)
    }
  }

  return (
    <div className="fullscreen-panel flex flex-col">
      {/* 头部 */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <button onClick={onBack}>
          <ArrowLeft size={22} style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>智能辨证</h2>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>AI辅助诊断证型</span>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--green)]/20">
          <Sparkles size={16} style={{ color: 'var(--green)' }} />
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        {/* 欢迎提示 */}
        {!diagnosing && !diagnosisResult && (
          <div className="card bg-gradient-to-r from-[var(--green)]/10 to-[var(--gold)]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--green)]/20">
                <Sparkles size={20} style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>您好！我是您的中医智能辨证助手</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  请描述您的症状（如：神疲乏力、食欲差、舌淡胖有齿痕等），我会为您分析证型并给出调理建议。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 诊断结果 */}
        {diagnosisResult && (
          <div className="space-y-4 animate-fade-in">
            {diagnosisResult.aiExplanation && (
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} style={{ color: 'var(--green)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--green)' }}>AI辨证分析</span>
                  {diagnosisResult.source === 'hybrid' && (
                    <span className="tag bg-[var(--gold)]/20 text-[var(--gold)]">量化+AI</span>
                  )}
                  {diagnosisResult.source === 'local' && (
                    <span className="tag bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]">量化引擎</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                  {diagnosisResult.aiExplanation}
                </p>
              </div>
            )}

            {diagnosisResult.results && diagnosisResult.results.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>匹配证型</span>
                </div>
                <div className="space-y-3">
                  {diagnosisResult.results.map((r: any, i: number) => (
                    <div key={i} className="border-l-4 pl-3" style={{ borderColor: i === 0 ? 'var(--gold)' : 'var(--text-secondary)/30' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{r.syndrome}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--gold)]/20 text-[var(--gold)]">
                          {Math.round(r.score * 100)}%匹配
                        </span>
                        {i === 0 && <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">最可能</span>}
                      </div>
                      <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{r.definition}</p>
                      {r.careAdvice && (
                        <div className="mt-2 p-2 rounded-lg bg-[var(--bg-card)]">
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="font-bold">食疗：</span>{r.careAdvice.diet}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diagnosisResult.differentialInfo && (
              <div className="card bg-[var(--gold)]/5 border-[var(--gold)]/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>证型鉴别</span>
                </div>
                <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <p><span className="font-medium">相似：</span>{diagnosisResult.differentialInfo.similarities.join('、')}</p>
                  <p><span className="font-medium">关键区别：</span>{diagnosisResult.differentialInfo.keyPoint}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 诊断中 */}
        {diagnosing && (
          <div className="card text-center py-8">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--green)] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>正在辨证分析中...</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              量化诊断引擎 + AI智能分析
            </p>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="sticky bottom-0 p-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
        <div className="flex items-end gap-2">
          <textarea
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            placeholder="描述您的症状，如：神疲乏力、食欲差、舌淡胖有齿痕..."
            className="flex-1 card py-3 px-4 text-sm resize-none"
            rows={2}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              minHeight: '80px',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleDiagnose()
              }
            }}
          />
          <button
            onClick={handleDiagnose}
            disabled={!symptomInput.trim() || diagnosing}
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--green)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={20} style={{ color: 'white' }} />
          </button>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
          ⚠️ 本建议仅供参考，不替代医生诊断。如有严重不适，请及时就医。
        </p>
      </div>
    </div>
  )
}
