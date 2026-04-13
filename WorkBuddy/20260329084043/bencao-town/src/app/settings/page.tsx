'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { CONSTITUTION_INFO, SCENES } from '@/lib/constants'
import { authService } from '@/lib/auth-service'
import { useAuthInit } from '@/components/AuthProvider'
import {
  User, Coins, Star,
  ChevronRight, Settings, Heart,
  BarChart3, Award, Shield, CheckCircle2, ShoppingCart, LogOut, LogIn, Wifi, WifiOff, Sparkles,
  Map
} from 'lucide-react'

// ─── 积分商城数据 ───
const SHOP_ITEMS = [
  { id: 'saddle', name: '金丝马鞍', emoji: '🪄', cost: 200, type: 'coins', category: '装扮' },
  { id: 'hat', name: '皇冠头饰', emoji: '👑', cost: 150, type: 'coins', category: '装扮' },
  { id: 'bell', name: '铜铃铛', emoji: '🔔', cost: 80, type: 'coins', category: '装扮' },
  { id: 'bed', name: '豪华马厩', emoji: '🏠', cost: 500, type: 'coins', category: '马厩' },
  { id: 'recipe1', name: '九蒸九晒黑芝麻丸', emoji: '⚫', cost: 100, type: 'points', category: '食疗' },
  { id: 'recipe2', name: '八珍糕方', emoji: '🍰', cost: 150, type: 'points', category: '食疗' },
  { id: 'recipe3', name: '四物汤包', emoji: '🍵', cost: 120, type: 'points', category: '食疗' },
  { id: 'recipe4', name: '健脾养胃粥料', emoji: '🍲', cost: 80, type: 'points', category: '食疗' },
]

// ─── 成就列表 ───
const ACHIEVEMENTS = [
  { id: 'first_login', name: '初来乍到', emoji: '🌟', desc: '首次登录', unlocked: true },
  { id: 'first_quiz', name: '知己知彼', emoji: '📋', desc: '完成体质测评', unlocked: true },
  { id: 'first_horse', name: '骏马结缘', emoji: '🐴', desc: '领养第一匹马', unlocked: true },
  { id: 'streak_7', name: '坚持七天', emoji: '🔥', desc: '连续打卡7天', unlocked: false },
  { id: 'streak_21', name: '习惯养成', emoji: '💪', desc: '连续打卡21天', unlocked: false },
  { id: 'cards_30', name: '博学多才', emoji: '📚', desc: '阅读30张知识卡片', unlocked: false },
  { id: 'games_10', name: '游戏达人', emoji: '🎮', desc: '玩10次小游戏', unlocked: false },
  { id: 'weight_5', name: '初见成效', emoji: '⚖️', desc: '减重5斤', unlocked: false },
]

