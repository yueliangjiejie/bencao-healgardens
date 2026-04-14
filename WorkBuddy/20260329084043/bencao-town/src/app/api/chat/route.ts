import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { searchFood, FOOD_DATABASE, getFoodsByConstitution } from '@/lib/food-nutrition-db'
import { searchAcupoint, getAcupointsBySymptom, getAcupointsByConstitution, getAcupointPlan, ACUPOINT_DATABASE } from '@/lib/acupoint-db'

// ─── AI模型引擎选择 ───
type AIEngine = 'gemini' | 'minimax' | 'demo'

function selectEngine(): AIEngine {
  const miniKey = process.env.MINIMAX_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  if (miniKey && miniKey !== 'your_minimax_api_key_here') return 'minimax'
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') return 'gemini'
  return 'demo'
}

// ─── MiniMax API调用 ───
async function callMiniMax(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY!
  const groupId = process.env.MINIMAX_GROUP_ID || 'default'

  const res = await fetch(`https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${groupId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('MiniMax API error:', res.status, errText)
    throw new Error(`MiniMax API error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || '抱歉，AI暂时无法回答。'
}

// ─── 知识库构建 ───

function buildKnowledgeBase(): string {
  const parts: string[] = []

  // 1. 食物营养知识（取前30条核心数据）
  parts.push('【食物营养与中医食疗知识】')
  FOOD_DATABASE.slice(0, 30).forEach(f => {
    parts.push(`- ${f.name}(${f.category}): ${f.calories}kcal/${f.portion}, 性${f.tcmNature}, 归${f.tcmMeridian}. ${f.tcmAdvice} 适宜:${f.constitutionFit.join('/')} 忌:${f.constitutionAvoid.join('/') || '无'}`)
  })

  // 2. 穴位按摩知识
  parts.push('\n【穴位按摩与经络知识】')
  ACUPOINT_DATABASE.forEach(p => {
    parts.push(`- ${p.name}(${p.nameEn}, ${p.meridian}): 定位:${p.location}. 功效:${p.effects.join('、')}. 按摩:${p.massageMethod} ${p.massageDuration}. 适宜:${p.constitutionFit.join('/')}. 主治:${p.relatedSymptoms.join('、')}. 配穴:${p.pairPoints.join('+')}`)
  })

  // 3. 体质知识摘要
  parts.push('\n【九种体质知识】')
  parts.push('平和质：阴阳气血调和，体态适中，面色润泽。调养：饮食有节，不偏不挑。')
  parts.push('气虚质：元气不足，疲乏气短，易感冒。调养：补气健脾，宜食黄芪、山药、鸡肉。忌过劳。')
  parts.push('阳虚质：阳气不足，畏寒怕冷，手足不温。调养：温阳散寒，宜食羊肉、生姜、桂圆。忌寒凉。')
  parts.push('阴虚质：阴液亏少，口燥咽干，手足心热。调养：滋阴降火，宜食百合、银耳、枸杞。忌辛辣燥热。')
  parts.push('痰湿质：痰湿凝聚，体形肥胖，腹部肥满。调养：化痰祛湿，宜食薏米、冬瓜、荷叶。忌甜腻。')
  parts.push('湿热质：湿热内蕴，面垢油光，口苦口干。调养：清热利湿，宜食绿豆、苦瓜、黄瓜。忌辛辣油腻。')
  parts.push('血瘀质：血行不畅，肤色晦暗，易有瘀斑。调养：活血化瘀，宜食山楂、桃仁、红花。宜运动。')
  parts.push('气郁质：气机郁滞，情志不畅，忧郁脆弱。调养：疏肝理气，宜食玫瑰花、佛手、柑橘。宜社交运动。')
  parts.push('特禀质：先天禀赋异常，过敏体质。调养：益气固表，宜食黄芪、防风。忌过敏原。')

  return parts.join('\n')
}

// ─── RAG检索：根据用户问题检索相关知识 ───

interface RAGContext {
  foods: string[]
  acupoints: string[]
  keywords: string[]
}

function retrieveContext(query: string): RAGContext {
  const context: RAGContext = { foods: [], acupoints: [], keywords: [] }
  const q = query.toLowerCase()

  // 症状关键词 → 穴位
  const symptomKeywords = ['头痛','失眠','胃痛','恶心','便秘','腹泻','咳嗽','痛经','腰痛','颈痛','颈椎','感冒','焦虑','疲劳','眼疲劳','消化不良','耳鸣','水肿','脚冷','手冷','怕冷','上火','口干','月经']
  const matchedSymptoms = symptomKeywords.filter(s => q.includes(s))
  if (matchedSymptoms.length > 0) {
    matchedSymptoms.forEach(s => {
      const points = getAcupointsBySymptom(s).slice(0, 3)
      points.forEach(p => {
        context.acupoints.push(`${p.name}(${p.nameEn}): ${p.location}. 按法:${p.massageMethod} ${p.massageDuration}. 功效:${p.effects.join('、')}`)
      })
    })
  }

  // 体质关键词 → 食物+穴位
  const constitutionKeywords = ['气虚','阳虚','阴虚','痰湿','湿热','血瘀','气郁','特禀','平和']
  const matchedConstitutions = constitutionKeywords.filter(c => q.includes(c))
  matchedConstitutions.forEach(c => {
    const cName = c + '质'
    const foods = getFoodsByConstitution(cName, 'fit').slice(0, 5)
    foods.forEach(f => context.foods.push(`${f.name}: ${f.calories}kcal, 性${f.tcmNature}, ${f.tcmAdvice}`))
    const points = getAcupointsByConstitution(cName).slice(0, 3)
    points.forEach(p => context.acupoints.push(`${p.name}: ${p.effects.join('、')}, 按摩${p.massageDuration}`))
  })

  // 食物关键词 → 营养数据
  const foodKeywords = ['米饭','面','粥','鸡','鱼','牛肉','猪肉','虾','白菜','西兰花','番茄','土豆','豆腐','奶茶','咖啡','牛奶','豆浆','苹果','香蕉','橙子','火锅','烤肉','粥','汤']
  const matchedFoods = foodKeywords.filter(f => q.includes(f))
  matchedFoods.forEach(f => {
    const food = searchFood(f)
    if (food) context.foods.push(`${food.name}: ${food.calories}kcal/${food.portion}, 蛋白${food.nutrients.protein}g 碳水${food.nutrients.carbs}g 脂肪${food.nutrients.fat}g, 性${food.tcmNature}, ${food.tcmAdvice}`)
  })

  // 穴位关键词 → 穴位详情
  const acupointKeywords = ['百会','印堂','太阳','涌泉','合谷','内关','列缺','足三里','三阴交','太冲','丰隆','血海','中脘','关元','命门','肾俞','肺俞','穴位','按摩','推拿']
  const matchedAcupoints = acupointKeywords.filter(a => q.includes(a))
  matchedAcupoints.forEach(a => {
    const point = searchAcupoint(a)
    if (point) {
      context.acupoints.push(`${point.name}(${point.nameEn}): 定位:${point.location}. 按法:${point.massageMethod} ${point.massageDuration}. 功效:${point.effects.join('、')}. 配穴:${point.pairPoints.join('+')}`)
    }
  })

  // 通用关键词
  if (q.includes('减') || q.includes('瘦') || q.includes('肥')) context.keywords.push('减脂')
  if (q.includes('吃什么') || q.includes('推荐食')) context.keywords.push('饮食推荐')
  if (q.includes('养生') || q.includes('保健')) context.keywords.push('养生')
  if (q.includes('按') || q.includes('揉') || q.includes('压')) context.keywords.push('按摩')

  return context
}

// ─── API处理 ───

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null
  return new GoogleGenerativeAI(apiKey)
}

