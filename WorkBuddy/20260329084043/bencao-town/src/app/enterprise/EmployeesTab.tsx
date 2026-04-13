'use client'

import { useState } from 'react'
import {
  Users, Search, Upload, Mail, Star, Flame,
  ChevronRight, UserCheck, UserX, X,
  Heart, Activity, TrendingUp, TrendingDown,
  Calendar, Weight, Utensils, Droplets, Moon, Zap,
} from 'lucide-react'
import type { ConstitutionType } from '@/lib/enterprise/types'
import { CONSTITUTION_LABELS, CONSTITUTION_TYPES } from '@/lib/enterprise/types'

interface DemoEmployee {
  id: string; name: string; email: string; department: string; position: string
  constitution: ConstitutionType; points: number; streak: number; status: 'active' | 'inactive'
  // 健康详情
  constitutionScores: Record<string, number>; weight: number; weightGoal: number; weightChange: number
  bmi: number; avgDailyCalories: number; caloriesTarget: number
  waterGlasses: number; sleepHours: number; exerciseMinutesWeek: number
  dietRecordsWeek: number; lastDietRecord: string; joinedAt: string
  healthScore: number; mentalScore: number
  recentWeightTrend: number[] // 最近7天体重
}

const EMPLOYEES: DemoEmployee[] = [
  { id: '1', name: '张三', email: 'zhangsan@demo.com', department: '研发部', position: '高级工程师', constitution: '气虚质', points: 2450, streak: 45, status: 'active',
    constitutionScores: { '平和质': 25, '气虚质': 82, '阳虚质': 45, '阴虚质': 20, '痰湿质': 35, '湿热质': 15, '血瘀质': 10, '气郁质': 40, '特禀质': 5 },
    weight: 78.5, weightGoal: 72, weightChange: -3.2, bmi: 26.1, avgDailyCalories: 1850, caloriesTarget: 1600,
    waterGlasses: 6, sleepHours: 6.5, exerciseMinutesWeek: 120, dietRecordsWeek: 18, lastDietRecord: '今天 12:30',
    joinedAt: '2025-12-05', healthScore: 72, mentalScore: 68,
    recentWeightTrend: [81.7, 81.2, 80.8, 80.3, 79.5, 79.0, 78.5] },
  { id: '2', name: '李四', email: 'lisi@demo.com', department: '产品部', position: '产品经理', constitution: '痰湿质', points: 2180, streak: 38, status: 'active',
    constitutionScores: { '平和质': 20, '气虚质': 40, '阳虚质': 30, '阴虚质': 15, '痰湿质': 78, '湿热质': 55, '血瘀质': 25, '气郁质': 35, '特禀质': 8 },
    weight: 85.2, weightGoal: 75, weightChange: -2.8, bmi: 28.4, avgDailyCalories: 2100, caloriesTarget: 1800,
    waterGlasses: 4, sleepHours: 7, exerciseMinutesWeek: 90, dietRecordsWeek: 14, lastDietRecord: '今天 08:15',
    joinedAt: '2025-12-10', healthScore: 65, mentalScore: 72,
    recentWeightTrend: [88.0, 87.5, 87.0, 86.5, 86.0, 85.6, 85.2] },
  { id: '3', name: '王五', email: 'wangwu@demo.com', department: '研发部', position: '前端开发', constitution: '阳虚质', points: 1950, streak: 32, status: 'active',
    constitutionScores: { '平和质': 18, '气虚质': 50, '阳虚质': 85, '阴虚质': 30, '痰湿质': 40, '湿热质': 10, '血瘀质': 20, '气郁质': 45, '特禀质': 5 },
    weight: 68.0, weightGoal: 65, weightChange: -1.5, bmi: 22.7, avgDailyCalories: 1700, caloriesTarget: 1500,
    waterGlasses: 5, sleepHours: 5.5, exerciseMinutesWeek: 60, dietRecordsWeek: 12, lastDietRecord: '昨天 19:00',
    joinedAt: '2025-12-15', healthScore: 70, mentalScore: 62,
    recentWeightTrend: [69.5, 69.3, 69.0, 68.8, 68.5, 68.2, 68.0] },
  { id: '4', name: '赵六', email: 'zhaoliu@demo.com', department: '市场部', position: '市场总监', constitution: '阴虚质', points: 1720, streak: 28, status: 'active',
    constitutionScores: { '平和质': 30, '气虚质': 35, '阳虚质': 25, '阴虚质': 80, '痰湿质': 20, '湿热质': 45, '血瘀质': 30, '气郁质': 50, '特禀质': 10 },
    weight: 62.5, weightGoal: 60, weightChange: -1.0, bmi: 21.8, avgDailyCalories: 1400, caloriesTarget: 1350,
    waterGlasses: 7, sleepHours: 6, exerciseMinutesWeek: 150, dietRecordsWeek: 16, lastDietRecord: '今天 18:45',
    joinedAt: '2026-01-05', healthScore: 78, mentalScore: 65,
    recentWeightTrend: [63.5, 63.3, 63.0, 62.8, 62.7, 62.6, 62.5] },
  { id: '5', name: '钱七', email: 'qianqi@demo.com', department: '运营部', position: '运营主管', constitution: '湿热质', points: 1580, streak: 25, status: 'active',
    constitutionScores: { '平和质': 22, '气虚质': 30, '阳虚质': 15, '阴虚质': 40, '痰湿质': 50, '湿热质': 75, '血瘀质': 20, '气郁质': 35, '特禀质': 8 },
    weight: 76.0, weightGoal: 70, weightChange: -2.0, bmi: 25.3, avgDailyCalories: 1950, caloriesTarget: 1700,
    waterGlasses: 5, sleepHours: 7.5, exerciseMinutesWeek: 80, dietRecordsWeek: 10, lastDietRecord: '今天 07:30',
    joinedAt: '2026-01-15', healthScore: 68, mentalScore: 75,
    recentWeightTrend: [78.0, 77.5, 77.2, 76.8, 76.5, 76.2, 76.0] },
  { id: '6', name: '孙八', email: 'sunba@demo.com', department: '人力资源', position: 'HR经理', constitution: '平和质', points: 1450, streak: 22, status: 'active',
    constitutionScores: { '平和质': 88, '气虚质': 15, '阳虚质': 10, '阴虚质': 8, '痰湿质': 12, '湿热质': 10, '血瘀质': 5, '气郁质': 15, '特禀质': 3 },
    weight: 58.0, weightGoal: 58, weightChange: 0, bmi: 20.1, avgDailyCalories: 1600, caloriesTarget: 1600,
    waterGlasses: 8, sleepHours: 7.5, exerciseMinutesWeek: 180, dietRecordsWeek: 20, lastDietRecord: '今天 12:00',
    joinedAt: '2026-02-01', healthScore: 92, mentalScore: 85,
    recentWeightTrend: [58.2, 58.1, 58.0, 58.1, 58.0, 58.0, 58.0] },
  { id: '7', name: '周九', email: 'zhoujiu@demo.com', department: '财务部', position: '财务主管', constitution: '血瘀质', points: 1320, streak: 18, status: 'inactive',
    constitutionScores: { '平和质': 15, '气虚质': 35, '阳虚质': 30, '阴虚质': 25, '痰湿质': 30, '湿热质': 20, '血瘀质': 72, '气郁质': 55, '特禀质': 8 },
    weight: 72.0, weightGoal: 68, weightChange: -0.5, bmi: 24.0, avgDailyCalories: 1800, caloriesTarget: 1650,
    waterGlasses: 3, sleepHours: 5, exerciseMinutesWeek: 30, dietRecordsWeek: 5, lastDietRecord: '3天前',
    joinedAt: '2026-02-10', healthScore: 58, mentalScore: 55,
    recentWeightTrend: [72.5, 72.3, 72.2, 72.1, 72.0, 72.0, 72.0] },
  { id: '8', name: '吴十', email: 'wushi@demo.com', department: '研发部', position: '后端开发', constitution: '气郁质', points: 1200, streak: 15, status: 'active',
    constitutionScores: { '平和质': 20, '气虚质': 45, '阳虚质': 35, '阴虚质': 30, '痰湿质': 25, '湿热质': 15, '血瘀质': 35, '气郁质': 80, '特禀质': 5 },
    weight: 70.5, weightGoal: 68, weightChange: -1.2, bmi: 23.5, avgDailyCalories: 1750, caloriesTarget: 1600,
    waterGlasses: 4, sleepHours: 6, exerciseMinutesWeek: 45, dietRecordsWeek: 8, lastDietRecord: '昨天 20:00',
    joinedAt: '2026-02-20', healthScore: 65, mentalScore: 58,
    recentWeightTrend: [71.7, 71.5, 71.2, 71.0, 70.8, 70.6, 70.5] },
  { id: '9', name: '郑十一', email: 'zheng11@demo.com', department: '产品部', position: 'UI设计师', constitution: '特禀质', points: 980, streak: 12, status: 'inactive',
    constitutionScores: { '平和质': 18, '气虚质': 25, '阳虚质': 20, '阴虚质': 15, '痰湿质': 15, '湿热质': 12, '血瘀质': 10, '气郁质': 30, '特禀质': 70 },
    weight: 55.0, weightGoal: 55, weightChange: 0, bmi: 19.2, avgDailyCalories: 1500, caloriesTarget: 1500,
    waterGlasses: 6, sleepHours: 7, exerciseMinutesWeek: 60, dietRecordsWeek: 6, lastDietRecord: '2天前',
    joinedAt: '2026-03-01', healthScore: 75, mentalScore: 72,
    recentWeightTrend: [55.2, 55.1, 55.0, 55.1, 55.0, 55.0, 55.0] },
  { id: '10', name: '冯十二', email: 'feng12@demo.com', department: '研发部', position: '测试工程师', constitution: '痰湿质', points: 850, streak: 8, status: 'active',
    constitutionScores: { '平和质': 15, '气虚质': 35, '阳虚质': 25, '阴虚质': 20, '痰湿质': 68, '湿热质': 40, '血瘀质': 15, '气郁质': 30, '特禀质': 5 },
    weight: 82.0, weightGoal: 73, weightChange: -1.8, bmi: 27.3, avgDailyCalories: 2050, caloriesTarget: 1750,
    waterGlasses: 3, sleepHours: 6, exerciseMinutesWeek: 40, dietRecordsWeek: 7, lastDietRecord: '今天 13:00',
    joinedAt: '2026-03-05', healthScore: 60, mentalScore: 68,
    recentWeightTrend: [83.8, 83.5, 83.2, 82.8, 82.5, 82.3, 82.0] },
]

