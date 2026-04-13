import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null
  return new GoogleGenerativeAI(apiKey)
}

const MEDICINE_SYSTEM_PROMPT = `你是一位专业的临床药师，专门帮助用户整理家庭药箱。

用户会发一张药盒/药品包装的照片，你需要：
1. **准确识别**药品通用名称和商品名
2. **分类**：处方药/OTC非处方药/保健品/中成药
3. **主要用途**：该药品主要用于治疗什么
4. **用法用量**：常见的用法用量（仅作参考）
5. **注意事项**：关键禁忌和不良反应
6. **有效期管理**：提醒检查有效期
7. **相互作用**：常见药物相互作用警告

⚠️ 重要规则：
- 如果图片不是药品/药盒，返回 error: "这不是药品图片"
- 用法用量仅为参考建议，提醒用户遵医嘱
- 注意事项要突出最重要的几条
- 必须严格返回JSON格式`

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    const genAI = getGenAI()
    if (!genAI) {
      return NextResponse.json({
        success: true,
        demo: true,
        result: [{
          name: '阿莫西林胶囊（Demo）',
          brand: '某某药业',
          category: 'OTC非处方药',
          purpose: '用于敏感菌所致的呼吸道感染、泌尿生殖道感染等',
          dosage: '成人一次0.5g，每6~8小时1次（遵医嘱）',
          precautions: [
            '青霉素过敏者禁用',
            '服药期间避免饮酒',
            '孕妇及哺乳期妇女慎用',
            '可能出现腹泻、恶心等不良反应',
          ],
          interactions: '避免与丙磺舒、别嘌醇同用',
          storageNote: '密封，在阴凉干燥处保存',
          confidence: 0.8,
        }]
      })
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: MEDICINE_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        responseMimeType: 'application/json',
      }
    })

    const result = await model.generateContent([
      {
        inlineData: { data: imageBase64, mimeType }
      },
      '请识别这张药品图片，返回JSON数组格式（可识别多个药品）：\n[{"name":"药品通用名","brand":"商品名/厂家","category":"处方药/OTC非处方药/保健品/中成药","purpose":"主要用途(30字内)","dosage":"常见用法用量","precautions":["注意事项1","注意事项2","注意事项3"],"interactions":"常见药物相互作用","storageNote":"储存条件","confidence":0.0-1.0}]'
    ])

    const text = result.response.text()
    let parsed
    try {
      let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const match = clean.match(/\[[\s\S]*\]/) || clean.match(/\{[\s\S]*\}/)
      if (match) clean = match[0]
      if (!clean.startsWith('[')) clean = '[' + clean + ']'
      parsed = JSON.parse(clean)
      if (!Array.isArray(parsed)) parsed = [parsed]
    } catch {
      parsed = [{
        name: '药品（AI识别）',
        brand: '未知',
        category: '其他',
        purpose: '请参考药品说明书',
        dosage: '请遵医嘱',
        precautions: ['请仔细阅读药品说明书', '如有不适请及时就医'],
        interactions: '请咨询药师',
        storageNote: '密封保存',
        confidence: 0.5,
      }]
    }

    const safeResult = parsed.map((item: any) => ({
      name: typeof item.name === 'string' ? item.name : '未知药品',
      brand: item.brand || '未知',
      category: item.category || '其他',
      purpose: item.purpose || '请参考药品说明书',
      dosage: item.dosage || '请遵医嘱',
      precautions: Array.isArray(item.precautions) ? item.precautions : ['请仔细阅读说明书'],
      interactions: item.interactions || '请咨询药师',
      storageNote: item.storageNote || '密封保存',
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.6,
    }))

    return NextResponse.json({ success: true, demo: false, result: safeResult })
  } catch (error: any) {
    const msg = error?.message || ''
    if (msg.includes('API_KEY') || msg.includes('api key')) {
      return NextResponse.json({ error: 'API Key 未配置', code: 'NO_API_KEY' }, { status: 500 })
    }
    if (msg.includes('quota') || msg.includes('429')) {
      return NextResponse.json({ error: 'API 配额已用尽', code: 'QUOTA_EXCEEDED' }, { status: 429 })
    }
    return NextResponse.json({ error: '识别失败，请重试', code: 'UNKNOWN' }, { status: 500 })
  }
}