const CHAT_SYSTEM_PROMPT = `你是「本草纲目健康小镇」的AI中医健康顾问，名字叫"小本草"。

## 身份
你是专业的中医食疗养生顾问，擅长：
- 中医体质辨识与调理建议
- 食疗营养分析（基于精确数据库）
- 穴位按摩指导（含定位、手法、时长）
- 健康生活方式建议

## 回答规则
1. **优先使用知识库数据**：用户问到的食物/穴位，优先引用下方【知识库检索结果】中的精确数据
2. **穴位指导要详细**：包含定位描述、按摩手法、时长、频率、注意事项
3. **食物建议要量化**：包含热量、营养素、寒热属性、适宜/不适宜体质
4. **中医用语通俗化**：用普通人能理解的方式解释中医概念
5. **安全提醒**：涉及穴位按摩时提醒注意事项，孕妇穴位要特别标注
6. **回答格式**：使用emoji+分点+小标题，让回答清晰易读
7. **如果涉及严重疾病**：提醒用户及时就医，AI建议不能替代专业诊疗

## 回答长度
- 简单问题：100-200字
- 详细建议：200-400字
- 综合调理方案：300-500字

## 语言风格
温和专业，像一位有经验的老中医。开头可以加"您好👋"，结尾加鼓励性的话。`

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()
    if (!message) return NextResponse.json({ error: '请输入问题' }, { status: 400 })

    // RAG检索
    const context = retrieveContext(message)
    const knowledgeBase = buildKnowledgeBase()

    // 构建上下文提示
    let contextPrompt = ''
    if (context.foods.length > 0 || context.acupoints.length > 0) {
      contextPrompt = '\n\n【知识库检索结果（请优先引用）】'
      if (context.foods.length > 0) contextPrompt += '\n食物营养数据:\n' + context.foods.join('\n')
      if (context.acupoints.length > 0) contextPrompt += '\n穴位按摩数据:\n' + context.acupoints.join('\n')
    }

    const genAI = getGenAI()
    const engine = selectEngine()

    // Demo模式（无API Key）
    if (engine === 'demo') {
      const demoReply = generateDemoReply(message, context)
      return NextResponse.json({
        success: true,
        demo: true,
        reply: demoReply,
        sources: context.foods.length > 0 || context.acupoints.length > 0
          ? { foods: context.foods.length, acupoints: context.acupoints.length }
          : undefined
      })
    }

    // 构建完整系统提示（含知识库+RAG上下文）
    const fullSystemPrompt = CHAT_SYSTEM_PROMPT + '\n\n【基础知识库摘要】\n' + knowledgeBase.slice(0, 3000) + contextPrompt

    // MiniMax模式
    if (engine === 'minimax') {
      const chatMessages = history.slice(-6).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user' as const,
        content: msg.content,
      }))
      chatMessages.push({ role: 'user', content: message })

      const reply = await callMiniMax(chatMessages, fullSystemPrompt)

      return NextResponse.json({
        success: true,
        demo: false,
        engine: 'minimax',
        reply,
        sources: context.foods.length > 0 || context.acupoints.length > 0
          ? { foods: context.foods.length, acupoints: context.acupoints.length }
          : undefined
      })
    }

    // Gemini模式（默认）
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: CHAT_SYSTEM_PROMPT + '\n\n【基础知识库摘要】\n' + knowledgeBase.slice(0, 3000) + contextPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      }
    })

    // 构建对话历史
    const chatHistory = history.slice(-6).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    const chat = model.startChat({ history: chatHistory })
    const result = await chat.sendMessage(message)
    const reply = result.response.text()

    return NextResponse.json({
      success: true,
      demo: false,
      engine: 'gemini',
      reply,
      sources: context.foods.length > 0 || context.acupoints.length > 0
        ? { foods: context.foods.length, acupoints: context.acupoints.length }
        : undefined
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'AI暂时无法回答，请稍后再试', code: 'CHAT_ERROR' },
      { status: 500 }
    )
  }
}