// 体重迷你趋势图
function MiniWeightChart({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 200
  const h = 40
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ')

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

export default function EmployeesTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState<DemoEmployee | null>(null)

  const departments = [...new Set(EMPLOYEES.map(e => e.department))]
  const filtered = EMPLOYEES.filter(e => {
    const matchSearch = !searchTerm || e.name.includes(searchTerm) || e.email.includes(searchTerm)
    const matchDept = deptFilter === 'all' || e.department === deptFilter
    return matchSearch && matchDept
  })
  const activeCount = EMPLOYEES.filter(e => e.status === 'active').length

  return (
    <div className="space-y-3">
      {/* 统计 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#3B82F6' }}>{EMPLOYEES.length}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>总员工</p>
        </div>
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#10B981' }}>{activeCount}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>已激活</p>
        </div>
        <div className="card p-2.5 text-center" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))' }}>
          <p className="text-lg font-black" style={{ color: '#EF4444' }}>{EMPLOYEES.length - activeCount}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>未激活</p>
        </div>
      </div>

      {/* 搜索 & 导入 */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text" placeholder="搜索姓名或邮箱..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <button className="px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold shrink-0" style={{ background: 'var(--gold)', color: '#1A1A1A' }}>
          <Upload size={12} /> CSV导入
        </button>
      </div>

      {/* 部门筛选 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        <button onClick={() => setDeptFilter('all')}
          className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
          style={{ background: deptFilter === 'all' ? 'var(--gold)' : 'var(--bg-card)', color: deptFilter === 'all' ? '#1A1A1A' : 'var(--text-secondary)', border: deptFilter === 'all' ? 'none' : '1px solid var(--border)' }}
        >全部</button>
        {departments.map(d => (
          <button key={d} onClick={() => setDeptFilter(d)}
            className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ background: deptFilter === d ? 'var(--gold)' : 'var(--bg-card)', color: deptFilter === d ? '#1A1A1A' : 'var(--text-secondary)', border: deptFilter === d ? 'none' : '1px solid var(--border)' }}
          >{d}</button>
        ))}
      </div>

      {/* 员工列表 */}
      <div className="text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
        共 {filtered.length} 名员工
      </div>
      {filtered.map(emp => {
        const constInfo = CONSTITUTION_LABELS[emp.constitution]
        return (
          <div key={emp.id} className="card p-3 flex items-center gap-3" style={{ cursor: 'pointer' }}
            onClick={() => setSelectedEmployee(emp)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
              style={{ background: `${constInfo?.color || '#6B7280'}15`, color: constInfo?.color || '#6B7280' }}>
              {emp.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{emp.name}</span>
                {emp.status === 'active'
                  ? <UserCheck size={12} style={{ color: '#10B981' }} />
                  : <UserX size={12} style={{ color: '#EF4444' }} />
                }
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{emp.department} · {emp.position}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${constInfo?.color || '#6B7280'}15`, color: constInfo?.color || '#6B7280' }}>
                  {emp.constitution}
                </span>
                <span className="text-[9px] flex items-center gap-0.5" style={{ color: '#F59E0B' }}>
                  <Star size={8} /> {emp.points}
                </span>
                <span className="text-[9px] flex items-center gap-0.5" style={{ color: '#EF4444' }}>
                  <Flame size={8} /> {emp.streak}天
                </span>
              </div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
          </div>
        )
      })}

      {/* ── 员工健康详情弹窗 ── */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
            {/* 头部 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{ background: `${CONSTITUTION_LABELS[selectedEmployee.constitution]?.color || '#6B7280'}20`, color: CONSTITUTION_LABELS[selectedEmployee.constitution]?.color || '#6B7280' }}>
                  {selectedEmployee.name[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEmployee.name}</h3>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{selectedEmployee.department} · {selectedEmployee.position}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)}><X size={18} style={{ color: 'var(--text-secondary)' }} /></button>
            </div>

            {/* 综合评分 */}
            <div className="card p-3 mb-3" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))' }}>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: '#10B981' }}>{selectedEmployee.healthScore}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>健康评分</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: '#8B5CF6' }}>{selectedEmployee.mentalScore}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>心理评分</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>{selectedEmployee.streak}天</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>连续打卡</p>
                </div>
              </div>
            </div>

            {/* 体质雷达 */}
            <div className="card p-3 mb-3">
              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>🫀 体质分布</h4>
              {CONSTITUTION_TYPES.map(ct => {
                const score = selectedEmployee.constitutionScores[ct] || 0
                const constInfo = CONSTITUTION_LABELS[ct]
                const isTop = ct === selectedEmployee.constitution
                return (
                  <div key={ct} className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] w-14 shrink-0 font-bold" style={{ color: isTop ? constInfo.color : 'var(--text-secondary)' }}>
                      {isTop ? '★ ' : ''}{ct}
                    </span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'var(--bg-card)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: constInfo.color, opacity: isTop ? 1 : 0.6 }} />
                    </div>
                    <span className="text-[9px] w-7 text-right font-bold" style={{ color: isTop ? constInfo.color : 'var(--text-secondary)' }}>{score}</span>
                  </div>
                )
              })}
            </div>

            {/* 体重趋势 */}
            <div className="card p-3 mb-3">
              <h4 className="text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>⚖️ 体重趋势（最近7天）</h4>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{selectedEmployee.weight}kg</span>
                  <span className="text-xs ml-2" style={{ color: selectedEmployee.weightChange < 0 ? '#10B981' : '#EF4444' }}>
                    {selectedEmployee.weightChange < 0 ? '↓' : '↑'} {Math.abs(selectedEmployee.weightChange)}kg
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>目标: {selectedEmployee.weightGoal}kg</span>
              </div>
              <MiniWeightChart data={selectedEmployee.recentWeightTrend} color={selectedEmployee.weightChange < 0 ? '#10B981' : '#EF4444'} />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>BMI: {selectedEmployee.bmi}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                  background: selectedEmployee.bmi < 18.5 ? 'rgba(59,130,246,0.1)' : selectedEmployee.bmi < 24 ? 'rgba(16,185,129,0.1)' : selectedEmployee.bmi < 28 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                  color: selectedEmployee.bmi < 18.5 ? '#3B82F6' : selectedEmployee.bmi < 24 ? '#10B981' : selectedEmployee.bmi < 28 ? '#F59E0B' : '#EF4444'
                }}>
                  {selectedEmployee.bmi < 18.5 ? '偏瘦' : selectedEmployee.bmi < 24 ? '正常' : selectedEmployee.bmi < 28 ? '偏胖' : '肥胖'}
                </span>
              </div>
            </div>

            {/* 饮食数据 */}
            <div className="card p-3 mb-3">
              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>🍽️ 饮食数据</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Utensils size={10} style={{ color: '#F59E0B' }} />
                    <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>日均热量</span>
                  </div>
                  <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{selectedEmployee.avgDailyCalories}kcal</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>目标 {selectedEmployee.caloriesTarget}</p>
                </div>
                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar size={10} style={{ color: '#3B82F6' }} />
                    <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>本周记录</span>
                  </div>
                  <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{selectedEmployee.dietRecordsWeek}次</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>最近: {selectedEmployee.lastDietRecord}</p>
                </div>
              </div>
            </div>

            {/* 生活习惯 */}
            <div className="card p-3 mb-3">
              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>💪 生活习惯</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <Droplets size={14} style={{ color: '#3B82F6' }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEmployee.waterGlasses}杯</p>
                    <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>日均饮水</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <Moon size={14} style={{ color: '#8B5CF6' }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEmployee.sleepHours}h</p>
                    <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>平均睡眠</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <Zap size={14} style={{ color: '#10B981' }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEmployee.exerciseMinutesWeek}分钟</p>
                    <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>本周运动</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                  <Star size={14} style={{ color: '#F59E0B' }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEmployee.points}</p>
                    <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>累计积分</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 加入信息 */}
            <div className="text-center">
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                加入于 {selectedEmployee.joinedAt} · {selectedEmployee.status === 'active' ? '✅ 活跃中' : '⏸️ 未活跃'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
