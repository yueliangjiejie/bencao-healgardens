'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, Constitution, HorseStyle, HorseStyleShort } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { QUIZ_QUESTIONS, CONSTITUTION_INFO, CONSTITUTION_DB, RADAR_KEYS, RADAR_LABELS, HORSE_IMAGE_MAP } from '@/lib/constants'
import { dataService } from '@/lib/data-service'
import { ArrowLeft, ChevronRight, Sparkles, Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react'

type Step = 'welcome' | 'quiz' | 'tongue' | 'result' | 'adopt' | 'analyzing'
interface QuizOption { t: string; s: number }
interface QuizQuestion { id: number; cat: string; catKey: string; question: string; options: QuizOption[] }
interface TongueResult { isValid: boolean; error: string | null; features: Record<string, { value: string; description: string }>; summary: string; constitutionScores: Record<string, number>; primaryConstitution: string; confidence: number; tcmAdvice: string; organAnalysis?: Record<string, { score: number; status: string; note: string }> }

const HS: { style: HorseStyle; image: string; desc: string; acc: string }[] = [
  { style:'金鬃骏马', image:HORSE_IMAGE_MAP['golden'], desc:'威武雄壮，星星相伴', acc:'⭐' },
  { style:'蓝紫灵马', image:HORSE_IMAGE_MAP['purple'], desc:'神秘灵动，葫芦护佑', acc:'🏮' },
  { style:'赤棕壮马', image:HORSE_IMAGE_MAP['brown'], desc:'健壮有力，元宝招财', acc:'💰' },
  { style:'粉樱萌马', image:HORSE_IMAGE_MAP['pink'], desc:'可爱温柔，锦鲤伴身', acc:'🐟' },
]
const TIPS = [{ i:'💡',t:'自然光线',d:'自然光或白光下拍摄'},{i:'👅',t:'伸出舌头',d:'自然伸舌，不用力'},{i:'📱',t:'对准舌头',d:'舌头居中，拍全舌面'},{i:'🍽️',t:'饭后30分',d:'避免染色食物后拍'}]

export default function OnboardPage() {
  const router = useRouter()
  const { setConstitution, adoptHorse } = useStore()
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('welcome')
  const [qi, setQi] = useState(0) // quiz index
  const [scores, setScores] = useState<Record<string, number>>({})
  const [ans, setAns] = useState<number[]>(new Array(QUIZ_QUESTIONS.length).fill(-1))
  const [rk, setRk] = useState('') // result key
  const [rn, setRn] = useState('平和质') // result name
  const [selStyle, setSelStyle] = useState<HorseStyle | null>(null)
  const [hname, setHname] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const vidRef = useRef<HTMLVideoElement>(null)

  // tongue state
  const [tImg, setTImg] = useState<string | null>(null)
  const [tRes, setTRes] = useState<TongueResult | null>(null)
  const [tLoad, setTLoad] = useState(false)
  const [tErr, setTErr] = useState<string | null>(null)
  const [camOn, setCamOn] = useState(false)

  const startQuiz = () => { setStep('quiz'); setQi(0); setScores({}); setAns(new Array(QUIZ_QUESTIONS.length).fill(-1)) }

  const chooseOpt = (q: QuizQuestion, oi: number) => {
    const ns = { ...scores }; ns[q.catKey] = (ns[q.catKey] || 0) + q.options[oi].s; setScores(ns)
    const na = [...ans]; na[qi] = oi; setAns(na)
    if (qi < QUIZ_QUESTIONS.length - 1) setTimeout(() => setQi(qi + 1), 300)
  }

  // 图片质量预检（参考ChineseMedicine haveTongue.py）
  const checkImgQuality = useCallback((base64: string): Promise<{ok:boolean; msg:string}> => {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas')
        const maxDim = 640 // 缩小采样加速
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0, c.width, c.height)
        const data = ctx.getImageData(0, 0, c.width, c.height).data
        let sum = 0, cnt = data.length / 4
        for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i+1] + data[i+2]) / 3
        const avgBright = sum / cnt
        if (avgBright < 50) resolve({ok:false, msg:'图片过暗，请在明亮环境下重新拍摄'})
        else if (avgBright > 220) resolve({ok:false, msg:'图片过亮，请避免逆光拍摄'})
        else resolve({ok:true, msg:''})
      }
      img.onerror = () => resolve({ok:true, msg:''}) // 检测失败不阻断流程
      img.src = `data:image/jpeg;base64,${base64}`
    })
  }, [])

  const handleImg = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    if (!f.type.startsWith('image/')) { setTErr('请选择图片'); return }
    if (f.size > 10485760) { setTErr('图片不超过10MB'); return }
    setTErr(null)
    const r = new FileReader()
    r.onload = async () => {
      const b64 = (r.result as string).split(',')[1]
      const q = await checkImgQuality(b64)
      if (!q.ok) { setTErr(q.msg); return }
      setTImg(b64)
    }
    r.readAsDataURL(f)
  }, [checkImgQuality])

  const openCam = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment', width:{ideal:1280}, height:{ideal:720} } })
      if (vidRef.current) { vidRef.current.srcObject = s; vidRef.current.play(); setCamOn(true) }
    } catch { setTErr('无法访问摄像头，请用相册上传') }
  }, [])

  const takePhoto = useCallback(async () => {
    if (!vidRef.current) return
    const c = document.createElement('canvas'); c.width = vidRef.current.videoWidth; c.height = vidRef.current.videoHeight
    c.getContext('2d')!.drawImage(vidRef.current, 0, 0)
    const b64 = c.toDataURL('image/jpeg', 0.8).split(',')[1]
    closeCam()
    const q = await checkImgQuality(b64)
    if (!q.ok) { setTErr(q.msg); return }
    setTImg(b64)
  }, [checkImgQuality])

  const closeCam = useCallback(() => {
    if (vidRef.current?.srcObject) { (vidRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); vidRef.current.srcObject = null }
    setCamOn(false)
  }, [])

  const analyzeTongue = useCallback(async () => {
    if (!tImg) return
    setTLoad(true); setTErr(null)
    try {
      const res = await fetch('/api/tongue-diagnosis', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ imageBase64: tImg, mimeType:'image/jpeg' }) })

      // 检查HTTP状态码
      if (!res.ok) {
        console.error('HTTP error:', res.status, res.statusText)
        setTErr(`请求失败 (${res.status})`)
        setTLoad(false)
        return
      }

      const d = await res.json()

      // API返回的业务错误
      if (d.error && !d.result) {
        console.error('API error:', d.code, d.error)
        // 根据错误code显示友好提示
        let errorMsg = d.error
        if (d.code === 'NO_API_KEY') {
          errorMsg = 'API Key未配置，正在使用Demo模式'
        } else if (d.code === 'QUOTA_EXCEEDED') {
          errorMsg = 'API配额已用尽，请稍后再试'
        } else if (d.code === 'SAFETY_ERROR') {
          errorMsg = '图片内容不符合安全规范'
        }
        setTErr(errorMsg)
        setTLoad(false)
        return
      }

      const r: TongueResult = d.result
      if (!r.isValid && r.error) { setTErr(r.error); setTLoad(false); return }
      setTRes(r); setTLoad(false)
    } catch (err) {
      // 真正的网络错误或未知错误
      console.error('Tongue diagnosis fetch error:', err)
      setTErr('连接失败，请检查网络后重试')
      setTLoad(false)
    }
  }, [tImg])

  const doAnalyze = (tData: TongueResult | null) => {
    setStep('analyzing')
    setTimeout(() => {
      let mx = 0, mk = 'A'; const fs: Record<string, number> = {}
      if (tData) {
        for (const k of RADAR_KEYS) fs[k] = ((scores[k]||0)/15)*100*0.6 + (tData.constitutionScores[k]||0)*0.4
      } else {
        for (const k of RADAR_KEYS) fs[k] = scores[k] || 0
      }
      for (const [k,v] of Object.entries(fs)) { if (v > mx) { mx = v; mk = k } }
      const cn = (CONSTITUTION_DB as any)[mk]?.name || '平和质'
      setRk(mk); setRn(cn); setConstitution(cn as Constitution); setScores(fs)
      // 保存体质测评结果到 DataService（持久化 + 云端）
      dataService.assessment.save({
        method: 'quiz',
        quiz_scores: fs,
        final_scores: fs,
        primary_constitution: cn as any,
      }).catch(() => { /* 静默失败，不影响用户体验 */ })
      setStep('result'); setTimeout(() => drawRadar(fs, mk, !!tData), 100)
    }, 2500)
  }

  const drawRadar = (fs: Record<string, number>, hl: string, norm: boolean) => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    const W=cv.width, H=cv.height, cx=W/2, cy=H/2+6, R=Math.min(W,H)*0.38, N=9
    const mx = norm ? 100 : 15, as = (Math.PI*2)/N
    const C: Record<string,string> = {A:'#22c55e',B:'#60a5fa',C:'#f97316',D:'#a78bfa',E:'#06b6d4',F:'#ef4444',G:'#ec4899',H:'#8b5cf6',I:'#14b8a6'}
    ctx.clearRect(0,0,W,H)
    for (let l=1;l<=5;l++){const r=(R/5)*l;ctx.beginPath();for(let i=0;i<N;i++){const a=as*i-Math.PI/2;if(i===0)ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a));else ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))}ctx.closePath();ctx.strokeStyle=l===5?'rgba(139,105,20,0.25)':'rgba(139,105,20,0.08)';ctx.lineWidth=l===5?1.2:0.6;ctx.stroke()}
    for(let i=0;i<N;i++){const a=as*i-Math.PI/2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));ctx.strokeStyle='rgba(139,105,20,0.08)';ctx.lineWidth=0.5;ctx.stroke()}
    ctx.beginPath();const pts:{x:number;y:number;key:string}[]=[]
    for(let i=0;i<N;i++){const k=RADAR_KEYS[i],v=fs[k]||0,r=R*Math.min(v/mx,1),a=as*i-Math.PI/2;pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a),key:k});if(i===0)ctx.moveTo(pts[i].x,pts[i].y);else ctx.lineTo(pts[i].x,pts[i].y)}
    ctx.closePath();const hc=C[hl]||'#fbbf24';const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R);g.addColorStop(0,hc+'30');g.addColorStop(1,hc+'10');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=hc+'90';ctx.lineWidth=2;ctx.stroke()
    for(const p of pts){const ih=p.key===hl;ctx.beginPath();ctx.arc(p.x,p.y,ih?5:3.5,0,Math.PI*2);ctx.fillStyle=ih?C[p.key]:'#fff';ctx.fill();ctx.strokeStyle=C[p.key];ctx.lineWidth=ih?2:1.2;ctx.stroke()}
    ctx.textAlign='center';ctx.textBaseline='middle'
    for(let i=0;i<N;i++){const a=as*i-Math.PI/2,lr=R+18,x=cx+lr*Math.cos(a),y=cy+lr*Math.sin(a),ih=RADAR_KEYS[i]===hl;ctx.font=ih?'bold 12px "PingFang SC","Microsoft YaHei"':'bold 11px "PingFang SC","Microsoft YaHei"';ctx.fillStyle=C[RADAR_KEYS[i]]||'#999';ctx.fillText(RADAR_LABELS[i],x,y);ctx.font='10px "PingFang SC","Microsoft YaHei"';ctx.fillStyle='#888';ctx.fillText(norm?String(Math.round(fs[RADAR_KEYS[i]]||0)):String(fs[RADAR_KEYS[i]]||0),x,y+(a>Math.PI/4&&a<Math.PI*3/4?13:-13))}
  }

  const handleAdopt = () => {
    if (!selStyle || !hname.trim()) return
    // 映射 HorseStyle 到 HorseStyleShort
    const styleMap: Record<HorseStyle, HorseStyleShort> = {
      '金鬃骏马': 'golden',
      '蓝紫灵马': 'purple',
      '赤棕壮马': 'brown',
      '粉樱萌马': 'pink',
    }
    adoptHorse(selStyle, styleMap[selStyle], hname.trim())
    // 通过 DataService 记录打卡（领养日）
    dataService.checkin.updateToday({ horse_fed: true, horse_cleaned: true }).catch(() => {})
    router.push('/')
  }

  // ═══ WELCOME ═══
  if (step === 'welcome') return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center" style={{background:'linear-gradient(180deg,var(--bg-primary) 0%,var(--bg-secondary) 100%)'}}>
      <div className="text-7xl mb-6 animate-bounce">🐴</div>
      <h1 className="text-3xl font-bold mb-3" style={{color:'var(--gold)'}}>{t.onboard.welcomeTitle}</h1>
      <p className="text-sm mb-2" style={{color:'var(--text-secondary)'}}>{t.onboard.welcomeSubtitle1}</p>
      <p className="text-sm mb-8" style={{color:'var(--text-secondary)'}}>养一匹小马，陪你走健康之路</p>
      <div className="w-full max-w-[320px] space-y-3 mb-8">
        {[['⏱️','约需 3~5 分钟','27道专业测评题 + AI舌诊'],['🎯','九维体质精准诊断','答题60% + AI舌诊40% 双重诊断'],['👅','AI智能舌诊','拍照分析舌色、舌苔，精准辨识体质'],['🔒','数据完全隐私','仅存本地，不上传服务器']].map(([ic,t,d],i)=>(
          <div key={i} className="flex items-start gap-3 card py-3 px-4"><span className="text-xl">{ic}</span><div><p className="text-xs font-bold" style={{color:'var(--text-primary)'}}>{t}</p><p className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>{d}</p></div></div>
        ))}
      </div>
      <button onClick={startQuiz} className="btn-gold w-full flex items-center justify-center gap-2 text-lg py-3.5 max-w-[300px]"><Sparkles size={20}/>开始体质测评</button>
    </div>
  )

  // ═══ QUIZ ═══
  if (step === 'quiz') {
    const q: QuizQuestion = QUIZ_QUESTIONS[qi] as unknown as QuizQuestion
    const prog = ((qi+1)/QUIZ_QUESTIONS.length)*100
    return (
      <div className="min-h-dvh flex flex-col" style={{background:'var(--bg-primary)'}}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 sticky top-0 z-10" style={{background:'var(--bg-primary)',borderBottom:'1px solid var(--border)'}}>
          <button onClick={()=>router.push('/')} className="p-1"><ArrowLeft size={20} style={{color:'var(--text-secondary)'}}/></button>
          <div className="flex-1"><div className="h-2 rounded-full bg-[var(--border)] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[var(--gold)] to-[#FFD700]" style={{width:`${prog}%`}}/></div></div>
          <span className="text-xs font-bold whitespace-nowrap ml-2" style={{color:'var(--gold)'}}>{qi+1}/{QUIZ_QUESTIONS.length}</span>
        </div>
        <div className="px-4 pt-4 pb-2"><span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">{q.cat}</span></div>
        <div className="px-4 pt-2"><h2 className="text-xl font-bold leading-relaxed" style={{color:'var(--text-primary)'}}>{q.question}</h2></div>
        <div className="px-4 pt-6 space-y-3 flex-1">
          {q.options.map((opt,i)=>{const sel=ans[qi]===i;return(
            <button key={i} onClick={()=>chooseOpt(q,i)} className={`w-full text-left card flex items-center gap-3 transition-all ${sel?'border-[var(--gold)] bg-[var(--gold)]/5 shadow-[0_0_15px_rgba(255,215,0,0.15)]':'hover:border-[var(--gold)]/50 active:scale-[0.98]'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${sel?'bg-[var(--gold)] text-[#1A1A1A]':'bg-[var(--gold)]/10'}`} style={!sel?{color:'var(--gold)'}:undefined}>{String.fromCharCode(65+i)}</span>
              <span className="text-sm" style={{color:'var(--text-primary)'}}>{opt.t}</span>
            </button>
          )})}
        </div>
        <div className="px-4 pt-4 pb-6 flex items-center justify-between">
          <button onClick={()=>{if(qi>0)setQi(qi-1)}} disabled={qi===0} className="px-5 py-2.5 rounded-xl text-sm font-bold border border-[var(--border)] disabled:opacity-30" style={{color:'var(--text-primary)',background:'var(--bg-card)'}}>← 上一题</button>
          {qi===QUIZ_QUESTIONS.length-1?(
            <button onClick={()=>setStep('tongue')} disabled={ans.some(a=>a===-1)} className="btn-gold px-6 py-2.5 text-sm font-bold flex items-center gap-2 disabled:opacity-40">下一步：舌诊 →</button>
          ):(
            <button onClick={()=>setQi(qi+1)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--gold)] text-[#1A1A1A] active:scale-95 transition-transform">下一题 →</button>
          )}
        </div>
      </div>
    )
  }

  // ═══ TONGUE ═══
  if (step === 'tongue') return (
    <div className="min-h-dvh flex flex-col" style={{background:'var(--bg-primary)'}}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 sticky top-0 z-10" style={{background:'var(--bg-primary)',borderBottom:'1px solid var(--border)'}}>
        <button onClick={()=>setStep('quiz')} className="p-1"><ArrowLeft size={20} style={{color:'var(--text-secondary)'}}/></button>
        <div className="flex-1"><p className="text-sm font-bold" style={{color:'var(--text-primary)'}}>AI 舌诊分析</p><p className="text-xs" style={{color:'var(--text-secondary)'}}>舌诊+答题双重诊断，结果更精准</p></div>
        <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">第2步</span>
      </div>
      <div className="flex-1 px-4 pt-4 pb-4 overflow-auto">
        {/* 拍照提示 */}
        {!tImg && !tRes && (<div className="space-y-4">
          <div className="text-center mb-2">
            <div className="text-5xl mb-3">👅</div>
            <h2 className="text-lg font-bold mb-1" style={{color:'var(--text-primary)'}}>拍摄你的舌头照片</h2>
            <p className="text-xs" style={{color:'var(--text-secondary)'}}>AI分析舌色、舌苔等特征，结合答题精准辨识体质</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">{TIPS.map((t,i)=>(
            <div key={i} className="card py-3 px-3 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">{t.i}</span>
              <p className="text-xs font-bold" style={{color:'var(--text-primary)'}}>{t.t}</p>
              <p className="text-xs" style={{color:'var(--text-secondary)',fontSize:'10px'}}>{t.d}</p>
            </div>
          ))}</div>
          <div className="space-y-3 pt-2">
            <button onClick={openCam} className="btn-gold w-full flex items-center justify-center gap-2 py-3.5"><Camera size={20}/>拍照舌象</button>
            <button onClick={()=>fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border)] font-bold text-sm" style={{color:'var(--text-primary)',background:'var(--bg-card)'}}><Upload size={18}/>从相册选择</button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImg}/>
            <button onClick={()=>doAnalyze(null)} className="w-full text-center py-2 text-xs" style={{color:'var(--text-secondary)'}}>跳过舌诊，仅用答题结果 →</button>
          </div>
          {camOn && (<div className="relative mt-4 rounded-xl overflow-hidden">
            <video ref={vidRef} className="w-full rounded-xl" autoPlay playsInline muted/>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button onClick={takePhoto} className="w-16 h-16 rounded-full bg-white/20 border-4 border-white flex items-center justify-center active:scale-90 transition-transform"><div className="w-12 h-12 rounded-full bg-white"/></button>
              <button onClick={closeCam} className="w-12 h-12 rounded-full bg-red-500/80 flex items-center justify-center"><X size={24} className="text-white"/></button>
            </div>
          </div>)}
        </div>)}

        {/* 已选图片 */}
        {tImg && !tRes && (<div className="space-y-4">
          <div className="relative">
            <img src={`data:image/jpeg;base64,${tImg}`} alt="舌象" className="w-full max-h-[40vh] object-contain rounded-xl border border-[var(--border)]"/>
            <button onClick={()=>{setTImg(null);setTErr(null)}} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"><X size={16} className="text-white"/></button>
          </div>
          {tErr && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"><AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5"/><p className="text-xs text-red-400">{tErr}</p></div>}
          <div className="flex gap-3">
            <button onClick={()=>{setTImg(null);setTErr(null)}} className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-bold" style={{color:'var(--text-primary)',background:'var(--bg-card)'}}>重新拍摄</button>
            <button onClick={analyzeTongue} disabled={tLoad} className="flex-1 btn-gold py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {tLoad?<><div className="w-4 h-4 border-2 border-[#1A1A1A]/30 border-t-[#1A1A1A] rounded-full animate-spin"/>AI分析中...</>:<><Sparkles size={16}/>开始分析</>}
            </button>
          </div>
        </div>)}

        {/* 舌诊结果 */}
        {tRes && tRes.isValid && (<div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20"><CheckCircle size={16} className="text-green-400"/><p className="text-xs text-green-400 font-bold">舌诊分析完成！</p></div>
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-2" style={{color:'var(--gold)'}}>👅 舌象特征</h3>
            <p className="text-xs mb-3 leading-relaxed" style={{color:'var(--text-primary)'}}>{tRes.summary}</p>
            <div className="grid grid-cols-2 gap-2">{Object.entries(tRes.features).map(([k,f]:[string,any])=>(
              <div key={k} className="flex items-center gap-1.5 py-1">
                <span className="text-xs font-bold" style={{color:'var(--gold)',fontSize:'10px'}}>{k==='tongueColor'?'舌色':k==='tongueShape'?'舌形':k==='tongueBody'?'舌体':k==='coatingColor'?'苔色':k==='coatingTexture'?'苔质':k==='sublingualVein'?'舌下':k}</span>
                <span className="text-xs" style={{color:'var(--text-secondary)'}}>{f.value}</span>
              </div>
            ))}</div>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-2" style={{color:'var(--gold)'}}>📊 舌诊体质倾向</h3>
            <div className="space-y-2">{RADAR_KEYS.map(key=>{
              const s=tRes.constitutionScores[key]||0, db=(CONSTITUTION_DB as any)[key]; if(!db) return null
              const isP=key===tRes.primaryConstitution
              return (<div key={key} className="flex items-center gap-2">
                <span className="text-xs w-14 shrink-0 font-bold" style={{color:isP?db.color:'var(--text-secondary)'}}>{db.name}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:`${Math.min(s,100)}%`,background:isP?db.color:`${db.color}60`}}/></div>
                <span className="text-xs w-8 text-right font-bold" style={{color:isP?db.color:'var(--text-secondary)'}}>{Math.round(s)}</span>
                {isP && <span className="text-xs">👑</span>}
              </div>)
            })}</div>
          </div>
          {tRes.organAnalysis && Object.keys(tRes.organAnalysis).length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-2" style={{color:'var(--gold)'}}>🫀 五脏分区分析</h3>
            <div className="grid grid-cols-2 gap-2">{[
              {key:'heart',label:'❤️ 心肺',sub:'舌尖'},{key:'spleen',label:'🟢 脾胃',sub:'舌中'},{key:'kidney',label:'🔵 肾',sub:'舌根'},{key:'liver',label:'🟡 肝',sub:'舌边'}
            ].map(({key,label,sub})=>{const o=tRes.organAnalysis![key];if(!o)return null;const clr=o.score>60?'#ef4444':o.score>40?'#f59e0b':'#22c55e';return(
              <div key={key} className="p-2 rounded-lg border border-[var(--border)]">
                <div className="flex items-center justify-between mb-1"><span className="text-xs font-bold" style={{color:'var(--text-primary)'}}>{label}</span><span className="text-xs" style={{color:'var(--text-secondary)'}}>{sub}</span></div>
                <div className="flex items-center gap-2 mb-1"><div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min(o.score,100)}%`,background:clr}}/></div><span className="text-xs font-bold" style={{color:clr}}>{o.score}</span></div>
                <p className="text-xs leading-snug" style={{color:'var(--text-secondary)',fontSize:'10px'}}>{o.note}</p>
              </div>
            )})}</div>
          </div>)}
          <div className="card p-4" style={{background:'rgba(200,169,81,0.08)'}}>
            <h3 className="text-xs font-bold mb-1" style={{color:'var(--gold)'}}>💡 舌诊建议</h3>
            <p className="text-xs leading-relaxed" style={{color:'var(--text-primary)'}}>{tRes.tcmAdvice}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={()=>{setTImg(null);setTRes(null);setTErr(null)}} className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-bold" style={{color:'var(--text-primary)',background:'var(--bg-card)'}}>重新拍摄</button>
            <button onClick={()=>doAnalyze(tRes)} className="flex-1 btn-gold py-3 text-sm font-bold flex items-center justify-center gap-2"><Sparkles size={16}/>合并分析 →</button>
          </div>
        </div>)}
      </div>
    </div>
  )

  // ═══ ANALYZING ═══
  if (step === 'analyzing') return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center" style={{background:'linear-gradient(180deg,var(--bg-primary) 0%,var(--bg-secondary) 100%)'}}>
      <div className="text-7xl mb-6 animate-bounce" style={{animationDuration:'1.5s'}}>🔮</div>
      <h2 className="text-xl font-bold mb-2" style={{color:'var(--text-primary)'}}>正在综合分析你的体质...</h2>
      <p className="text-sm mb-8" style={{color:'var(--text-secondary)'}}>老中医正在结合问诊与舌诊<br/>为你精准辨识体质，请稍候...</p>
      <div className="w-48 h-1 rounded-full bg-[var(--border)] overflow-hidden"><div className="h-full rounded-full bg-[var(--gold)] animate-pulse" style={{width:'60%'}}/></div>
    </div>
  )

  // ═══ RESULT ═══
  if (step === 'result') {
    const dbD = (CONSTITUTION_DB as any)[rk], info = CONSTITUTION_INFO[rn]||CONSTITUTION_INFO['平和质'], db = dbD||CONSTITUTION_DB.A
    return (
      <div className="min-h-dvh px-4 pt-6 pb-4" style={{background:'var(--bg-primary)'}}>
        <div className="flex items-center justify-between mb-2">
          <span className="tag bg-[var(--gold)]/15 text-[var(--gold)]">{db.name}</span>
          <span className="text-xs" style={{color:'var(--text-secondary)'}}>{tRes?'答题+舌诊双重诊断':'问诊诊断'}</span>
        </div>
        <div className="text-center mb-4">
          <span className="text-5xl block mb-2">{db.icon}</span>
          <h1 className="text-2xl font-bold" style={{color:db.color}}>{db.title}</h1>
          <p className="text-sm mt-1" style={{color:'var(--text-secondary)'}}>{db.desc}</p>
        </div>
        <div className="card mb-4 flex flex-col items-center py-4">
          <p className="text-xs font-bold mb-3" style={{color:'#999'}}>📊 九维体质分析</p>
          <canvas ref={canvasRef} width={300} height={260} className="rounded-lg"/>
        </div>
        <div className="card mb-3">
          <h3 className="text-sm font-bold mb-2" style={{color:db.color}}>✨ 体质特征</h3>
          <div className="space-y-1.5">{db.features?.map((f:string,i:number)=><p key={i} className="text-sm" style={{color:'var(--text-primary)'}}>{f}</p>)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card p-3" style={{background:'rgba(74,124,89,0.08)'}}><h3 className="text-xs font-bold mb-1" style={{color:'var(--green)'}}>🌿 推荐饮食</h3><p className="text-xs leading-relaxed" style={{color:'var(--text-primary)'}}>{info.diet}</p></div>
          <div className="card p-3" style={{background:'rgba(232,93,74,0.08)'}}><h3 className="text-xs font-bold mb-1" style={{color:'var(--red)'}}>⚠️ 饮食禁忌</h3><p className="text-xs leading-relaxed" style={{color:'var(--text-primary)'}}>{info.avoid}</p></div>
        </div>
        <div className="card mb-6 p-3" style={{background:'var(--gold)/8'}}><h3 className="text-xs font-bold mb-1" style={{color:'var(--gold)'}}>💡 养生建议</h3><p className="text-xs" style={{color:'var(--text-primary)'}}>{db.rec}</p></div>
        <button onClick={()=>setStep('adopt')} className="btn-gold w-full flex items-center justify-center gap-2 text-lg py-3.5">🎉 领养你的专属小马 <ChevronRight size={20}/></button>
      </div>
    )
  }

  // ═══ ADOPT ═══
  if (step === 'adopt') return (
    <div className="min-h-dvh px-6 py-8 flex flex-col" style={{background:'var(--bg-primary)'}}>
      <h2 className="text-xl font-bold mb-2 text-center" style={{color:'var(--text-primary)'}}>选择你的小马</h2>
      <p className="text-xs text-center mb-6" style={{color:'var(--text-secondary)'}}>每匹马都有独特的性格和配件</p>
      <div className="grid grid-cols-2 gap-3 mb-6">{HS.map(h=>(
        <button key={h.style} onClick={()=>setSelStyle(h.style)} className={`card flex flex-col items-center gap-2 py-4 transition-all ${selStyle===h.style?'border-[var(--gold)] shadow-[0_0_20px_rgba(255,215,0,0.3)]':'hover:border-[var(--gold)]/50'}`}>
          <img src={h.image} alt={h.style} className="w-20 h-20 object-contain" /><span className="text-sm font-bold" style={{color:'var(--text-primary)'}}>{h.style}</span>
          <span className="text-xs" style={{color:'var(--text-secondary)'}}>{h.desc}</span><span className="text-lg">{h.acc}</span>
        </button>
      ))}</div>
      {selStyle && (<div className="space-y-4 animate-fade-in">
        <div><label className="text-sm font-medium mb-1.5 block" style={{color:'var(--text-secondary)'}}>给小马取个名字</label>
          <input type="text" value={hname} onChange={e=>setHname(e.target.value)} placeholder="例如：小白、追风、千里马..." className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--gold)]" maxLength={8}/>
        </div>
        <button onClick={handleAdopt} disabled={!hname.trim()} className="btn-gold w-full flex items-center justify-center gap-2 text-lg py-3 disabled:opacity-40 disabled:cursor-not-allowed">🎉 领养 {hname||'小马'}</button>
      </div>)}
    </div>
  )

  return null
}
