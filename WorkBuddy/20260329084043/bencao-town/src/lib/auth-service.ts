/**
 * 本草纲目药膳小镇 — Supabase Auth 认证服务
 * 
 * 功能：
 * - 邮箱/密码注册 & 登录
 * - Magic Link 登录
 * - Session 管理
 * - 与 Zustand Store 同步认证状态
 * - Demo 模式（无Supabase时的降级方案）
 */

import { supabase } from './supabase'
import { useStore } from './store'
import { dataService, resetConnectionCheck } from './data-service'
import type { User } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════
// Auth 状态类型
// ═══════════════════════════════════════════════════

export interface AuthState {
  user: User | null
  isLoading: boolean
  isDemo: boolean
  error: string | null
}

// ═══════════════════════════════════════════════════
// AuthService 单例
// ═══════════════════════════════════════════════════

import type { Subscription } from '@supabase/supabase-js'

class AuthService {
  private static instance: AuthService
  private authSubscription: Subscription | null = null

  private constructor() {
    if (typeof window !== 'undefined') {
      this.setupListener()
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // ─── Session 监听 ──────────────────────────────

  private setupListener(): void {
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        const store = useStore.getState()

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              store.login(session.user.id, session.user.email || '')
              await dataService.init()
              if (dataService.isOnline) {
                await dataService.sync.pullAll()
              }
            }
            break

          case 'SIGNED_OUT':
            store.logout()
            resetConnectionCheck()
            break

          case 'TOKEN_REFRESHED':
            break

          case 'USER_UPDATED':
            break
        }
      })
      this.authSubscription = data.subscription
    } catch {
      // Supabase未配置，静默忽略
    }
  }

  // ─── 注册 ──────────────────────────────────────

  async signUp(email: string, password: string, displayName?: string): Promise<{
    success: boolean
    error?: string
    needsConfirmation?: boolean
  }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      })

      if (error) {
        return { success: false, error: this.translateError(error.message) }
      }

      // 检查是否需要邮箱确认
      if (data.user && !data.session) {
        return { success: true, needsConfirmation: true }
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: '网络错误，请检查连接' }
    }
  }

  // ─── 登录 ──────────────────────────────────────

  async signIn(email: string, password: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: this.translateError(error.message) }
      }

      if (data.user) {
        const store = useStore.getState()
        store.login(data.user.id, data.user.email || '')
      }

      return { success: true }
    } catch {
      return { success: false, error: '网络错误，请检查连接' }
    }
  }

  // ─── Magic Link 登录 ──────────────────────────

  async signInWithMagicLink(email: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { success: false, error: this.translateError(error.message) }
      }

      return { success: true }
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  // ─── 登出 ──────────────────────────────────────

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch {
      // 静默处理
    }
    const store = useStore.getState()
    store.logout()
    resetConnectionCheck()
  }

  // ─── 获取当前Session ──────────────────────────

  async getSession(): Promise<{
    user: User | null
    isDemo: boolean
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        return { user: session.user, isDemo: false }
      }
    } catch {
      // Supabase未配置
    }

    // Demo模式：从localStorage读取
    const store = useStore.getState()
    if (store.userId) {
      return { user: null, isDemo: true }
    }

    return { user: null, isDemo: false }
  }

  // ─── Demo 登录（无需Supabase）──────────────────

  demoLogin(displayName: string): void {
    const store = useStore.getState()
    const demoId = `demo-${Date.now()}`
    store.login(demoId, `${displayName}@demo.local`)
    // 不连接Supabase，所有数据在本地
  }

  // ─── 修改密码 ──────────────────────────────────

  async updatePassword(newPassword: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { success: false, error: this.translateError(error.message) }
      }

      return { success: true }
    } catch {
      return { success: false, error: '密码更新失败' }
    }
  }

  // ─── 密码重置邮件 ──────────────────────────────

  async resetPassword(email: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { success: false, error: this.translateError(error.message) }
      }

      return { success: true }
    } catch {
      return { success: false, error: '发送重置邮件失败' }
    }
  }

  // ─── 错误信息翻译 ──────────────────────────────

  private translateError(msg: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': '邮箱或密码不正确',
      'User already registered': '该邮箱已注册',
      'Email not confirmed': '请先确认邮箱',
      'Password should be at least 6 characters': '密码至少需要6个字符',
      'Unable to validate email address: invalid format': '邮箱格式不正确',
      'Email rate limit exceeded': '发送过于频繁，请稍后再试',
      'Request timeout': '请求超时，请重试',
    }

    for (const [key, value] of Object.entries(errorMap)) {
      if (msg.includes(key)) return value
    }

    return msg || '操作失败，请重试'
  }

  // ─── 清理 ──────────────────────────────────────

  destroy(): void {
    this.authSubscription?.unsubscribe()
  }
}

export const authService = AuthService.getInstance()
