'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { dataService } from '@/lib/data-service'
import type { DietRecord as DietRecordType } from '@/lib/database.types'
import { Plus, TrendingDown, X, Camera, Sparkles, Loader2, CheckCircle2, AlertCircle, ChevronRight, UtensilsCrossed, Leaf, Flame, Droplets, Zap, Pill } from 'lucide-react'
import dynamic from 'next/dynamic'

const MedicineTab = dynamic(() => import('@/components/record/MedicineTab'), { ssr: false })

type RecordTab = 'diet' | 'weight' | 'medicine'

interface DietRecord {
  id: string
  food: string
  calories: number
  time: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

// MealType 映射
const MEAL_TYPE_MAP: Record<DietRecord['type'], import('@/lib/database.types').MealType> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}
const REVERSE_MEAL_TYPE_MAP: Record<string, DietRecord['type']> = {
  '早餐': 'breakfast', '午餐': 'lunch', '晚餐': 'dinner', '加餐': 'snack', '零食': 'snack',
}

interface FoodRecognitionResult {
  name: string
  calories: number
  category: string
  portion: string
  tcmNature?: string
  tcmAdvice: string
  constitutionFit: string[]
  constitutionAvoid?: string[]
  nutrients: { protein: number; carbs: number; fat: number; fiber: number }
  confidence: number
  candidates?: { name: string; calories: number; confidence: number }[]
}

const mealTypeKeys = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const mealEmojis: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

const commonFoods = [
  { name: '米饭(一碗)', cal: 230 },
  { name: '馒头(1个)', cal: 220 },
  { name: '鸡胸肉(100g)', cal: 133 },
  { name: '鸡蛋(1个)', cal: 78 },
  { name: '牛奶(250ml)', cal: 160 },
  { name: '苹果(1个)', cal: 72 },
  { name: '香蕉(1根)', cal: 89 },
  { name: '豆腐(100g)', cal: 73 },
  { name: '西兰花(100g)', cal: 34 },
  { name: '红薯(1个)', cal: 112 },
  { name: '燕麦粥(碗)', cal: 150 },
  { name: '酸奶(200ml)', cal: 130 },
]

// 分类图标映射
const categoryIcons: Record<string, string> = {
  '主食': '🍚',
  '蔬菜': '🥬',
  '肉类': '🥩',
  '汤类': '🍲',
  '饮品': '🧋',
  '水果': '🍎',
  '零食': '🍿',
  '其他': '🍽️',
}

// 置信度颜色
function getConfidenceColor(confidence: number) {
  if (confidence >= 0.85) return 'text-green-500'
  if (confidence >= 0.7) return 'text-yellow-500'
  return 'text-orange-500'
}

