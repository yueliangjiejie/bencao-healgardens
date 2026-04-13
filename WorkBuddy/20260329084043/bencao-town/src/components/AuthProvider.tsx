/**
 * 本草纲目药膳小镇 — Auth 初始化 Provider
 * 
 * 职责：
 * 1. 应用启动时检测 Supabase 连接状态
 * 2. 恢复已有 Session（刷新页面不丢失登录态）
 * 3. 启动 Store ↔ Supabase 双向同步
 * 4. Demo 模式自动初始化
 */

'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useStore } from '@/lib/store'
import { authService } from '@/lib/auth-service'
import { dataService } from '@/lib/data-service'
import {
  syncStoreToCloud,
  startAutoSync,
  stopAutoSync,
  startStoreSyncWatcher,
  stopStoreSyncWatcher,
} from '@/lib/store-sync'

interface AuthContextType {
  isReady: boolean
  isOnline: boolean
  isDemoMode: boolean
}

const AuthContext = createContext<AuthContextType>({
  isReady: false,
  isOnline: false,
  isDemoMode: false,
})

export function useAuthInit() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // 1. 初始化 DataService（检测 Supabase 连接）
        const online = await dataService.init()
        if (mounted) {
          setIsOnline(online)

          // 2. 尝试恢复 Session（刷新页面后保持登录态）
          const { user, isDemo } = await authService.getSession()

          if (user) {
            // 有真实用户 session → 启动同步
            if (mounted) {
              setIsOnline(true)
            }
            // 拉取云端数据到本地
            if (dataService.isOnline) {
              await dataService.sync.pullAll()
              await syncStoreToCloud()
            }
            // 启动后台自动同步 + Store 变更监听
            startAutoSync(5 * 60 * 1000) // 每5分钟
            startStoreSyncWatcher()
          } else if (isDemo) {
            // Demo 用户 → 标记为离线模式
            if (mounted) {
              setIsDemoMode(true)
              setIsOnline(false)
            }
          }

          // 3. 如果没有马，且是 Demo 模式或有 userId，引导领养
          const store = useStore.getState()
          if (!store.horse && store.userId) {
            // 已有用户但没有马 → 不在这里强制领养，让用户自己走流程
          }
        }
      } catch (err) {
        console.warn('[AuthProvider] Init failed:', err)
        // 即使失败也标记 ready（降级为纯本地模式）
        if (mounted) {
          setIsDemoMode(true)
        }
      } finally {
        if (mounted) {
          setIsReady(true)
        }
      }
    }

    initAuth()

    // 清理
    return () => {
      mounted = false
      stopAutoSync()
      stopStoreSyncWatcher()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isReady, isOnline, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  )
}
