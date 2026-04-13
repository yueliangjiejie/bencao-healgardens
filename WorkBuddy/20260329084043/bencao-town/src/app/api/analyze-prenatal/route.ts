import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null
  return new GoogleGenerativeAI(apiKey)
}

const PRENATAL_SYSTEM_PROMPT = `你是一位专业的产科医生助手，专门帮助孕妇分析产检报告并制定健康计划。

用户会发一张产检报告单的照片，你需要：
1. **识别报告类型**：血常规/尿常规/B超/糖耐/唐筛/大排畸/其他
2. **关键指标解读**：提取关键数值，判断是否在正常范围
3. **异常标记**：哪些指标偏高/偏低，需要关注
4. **建议**：饮食/生活方式建议
5. **疫苗提醒**：根据孕期阶段提醒需要接种的疫苗
6. **下次产检**：建议下次产检时间和项目

⚠️ 重要规则：
- 如果图片不是产检报告，返回 error: "这不是产检报告"
- 正常范围参考值要准确
- 异常指标要特别标注
- 疫苗提醒要参考中国孕期免疫规划
- 必须严格返回JSON格式`

// 中国孕期推荐疫苗时间表
const VACCINE_SCHEDULE = [
  { weekRange: '12-16周', vaccine: '流感疫苗（灭活）', note: '孕期任何阶段均可接种' },
  { weekRange: '27-36周', vaccine: '百白破疫苗（Tdap）', note: '推荐每次怀孕27-36周接种，保护新生儿' },
  { weekRange: '产后', vaccine: '乙肝疫苗（如需要）', note: '根据乙肝五项结果决定' },
]

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg', gestationalWeek } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    const genAI = getGenAI()
    if (!genAI) {
      // Demo模式
      const demoWeek = gestationalWeek || 20
      return NextResponse.json({
        success: true,
        demo: true,
        result: {
          reportType: '血常规（Demo）',
          gestationalWeek: demoWeek,
          indicators: [
            { name: '血红蛋白', value: '110 g/L', normal: '110-150 g/L', status: 'normal' },
            { name: '白细胞', value: '9.8×10⁹/L', normal: '4-10×10⁹/L', status: 'normal' },
            { name: '血小板', value: '180×10⁹/L', normal: '100-300×10⁹/L', status: 'normal' },
            { name: '空腹血糖', value: '5.2 mmol/L', normal: '3.9-5.1 mmol/L', status: 'high', note: '轻度偏高，注意控糖' },
          ],
          abnormalCount: 1,
          advice: [
            '血糖略偏高，建议控制碳水化合物摄入',
            '适量运动，每天散步30分钟',
            '增加蛋白质摄入，多吃鱼、蛋、豆制品',
          ],
          vaccineReminders: [
            { vaccine: '百白破疫苗（Tdap）', weekRange: '27-36周', note: '建议在27-36周接种', urgent: false },
          ],
          nextCheckup: {
            time: `孕${demoWeek + 4}周`,
            items: ['B超', '尿常规', '血压监测'],
          },
        }
      })
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: PRENATAL_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1000,
        responseMimeType: 'application/json',
      }
    })

    const weekInfo = gestationalWeek ? `\n用户当前孕周：${gestationalWeek}周` : '\n请根据报告内容推测孕周'

    const result = await model.generateContent([
      {
        inlineData: { data: imageBase64, mimeType }
      },
      `请分析这张产检报告，返回JSON格式：${weekInfo}
{"reportType":"报告类型","gestationalWeek":数值,"indicators":[{"name":"指标名","value":"数值+单位","normal":"正常范围","status":"normal/high/low","note":"备注(可选)"}],"abnormalCount":数值,"advice":["建议1","建议2"],"vaccineReminders":[{"vaccine":"疫苗名","weekRange":"接种时间","note":"说明","urgent":true/false}],"nextCheckup":{"time":"下次建议时间","items":["项目1","项目2"]}}`
    ])

    const text = result.response.text()
    let parsed
    try {
      let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const match = clean.match(/\{[\s\S]*\}/)
      if (match) clean = match[0]
      parsed = JSON.parse(clean)
    } catch {
      parsed = {
        reportType: '产检报告（AI分析）',
        gestationalWeek: gestationalWeek || 0,
        indicators: [],
        abnormalCount: 0,
        advice: ['请咨询主治医生获取详细解读'],
        vaccineReminders: [],
        nextCheckup: { time: '请遵医嘱', items: [] },
      }
    }

    const safeResult = {
      reportType: parsed.reportType || '产检报告',
      gestationalWeek: parsed.gestationalWeek || gestationalWeek || 0,
      indicators: Array.isArray(parsed.indicators)
        ? parsed.indicators.map((ind: any) => ({
            name: ind.name || '未知指标',
            value: ind.value || '--',
            normal: ind.normal || '--',
            status: ['normal', 'high', 'low'].includes(ind.status) ? ind.status : 'normal',
            note: ind.note || '',
          }))
        : [],
      abnormalCount: typeof parsed.abnormalCount === 'number' ? parsed.abnormalCount : 0,
      advice: Array.isArray(parsed.advice) ? parsed.advice : ['请咨询医生'],
      vaccineReminders: Array.isArray(parsed.vaccineReminders)
        ? parsed.vaccineReminders.map((v: any) => ({
            vaccine: v.vaccine || '',
            weekRange: v.weekRange || '',
            note: v.note || '',
            urgent: !!v.urgent,
          }))
        : [],
      nextCheckup: parsed.nextCheckup || { time: '请遵医嘱', items: [] },
    }

    return NextResponse.json({ success: true, demo: false, result: safeResult })
  } catch (error: any) {
    const msg = error?.message || ''
    if (msg.includes('API_KEY') || msg.includes('api key')) {
      return NextResponse.json({ error: 'API Key 未配置', code: 'NO_API_KEY' }, { status: 500 })
    }
    if (msg.includes('quota') || msg.includes('429')) {
      return NextResponse.json({ error: 'API 配额已用尽', code: 'QUOTA_EXCEEDED' }, { status: 429 })
    }
    return NextResponse.json({ error: '分析失败，请重试', code: 'UNKNOWN' }, { status: 500 })
  }
}