export default function RecordPage() {
  const { todayCalories, addCalories, currentWeight, setWeight, addPoints } = useStore()
  const { t } = useTranslation()
  const mealTypes = [
    { key: 'breakfast' as const, label: t.record.breakfast, emoji: '🌅' },
    { key: 'lunch' as const, label: t.record.lunch, emoji: '☀️' },
    { key: 'dinner' as const, label: t.record.dinner, emoji: '🌙' },
    { key: 'snack' as const, label: t.record.snack, emoji: '🍎' },
  ]
  const [tab, setTab] = useState<RecordTab>('diet')
  const [showAddDiet, setShowAddDiet] = useState(false)
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [records, setRecords] = useState<DietRecord[]>([])
  const [weightInput, setWeightInput] = useState('')

  // ─── 从 DataService 加载今日记录（页面挂载时）───
  useEffect(() => {
    dataService.diet.getTodayRecords().then((dietRecords) => {
      // 将 DietRecordType 转换为 UI 所需格式
      setRecords(dietRecords.map((r) => ({
        id: r.id,
        food: r.food_name,
        calories: r.calories,
        time: new Date(r.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        type: (REVERSE_MEAL_TYPE_MAP[r.meal_type] || r.meal_type as DietRecord['type']) || 'lunch',
      })))
    })
  }, [])

  // ─── AI 拍照识别状态 ───
  const [showCamera, setShowCamera] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [recognitionResult, setRecognitionResult] = useState<FoodRecognitionResult | null>(null)
  const [recognitionError, setRecognitionError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 选择图片文件
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setRecognitionError('请选择图片文件（JPG/PNG/WebP）')
      return
    }

    // 验证文件大小 (最大10MB)
    if (file.size > 10 * 1024 * 1024) {
      setRecognitionError('图片太大，请选择 10MB 以内的图片')
      return
    }

    // 显示预览
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setRecognitionResult(null)
    setRecognitionError('')
    
    // 转为 base64 并调用 API
    await recognizeImage(file)
  }, [])

  // 调用 Gemini API 识别食物
  const recognizeImage = async (file: File) => {
    setRecognizing(true)
    setRecognitionError('')

    try {
      // 压缩图片以减少传输大小
      const compressedBase64 = await compressImage(file)

      const response = await fetch('/api/recognize-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressedBase64,
          mimeType: file.type || 'image/jpeg',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '识别失败')
      }

      setRecognitionResult(data.result)
      setIsDemo(data.demo || false)
    } catch (err: any) {
      console.error('Recognition error:', err)
      setRecognitionError(err.message || '网络错误，请检查连接后重试')
      setRecognitionResult(null)
    } finally {
      setRecognizing(false)
    }
  }

  // 图片压缩（减少 base64 大小）
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // 最大尺寸 1280px（确保AI能清晰识别细节）
        const MAX_SIZE = 1280
        let width = img.width
        let height = img.height

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          } else {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // 输出 JPEG，质量0.9（保证AI识别清晰度）
        resolve(canvas.toDataURL('image/jpeg', 0.9).split(',')[1])
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // 从识别结果添加到饮食记录
  const addFromRecognition = async (type: DietRecord['type']) => {
    if (!recognitionResult) return
    
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    // 通过 DataService 持久化（本地 + 云端）
    const savedRecord = await dataService.diet.addRecord({
      food_name: recognitionResult.name,
      calories: recognitionResult.calories,
      meal_type: MEAL_TYPE_MAP[type],
      source: 'ai_recognition',
      protein: recognitionResult.nutrients.protein,
      fat: recognitionResult.nutrients.fat,
      carbs: recognitionResult.nutrients.carbs,
      ai_confidence: recognitionResult.confidence,
      ai_raw_response: {
        category: recognitionResult.category,
        tcm_nature: recognitionResult.tcmNature,
        tcm_advice: recognitionResult.tcmAdvice,
        constitution_fit: recognitionResult.constitutionFit,
        constitution_avoid: recognitionResult.constitutionAvoid,
      } as Record<string, unknown>,
    })
    
    // 更新 UI 列表
    setRecords([...records, {
      id: savedRecord.id,
      food: recognitionResult.name,
      calories: recognitionResult.calories,
      time,
      type,
    }])
    // 积分和热量由 DataService 内部处理（addPoints + addCalories），无需重复调用
    
    // 关闭所有弹窗，回到主界面
    setShowCamera(false)
    setShowAddDiet(false)
    setRecognitionResult(null)
    setPreviewUrl(null)
  }

  const addDietRecord = async (food: string, cal: number, type: DietRecord['type']) => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    // 通过 DataService 持久化
    const savedRecord = await dataService.diet.addRecord({
      food_name: food,
      calories: cal,
      meal_type: MEAL_TYPE_MAP[type],
      source: 'manual',
    })
    
    setRecords([...records, {
      id: savedRecord.id,
      food,
      calories: cal,
      time,
      type,
    }])
    // 积分和热量由 DataService 内部处理
    setShowAddDiet(false)
  }

  const saveWeight = async () => {
    const w = parseFloat(weightInput)
    if (isNaN(w) || w < 30 || w > 300) return
    
    // 通过 DataService 持久化体重记录
    await dataService.weight.addRecord(w)
    
    // setWeight 和 addPoints 由 DataService 内部调用
    setWeightInput('')
    setShowAddWeight(false)
  }

  // 重置拍照状态
  const resetCamera = () => {
    setPreviewUrl(null)
    setRecognitionResult(null)
    setRecognitionError('')
    setIsDemo(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="px-4 pt-4 pb-4">
      {/* 顶部 */}
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t.record.dietLog}</h1>

      {/* Tab切换 */}
      <div className="flex gap-1.5 mb-4">
        {([
          { key: 'diet', label: t.record.dietLog, emoji: '📝' },
          { key: 'weight', label: t.record.weightLog, emoji: '⚖️' },
          { key: 'medicine', label: '💊 药箱', emoji: '💊' },
        ] as const).map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === tb.key
                ? 'bg-[var(--gold)] text-[#1a1a1a]'
                : 'bg-[var(--bg-card)] border border-[var(--border)]'
            }`}
            style={tab !== tb.key ? { color: 'var(--text-secondary)' } : {}}
          >
            {tb.emoji} {tb.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════ */}
      {/*  饮食记录 Tab                                  */}
      {/* ════════════════════════════════════════ */}
      {tab === 'diet' && (
        <div className="space-y-4">
          {/* 今日热量概览 */}
          <div className="card bg-gradient-to-r from-orange-500/10 to-red-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.record.todayTotal}</p>
                <p className="text-4xl font-bold" style={{ color: 'var(--red)' }}>{todayCalories}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.record.kcal}</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--red)]/20 flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
              </div>
            </div>
          </div>

          {/* 📸 AI拍照识别入口卡片 — 置顶醒目位置 */}
          <button
            onClick={() => { setShowCamera(true); resetCamera() }}
            className="card w-full p-4 bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-fuchsia-500/15 
                       border-2 border-dashed border-violet-400/30 hover:border-violet-400/60
                       active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 
                              flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-400/40 transition-shadow">
                <Camera size={22} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{t.record.aiCameraTitle}</span>
                  <Sparkles size={14} className="text-violet-400 animate-pulse" />
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  拍一拍，自动识别食物+热量+中医建议 ✨
                </p>
              </div>
              <ChevronRight size={18} className="text-violet-400/50 group-hover:text-violet-400 transition-colors" />
            </div>
          </button>

          {/* 各餐记录 */}
          {mealTypes.map((meal) => {
            const mealRecords = records.filter((r) => r.type === meal.key)
            const mealCal = mealRecords.reduce((s, r) => s + r.calories, 0)
            return (
              <div key={meal.key} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meal.emoji}</span>
                    <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{meal.label}</span>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {mealCal > 0 ? `${mealCal} kcal` : '未记录'}
                  </span>
                </div>
                {mealRecords.length > 0 ? (
                  <div className="space-y-1">
                    {mealRecords.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-sm py-1.5 px-2 -mx-2 rounded-lg hover:bg-[var(--bg-secondary)]/50">
                        <span style={{ color: 'var(--text-primary)' }}>{r.food}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{r.calories}kcal · {r.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>{t.record.noData}</p>
                )}
                <button
                  onClick={() => setShowAddDiet(true)}
                  className="mt-2 text-sm flex items-center gap-1 text-[var(--gold)]"
                >
                  <Plus size={14} /> 添加{meal.label}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/*  体重记录 Tab                                  */}
      {/* ════════════════════════════════════════ */}
      {tab === 'weight' && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-r from-purple-500/10 to-blue-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.record.weightLog}</p>
                <p className="text-4xl font-bold" style={{ color: '#8B5CF6' }}>
                  {currentWeight || '--'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.record.kg}</p>
              </div>
              <TrendingDown size={40} style={{ color: '#8B5CF6' }} className="opacity-30" />
            </div>
          </div>

          <button
            onClick={() => setShowAddWeight(true)}
            className="card w-full flex items-center justify-center gap-2 py-6 hover:border-[var(--gold)]"
          >
            <Plus size={20} style={{ color: 'var(--gold)' }} />
            <span className="font-bold text-base" style={{ color: 'var(--gold)' }}>{t.record.weightLog}</span>
          </button>

          {records.length === 0 && (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                开始记录体重，追踪减脂进度
              </p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/*  💊 药箱管理 Tab                           */}
      {/* ════════════════════════════════════════ */}
      {tab === 'medicine' && <MedicineTab />}

      {/* ══════════════════════════════════════════════════ */}
      {/*  📸 AI 拍照识别弹窗                                        */}
      {/* ══════════════════════════════════════════════════ */}
      {showCamera && (
        <div className="fullscreen-panel overflow-y-auto">
          {/* 头部 */}
          <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-xl px-4 py-4 -mx-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Sparkles size={22} className="text-violet-400" />
                AI 食物识别
              </h2>
              <button
                onClick={() => { setShowCamera(false); resetCamera() }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)]"
              >
                <X size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>

          <div className="px-4 py-5 space-y-4">
            {/* 上传区域 */}
            {!previewUrl && !recognizing && !recognitionResult && (
              <label className="block cursor-pointer group">
                <div className="border-2 border-dashed border-violet-300/40 rounded-2xl p-8 text-center
                                hover:border-violet-400/70 hover:bg-violet-500/5 transition-all duration-300 group-active:scale-[0.99]">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 
                              flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30 transition-all">
                    <Camera size={28} className="text-violet-400" />
                  </div>
                <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                  {t.record.aiCameraHint}
                </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    支持 JPG / PNG / WebP，最大 10MB
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-3">
                    <Sparkles size={14} className="text-violet-400" />
                    <span className="text-sm text-violet-400">Gemini AI 多模态识别 + 中医食疗分析</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}

            {/* 图片预览区 */}
            {previewUrl && !recognitionResult && (
              <div className="relative rounded-2xl overflow-hidden bg-black/5">
                <img
                  src={previewUrl}
                  alt="预览食物图片"
                  className="w-full max-h-64 object-contain mx-auto"
                />
                {/* 重新拍摄按钮 */}
                <button
                  onClick={resetCamera}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm 
                             text-white flex items-center justify-center hover:bg-black/70"
                >
                  <X size={16} />
                </button>
                
                {/* 识别中状态 */}
                {recognizing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                    <Loader2 size={42} className="text-white animate-spin mb-3" />
                    <p className="text-white text-lg font-medium">AI 正在分析中...</p>
                    <p className="text-white/70 text-sm mt-1">识别食物 · 计算热量 · 中医辨证</p>
                  </div>
                )}
              </div>
            )}

            {/* 错误提示 */}
            {recognitionError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-base font-medium text-red-300">识别失败</p>
                    <p className="text-sm text-red-400/80 mt-1">{recognitionError}</p>
                    <button
                      onClick={resetCamera}
                      className="mt-2 text-sm text-red-400 underline underline-offset-2"
                    >
                      重新拍照
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ 识别结果展示 ═══ */}
            {recognitionResult && (
              <div className="space-y-4 animate-slide-up">
                {/* 缩略图 + 基本信息 */}
                <div className="card p-4">
                  <div className="flex gap-3">
                    {previewUrl && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-secondary)]">
                        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {recognitionResult.name}
                          </p>
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {recognitionResult.portion} · {categoryIcons[recognitionResult.category] || '🍽️'} {recognitionResult.category}
                            {recognitionResult.tcmNature && (
                              <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400">
                                {recognitionResult.tcmNature === '寒' ? '❄️寒' :
                                 recognitionResult.tcmNature === '凉' ? '🌤️凉' :
                                 recognitionResult.tcmNature === '温' ? '☀️温' :
                                 recognitionResult.tcmNature === '热' ? '🔥热' : '⚖️平'}性
                              </span>
                            )}
                          </p>
                        </div>
                        {/* 置信度标签 */}
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full shrink-0 ${getConfidenceColor(recognitionResult.confidence)} 
                                       bg-current/10`}>
                          {(recognitionResult.confidence * 100).toFixed(0)}%匹配
                        </span>
                      </div>
                      
                      {/* 热量大字 */}
                      <div className="mt-3 flex items-baseline gap-1">
                        <Flame size={22} className="text-orange-500" />
                        <span className="text-3xl font-bold text-orange-500">{recognitionResult.calories}</span>
                        <span className="text-sm text-orange-400">kcal</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 候选食物（如果AI给出了多种可能） */}
                {recognitionResult.candidates && recognitionResult.candidates.length > 0 && (
                  <div className="card p-3">
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>🤔 也可能是：</p>
                    <div className="flex flex-wrap gap-2">
                      {recognitionResult.candidates.map((c, i) => (
                        <button key={i}
                          onClick={() => {
                            // 点击候选结果切换为主结果
                            setRecognitionResult({
                              ...recognitionResult,
                              name: c.name,
                              calories: c.calories,
                              confidence: c.confidence,
                            })
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--bg-card)] hover:border-orange-400 active:scale-95 transition-all"
                        >
                          <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                          <span className="text-orange-400">{c.calories}kcal</span>
                          <span className="text-[10px] px-1 rounded bg-current/10" style={{ color: 'var(--text-secondary)' }}>
                            {(c.confidence * 100).toFixed(0)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 营养成分网格 */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: UtensilsCrossed, label: '蛋白质', value: recognitionResult.nutrients.protein, unit: 'g', color: 'text-red-400', bg: 'bg-red-500/10' },
                    { icon: Zap, label: '碳水', value: recognitionResult.nutrients.carbs, unit: 'g', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    { icon: Droplets, label: '脂肪', value: recognitionResult.nutrients.fat, unit: 'g', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { icon: Leaf, label: '纤维', value: recognitionResult.nutrients.fiber, unit: 'g', color: 'text-green-400', bg: 'bg-green-500/10' },
                  ].map((n) => (
                    <div key={n.label} className={`${n.bg} rounded-xl p-3 text-center`}>
                      <n.icon size={20} className={`mx-auto ${n.color}`} />
                      <p className="text-base font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{n.value}{n.unit}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{n.label}</p>
                    </div>
                  ))}
                </div>

                {/* 中医食疗建议卡 */}
                <div className="card p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌿</span>
                    <span className="text-base font-bold text-emerald-400">中医食疗建议</span>
                  </div>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {recognitionResult.tcmAdvice}
                  </p>

                  {/* 适配体质标签 */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-emerald-500/10">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>✅ 适宜：</span>
                    {recognitionResult.constitutionFit.map((c) => (
                      <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                        {c}
                      </span>
                    ))}
                    {recognitionResult.constitutionAvoid && recognitionResult.constitutionAvoid.length > 0 && (
                      <>
                        <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>⚠️ 少食：</span>
                        {recognitionResult.constitutionAvoid.map((c) => (
                          <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-medium">
                            {c}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Demo 提示 */}
                {isDemo && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <p className="text-sm text-amber-300">
                      当前为演示模式。配置 GEMINI_API_KEY 后可使用真实 AI 识别。
                    </p>
                  </div>
                )}

                {/* 操作按钮组 */}
                <div className="space-y-3 pb-2">
                  <p className="text-sm font-medium text-center" style={{ color: 'var(--text-secondary)' }}>
                    将此食物记录到哪一餐？
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {mealTypes.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => addFromRecognition(m.key)}
                        className="py-4 rounded-xl font-bold text-base bg-gradient-to-r from-violet-600 to-fuchsia-600
                                   text-white active:scale-[0.97] transition-all flex items-center justify-center gap-2
                                   shadow-lg shadow-violet-500/25"
                      >
                        <CheckCircle2 size={18} />
                        {m.emoji} 加入{m.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={resetCamera}
                    className="w-full py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    重新拍照识别
                  </button>
                </div>
              </div>
            )}

            {/* 使用提示（仅在未识别时显示） */}
            {!recognitionResult && !recognizing && (
              <div className="rounded-xl bg-violet-500/5 border border-violet-500/10 p-4 space-y-3">
                <p className="text-sm font-bold text-violet-300">💡 使用小贴士</p>
                <ul className="space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>正对食物拍摄，光线充足效果最佳</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>单独拍一道菜比拍整桌菜更准确</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>AI 会自动给出中医体质适配建议</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/*  添加饮食弹窗（原始：手动选择）                         */}
      {/* ══════════════════════════════════════════════════ */}
      {showAddDiet && !showCamera && (
        <div className="fullscreen-panel px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>添加饮食</h2>
            <button onClick={() => setShowAddDiet(false)}><X size={20} style={{ color: 'var(--text-secondary)' }} /></button>
          </div>
          
          {/* AI拍照入口 */}
          <button
            onClick={() => { setShowAddDiet(false); setShowCamera(true); resetCamera() }}
            className="w-full mb-4 p-3 rounded-xl border-2 border-dashed border-violet-400/40 
                       flex items-center justify-center gap-2 hover:bg-violet-500/5 hover:border-violet-400/60 transition-all"
          >
            <Camera size={18} className="text-violet-400" />
            <span className="text-base font-bold text-violet-400">或用 AI 拍照识别</span>
            <Sparkles size={14} className="text-violet-400/60 animate-pulse" />
          </button>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {mealTypes.map((m) => (
              <div key={m.key} className="text-center text-sm font-bold py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                {m.emoji} {m.label}
              </div>
            ))}
          </div>
          <p className="text-base font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>常见食物</p>
          <div className="grid grid-cols-2 gap-2">
            {commonFoods.map((f) => (
              <button
                key={f.name}
                onClick={() => addDietRecord(f.name, f.cal, 'lunch')}
                className="card text-left py-3.5 hover:border-[var(--gold)] active:scale-95 transition-all"
              >
                <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>{f.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f.cal} kcal</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/*  添加体重弹窗                                          */}
      {/* ══════════════════════════════════════════════════ */}
      {showAddWeight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddWeight(false)}>
          <div className="card mx-6 w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t.record.weightLog}</h3>
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder={t.record.currentWeightPlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--gold)] mb-4"
              step="0.1"
              min="30"
              max="300"
            />
            <button
              onClick={saveWeight}
              disabled={!weightInput}
              className="btn-gold w-full py-3 disabled:opacity-40"
            >
              {t.record.saveWeight}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
