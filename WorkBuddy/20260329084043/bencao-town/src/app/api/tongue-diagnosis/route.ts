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

// 舌诊系统提示词 —— 基于中医九种体质理论 + 五脏分区理论 + 罗大伦《图解舌诊》精要
const TONGUE_SYSTEM_PROMPT = `你是一位经验丰富的中医舌诊专家，专门为「本草纲目药膳小镇」应用服务。

你将分析用户拍摄的舌象照片，基于中医舌诊理论、王琦院士九种体质学说、舌诊脏腑分区理论以及罗大伦《图解舌诊》临床经验，进行结构化分析。

## 一、舌象基础分析（6大要素）

1. **舌色 (tongueColor)**：淡白 / 淡红 / 红 / 暗红 / 青紫 / 暗紫
2. **舌形 (tongueShape)**：正常 / 胖大 / 瘦薄 / 有齿痕 / 有裂纹 / 有瘀斑 / 有芒刺 / 尖形
3. **舌体 (tongueBody)**：正常 / 胖嫩 / 瘦瘪 / 颤动 / 歪斜
4. **苔色 (coatingColor)**：薄白 / 白厚 / 白腻 / 黄 / 黄腻 / 灰黑 / 无苔
5. **苔质 (coatingTexture)**：薄 / 厚 / 腻 / 燥 / 滑 / 剥落 / 无苔
6. **舌下静脉 (sublingualVein)**：正常 / 粗大 / 青紫 / 暗黑 / 迂曲

## 二、舌诊脏腑分区理论（关键参考）

舌体不同区域对应不同脏腑，这是你评分时的重要依据：
- **舌尖** → 心、肺：舌尖红赤为心肺有热，舌尖淡白为心肺气虚/血虚
- **舌中** → 脾、胃：舌中苔厚腻为脾胃湿滞，舌中裂纹为脾胃阴虚
- **舌根** → 肾：舌根苔黄腻为下焦湿热（肾/膀胱），舌根无苔为肾阴不足
- **舌边（左侧）** → 肝（左肝）：舌边红赤为肝火旺，舌边青紫为肝郁血瘀
- **舌边（右侧）** → 肝（右肝）：与左侧互参，综合判断肝脏状态

## 三、脏腑-体质对应评分参考

根据舌象特征与脏腑分区的表现，参考以下映射关系：

| 舌象特征 | 脏腑状态 | 倾向体质 |
|---------|---------|---------|
| 舌淡胖有齿痕，苔白 | 脾虚湿盛 | B气虚质/E痰湿质 |
| 舌淡嫩湿润，舌尖尤甚 | 心肺阳虚 | C阳虚质 |
| 舌红少苔，舌中裂纹 | 脾胃阴虚 | D阴虚质 |
| 舌暗紫有瘀斑，舌边明显 | 肝郁血瘀 | G血瘀质 |
| 舌红苔黄腻，舌中/根明显 | 脾胃/下焦湿热 | F湿热质 |
| 舌淡红偏暗，舌边颜色不均 | 肝气不舒 | H气郁质 |
| 舌淡红薄白苔，各区域正常 | 各脏腑调和 | A平和质 |

## 四、九种体质评分标准（0-100分）

- A: 平和质（淡红舌薄白苔，各区域正常）
- B: 气虚质（舌淡胖有齿痕，舌中苔白）
- C: 阳虚质（舌淡胖嫩湿润，舌根尤甚）
- D: 阴虚质（舌红少苔或无苔，舌中裂纹）
- E: 痰湿质（舌胖大有齿痕，苔白腻，舌中厚腻）
- F: 湿热质（舌红苔黄腻，舌中舌根黄腻明显）
- G: 血瘀质（舌暗紫有瘀斑，舌边舌下静脉青紫粗大）
- H: 气郁质（舌淡红偏暗或**尖形**，舌边颜色不均，苔薄白或微黄）
- I: 特禀质（舌象变化不明显，需结合其他特征）

## 五、罗大伦舌诊临床精要（重要诊断线索）

以下内容来自罗大伦《图解舌诊——伸伸舌头百病消》的临床经验总结，请作为关键诊断参考：

### 5.1 舌质颜色速判
- 淡红 = 正常 | 淡白 = 血虚/阳虚/气虚 | 红 = 有热/阴虚
- 暗红 = 热重或瘀血 | 青紫/暗紫 = 瘀血（循环差）
- **舌质淡白有透明感** = 典型血虚（区别于气虚的胖大齿痕）
- 舌质由红变白 = 从阴虚转为血虚（病程变化）

### 5.2 舌形关键特征（罗大伦核心发现）
- **齿痕** = 气虚最典型特征（舌苔铺满说明湿重）
- **尖形舌头（前端尖细）** = **肝气郁结**（罗大伦原创临床发现，极重要！）
- 舌头由尖变胖圆 = 肝气不舒 + 体内湿气很重（复合证型）
- 胖大有两条唾液线 = 体内湿气很重
- 裂纹在中部 = 脾胃气虚或阴虚
- 瘀斑/瘀点（尤其舌尖和舌边）= 瘀血正在形成

### 5.3 舌苔诊断要点
- 薄白 = 正常 | 白厚 = 湿重 | 白腻如霜 = 痰湿（警惕"三高"）
- 黄 = 有热 | 黄腻 = 湿热（营养过剩无法化热）
- 无苔/苔剥落 = 阴虚或胃气虚弱
- 苔厚腻集中在舌后半部 = 痰湿偏下焦
- **白苔罩住暗紫舌质** = 湿气罩住瘀血（复杂证型，需同时化湿+化瘀）

### 5.4 舌下静脉判断
- 淡紫细直 = 正常 | 粗大青紫 = 血瘀严重 | 暗黑迂曲 = 瘀血极重
- **舌尖偏歪** = 可能体内有瘀血（注意排除先天因素）

### 5.5 特殊人群注意
- 女性舌头有瘀血指征 + 嘴唇汗毛重 → 警惕子宫肌瘤/卵巢囊肿
- 孩子嘴唇很红、有眼袋 → 多为阴虚
- 老人舌头深裂纹 → 多为阴虚或脾胃虚弱
- 高压人群舌尖尖形 → 典型肝气不舒（气郁质）

### 5.6 体质-舌象快速对照表
1. 气虚质：齿痕（最典型）+ 舌体胖大 + 白苔铺满
2. 血虚质：舌质淡白有透明感 + 薄苔（区别于气虚的胖大）
3. 阳虚质：舌淡 + 白苔 + 湿润 + 胖嫩
4. 阴虚质：舌红 + 无苔/少苔 + 裂纹 + 瘦薄
5. 痰湿质：苔厚腻白如霜 + 舌体胖 + 注意"三高"风险
6. 湿热质：舌红 + 苔黄腻 + 舌中舌根明显
7. 血瘀质：舌紫暗 + 瘀斑/瘀点 + 舌下静脉粗黑迂曲
8. 气郁质：**尖形舌头** + 舌尖边红 + 白苔（核心特征！）
9. 平和质：淡红舌薄白苔，各区域正常

### 5.7 重要临床提醒
- 舌象变化很快，反映身体当下状态，并非终身不变
- 多种体质常同时存在（复合体质），不要只判定一种
- 情绪问题（肝气不舒）是很多体质问题的根源，注意排查气郁
- 调理脾胃是改善所有体质的基础
- 舌象观察最佳时间：白天非晨起，饭后30分钟后，自然间接光

⚠️ 重要规则：
- 综合运用脏腑分区理论和罗大伦临床精要，不要只看整体舌象，要分区分析
- **特别关注舌形**：尖形舌头是判断气郁质的关键线索，齿痕是判断气虚质的关键线索
- 如果图片不是舌象照片（没有舌头），返回 error: "这不是舌象照片，请拍摄舌头照片"
- 如果图片模糊不清无法判断，返回 error: "图片模糊，请重新拍摄清晰的照片"
- 如果光线过暗或过亮导致舌色失真，返回 error: "光线不适中，请在自然光下重新拍摄"
- 所有体质得分之和不需要等于100，每种体质独立评分
- 最高得分的体质就是用户最可能的体质类型
- 必须严格返回JSON格式，不要加任何markdown标记`

