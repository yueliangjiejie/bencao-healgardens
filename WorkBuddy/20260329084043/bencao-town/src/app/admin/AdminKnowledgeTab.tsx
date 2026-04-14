'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Trash2, Search, Plus, Download, BookOpen, Tag, AlertCircle, CheckCircle, Eye, Edit3, Save, X } from 'lucide-react'

// ─── 知识条目类型 ───
interface KnowledgeEntry {
  id: string
  title: string
  category: 'food' | 'acupoint' | 'constitution' | 'syndrome' | 'herb' | 'recipe' | 'general'
  content: string
  tags: string[]
  source: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'draft' | 'archived'
}

const CATEGORY_LABELS: Record<KnowledgeEntry['category'], { label: string; icon: string; color: string }> = {
  food: { label: '食物营养', icon: '🍽️', color: '#F59E0B' },
  acupoint: { label: '穴位经络', icon: '💆', color: '#10B981' },
  constitution: { label: '体质知识', icon: '🧬', color: '#8B5CF6' },
  syndrome: { label: '证型诊断', icon: '🏥', color: '#EF4444' },
  herb: { label: '中药药材', icon: '🌿', color: '#059669' },
  recipe: { label: '食疗方', icon: '🍲', color: '#F97316' },
  general: { label: '综合养生', icon: '📖', color: '#6366F1' },
}

// ─── 初始Demo数据 ───
const DEMO_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'kb-001', title: '黄芪的性味归经与功效', category: 'herb',
    content: '黄芪，性微温，味甘。归脾、肺经。\n功效：补气升阳，益卫固表，托毒生肌，利水消肿。\n主治：气虚乏力、食少便溏、中气下陷、表虚自汗。\n用法：煎服9-30g，或入丸散。补气升阳炙用，其他生用。\n禁忌：表实邪盛、气滞湿阻、食积内停者不宜。',
    tags: ['补气药', '黄芪', '气虚质'], source: '《中国药典》2020版', createdAt: '2026-04-10', updatedAt: '2026-04-10', status: 'active',
  },
  {
    id: 'kb-002', title: '痰湿质食疗调理方案', category: 'constitution',
    content: '痰湿质以痰湿凝聚为主要特征。\n\n食疗原则：健脾化湿、化痰降浊\n\n推荐食材：\n- 薏米：利水渗湿、健脾止泻\n- 冬瓜：清热化痰、利水消肿\n- 荷叶：清热解暑、升发清阳\n- 白萝卜：下气消食、化痰止咳\n- 陈皮：理气健脾、燥湿化痰\n\n食疗方：\n1. 薏米红豆汤：薏米50g+红豆50g，煮粥\n2. 荷叶冬瓜汤：鲜荷叶1张+冬瓜500g，煲汤\n3. 陈皮粥：陈皮10g+大米100g，煮粥\n\n禁忌：少食肥甘厚腻、甜食、冷饮',
    tags: ['痰湿质', '食疗', '健脾化湿'], source: '《中医体质学》王琦', createdAt: '2026-04-11', updatedAt: '2026-04-12', status: 'active',
  },
  {
    id: 'kb-003', title: '足三里穴保健按摩法', category: 'acupoint',
    content: '足三里（ST36），足阳明胃经合穴。\n\n定位：外膝眼下3寸，胫骨前嵴外一横指。\n\n保健按摩法：\n1. 按揉法：用拇指指腹按揉，顺时针30圈，逆时针30圈\n2. 叩击法：握空拳，用拳眼叩击50-100下\n3. 艾灸法：温和灸10-15分钟\n\n功效：补脾健胃、扶正培元、通经活络\n\n适宜人群：气虚质、阳虚质、痰湿质、脾胃虚弱者\n\n注意事项：过饥过饱不宜按摩，力度由轻到重',
    tags: ['足三里', '胃经', '健脾', '保健穴'], source: '《经络腧穴学》', createdAt: '2026-04-11', updatedAt: '2026-04-11', status: 'active',
  },
  {
    id: 'kb-004', title: '山楂活血化瘀食疗方', category: 'recipe',
    content: '山楂（Crataegus），性微温，味酸甘。归脾、胃、肝经。\n功效：消食化积、活血散瘀。\n\n推荐食疗方：\n\n1. 山楂红糖水\n   山楂30g + 红糖适量，水煎服\n   功效：活血化瘀，适合血瘀质\n\n2. 山楂决明子茶\n   山楂15g + 决明子10g，沸水冲泡\n   功效：消食降脂，适合减脂期\n\n3. 山楂粥\n   山楂30g + 大米100g，煮粥\n   功效：消食健胃\n\n注意：胃酸过多者不宜空腹食用，孕妇慎用',
    tags: ['山楂', '活血化瘀', '血瘀质', '减脂'], source: '《本草纲目》', createdAt: '2026-04-12', updatedAt: '2026-04-12', status: 'active',
  },
]