// Demo模式智能回复
function generateDemoReply(message: string, context: RAGContext): string {
  const q = message.toLowerCase()

  if (context.acupoints.length > 0) {
    return `您好👋 根据您的问题，我为您找到了以下穴位建议：\n\n${context.acupoints.slice(0, 3).map((a, i) => `${i + 1}. ${a}`).join('\n\n')}\n\n⚠️ 按摩时力度由轻到重，孕妇请在医师指导下操作。\n\n💡 点击下方"查看穴位图"可以查看人体穴位定位图哦！\n\n坚持每天按摩，效果会逐渐显现！💪`
  }

  if (context.foods.length > 0) {
    return `您好👋 根据您的需求，为您推荐以下食物：\n\n${context.foods.slice(0, 4).map((f, i) => `${i + 1}. ${f}`).join('\n\n')}\n\n合理搭配饮食，配合适量运动，健康就在身边！🌿`
  }

  if (q.includes('体质')) {
    return `您好👋 中医将人体分为九种体质：平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质。\n\n建议先完成体质测评，了解自己的体质类型，我可以针对性地给出食疗和穴位按摩建议。\n\n您可以在"中医馆"页面进行专业体质测试哦！🏯`
  }

  if (q.includes('减') || q.includes('瘦') || q.includes('肥')) {
    return `您好👋 减脂的关键是"管住嘴、迈开腿"，中医讲究"健脾化湿"：\n\n🍽️ 饮食建议：\n1. 主食减量但不全戒，可用红薯/玉米替代白米饭\n2. 多吃蔬菜（西兰花、菠菜、白菜）和优质蛋白（鸡胸肉、鱼、虾）\n3. 少油少糖，痰湿质特别要避免甜食和冷饮\n\n🤸 穴位辅助：\n- 丰隆穴：化痰祛湿要穴\n- 足三里：健脾胃助代谢\n- 天枢穴（脐旁2寸）：促进肠道蠕动\n\n坚持下去，你一定可以的！💪`
  }

  return `您好👋 我是"小本草"，本草纲目健康小镇的AI中医健康顾问。\n\n我可以帮您：\n🌿 体质辨识与调理建议\n🍽️ 食物营养分析与食疗推荐\n💆 穴位按摩指导（含定位和手法）\n🏃 减脂养生方案定制\n\n请告诉我您的具体问题，比如：\n- "我总是失眠怎么办？"\n- "气虚质适合吃什么？"\n- "头痛按什么穴位？"`
}
