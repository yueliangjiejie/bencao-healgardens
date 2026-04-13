import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 初始化 Gemini 客户端（懒加载，避免冷启动问题）
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null
  }
  return new GoogleGenerativeAI(apiKey)
}

// ─── 常见食物热量参考表（中餐为主） ───
const CALORIE_REFERENCE = `
【常见中餐热量参考表（每份/100g）】
主食：白米饭(一碗)230kcal, 馒头(1个)220kcal, 面条(一碗)280kcal, 炒饭(一盘)550kcal, 炒面(一盘)500kcal, 饺子(10个)420kcal, 包子(1个)180kcal, 粥(一碗)60kcal, 红薯(1个)112kcal, 玉米(1根)112kcal
肉类：鸡胸肉(100g)133kcal, 五花肉(100g)395kcal, 瘦猪肉(100g)143kcal, 牛肉(100g)125kcal, 羊肉(100g)203kcal, 鸡腿(1个)180kcal, 排骨(100g)264kcal, 鱼肉(100g)100kcal, 虾(100g)95kcal, 带鱼(100g)127kcal
蔬菜：西兰花(100g)34kcal, 菠菜(100g)23kcal, 白菜(100g)18kcal, 番茄(100g)19kcal, 黄瓜(100g)15kcal, 茄子(100g)21kcal, 土豆(100g)76kcal, 豆腐(100g)73kcal, 豆芽(100g)18kcal, 蘑菇(100g)20kcal
蛋奶：鸡蛋(1个)78kcal, 牛奶(250ml)160kcal, 酸奶(200ml)130kcal, 豆浆(250ml)35kcal, 奶酪(30g)110kcal
水果：苹果(1个)72kcal, 香蕉(1根)89kcal, 橙子(1个)48kcal, 西瓜(100g)25kcal, 葡萄(100g)43kcal, 草莓(100g)32kcal
饮品：可乐(330ml)140kcal, 奶茶(500ml)350kcal, 咖啡(黑)5kcal, 啤酒(330ml)120kcal
零食：薯片(100g)547kcal, 巧克力(100g)546kcal, 饼干(100g)430kcal, 坚果(100g)600kcal
汤类：紫菜蛋花汤(碗)45kcal, 番茄蛋汤(碗)60kcal, 酸辣汤(碗)80kcal, 排骨汤(碗)120kcal, 鸡汤(碗)95kcal
菜式：宫保鸡丁(份)230kcal, 麻婆豆腐(份)180kcal, 红烧肉(份)380kcal, 清蒸鱼(份)130kcal, 西红柿炒蛋(份)150kcal, 青椒肉丝(份)180kcal, 鱼香肉丝(份)250kcal, 糖醋排骨(份)350kcal, 回锅肉(份)380kcal, 地三鲜(份)160kcal, 干锅花菜(份)200kcal, 蒜蓉西兰花(份)80kcal
`