export default function SettingsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { isOnline, isDemoMode } = useAuthInit()
  const {
    constitution, horse, points, coins, streak,
    todayCalories, currentWeight, totalCardsRead,
    spendCoins, spendPoints, isLoggedIn, userId,
    currentScene, changeScene
  } = useStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'shop' | 'bag' | 'stats' | 'scene'>('profile')
  const [selectedScene, setSelectedScene] = useState<keyof typeof SCENES | null>(null)
  // 商城购买反馈
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null)

  // 购买商品
  const handlePurchase = (item: typeof SHOP_ITEMS[0]) => {
    if (item.type === 'coins' && coins >= item.cost) {
      spendCoins(item.cost)
      showPurchaseFeedback(`🎉 获得 ${item.name}！`)
      setPurchasedItems(prev => [...prev, item.id])
    } else if (item.type === 'points' && points >= item.cost) {
      spendPoints(item.cost)
      showPurchaseFeedback(`🎉 获得 ${item.name}！`)
      setPurchasedItems(prev => [...prev, item.id])
    }
  }

  // 显示购买提示（2秒后自动消失）
  const showPurchaseFeedback = (msg: string) => {
    setPurchaseToast(msg)
    setTimeout(() => setPurchaseToast(null), 2000)
  }

  // 退出登录
  const handleLogout = async () => {
    await authService.signOut()
    router.push('/login')
  }

  const constitutionData = constitution ? CONSTITUTION_INFO[constitution] : null

  // ─── 个人资料页 ───
  if (activeTab === 'profile') {
    return (
      <div className="px-4 pt-4 pb-4">
        {/* 头像区 */}
        <div className="card flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gold)]/30 to-[var(--green)]/20 flex items-center justify-center text-3xl">
            {horse ? { '金鬃骏马': '🐴', '蓝紫灵马': '🦄', '赤棕壮马': '🐎', '粉樱萌马': '🎠' }[horse.style] || '🐴' : '👤'}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {horse?.name || '未命名'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {constitution && (
                <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">{constitution}</span>
              )}
              {horse && (
                <span className="tag bg-[var(--green)]/15 text-[var(--green)]">{horse.level}</span>
              )}
            </div>
          </div>
          <button className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]"
            onClick={() => {}}>
            <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* 数据总览 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card bg-gradient-to-br from-amber-500/10 to-amber-600/5">
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} style={{ color: 'var(--gold)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>养生积分</span>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--gold)' }}>{points}</span>
          </div>
          <div className="card bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={14} style={{ color: '#F59E0B' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>马粮币</span>
            </div>
            <span className="text-xl font-bold" style={{ color: '#F59E0B' }}>{coins}</span>
          </div>
        </div>

        {/* 体质信息 */}
        {constitutionData && (
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{constitutionData.emoji}</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{constitutionData.title}</span>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{constitutionData.desc}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-[var(--green)]/10">
                <p className="text-xs font-bold" style={{ color: 'var(--green)' }}>✅ 推荐饮食</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{constitutionData.diet}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--red)]/10">
                <p className="text-xs font-bold" style={{ color: 'var(--red)' }}>❌ 避免饮食</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{constitutionData.avoid}</p>
              </div>
            </div>
          </div>
        )}

        {/* 功能入口 */}
        <div className="space-y-2">
          <button onClick={() => setActiveTab('scene')}
            className="card w-full text-left flex items-center gap-3 hover:border-[var(--gold)] transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/10 flex items-center justify-center text-xl">🌅</div>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>场景切换</span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>切换背景场景</p>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>

          <button onClick={() => setActiveTab('shop')}
            className="card w-full text-left flex items-center gap-3 hover:border-[var(--gold)] transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 flex items-center justify-center text-xl">🏪</div>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>积分商城</span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>兑换食疗方、马匹装扮</p>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>

          <button onClick={() => setActiveTab('bag')}
            className="card w-full text-left flex items-center gap-3 hover:border-[var(--gold)] transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-600/10 flex items-center justify-center text-xl">🎒</div>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>我的背包</span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>查看已获得的物品</p>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>

          <button onClick={() => setActiveTab('stats')}
            className="card w-full text-left flex items-center gap-3 hover:border-[var(--gold)] transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 flex items-center justify-center text-xl">📊</div>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>数据统计</span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>健康数据与成就</p>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>

          <button onClick={() => router.push('/onboard')}
            className="card w-full text-left flex items-center gap-3 hover:border-[var(--gold)] transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/10 flex items-center justify-center text-xl">📋</div>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>重新测评</span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>重新进行体质测试</p>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>

          <button onClick={() => router.push('/enterprise')}
            className="card w-full text-left flex items-center gap-3 hover:border-[var(--gold)] transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))', borderColor: 'rgba(99,102,241,0.2)' }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-600/10 flex items-center justify-center text-xl">🏢</div>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>企业管理中心</span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>HR管理后台 · 员工 · 挑战赛 · 数据</p>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>

          <button onClick={() => router.push('/admin')}
            className="card w-full text-left flex items-center gap-3 hover:border-[var(--gold)] transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.04))', borderColor: 'rgba(239,68,68,0.2)' }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center text-xl">🛡️</div>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>平台管理中心</span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>企业管理 · 用户管理 · 订阅 · 全局统计</p>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {/* ═══ 登录状态 + 退出登录 ═══ */}
          <div className="card mt-2" style={{ background: 'linear-gradient(135deg, rgba(100,116,139,0.06), rgba(100,116,139,0.02))' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-500/15' : isDemoMode ? 'bg-amber-500/15' : 'bg-gray-500/15'}`}>
                {isOnline ? <Wifi size={16} className="text-green-400" /> : isDemoMode ? <Sparkles size={16} className="text-amber-400" /> : <WifiOff size={16} className="text-gray-400" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {isOnline ? '已连接云端' : isDemoMode ? 'Demo 模式（离线）' : '未连接'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {isLoggedIn ? `用户 ID: ${userId?.slice(0, 8)}...` : '尚未登录'}
                </p>
              </div>
            </div>
            {isLoggedIn ? (
              <button onClick={handleLogout}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                           bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-[0.98]">
                <LogOut size={16} /> 退出登录
              </button>
            ) : (
              <button onClick={() => router.push('/login')}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                           bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98]">
                <LogIn size={16} /> 登录 / 注册
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── 积分商城 ───
  if (activeTab === 'shop') {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setActiveTab('profile')} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ← 返回
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.settings.shop}</h1>
        </div>

        {/* 积分余额 */}
        <div className="card flex items-center justify-between mb-4 bg-gradient-to-r from-[var(--gold)]/10 to-[var(--gold)]/5">
          <div className="flex items-center gap-3">
            <Star size={20} style={{ color: 'var(--gold)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>养生积分</p>
              <p className="text-xl font-bold" style={{ color: 'var(--gold)' }}>{points}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Coins size={20} style={{ color: '#F59E0B' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>马粮币</p>
              <p className="text-xl font-bold" style={{ color: '#F59E0B' }}>{coins}</p>
            </div>
          </div>
        </div>

        {/* 商品列表 */}
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🐎 马匹装扮</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SHOP_ITEMS.filter(i => i.category === '装扮' || i.category === '马厩').map(item => {
            const owned = purchasedItems.includes(item.id)
            const canAfford = (item.type === 'coins' ? coins : points) >= item.cost
            return (
              <div key={item.id} className={`card flex flex-col items-center py-4 ${owned ? 'border-[var(--green)] bg-[var(--green)]/5' : ''}`}>
                <span className="text-3xl mb-2">{item.emoji}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                {owned ? (
                  <div className="mt-2 text-xs px-3 py-1.5 rounded-lg font-bold bg-[var(--green)]/20 text-[var(--green)] flex items-center gap-1">
                    <CheckCircle2 size={12} /> 已拥有
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    className={`mt-2 text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                      canAfford
                        ? `${item.type === 'coins' ? 'bg-[var(--gold)] text-[#1A1A1A]' : 'bg-[var(--green)] text-white'} active:scale-95`
                        : 'bg-[var(--bg-card)] border border-[var(--border)] opacity-50'
                    }`}
                  >
                    {item.type === 'coins' ? `🪙 ${item.cost}` : `⭐ ${item.cost}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🍲 食疗配方</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {SHOP_ITEMS.filter(i => i.category === '食疗').map(item => {
            const owned = purchasedItems.includes(item.id)
            const canAfford = (item.type === 'points' && points >= item.cost)
            return (
              <div key={item.id} className={`card flex flex-col items-center py-4 ${owned ? 'border-[var(--green)] bg-[var(--green)]/5' : ''}`}>
                <span className="text-3xl mb-2">{item.emoji}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                {owned ? (
                  <div className="mt-2 text-xs px-3 py-1.5 rounded-lg font-bold bg-[var(--green)]/20 text-[var(--green)] flex items-center gap-1">
                    <CheckCircle2 size={12} /> 已拥有
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    className={`mt-2 text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                      canAfford
                        ? 'bg-[var(--green)] text-white active:scale-95'
                        : 'bg-[var(--bg-card)] border border-[var(--border)] opacity-50'
                    }`}
                  >
                    ⭐ {item.cost}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 购买成功提示 */}
        {purchaseToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] card px-5 py-3 animate-scale-in shadow-xl"
               style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.08))', borderColor: 'rgba(74,222,128,0.3)' }}>
            <p className="text-sm font-bold text-green-400 flex items-center gap-2">
              <ShoppingCart size={16} /> {purchaseToast}
            </p>
          </div>
        )}
      </div>
    )
  }

  // ─── 我的背包 ───
  if (activeTab === 'bag') {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setActiveTab('profile')} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ← 返回
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.settings.bag}</h1>
        </div>

        {horse ? (
          <>
            {/* 马匹信息卡 */}
            <div className="card bg-gradient-to-br from-[var(--gold)]/10 to-[var(--green)]/5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">
                  {({ '金鬃骏马': '🐴', '蓝紫灵马': '🦄', '赤棕壮马': '🐎', '粉樱萌马': '🎠' })[horse.style] || '🐴'}
                </span>
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{horse.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">{horse.level}</span>
                    <span className="tag bg-[var(--green)]/15 text-[var(--green)]">{horse.fur}</span>
                  </div>
                </div>
              </div>
              {/* 马匹属性 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-[var(--bg-primary)]/50">
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>心情</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--gold)' }}>{horse.mood}/100</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--bg-primary)]/50">
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>饱腹</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>{horse.hunger}/100</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--bg-primary)]/50">
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>清洁</p>
                  <p className="text-sm font-bold" style={{ color: '#60A5FA' }}>{horse.clean}/100</p>
                </div>
              </div>
            </div>

            {/* 装扮栏 */}
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>当前装扮</h2>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="card flex flex-col items-center py-3">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>头饰</span>
                <span className="text-xl mt-1">—</span>
              </div>
              <div className="card flex flex-col items-center py-3">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>马鞍</span>
                <span className="text-xl mt-1">—</span>
              </div>
              <div className="card flex flex-col items-center py-3">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>铃铛</span>
                <span className="text-xl mt-1">—</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p style={{ color: 'var(--text-secondary)' }}>还没有领养马匹</p>
          </div>
        )}
      </div>
    )
  }

  // ─── 数据统计 ───
  if (activeTab === 'stats') {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setActiveTab('profile')} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ← 返回
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.settings.stats}</h1>
        </div>

        {/* 健康数据概览 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card bg-gradient-to-br from-red-500/10 to-red-600/5">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>今日热量</p>
            <p className="text-xl font-bold" style={{ color: '#EF4444' }}>{todayCalories || 0}<span className="text-xs ml-1">kcal</span></p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>当前体重</p>
            <p className="text-xl font-bold" style={{ color: '#8B5CF6' }}>{currentWeight || '--'}<span className="text-xs ml-1">kg</span></p>
          </div>
          <div className="card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>连续打卡</p>
            <p className="text-xl font-bold" style={{ color: '#10B981' }}>{streak}<span className="text-xs ml-1">天</span></p>
          </div>
          <div className="card bg-gradient-to-br from-amber-500/10 to-amber-600/5">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>阅读卡片</p>
            <p className="text-xl font-bold" style={{ color: '#F59E0B' }}>{totalCardsRead}<span className="text-xs ml-1">张</span></p>
          </div>
        </div>

        {/* 积分汇总 */}
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>💰 资产总览</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card bg-gradient-to-br from-yellow-500/15 to-amber-600/5 border-[var(--gold)]/30">
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} style={{ color: 'var(--gold)' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>养生积分</p>
            </div>
            <p className="text-2xl font-black" style={{ color: 'var(--gold)' }}>{points}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>可用于兑换食疗方</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-500/15 to-yellow-600/5 border-amber-400/30">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={14} style={{ color: '#F59E0B' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>马粮币</p>
            </div>
            <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>{coins}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>可用于购买马匹装扮</p>
          </div>
        </div>

        {/* 积分获取指南 */}
        <div className="card p-3 mb-4" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(74,124,89,0.04))', borderColor: 'rgba(255,215,0,0.12)' }}>
          <h3 className="text-sm font-bold mb-2 flex items-center gap-1" style={{ color: 'var(--gold)' }}>
            <Award size={14} /> 如何赚取积分
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <span>📸 AI识别食物 +3</span><span>🍽️ 手动记录饮食 +1</span>
            <span>⚖️ 记录体重 +2</span><span>🧠 翻牌通关 +15</span>
            <span>✅ 每日打卡 +5~10</span><span>🐴 喂马/清洁 +5</span>
            <span>🎮 和小马玩耍 +5</span><span>🏃 运动打卡 +10</span>
          </div>
        </div>

        {/* 成就系统 */}
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🏆 成就墙</h2>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map(ach => (
            <div key={ach.id} className={`card flex items-center gap-2 ${!ach.unlocked ? 'opacity-40' : ''}`}>
              <span className="text-xl">{ach.emoji}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{ach.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── 场景选择 ───
  if (activeTab === 'scene') {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setActiveTab('profile')} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ← 返回
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>切换场景</h1>
        </div>

        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>选择你喜欢的背景场景</p>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(SCENES).map(([key, scene]) => (
            <button
              key={key}
              onClick={() => {
                changeScene(key as any)
                setActiveTab('profile')
              }}
              className={`card flex flex-col items-center py-4 transition-all ${
                currentScene === key
                  ? 'border-[var(--gold)] shadow-[0_0_20px_rgba(255,215,0,0.3)] bg-[var(--gold)]/5'
                  : 'hover:border-[var(--gold)]/50'
              }`}
            >
              <span className="text-4xl mb-2">{scene.emoji}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{scene.name}</span>
              <span className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{scene.desc}</span>
              {currentScene === key && (
                <div className="mt-2 flex items-center gap-1 text-xs text-[var(--gold)]">
                  <CheckCircle2 size={12} />
                  <span>当前场景</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return null
}
