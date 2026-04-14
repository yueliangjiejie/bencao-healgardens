'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { searchAcupoint, getAcupointsBySymptom, ACUPOINT_DATABASE, type Acupoint } from '@/lib/acupoint-db'
import AcupointDiagram from '@/components/AcupointDiagram'
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2, MapPin, Hand, ChevronDown, ChevronUp, Eye } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  /** 匹配到的穴位ID列表（用于配图） */
  acupointIds?: string[]
  /** 匹配到的穴位详情 */
  acupointDetails?: Acupoint[]
}

/** 从回复内容中提取穴位名称并查询详情 */
function extractAcupoints(content: string): { ids: string[]; details: Acupoint[] } {
  const ids: string[] = []
  const details: Acupoint[] = []
  ACUPOINT_DATABASE.forEach(p => {
    if (content.includes(p.name)) {
      ids.push(p.id)
      details.push(p)
    }
  })
  return { ids, details }
}

interface QuickQuestion {
  label: string
  question: string
  icon: string
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  { label: '我适合吃什么', question: '根据我的体质，推荐适合的食物', icon: '🍽️' },
  { label: '失眠怎么办', question: '经常失眠，有什么穴位可以按摩助眠？', icon: '💤' },
  { label: '推荐穴位', question: '推荐几个日常保健穴位和按摩方法', icon: '💆' },
  { label: '减脂建议', question: '中医角度如何健康减脂？', icon: '🏋️' },
]

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { constitution } = useStore()

  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      const constitutionText = constitution ? `我检测到您的体质是${constitution}。` : ''
      setMessages([{
        role: 'assistant',
        content: `您好👋 我是"小本草"，您的AI中医健康顾问。\n\n${constitutionText}我可以帮您解答食疗养生、穴位按摩、体质调理等问题。\n\n试试下面的快捷问题，或直接输入您想了解的～`,
        timestamp: Date.now()
      }])
    }
  }, [constitution])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 从localStorage恢复对话历史
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai-chat-history')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      }
    } catch {}
  }, [])

  // 保存对话历史
  useEffect(() => {
    if (messages.length > 1) {
      try {
        localStorage.setItem('ai-chat-history', JSON.stringify(messages.slice(-20)))
      } catch {}
    }
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        ...extractAcupoints(data.reply),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，我暂时无法回答。请稍后再试～ 🙏',
        timestamp: Date.now()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (q: QuickQuestion) => {
    let question = q.question
    if (constitution && q.question.includes('体质')) {
      question = `我是${constitution}，${q.question}`
    }
    sendMessage(question)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // 简单Markdown渲染
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // 标题
      if (line.startsWith('# ')) return <h3 key={i} className="font-bold text-base mt-2 mb-1">{line.slice(2)}</h3>
      if (line.startsWith('## ')) return <h4 key={i} className="font-bold text-sm mt-2 mb-1">{line.slice(3)}</h4>
      // 列表
      if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-3 list-disc">{renderInline(line.slice(2))}</li>
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+\.)\s(.*)$/)
        if (match) return <li key={i} className="ml-3 list-decimal"><span className="font-medium">{match[1]}</span> {renderInline(match[2])}</li>
      }
      // 分割线
      if (line.startsWith('---')) return <hr key={i} className="my-2 border-border/30" />
      // 空行
      if (!line.trim()) return <br key={i} />
      // 普通行
      return <p key={i} className="leading-relaxed">{renderInline(line)}</p>
    })
  }

  const renderInline = (text: string) => {
    // 粗体
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  // 检测消息是否包含穴位相关内容
  const hasAcupoints = (content: string) => {
    const keywords = ['穴位', '按摩', '按揉', '配穴', '百会', '涌泉', '合谷', '内关', '足三里', '三阴交', '太冲', '丰隆', '血海', '中脘', '关元', '命门', '肾俞', '肺俞', '列缺']
    return keywords.some(k => content.includes(k))
  }

  // 穴位详情卡片
  const AcupointCard = ({ point }: { point: Acupoint }) => {
    const [expanded, setExpanded] = useState(false)
    return (
      <div className="mt-2 rounded-lg border overflow-hidden text-left"
        style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
        <button onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left">
          <MapPin size={14} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex-1">{point.name} ({point.nameEn})</span>
          {expanded ? <ChevronUp size={14} className="text-emerald-500" /> : <ChevronDown size={14} className="text-emerald-500" />}
        </button>
        {expanded && (
          <div className="px-3 pb-2 space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <p>📍 定位：{point.location}</p>
            <p>👐 按法：{point.massageMethod}</p>
            <p>⏱️ 时长：{point.massageDuration} · {point.massageFrequency}</p>
            <p>✨ 功效：{point.effects.join('、')}</p>
            {point.precautions.length > 0 && (
              <p className="text-amber-600 dark:text-amber-400">⚠️ {point.precautions.join('；')}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // 穴位配图查看器（嵌入消息流）
  const AcupointImageViewer = ({ pointIds }: { pointIds: string[] }) => {
    const [showDiagram, setShowDiagram] = useState(false)
    return (
      <div className="mt-2">
        <button onClick={() => setShowDiagram(!showDiagram)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 transition-colors">
          <Eye size={12} />
          {showDiagram ? '收起穴位图' : '查看穴位定位图'}
        </button>
        {showDiagram && (
          <div className="mt-2 rounded-lg overflow-hidden border"
            style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
            <AcupointDiagram pointIds={pointIds} size={220} />
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* 浮动按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
          aria-label="AI健康顾问"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* 聊天面板 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm sm:inset-auto sm:bottom-0 sm:right-0 sm:w-[400px] sm:h-[600px] sm:max-h-[85vh] sm:rounded-tl-2xl sm:shadow-2xl sm:border sm:border-border/50 sm:absolute sm:bottom-20 sm:right-4">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">小本草 AI顾问</h3>
                <p className="text-xs text-muted-foreground">中医食疗 · 穴位按摩 · 体质调理</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* 头像 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4 text-white" />
                    : <User className="w-4 h-4 text-white" />
                  }
                </div>
                {/* 消息内容 */}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'assistant'
                    ? 'bg-muted/50 rounded-tl-md'
                    : 'bg-primary text-primary-foreground rounded-tr-md'
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-0.5 [&_li]:my-0.5 [&_h3]:my-1 [&_h4]:my-1">
                    {renderContent(msg.content)}
                  </div>

                  {/* 穴位详情卡片 */}
                  {msg.role === 'assistant' && msg.acupointDetails && msg.acupointDetails.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.acupointDetails.slice(0, 3).map(point => (
                        <AcupointCard key={point.id} point={point} />
                      ))}
                    </div>
                  )}

                  {/* 穴位配图按钮 */}
                  {msg.role === 'assistant' && msg.acupointIds && msg.acupointIds.length > 0 && (
                    <AcupointImageViewer pointIds={msg.acupointIds} />
                  )}

                  {/* 穴位标记 */}
                  {msg.role === 'assistant' && hasAcupoints(msg.content) && (!msg.acupointIds || msg.acupointIds.length === 0) && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>含穴位按摩指导</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* 加载状态 */}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted/50 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-muted/50 hover:bg-muted border border-border/30 transition-colors disabled:opacity-50"
                  >
                    <span>{q.icon}</span>
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="px-4 py-3 border-t border-border/50 bg-background/50">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="问我任何健康问题..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-full bg-muted/50 border border-border/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white disabled:opacity-30 hover:shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
