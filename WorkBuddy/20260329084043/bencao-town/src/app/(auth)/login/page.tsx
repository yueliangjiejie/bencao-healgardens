'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { authService } from '@/lib/auth-service'
import { dataService } from '@/lib/data-service'
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, Zap, Leaf, Heart, ChevronRight, Loader2, AlertCircle } from 'lucide-react'

type AuthMode = 'login' | 'register' | 'magic' | 'demo' | 'forgot'

export default function LoginPage() {
  const router = useRouter()
  const { isLoggedIn, horse } = useStore()

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // 已登录 → 跳转首页
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/')
    }
  }, [isLoggedIn, router])

  // ─── 处理登录 ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError('')
    const result = await authService.signIn(email, password)
    setLoading(false)

    if (result.success) {
      router.push('/')
    } else {
      setError(result.error || '登录失败')
    }
  }

  // ─── 处理注册 ───
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError('')
    setSuccessMsg('')

    const result = await authService.signUp(email, password, displayName)
    setLoading(false)

    if (result.success) {
      if (result.needsConfirmation) {
        setSuccessMsg('注册成功！请查收邮箱确认链接 📧')
      } else {
        router.push('/')
      }
    } else {
      setError(result.error || '注册失败')
    }
  }

  // ─── Magic Link 登录 ───
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')
    const result = await authService.signInWithMagicLink(email)
    setLoading(false)

    if (result.success) {
      setSuccessMsg('✨ 魔法链接已发送到你的邮箱，请点击邮件中的链接完成登录！')
    } else {
      setError(result.error || '发送失败')
    }
  }

  // ─── Demo 模式（免登录体验）───
  const handleDemoLogin = () => {
    const names = ['养生达人', '减脂先锋', '药膳小厨', '马术爱好者', '中医学徒']
    const name = names[Math.floor(Math.random() * names.length)]
    authService.demoLogin(name)
    // 初始化 DataService（离线模式）
    dataService.init().then(() => {
      router.push('/')
    })
  }

  // 输入框通用组件
  const InputField = ({
    icon: Icon,
    type = 'text',
    value,
    onChange,
    placeholder,
    autoCapitalize,
  }: {
    icon: React.ElementType
    type?: string
    value: string
    onChange: (v: string) => void
    placeholder: string
    autoCapitalize?: string
  }) => (
    <div className="relative">
      <Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize as any}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] 
                   text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 
                   focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20
                   transition-all"
      />
    </div>
  )

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#0a1628] via-[#0F1419] to-[#0a1628] flex flex-col">
      
      {/* ═══ 顶部装饰背景 ═══ */}
      <div className="absolute top-0 inset-x-0 h-64 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute top-10 -left-20 w-60 h-60 rounded-full bg-violet-500/6 blur-3xl" />
        <div className="absolute top-0 -right-20 w-48 h-48 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      {/* ═══ 主内容区 ═══ */}
      <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
        
        {/* Logo + 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl 
                          bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 
                          shadow-lg shadow-emerald-500/25 mb-4">
            <span className="text-4xl">🌿</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">本草纲目药膳小镇</h1>
          <p className="text-sm text-white/50">AI 中医食疗 · 养宠互动 · 科学减脂</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl backdrop-blur-sm">
          {([
            { key: 'login' as AuthMode, label: '密码登录' },
            { key: 'register' as AuthMode, label: '注册账号' },
            { key: 'magic' as AuthMode, label: '魔法链接' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setMode(tab.key); setError(''); setSuccessMsg('') }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === tab.key
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 错误 / 成功提示 */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 animate-slide-up">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2 animate-slide-up">
            <Sparkles size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-sm text-emerald-300">{successMsg}</span>
          </div>
        )}

        {/* ═══ 密码登录表单 ═══ */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <InputField icon={Mail} type="email" value={email} onChange={setEmail}
                       placeholder="邮箱地址" autoCapitalize="none" />
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] 
                           text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 
                           focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white/70"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-500
                         text-white shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all
                         disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              登 录
            </button>

            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              忘记密码？
            </button>
          </form>
        )}

        {/* ═══ 注册表单 ═══ */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <InputField icon={User} value={displayName} onChange={setDisplayName}
                       placeholder="昵称（选填）" autoCapitalize="words" />
            <InputField icon={Mail} type="email" value={email} onChange={setEmail}
                       placeholder="邮箱地址" autoCapitalize="none" />
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码（至少6位）"
                minLength={6}
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] 
                           text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 
                           focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white/70"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-violet-500 to-fuchsia-500
                         text-white shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all
                         disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              注 册
            </button>
          </form>
        )}

        {/* ═══ Magic Link 表单 ═══ */}
        {mode === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4 mb-2">
              <p className="text-sm text-violet-300 leading-relaxed">
                ✨ 无需密码！输入邮箱后，我们将发送一个<strong>一次性魔法链接</strong>，点击即可安全登录。
              </p>
            </div>
            <InputField icon={Mail} type="email" value={email} onChange={setEmail}
                       placeholder="邮箱地址" autoCapitalize="none" />

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-indigo-500 to-purple-500
                         text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all
                         disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              发送魔法链接 ✨
            </button>
          </form>
        )}

        {/* ═══ 忘记密码 ═══ */}
        {mode === 'forgot' && (
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!email) return
            setLoading(true)
            setError('')
            const result = await authService.resetPassword(email)
            setLoading(false)
            if (result.success) {
              setSuccessMsg('📧 重置密码邮件已发送，请查收！')
            } else {
              setError(result.error || '发送失败')
            }
          }} className="space-y-3">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-2">
              <p className="text-sm text-amber-300">输入注册邮箱，我们将发送密码重置链接</p>
            </div>
            <InputField icon={Mail} type="email" value={email} onChange={setEmail}
                       placeholder="邮箱地址" autoCapitalize="none" />
            <button type="submit" disabled={loading || !email}
              className="btn-gold w-full py-3.5 disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
              发送重置邮件
            </button>
          </form>
        )}
      </div>

      {/* ═══ 底部：Demo 模式入口 + 特性展示 ═══ */}
      <div className="px-6 pb-8 relative z-10">
        {/* 分隔线 */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">或</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Demo 模式按钮 */}
        <button
          onClick={handleDemoLogin}
          className="w-full py-4 rounded-2xl font-bold text-base
                     bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15
                     border-2 border-dashed border-amber-400/30 hover:border-amber-400/60
                     text-amber-300 active:scale-[0.98] transition-all duration-200
                     flex items-center justify-center gap-2 group"
        >
          <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
          免登录体验（Demo 模式）
        </button>

        {/* 特性标签 */}
        <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
          {[
            { icon: Zap, label: 'AI 食物识别', color: 'text-violet-400' },
            { icon: Leaf, label: '9 种体质测评', color: 'text-emerald-400' },
            { icon: Heart, label: '养宠互动', color: 'text-pink-400' },
          ].map((f) => (
            <div key={f.label} className={`flex items-center gap-1 text-xs ${f.color}`}>
              <f.icon size={12} />
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