export default function AdminKnowledgeTab() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(DEMO_ENTRIES)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<KnowledgeEntry['category'] | 'all'>('all')
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editSource, setEditSource] = useState('')
  const [editCategory, setEditCategory] = useState<KnowledgeEntry['category']>('general')
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 过滤条目
  const filtered = entries.filter(e => {
    const matchCategory = filterCategory === 'all' || e.category === filterCategory
    const matchSearch = !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(t => t.includes(searchQuery))
    return matchCategory && matchSearch
  })

  // 查看详情
  const viewEntry = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry)
    setIsEditing(false)
    setEditContent(entry.content)
    setEditTitle(entry.title)
    setEditTags(entry.tags.join(', '))
    setEditSource(entry.source)
    setEditCategory(entry.category)
  }

  // 保存编辑
  const saveEntry = () => {
    if (!selectedEntry) return
    setEntries(prev => prev.map(e =>
      e.id === selectedEntry.id ? {
        ...e,
        title: editTitle,
        content: editContent,
        tags: editTags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        source: editSource,
        category: editCategory,
        updatedAt: new Date().toISOString().slice(0, 10),
      } : e
    ))
    setSelectedEntry(null)
    setIsEditing(false)
  }

  // 删除
  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    if (selectedEntry?.id === id) setSelectedEntry(null)
  }

  // 导入JSON
  const handleImport = useCallback(() => {
    try {
      const parsed = JSON.parse(importText)
      let newEntries: KnowledgeEntry[] = []

      if (Array.isArray(parsed)) {
        newEntries = parsed.map((item: any, i: number) => ({
          id: `kb-import-${Date.now()}-${i}`,
          title: item.title || item.name || `导入条目${i + 1}`,
          category: item.category || 'general',
          content: item.content || item.description || JSON.stringify(item),
          tags: Array.isArray(item.tags) ? item.tags : [],
          source: item.source || '手动导入',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
          status: 'active' as const,
        }))
      } else if (typeof parsed === 'object') {
        newEntries = [{
          id: `kb-import-${Date.now()}`,
          title: parsed.title || parsed.name || '导入条目',
          category: parsed.category || 'general',
          content: parsed.content || parsed.description || JSON.stringify(parsed),
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          source: parsed.source || '手动导入',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
          status: 'active' as const,
        }]
      }

      if (newEntries.length === 0) throw new Error('未找到有效数据')
      setEntries(prev => [...newEntries, ...prev])
      setImportStatus('success')
      setImportText('')
      setTimeout(() => setImportStatus('idle'), 3000)
    } catch {
      setImportStatus('error')
      setTimeout(() => setImportStatus('idle'), 3000)
    }
  }, [importText])

  // 文件上传
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setImportText(text)
      setShowImportPanel(true)
    }
    reader.readAsText(file)
  }, [])

  // 导出全部
  const exportAll = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `knowledge-base-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── 详情/编辑面板 ───
  if (selectedEntry) {
    const cat = CATEGORY_LABELS[isEditing ? editCategory : selectedEntry.category]
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => { setSelectedEntry(null); setIsEditing(false) }}
            className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            ← 返回列表
          </button>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  <Edit3 size={12} /> 编辑
                </button>
                <button onClick={() => { deleteEntry(selectedEntry.id) }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-500">
                  <Trash2 size={12} /> 删除
                </button>
              </>
            ) : (
              <>
                <button onClick={saveEntry}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-white">
                  <Save size={12} /> 保存
                </button>
                <button onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  <X size={12} /> 取消
                </button>
              </>
            )}
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{cat.icon}</span>
          {isEditing ? (
            <select value={editCategory} onChange={e => setEditCategory(e.target.value as KnowledgeEntry['category'])}
              className="px-2 py-1 text-xs rounded border" style={{ borderColor: 'var(--border)' }}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: cat.color + '20', color: cat.color }}>{cat.label}</span>
          )}
        </div>

        {/* 标题 */}
        {isEditing ? (
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 text-base font-bold rounded-lg border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} />
        ) : (
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEntry.title}</h3>
        )}

        {/* 内容 */}
        {isEditing ? (
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border min-h-[200px]"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} />
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
            {selectedEntry.content}
          </div>
        )}

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5">
          <Tag size={12} style={{ color: 'var(--text-secondary)' }} className="mt-0.5" />
          {isEditing ? (
            <input value={editTags} onChange={e => setEditTags(e.target.value)}
              placeholder="标签，逗号分隔"
              className="flex-1 px-2 py-1 text-xs rounded border"
              style={{ borderColor: 'var(--border)' }} />
          ) : (
            selectedEntry.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {tag}
              </span>
            ))
          )}
        </div>

        {/* 来源 */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <BookOpen size={12} />
          {isEditing ? (
            <input value={editSource} onChange={e => setEditSource(e.target.value)}
              className="flex-1 px-2 py-1 text-xs rounded border"
              style={{ borderColor: 'var(--border)' }} />
          ) : (
            <span>来源：{selectedEntry.source}</span>
          )}
        </div>

        {/* 时间 */}
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          创建：{selectedEntry.createdAt} · 更新：{selectedEntry.updatedAt}
        </div>
      </div>
    )
  }

  // ─── 主列表视图 ───
  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BookOpen size={18} className="text-emerald-500" />
          知识库管理
          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            {entries.length} 条
          </span>
        </h2>
        <div className="flex gap-2">
          <button onClick={exportAll}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Download size={12} /> 导出
          </button>
          <button onClick={() => setShowImportPanel(!showImportPanel)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-white">
            <Upload size={12} /> 导入素材
          </button>
        </div>
      </div>

      {/* 导入面板 */}
      {showImportPanel && (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h4 className="text-sm font-bold">导入知识素材</h4>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            支持 JSON 格式导入。可以是单个对象或数组，每个条目包含 title/content/category/tags/source 字段。
          </p>

          {/* 文件上传 */}
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border"
              style={{ borderColor: 'var(--border)' }}>
              <Upload size={12} /> 选择文件
            </button>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>或直接粘贴JSON</span>
          </div>

          {/* 文本框 */}
          <textarea value={importText} onChange={e => setImportText(e.target.value)}
            placeholder='{"title":"...", "content":"...", "category":"food", "tags":["标签1"], "source":"来源"}'
            className="w-full px-3 py-2 text-xs rounded-lg border min-h-[120px] font-mono"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }} />

          {/* 导入按钮和状态 */}
          <div className="flex items-center gap-3">
            <button onClick={handleImport} disabled={!importText.trim()}
              className="px-4 py-1.5 text-xs rounded-lg bg-emerald-500 text-white disabled:opacity-30">
              确认导入
            </button>
            {importStatus === 'success' && (
              <span className="flex items-center gap-1 text-xs text-emerald-500"><CheckCircle size={14} /> 导入成功</span>
            )}
            {importStatus === 'error' && (
              <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle size={14} /> JSON格式错误</span>
            )}
          </div>

          {/* 格式说明 */}
          <details className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <summary className="cursor-pointer">查看支持的JSON格式示例</summary>
            <pre className="mt-2 p-3 rounded-lg text-[10px] overflow-auto" style={{ background: 'var(--bg-primary)' }}>
{`// 批量导入示例
[
  {
    "title": "枸杞的功效",
    "content": "枸杞性平味甘，滋补肝肾...",
    "category": "herb",
    "tags": ["枸杞", "补肝肾", "明目"],
    "source": "《本草纲目》"
  },
  {
    "title": "气虚质饮食方案",
    "content": "推荐黄芪、山药...",
    "category": "constitution",
    "tags": ["气虚质", "食疗"],
    "source": "《中医体质学》"
  }
]`}
            </pre>
          </details>
        </div>
      )}

      {/* 搜索 + 筛选 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索标题、内容、标签..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)}
          className="px-3 py-2 text-xs rounded-lg border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <option value="all">全部分类</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
      </div>

      {/* 知识条目列表 */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p>暂无匹配的知识条目</p>
          </div>
        ) : (
          filtered.map(entry => {
            const cat = CATEGORY_LABELS[entry.category]
            return (
              <div key={entry.id}
                onClick={() => viewEntry(entry)}
                className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                {/* 分类图标 */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: cat.color + '15' }}>
                  {cat.icon}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{entry.title}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: cat.color + '20', color: cat.color }}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {entry.content.slice(0, 100)}...
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {entry.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {tag}
                      </span>
                    ))}
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      {entry.updatedAt}
                    </span>
                  </div>
                </div>

                {/* 操作 */}
                <button onClick={e => { e.stopPropagation(); deleteEntry(entry.id) }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {Object.entries(CATEGORY_LABELS).map(([k, v]) => {
          const count = entries.filter(e => e.category === k).length
          return (
            <div key={k} className="text-center p-2 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
              <span className="text-lg">{v.icon}</span>
              <p className="text-xs font-bold mt-1" style={{ color: v.color }}>{count}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{v.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
