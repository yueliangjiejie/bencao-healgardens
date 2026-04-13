'use client'

import { useEffect, useState } from 'react'

export type SceneType = 'bedroom' | 'hospital' | 'office' | 'outdoor' | 'kitchen' | 'garden'

interface SceneBackgroundProps {
  scene?: SceneType
  children: React.ReactNode
}

export default function SceneBackground({ scene = 'bedroom', children }: SceneBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 场景映射到背景渐变色
  const sceneGradients: Record<SceneType, { light: string; dark: string }> = {
    bedroom: {
      light: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', // 温暖的卧室
      dark: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
    },
    hospital: {
      light: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)', // 清洁的医院
      dark: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
    },
    office: {
      light: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', // 专业办公室
      dark: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
    },
    outdoor: {
      light: 'linear-gradient(135deg, #DCFCE7 0%, #86EFAC 100%)', // 自然户外
      dark: 'linear-gradient(135deg, #064E3B 0%, #14532D 100%)',
    },
    kitchen: {
      light: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)', // 温馨厨房
      dark: 'linear-gradient(135deg, #292524 0%, #44403C 100%)',
    },
    garden: {
      light: 'linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)', // 中医草药园
      dark: 'linear-gradient(135deg, #065F46 0%, #14532D 100%)',
    },
  }

  const current = sceneGradients[scene]

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--bg-primary)]">{children}</div>
  }

  return (
    <div
      className="min-h-screen transition-all duration-700"
      style={{
        background: current.light,
      }}
    >
      {/* 深色模式遮罩 */}
      <div
        className="absolute inset-0 transition-opacity duration-700 dark:opacity-100 opacity-0"
        style={{ background: current.dark }}
      />
      {/* 场景装饰层（可扩展像素图案） */}
      <div
        className="absolute inset-0 opacity-5 dark:opacity-3 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      {/* 内容 */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