const SYSTEM_PROMPT = `你是一位专业的中式菜肴营养分析AI，服务于「本草纲目药膳小镇」健康应用。

## 核心任务
分析用户拍摄的食物图片，准确识别并返回营养数据。

## 识别规则
1. **优先识别中餐**：如果看起来像中餐菜式，优先使用中餐菜名（如"西红柿炒鸡蛋"而非"番茄炒蛋"）
2. **多种食物同时出现**：如果图片中有多种食物，识别最主体/最明显的一种作为主结果，其余放入candidates数组
3. **份量估算**：参考常见餐具（碗≈250ml、盘子≈20cm、筷子长度≈25cm）来估算份量
4. **热量校准**：必须参考以下热量表校准你的估算结果：
${CALORIE_REFERENCE}
5. **置信度诚实评估**：
   - 0.9+：非常确定是什么食物
   - 0.8-0.9：较确定，可能是某个菜式
   - 0.7-0.8：基本识别，可能混淆相似菜
   - 0.5-0.7：不确定，可能是多种食物之一
   - <0.5：无法确定，建议用户手动记录

## 中医食疗分析
- 根据食物的性味归经给出简短建议
- 标注食物的寒热温凉属性
- 结合9种体质（平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质）标注适宜/不适宜
- 中医建议不超过80字

## 错误处理
- 如果图片不是食物，返回 {"error": "这不是食物图片"}
- 如果图片模糊无法识别，返回 {"error": "图片模糊", "confidence": 0.3}
- 如果图片包含多道菜，主结果取最大的，其余放candidates

## 输出格式（严格JSON）
{
  "name": "食物名称（含emoji，如🍚 白米饭）",
  "calories": 数值(kcal，基于估算份量),
  "category": "主食|蔬菜|肉类|汤类|饮品|水果|零食|菜式|其他",
  "portion": "估算份量描述（如'一碗约250g'、'一盘约300g'）",
  "tcmNature": "寒|凉|平|温|热",
  "tcmAdvice": "中医食疗建议（80字以内）",
  "constitutionFit": ["适宜的体质（最多3种）"],
  "constitutionAvoid": ["不适宜的体质（最多2种）"],
  "nutrients": {"protein": 蛋白质g, "carbs": 碳水g, "fat": 脂肪g, "fiber": 膳食纤维g},
  "confidence": 0.0-1.0,
  "candidates": [
    {"name": "候选食物名", "calories": 数值, "confidence": 0.0-1.0}
  ]
}`

