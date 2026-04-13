import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { diagnoseSyndromes, getSyndromeDefinition, getDifferentialInfo, type DiagnosisInput } from '@/lib/syndrome-diagnosis-rules'

// 初始化 Gemini 客户端
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null
  return new GoogleGenerativeAI(apiKey)
}

const SYNDROME_SYSTEM_PROMPT = `你是「本草纲目药膳小镇」的中医智能辨证助手。用户会描述自己的症状，你需要：

1. 从用户描述中提取关键症状
2. 结合中医辨证理论进行证型分析
3. 给出调理建议（食疗、药方、生活方式）

## 核心辨证体系
- 气血津液辨证：气虚/气滞/血虚/血瘀/津液不足
- 脏腑辨证（脾胃）：脾气虚/脾阳虚/胃气虚/胃阴虚
- 六经辨证：太阳/少阳/阳明
- 其他：肝气郁结/肾阳虚/肾阴虚

## 重要规则
- 回答要通俗易懂，避免过度使用中医术语
- 建议要具体可操作（给出具体食材和做法）
- 必须声明"本建议仅供参考，不替代医生诊断"
- 如果症状严重或紧急，建议立即就医`

export async function POST(req: NextRequest) {
  try {
    const { symptoms, tongueData } = await req.json()

    if (!symptoms || (Array.isArray(symptoms) && symptoms.length === 0)) {
      return NextResponse.json({ error: '请描述您的症状' }, { status: 400 })
    }

    const symptomList = Array.isArray(symptoms) ? symptoms : [symptoms]

    // ── 第一步：本地量化诊断引擎 ──
    const input: DiagnosisInput = {
      symptoms: symptomList,
      tongueColor: tongueData?.tongueColor,
      tongueShape: tongueData?.tongueShape,
      coating: tongueData?.coating,
    }
    const localResults = diagnoseSyndromes(input)

    // 获取匹配证型的详细信息和鉴别要点
    const detailedResults = localResults.slice(0, 3).map(r => {
      const def = getSyndromeDefinition(r.syndrome)
      return {
        ...r,
        definition: def?.definition || '',
        careAdvice: def?.careAdvice || null,
        constitutionMapping: def?.constitutionMapping || [],
      }
    })

    // 获取前两个证型的鉴别要点
    let differentialInfo = null
    if (localResults.length >= 2) {
      differentialInfo = getDifferentialInfo(localResults[0].syndrome, localResults[1].syndrome)
    }

    // ── 第二步：如果有Gemini API，让AI生成自然语言解释 ──
    const genAI = getGenAI()
    if (genAI) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYNDROME_SYSTEM_PROMPT,
        generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
      })

      const prompt = `用户描述的症状：${symptomList.join('、')}
${tongueData ? `\n舌诊数据：舌色${tongueData.tongueColor || '未知'}，舌形${tongueData.tongueShape || '未知'}，苔色${tongueData.coating || '未知'}` : ''}
${localResults.length > 0 ? `\n量化辨证引擎结果：最可能是「${localResults[0].syndrome}」（匹配度${Math.round(localResults[0].score * 100)}%）${localResults.length > 1 ? `，其次「${localResults[1].syndrome}」（${Math.round(localResults[1].score * 100)}%）` : ''}` : '量化辨证引擎未能匹配到明确证型'}

请基于以上分析，用通俗易懂的语言：
1. 一句话总结最可能的证型
2. 解释为什么（2-3句）
3. 给出3条具体可操作的调理建议（食疗为主）
4. 最后加上免责声明

回复控制在200字以内。`

      try {
        const result = await model.generateContent(prompt)
        const aiExplanation = result.response.text()

        return NextResponse.json({
          success: true,
          source: 'hybrid',
          results: detailedResults,
          differentialInfo,
          aiExplanation,
        })
      } catch {
        // AI调用失败，仍返回本地结果
      }
    }

    // ── Demo模式或AI失败：只返回本地引擎结果 ──
    const demoExplanation = localResults.length > 0
      ? `根据您的症状分析，最可能是「${localResults[0].syndrome}」。\n\n建议：${getSyndromeDefinition(localResults[0].syndrome)?.careAdvice?.diet || '饮食清淡，规律作息'}。\n\n⚠️ 本建议仅供参考，不替代医生诊断。`
      : '症状信息不足以做出明确判断，建议补充更多症状描述或咨询中医师。'

    return NextResponse.json({
      success: true,
      source: 'local',
      results: detailedResults,
      differentialInfo,
      aiExplanation: demoExplanation,
    })

  } catch (error: any) {
    console.error('Syndrome diagnosis error:', error)
    return NextResponse.json(
      { error: '证型诊断失败，请重试', code: 'UNKNOWN' },
      { status: 500 }
    )
  }
}