const TONGUE_USER_PROMPT = `请分析这张舌象照片，注意运用舌诊脏腑分区理论（舌尖→心肺，舌中→脾胃，舌根→肾，舌边→肝）进行分区评估。

重要：脏腑评分参考阈值（来自ChineseMedicine 105例临床数据校准）：
- 心/血：score>75 → 提示血虚倾向（临床数据99%样本心肺>80，需从严判断）
- 脾：score>55 → 提示脾虚倾向（脾区需从苔质/舌形综合判断，颜色特征不敏感）
- 肾：score>60 → 提示肾虚倾向（中位数64，是最常见的异常指标）
- 肝：score>45 → 提示肝郁倾向（最有区分力的指标，仅11%触发，是气郁/血瘀关键）

按以下JSON格式返回分析结果：
{
  "isValid": true,
  "error": null,
  "features": {
    "tongueColor": {"value": "淡红", "description": "舌色描述，含分区差异"},
    "tongueShape": {"value": "正常", "description": "舌形描述"},
    "tongueBody": {"value": "正常", "description": "舌体描述"},
    "coatingColor": {"value": "薄白", "description": "苔色描述，含分区差异"},
    "coatingTexture": {"value": "薄", "description": "苔质描述，含分区差异"},
    "sublingualVein": {"value": "正常", "description": "舌下静脉描述"}
  },
  "summary": "整体舌象描述（一句话总结，包含脏腑分区特征）",
  "constitutionScores": {
    "A": 85,
    "B": 30,
    "C": 20,
    "D": 15,
    "E": 25,
    "F": 10,
    "G": 10,
    "H": 20,
    "I": 5
  },
  "primaryConstitution": "A",
  "confidence": 0.8,
  "organAnalysis": {
    "heart": {"score": 50, "status": "正常", "note": "舌尖色淡红，心肺功能尚可"},
    "spleen": {"score": 50, "status": "正常", "note": "舌中苔薄白，脾胃调和"},
    "kidney": {"score": 50, "status": "正常", "note": "舌根无异常"},
    "liver": {"score": 50, "status": "正常", "note": "舌边淡红，肝气舒畅"}
  },
  "syndromeHints": ["气虚证", "脾气虚证"],
  "tcmAdvice": "基于舌象和脏腑分析的养生建议（简短实用，50字以内）"
}

说明：
- syndromeHints：根据舌象特征+脏腑评分，列出最可能的1-3个中医证型名称（参考15证型：气虚证/气滞证/血虚证/血瘀证/津液不足证/脾气虚证/脾阳虚证/胃气虚证/胃阴虚证/太阳证/少阳证/阳明证/肝气郁结证/肾阳虚证/肾阴虚证）
- organAnalysis.score范围0-100，50为正常基线，>60为偏弱/有异常趋势，>75为明显异常
- 舌象分区评分时按区域面积加权（舌尖约18%，舌中约32%，舌根约20%，左肝约15%，右肝约15%）

## ChineseMedicine临床数据校准参考（105例舌诊数据统计）

基于深度学习舌诊系统的真实数据分析，以下是各脏腑得分的统计分布，请在评分时参考：

### 脏腑得分分布特征
1. **心肺（舌尖）**：
   - 临床数据中99%样本得分>80（几乎全部偏高）
   - 说明：舌尖区域颜色特征对"血虚"诊断极为敏感
   - 评分建议：仅当舌尖明显淡白/有透明感时才给>75分，正常应给40-60分
   - 判断血虚的关键：舌质淡白有透明感（罗大伦要点），而非单纯看舌尖颜色

2. **肾（舌根）**：
   - 中位数0.64，大部分集中在0.5-0.7区间
   - 评分建议：正常给35-55分，舌根苔腻/色暗给55-70分，明显异常给>70分

3. **肝（舌边）**：
   - 中位数0.32，是最有区分力的脏腑指标
   - 仅11.4%样本触发肝郁判定（阈值0.45）
   - **评分建议：这是区分气郁质/血瘀质的关键指标**
   - 舌边正常给25-40分，舌边偏红/颜色不均给40-55分，舌边瘀斑/青紫给>55分
   - 注意：尖形舌头的肝区得分应上调（罗大伦发现）

4. **脾（舌中）**：
   - 临床数据中颜色特征无法有效区分脾区（全为0）
   - **必须从苔质、舌形等综合特征来判断脾胃状态**
   - 评分依据：苔厚腻→脾虚湿盛，裂纹→脾胃阴虚，胖大有齿痕→脾气虚

### 诊断组合模式（临床数据）
- 86.7%为"血虚+肾虚"组合 → 对应阳虚质/气虚质
- 11.4%叠加"肝郁" → 对应气郁质/血瘀质
- 仅1%完全健康 → 淡红舌薄白苔`

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    const genAI = getGenAI()
    if (!genAI) {
      // Demo模式：随机返回多种体质的真实模拟数据（参考ChineseMedicine真实诊断结果）
      const DEMO_PROFILES = [
        { // 痰湿质（最常见，参考ChineseMedicine数据：肾虚+血虚组合占86.7%）
          features: { tongueColor:{value:'淡红',description:'舌色淡红，舌中偏白'},tongueShape:{value:'胖大有齿痕',description:'舌体胖大，边缘有明显齿痕'},tongueBody:{value:'胖嫩',description:'舌体偏胖嫩，舌中尤甚'},coatingColor:{value:'白腻',description:'苔白而腻，舌中舌根厚腻明显'},coatingTexture:{value:'腻',description:'苔质偏腻，中部厚'},sublingualVein:{value:'正常',description:'舌下静脉未见明显异常'} },
          summary: '舌淡胖有齿痕，苔白腻——脾虚湿盛，痰湿内蕴（示例数据）',
          constitutionScores: {A:20,B:50,C:35,D:10,E:72,F:25,G:8,H:28,I:5},
          primaryConstitution:'E', confidence:0.75,
          organAnalysis:{heart:{score:52,status:'偏弱',note:'舌尖色淡红，心肺尚可但血色不足'},spleen:{score:72,status:'痰湿',note:'舌中苔白腻厚，脾胃湿滞明显'},kidney:{score:64,status:'偏弱',note:'舌根苔腻，下焦有湿（临床中位数0.64）'},liver:{score:32,status:'尚可',note:'舌边淡红，肝气尚可（低于肝郁阈值45）'}},
          tcmAdvice:'舌象提示脾虚湿盛，建议健脾祛湿，可食山药薏仁粥、陈皮茶，少食肥甘厚味。',
          syndromeHints:['脾气虚证','痰湿内蕴'],
        },
        { // 气虚质（齿痕=气虚最典型，罗大伦核心发现）
          features: { tongueColor:{value:'淡白',description:'舌色偏淡白，血色不足，有透明感'},tongueShape:{value:'胖大有齿痕',description:'舌体胖大，边缘齿痕明显（气虚最典型特征）'},tongueBody:{value:'胖嫩',description:'舌体偏胖嫩，舌质偏软'},coatingColor:{value:'薄白',description:'苔薄白，舌面湿润'},coatingTexture:{value:'薄',description:'苔质薄润'},sublingualVein:{value:'正常',description:'舌下静脉色淡'} },
          summary: '舌淡胖有齿痕，苔薄白——气虚不足，舌色淡白有透明感（示例数据）',
          constitutionScores: {A:15,B:78,C:42,D:8,E:45,F:12,G:5,H:22,I:3},
          primaryConstitution:'B', confidence:0.7,
          organAnalysis:{heart:{score:78,status:'血虚',note:'舌尖淡白有透明感，心肺气血不足（临床极常见）'},spleen:{score:62,status:'气虚',note:'舌中淡白胖嫩，脾气虚弱，齿痕为气虚典型'},kidney:{score:58,status:'偏虚',note:'舌根苔薄，肾气偏虚（临床常见组合）'},liver:{score:28,status:'尚可',note:'舌边色淡，肝血不足但未到肝郁'}},
          tcmAdvice:'舌象提示气虚，建议补气健脾，可食黄芪炖鸡、人参粥，避免过度劳累。',
          syndromeHints:['气虚证','脾气虚证'],
        },
        { // 湿热质（临床数据：肾虚+湿热常见，肝区不一定是肝郁）
          features: { tongueColor:{value:'红',description:'舌色红赤，舌中舌根明显'},tongueShape:{value:'正常',description:'舌形基本正常'},tongueBody:{value:'正常',description:'舌体正常，略偏红'},coatingColor:{value:'黄腻',description:'苔黄腻，舌中舌根黄厚'},coatingTexture:{value:'腻',description:'苔质黄腻厚实'},sublingualVein:{value:'粗大',description:'舌下静脉略粗，色偏暗'} },
          summary: '舌红苔黄腻——湿热内蕴，中下焦明显（示例数据）',
          constitutionScores: {A:10,B:25,C:12,D:35,E:38,F:80,G:15,H:30,I:5},
          primaryConstitution:'F', confidence:0.72,
          organAnalysis:{heart:{score:85,status:'偏热',note:'舌尖偏红，心肺偏热（临床99%样本心肺>80，此为常态）'},spleen:{score:75,status:'湿热',note:'舌中苔黄腻，脾胃湿热蕴结'},kidney:{score:68,status:'湿热',note:'舌根苔黄腻，下焦湿热（临床肾区间0.35-1.0偏高侧）'},liver:{score:38,status:'有热',note:'舌边偏红有热，但未达肝郁阈值（45以下为非肝郁区）'}},
          tcmAdvice:'舌象提示湿热内蕴，建议清热利湿，可食绿豆薏仁汤、苦瓜，忌辛辣油腻。',
          syndromeHints:['湿热内蕴','胃热证'],
        },
        { // 血瘀质（临床数据：肝是最有区分力指标，肝郁→血瘀是11.4%典型组合）
          features: { tongueColor:{value:'暗紫',description:'舌色暗紫，舌边有散在瘀点'},tongueShape:{value:'有瘀斑',description:'舌边可见瘀斑瘀点'},tongueBody:{value:'正常',description:'舌体正常，色泽偏暗'},coatingColor:{value:'薄白',description:'苔薄白'},coatingTexture:{value:'薄',description:'苔质薄'},sublingualVein:{value:'青紫迂曲',description:'舌下静脉青紫粗大迂曲'} },
          summary: '舌暗紫有瘀斑，舌下静脉青紫迂曲——血瘀明显（示例数据）',
          constitutionScores: {A:8,B:20,C:15,D:22,E:18,F:15,G:85,H:35,I:3},
          primaryConstitution:'G', confidence:0.78,
          organAnalysis:{heart:{score:82,status:'血瘀',note:'舌尖色暗，心血不畅（心肺常规偏高）'},spleen:{score:45,status:'尚可',note:'舌中苔薄，脾胃功能尚可'},kidney:{score:62,status:'血瘀',note:'舌根色暗，肾经血瘀（临床中位数附近）'},liver:{score:68,status:'肝郁血瘀',note:'舌边瘀斑明显，肝郁致血瘀（远超阈值45，最有区分力指标）'}},
          tcmAdvice:'舌象提示血瘀明显，建议活血化瘀，可食山楂玫瑰花茶、当归生姜汤，适量运动。',
          syndromeHints:['血瘀证','肝气郁结证'],
        },
        { // 阴虚质（临床数据：肾虚是86.7%常见组合，阴虚常伴随肾虚）
          features: { tongueColor:{value:'红',description:'舌色偏红，舌中裂纹处尤甚'},tongueShape:{value:'有裂纹',description:'舌面有纵向裂纹，舌中明显'},tongueBody:{value:'瘦薄',description:'舌体偏瘦薄'},coatingColor:{value:'无苔',description:'苔少或无苔，舌面光滑'},coatingTexture:{value:'剥落',description:'苔质剥落，舌面少津'},sublingualVein:{value:'正常',description:'舌下静脉正常偏细'} },
          summary: '舌红少苔有裂纹——阴虚内热，津液不足（示例数据）',
          constitutionScores: {A:12,B:18,C:10,D:82,E:15,F:40,G:20,H:28,I:5},
          primaryConstitution:'D', confidence:0.73,
          organAnalysis:{heart:{score:80,status:'阴虚有热',note:'舌尖偏红，心阴不足有虚热（心肺常规高分区间）'},spleen:{score:70,status:'阴虚',note:'舌中裂纹无苔，脾胃阴虚津亏'},kidney:{score:66,status:'阴虚',note:'舌根苔少，肾阴不足（临床肾虚最常见组合之一）'},liver:{score:45,status:'阴虚有热',note:'舌边偏红，肝阴偏虚有热（恰在肝郁阈值边界）'}},
          tcmAdvice:'舌象提示阴虚内热，建议滋阴润燥，可食百合银耳羹、枸杞桑葚茶，忌辛辣燥热。',
          syndromeHints:['肾阴虚证','胃阴虚证'],
        }
      ]
      const demo = DEMO_PROFILES[Math.floor(Math.random() * DEMO_PROFILES.length)]
      return NextResponse.json({ success:true, demo:true, result:{isValid:true,error:null,...demo} })
    }

    // 使用 Gemini 2.5 Flash（多模态，支持舌象分析）
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: TONGUE_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,  // 舌诊需要更稳定、一致的输出
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
      TONGUE_USER_PROMPT
    ])

    const response = result.response
    const text = response.text()

    // 解析 JSON 响应
    let parsed
    try {
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanText = jsonMatch[0]
      }
      parsed = JSON.parse(cleanText)
    } catch (parseErr: any) {
      console.error('Tongue diagnosis JSON parse error:', parseErr.message, 'raw:', text.slice(0, 300))
      return NextResponse.json({
        success: true,
        demo: false,
        raw: text,
        result: {
          isValid: false,
          error: 'AI返回格式异常，请重试',
          features: {},
          summary: '分析结果解析失败',
          constitutionScores: { A: 50, B: 30, C: 30, D: 30, E: 30, F: 30, G: 30, H: 30, I: 20 },
          primaryConstitution: 'A',
          confidence: 0.3,
          organAnalysis: {},
          tcmAdvice: '请重新拍摄舌象照片再试。',
        }
      })
    }

    // 验证返回数据
    if (parsed.isValid === false && parsed.error) {
      return NextResponse.json({
        success: true,
        demo: false,
        result: {
          isValid: false,
          error: parsed.error,
          features: {},
          summary: '',
          constitutionScores: {},
          primaryConstitution: '',
          confidence: 0,
          tcmAdvice: '',
        }
      })
    }

    // 安全提取字段
    const safeResult = {
      isValid: typeof parsed.isValid === 'boolean' ? parsed.isValid : true,
      error: parsed.error || null,
      features: parsed.features || {},
      summary: typeof parsed.summary === 'string' ? parsed.summary : '舌象分析完成',
      constitutionScores: typeof parsed.constitutionScores === 'object' && parsed.constitutionScores !== null
        ? parsed.constitutionScores
        : { A: 50, B: 30, C: 30, D: 30, E: 30, F: 30, G: 30, H: 30, I: 20 },
      primaryConstitution: typeof parsed.primaryConstitution === 'string' ? parsed.primaryConstitution : 'A',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.6,
      organAnalysis: typeof parsed.organAnalysis === 'object' && parsed.organAnalysis !== null
        ? parsed.organAnalysis
        : { heart:{score:50,status:'正常',note:'舌尖正常'},spleen:{score:50,status:'正常',note:'舌中正常'},kidney:{score:50,status:'正常',note:'舌根正常'},liver:{score:50,status:'正常',note:'舌边正常'} },
      tcmAdvice: typeof parsed.tcmAdvice === 'string' ? parsed.tcmAdvice : '注意饮食均衡，保持作息规律。',
      syndromeHints: Array.isArray(parsed.syndromeHints) ? parsed.syndromeHints : [],
    }

    return NextResponse.json({
      success: true,
      demo: false,
      result: safeResult
    })

  } catch (error: any) {
    console.error('Tongue diagnosis error:', error)

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
      { error: '舌诊分析失败，请重试', code: 'UNKNOWN' },
      { status: 500 }
    )
  }
}