// ─── Demo模式多样本数据 ───
const DEMO_FOODS = [
  {
    name: '🍚 蛋炒饭',
    calories: 480,
    category: '菜式',
    portion: '一盘约350g',
    tcmNature: '平',
    tcmAdvice: '蛋炒饭性平，补中益气。米饭健脾养胃，鸡蛋滋阴润燥。痰湿质少食，可加葱花助消化。',
    constitutionFit: ['平和质', '气虚质', '阳虚质'],
    constitutionAvoid: ['痰湿质'],
    nutrients: { protein: 14, carbs: 65, fat: 15, fiber: 1 },
    confidence: 0.88,
    candidates: [{ name: '扬州炒饭', calories: 520, confidence: 0.65 }, { name: '酱油炒饭', calories: 420, confidence: 0.45 }]
  },
  {
    name: '🥩 红烧排骨',
    calories: 380,
    category: '肉类',
    portion: '一份约200g',
    tcmNature: '温',
    tcmAdvice: '猪肉性平滋阴，红烧后偏温。配生姜、八角温中散寒。阳虚质适宜，湿热质少食。',
    constitutionFit: ['平和质', '阳虚质', '气虚质'],
    constitutionAvoid: ['湿热质', '痰湿质'],
    nutrients: { protein: 22, carbs: 8, fat: 30, fiber: 0 },
    confidence: 0.85,
    candidates: [{ name: '糖醋排骨', calories: 420, confidence: 0.6 }, { name: '豉汁排骨', calories: 350, confidence: 0.4 }]
  },
  {
    name: '🥬 蒜蓉西兰花',
    calories: 75,
    category: '蔬菜',
    portion: '一盘约200g',
    tcmNature: '凉',
    tcmAdvice: '西兰花性凉健脾胃，蒜蓉温中。适合大多数体质。脾胃虚寒者少食生冷，炒熟即可。',
    constitutionFit: ['平和质', '湿热质', '痰湿质'],
    constitutionAvoid: ['阳虚质'],
    nutrients: { protein: 5, carbs: 8, fat: 3, fiber: 4 },
    confidence: 0.92,
    candidates: [{ name: '白灼西兰花', calories: 55, confidence: 0.7 }]
  },
  {
    name: '🍲 番茄鸡蛋汤',
    calories: 65,
    category: '汤类',
    portion: '一碗约300ml',
    tcmNature: '平',
    tcmAdvice: '番茄性微寒生津止渴，鸡蛋滋阴润燥。此汤平和，适合所有体质，尤其阴虚质和气虚质。',
    constitutionFit: ['平和质', '阴虚质', '气虚质'],
    constitutionAvoid: [],
    nutrients: { protein: 6, carbs: 5, fat: 3, fiber: 1 },
    confidence: 0.9,
    candidates: [{ name: '紫菜蛋花汤', calories: 45, confidence: 0.55 }]
  },
  {
    name: '🍜 兰州牛肉面',
    calories: 520,
    category: '主食',
    portion: '一大碗约500g',
    tcmNature: '温',
    tcmAdvice: '牛肉面温中补气，牛肉补脾胃。萝卜消食，辣椒散寒。阳虚质最宜，阴虚质少放辣。',
    constitutionFit: ['平和质', '阳虚质', '气虚质'],
    constitutionAvoid: ['阴虚质', '湿热质'],
    nutrients: { protein: 25, carbs: 70, fat: 12, fiber: 2 },
    confidence: 0.82,
    candidates: [{ name: '刀削面', calories: 450, confidence: 0.5 }, { name: '拉面', calories: 480, confidence: 0.45 }]
  },
  {
    name: '🥟 猪肉白菜饺子',
    calories: 320,
    category: '主食',
    portion: '10个约250g',
    tcmNature: '平',
    tcmAdvice: '饺子皮健脾养胃，白菜清热利水，猪肉滋阴。平和百搭，适合大多数体质。',
    constitutionFit: ['平和质', '气虚质', '阴虚质'],
    constitutionAvoid: ['痰湿质'],
    nutrients: { protein: 16, carbs: 38, fat: 10, fiber: 2 },
    confidence: 0.86,
    candidates: [{ name: '韭菜鸡蛋饺', calories: 280, confidence: 0.55 }, { name: '三鲜饺子', calories: 300, confidence: 0.4 }]
  },
  {
    name: '🧋 珍珠奶茶',
    calories: 380,
    category: '饮品',
    portion: '一杯500ml（全糖）',
    tcmNature: '平',
    tcmAdvice: '奶茶高糖高热量，珍珠糯米难消化。痰湿质、湿热质不宜。建议减糖或换中药奶茶替代。',
    constitutionFit: ['平和质'],
    constitutionAvoid: ['痰湿质', '湿热质', '阴虚质'],
    nutrients: { protein: 4, carbs: 60, fat: 8, fiber: 0 },
    confidence: 0.93,
    candidates: [{ name: '黑糖珍珠奶茶', calories: 420, confidence: 0.7 }, { name: '芋泥奶茶', calories: 350, confidence: 0.45 }]
  },
  {
    name: '🐟 清蒸鲈鱼',
    calories: 130,
    category: '肉类',
    portion: '一条约300g（可食部分150g）',
    tcmNature: '平',
    tcmAdvice: '鲈鱼性平，健脾益肾。蒸制保留营养。适合所有体质，尤宜气虚质补益。葱姜去腥温中。',
    constitutionFit: ['平和质', '气虚质', '阴虚质'],
    constitutionAvoid: [],
    nutrients: { protein: 25, carbs: 0, fat: 4, fiber: 0 },
    confidence: 0.87,
    candidates: [{ name: '清蒸草鱼', calories: 115, confidence: 0.5 }]
  },
]

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    const genAI = getGenAI()
    if (!genAI) {
      // Demo模式：随机返回一种食物
      const demoFood = DEMO_FOODS[Math.floor(Math.random() * DEMO_FOODS.length)]
      return NextResponse.json({
        success: true,
        demo: true,
        result: demoFood
      })
    }

    // 使用 Gemini 2.5 Flash（支持多模态）
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,  // 降低温度，提高准确性
        maxOutputTokens: 800,
        responseMimeType: 'application/json'
      }
    })

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      },
      `请仔细分析这张食物图片。

识别要求：
1. 仔细观察食物的颜色、形状、纹理、容器、餐具来判断食物种类
2. 参考常见中餐份量估算食物重量
3. 用热量参考表校准热量值
4. 如果有多种食物，识别最明显的作为主结果
5. 诚实给出置信度，不确定时宁低勿高

严格返回JSON格式。`
    ])

    const response = result.response
    const text = response.text()

    // 解析 JSON 响应
    let parsed
    try {
      // 清理可能的 markdown 标记
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      // 尝试提取 JSON 对象
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanText = jsonMatch[0]
      }
      parsed = JSON.parse(cleanText)
    } catch (parseErr: any) {
      console.error('JSON parse error:', parseErr.message, 'raw:', text.slice(0, 300))
      // 智能降级
      return NextResponse.json({
        success: true,
        demo: false,
        raw: text,
        result: {
          name: '🍽️ AI识别结果',
          calories: 180,
          category: '其他',
          portion: '1份(约150g)',
          tcmNature: '平',
          tcmAdvice: text.length > 20 && text.length < 300 ? text.slice(0, 100) : 'AI已分析，建议根据实际食物手动调整热量。',
          constitutionFit: ['平和质'],
          constitutionAvoid: [],
          nutrients: { protein: 12, carbs: 22, fat: 6, fiber: 1 },
          confidence: 0.5,
          candidates: []
        }
      })
    }

    // 处理非食物错误
    if (parsed.error) {
      return NextResponse.json({
        success: false,
        error: parsed.error,
        confidence: parsed.confidence || 0
      })
    }

    // 安全提取字段（修复了nuts拼写bug）
    const safeResult = {
      name: typeof parsed.name === 'string' ? parsed.name : '🍽️ AI识别结果',
      calories: typeof parsed.calories === 'number' ? Math.round(parsed.calories) : 200,
      category: typeof parsed.category === 'string' ? parsed.category : '其他',
      portion: typeof parsed.portion === 'string' ? parsed.portion : '1份',
      tcmNature: typeof parsed.tcmNature === 'string' ? parsed.tcmNature : '平',
      tcmAdvice: typeof parsed.tcmAdvice === 'string' ? parsed.tcmAdvice : '适量食用有益健康',
      constitutionFit: Array.isArray(parsed.constitutionFit) && parsed.constitutionFit.every((c: any) => typeof c === 'string')
        ? parsed.constitutionFit
        : ['平和质'],
      constitutionAvoid: Array.isArray(parsed.constitutionAvoid) && parsed.constitutionAvoid.every((c: any) => typeof c === 'string')
        ? parsed.constitutionAvoid
        : [],
      nutrients: (parsed.nutrients && typeof parsed.nutrients === 'object')
        ? parsed.nutrients
        : { protein: 10, carbs: 25, fat: 8, fiber: 2 },
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates.filter((c: any) => c.name && typeof c.calories === 'number') : []
    }

    return NextResponse.json({
      success: true,
      demo: false,
      result: safeResult
    })

  } catch (error: any) {
    console.error('Food recognition error:', error)

    const errorMsg = error?.message || ''

    if (errorMsg.includes('API_KEY') || errorMsg.includes('api key')) {
      return NextResponse.json(
        { error: 'API Key 未配置或无效，请在 .env.local 中设置 GEMINI_API_KEY', code: 'NO_API_KEY' },
        { status: 500 }
      )
    }

    if (errorMsg.includes('quota') || errorMsg.includes('429')) {
      return NextResponse.json(
        { error: 'API 配额已用尽，请稍后再试', code: 'QUOTA_EXCEEDED' },
        { status: 429 }
      )
    }

    if (errorMsg.includes('SAFETY')) {
      return NextResponse.json(
        { error: '图片内容可能不符合安全规范', code: 'SAFETY_ERROR' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '识别失败，请重试', code: 'UNKNOWN' },
      { status: 500 }
    )
  }
}
