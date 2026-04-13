// ═══════════════════════════════════════════════
// 本草纲目药膳小镇 - 全局常量
// ═══════════════════════════════════════════════

// ─── 主题色 ───
export const COLORS = {
  primary: '#C8A951',      // 金色
  primaryDark: '#A68B3C',
  secondary: '#4A7C59',    // 绿色
  secondaryDark: '#2D5A3A',
  accent: '#E85D4A',       // 红色
  bgDark: '#0F1419',
  bgCard: '#1A2332',
  bgLight: '#FAF7F0',
  gold: '#FFD700',
  textPrimary: '#F0E6D3',
  textSecondary: '#8B9CAF',
  textDark: '#2C1810',
}

// ─── 马匹表情映射 ───
export const HORSE_EMOJI_MAP: Record<string, string> = {
  '金鬃骏马': '🐴',
  '蓝紫灵马': '🦄',
  '赤棕壮马': '🐎',
  '粉樱萌马': '🎠',
}

// ─── 马匹图片映射 ───
export const HORSE_IMAGE_MAP: Record<string, string> = {
  '金鬃骏马': '/images/horses/horse-golden.png',
  '蓝紫灵马': '/images/horses/horse-purple.png',
  '赤棕壮马': '/images/horses/horse-brown.png',
  '粉樱萌马': '/images/horses/horse-pink.png',
}

// ─── 马匹配件 ───
export const HORSE_ACCESSORY_MAP: Record<string, string> = {
  '金鬃骏马': '⭐',
  '蓝紫灵马': '🏮',
  '赤棕壮马': '💰',
  '粉樱萌马': '🐟',
}

// ─── 场景配置 ───
export type SceneType = 'bedroom' | 'hospital' | 'office' | 'outdoor' | 'kitchen' | 'garden'

export const SCENES: Record<SceneType, { name: string; emoji: string; desc: string }> = {
  bedroom: { name: '卧室', emoji: '🛏️', desc: '温馨舒适的休息空间' },
  hospital: { name: '医院', emoji: '🏥', desc: '专业诊疗环境' },
  office: { name: '办公室', emoji: '💼', desc: '职场奋斗场景' },
  outdoor: { name: '户外', emoji: '🌳', desc: '自然运动空间' },
  kitchen: { name: '厨房', emoji: '🍽️', desc: '健康饮食烹饪' },
  garden: { name: '花园', emoji: '🌿', desc: '中医百草园' },
}

// ─── 27题完整体质测评（每体质3题×9种体质，5分制） ───
export const QUIZ_QUESTIONS = [
  // ══ 平和质 Q1-3：精力充沛、面色润泽、适应力强 ══
  { id:1, cat:'平和质', catKey:'A',
    question: '你平时精力充沛吗？能应付日常工作和生活而不觉得疲劳吗？',
    options:[{t:'完全不是',s:1},{t:'不太是',s:2},{t:'一般',s:3},{t:'比较是',s:4},{t:'完全是',s:5}] },
  { id:2, cat:'平和质', catKey:'A',
    question: '你面色红润、目光有神吗？别人常夸你"看起来很健康"吗？',
    options:[{t:'面色萎黄无光',s:1},{t:'偏暗淡',s:2},{t:'一般',s:3},{t:'较红润',s:4},{t:'非常红润',s:5}] },
  { id:3, cat:'平和质', catKey:'A',
    question: '你对自然环境和社会环境适应能力如何？换季或出差时容易不适吗？',
    options:[{t:'很难适应',s:1},{t:'较难适应',s:2},{t:'一般',s:3},{t:'较好适应',s:4},{t:'很容易适应',s:5}] },
  // ══ 气虚质 Q4-6：易疲乏力、气短懒言、自汗 ══
  { id:4, cat:'气虚质', catKey:'B',
    question: '你是否容易疲劳？说话稍微多一点就累，或者上楼就气喘？',
    options:[{t:'从不疲劳',s:1},{t:'偶尔',s:2},{t:'有时',s:3},{t:'经常',s:4},{t:'总是如此',s:5}] },
  { id:5, cat:'气虚质', catKey:'B',
    question: '你容易声音低弱、懒得说话吗？平时喜欢安静不爱动弹吗？',
    options:[{t:'声音洪亮爱动',s:1},{t:'比较活跃',s:2},{t:'一般',s:3},{t:'偏懒言',s:4},{t:'声音极低很懒',s:5}] },
  { id:6, cat:'气虚质', catKey:'B',
    question: '你是否容易出虚汗？（不运动不动静时也出汗）',
    options:[{t:'从不出虚汗',s:1},{t:'很少',s:2},{t:'有时',s:3},{t:'经常',s:4},{t:'一动就大汗',s:5}] },
  // ══ 阳虚质 Q7-9：怕冷手足凉、喜热饮、腰膝冷痛 ══
  { id:7, cat:'阳虚质', catKey:'C',
    question: '你怕冷吗？手脚是否经常冰凉，夏天也需要穿袜子？',
    options:[{t:'不怕冷手脚暖',s:1},{t:'稍怕冷',s:2},{t:'一般',s:3},{t:'较怕冷',s:4},{t:'非常怕冷手脚冰',s:5}] },
  { id:8, cat:'阳虚质', catKey:'C',
    question: '你喜欢喝热饮还是冷饮？胃部受凉后会不会不舒服？',
    options:[{t:'只喝冰的没事',s:1},{t:'偏好冷饮',s:2},{t:'都可以',s:3},{t:'偏好温热',s:4},{t:'必须热的凉的难受',s:5}] },
  { id:9, cat:'阳虚质', catKey:'C',
    question: '你的腰背部或膝关节是否容易发冷酸痛？天气变冷时加重吗？',
    options:[{t:'从未有过',s:1},{t:'很少',s:2},{t:'有时',s:3},{t:'经常',s:4},{t:'总是如此',s:5}] },
  // ══ 阴虚质 Q10-12：口干咽燥、手脚心热、盗汗便秘 ══
  { id:10, cat:'阴虚质', catKey:'D',
    question: '你觉得口干咽燥吗？早上醒来喉咙像缺水一样？',
    options:[{t:'从不口干',s:1},{t:'偶尔',s:2},{t:'有时',s:3},{t:'经常口干',s:4},{t:'整天口渴难耐',s:5}] },
  { id:11, cat:'阴虚质', catKey:'D',
    question: '你的手脚心发热吗？心里也觉得烦躁想发脾气吗？',
    options:[{t:'手脚正常不烦',s:1},{t:'偶尔心烦',s:2},{t:'一般',s:3},{t:'手脚心偏热',s:4},{t:'五心烦热很严重',s:5}] },
  { id:12, cat:'阴虚质', catKey:'D',
    question: '你有便秘倾向吗？大便干燥成颗粒状？或者容易长痘？',
    options:[{t:'排便正常皮肤好',s:1},{t:'偶尔干燥',s:2},{t:'一般',s:3},{t:'经常便秘',s:4},{t:'长期便秘多痘',s:5}] },
  // ══ 痰湿质 Q13-15：体形肥胖腹部肥满、口黏苔腻 ══
  { id:13, cat:'痰湿质', catKey:'E',
    question: '你的体型偏胖吗？特别是腹部比较松软肥厚？',
    options:[{t:'很瘦腹平坦',s:1},{t:'偏瘦',s:2},{t:'正常',s:3},{t:'微胖腹部突出',s:4},{t:'肥胖腹部很大',s:5}] },
  { id:14, cat:'痰湿质', catKey:'E',
    question: '你嘴里常有黏腻感吗？感觉不清爽、舌苔厚厚的？',
    options:[{t:'清爽无黏腻',s:1},{t:'偶尔',s:2},{t:'有时',s:3},{t:'经常感觉黏',s:4},{t:'整天黏腻舌苔厚',s:5}] },
  { id:15, cat:'痰湿质', catKey:'E',
    question: '你是否胸闷、身体沉重困倦？尤其是梅雨季节更明显？',
    options:[{t:'轻松无沉重感',s:1},{t:'偶尔',s:2},{t:'有时',s:3},{t:'经常胸闷身重',s:4},{t:'常年困倦沉重',s:5}] },
  // ══ 湿热质 Q16-18：面垢油光、痤疮、口苦尿黄 ══
  { id:16, cat:'湿热质', catKey:'F',
    question: '你的面部或鼻头容易油光发亮吗？脸上容易长痤疮痘痘？',
    options:[{t:'清爽不长痘',s:1},{t:'偶尔油',s:2},{t:'一般',s:3},{t:'偏油偶长痘',s:4},{t:'很油满脸痘',s:5}] },
  { id:17, cat:'湿热质', catKey:'F',
    question: '你常感到口苦或嘴里有异味吗？小便颜色偏黄吗？',
    options:[{t:'口清尿色正常',s:1},{t:'偶尔',s:2},{t:'有时',s:3},{t:'经常口苦尿黄',s:4},{t:'长期口苦味重',s:5}] },
  { id:18, cat:'湿热质', catKey:'F',
    question: '你是否容易急躁易怒？女性是否有白带增多？男性阴囊潮湿？',
    options:[{t:'性情温和正常',s:1},{t:'偶尔急躁',s:2},{t:'一般',s:3},{t:'较易烦躁',s:4},{t:'暴躁+分泌物多',s:5}] },
  // ══ 血瘀质 Q19-21：肤色晦黯、舌紫有斑、疼痛固定 ══
  { id:19, cat:'血瘀质', catKey:'G',
    question: '你的皮肤是否偏暗、眼眶暗黑或有色素沉着？',
    options:[{t:'皮肤光泽白净',s:1},{t:'稍暗',s:2},{t:'一般',s:3},{t:'偏暗沉',s:4},{t:'晦暗+黑眼圈重',s:5}] },
  { id:20, cat:'血瘀质', catKey:'G',
    question: '你身上有没有固定的刺痛部位？比如某个地方总隐隐作痛？',
    options:[{t:'无痛感',s:1},{t:'极少',s:2},{t:'偶尔',s:3},{t:'常有固定痛点',s:4},{t:'多处刺痛明显',s:5}] },
  { id:21, cat:'血瘀质', catKey:'G',
    question: '你唇色偏暗吗？舌下静脉是否青紫色且较粗？',
    options:[{t:'唇红舌底正常',s:1},{t:'稍暗',s:2},{t:'一般',s:3},{t:'唇暗紫',s:4},{t:'唇紫+舌脉粗紫',s:5}] },
  // ══ 气郁质 Q22-24：情志抑郁、善太息、胸胁胀满 ══
  { id:22, cat:'气郁质', catKey:'H',
    question: '你经常闷闷不乐、情绪低落吗？喜欢叹气（"唉——"）吗？',
    options:[{t:'乐观开朗',s:1},{t:'偶尔郁闷',s:2},{t:'有时',s:3},{t:'经常情绪低落',s:4},{t:'长期抑郁多叹气',s:5}] },
  { id:23, cat:'气郁质', catKey:'H',
    question: '你是否敏感多疑？容易紧张焦虑或受到惊吓？',
    options:[{t:'心大不敏感',s:1},{t:'稍敏感',s:2},{t:'一般',s:3},{t:'较敏感易紧张',s:4},{t:'高度敏感多虑',s:5}] },
  { id:24, cat:'气郁质', catKey:'H',
    question: '你两肋（乳房/胸部两侧）是否容易胀痛？心情不好时加重？',
    options:[{t:'从不胀痛',s:1},{t:'偶尔',s:2},{t:'有时',s:3},{t:'经常胁肋胀',s:4},{t:'频繁胀痛明显',s:5}] },
  // ══ 特禀质 Q25-27：过敏体质、喷嚏荨麻疹 ══
  { id:25, cat:'特禀质', catKey:'I',
    question: '你有没有过敏性鼻炎？比如打喷嚏流鼻涕、鼻子痒眼睛痒？',
    options:[{t:'完全没有',s:1},{t:'偶尔打喷嚏',s:2},{t:'花粉季发作',s:3},{t:'常年鼻炎症状',s:4},{t:'严重过敏需用药',s:5}] },
  { id:26, cat:'特禀质', catKey:'I',
    question: '你是否容易起荨麻疹（风团）？或者皮肤一抓就红肿？',
    options:[{t:'皮肤正常',s:1},{t:'偶尔起包',s:2},{t:'有时',s:3},{t:'经常荨麻疹',s:4},{t:'反复发作严重',s:5}] },
  { id:27, cat:'特禀质', catKey:'I',
    question: '你对药物食物或环境因素（如灰尘、宠物）容易过敏吗？',
    options:[{t:'不过敏',s:1},{t:'对1种轻微过敏',s:2},{t:'对几种轻度',s:3},{t:'多种中度',s:4},{t:'严重过敏体质',s:5}] }
]

// 体质类型数据库 —— 用于结果展示和雷达图
export const CONSTITUTION_DB = {
  A: {
    name:'平和质', title:'健康达人', icon:'⚖️', color:'#22c55e', colorLight:'#dcfce7',
    desc:'阴阳气血调和，体态适中，面色红润，精力充沛。',
    features:['🌟 精力充沛，不易疲劳','💪 适应能力强','😊 性格开朗随和','🍃 饮食睡眠正常'],
    rec:'保持规律作息，坚持适度运动，继续保持！',
    horseStyle:'匀称健美型'
  },
  B: {
    name:'气虚质', title:'养气者', icon:'🌬️', color:'#60a5fa', colorLight:'#dbeafe',
    desc:'元气不足，以疲乏、气短、自汗为主要特征。',
    features:['💤 容易疲劳倦怠','🗣️ 说话声音偏低弱','💧 容易出虚汗','🫁 易感冒或呼吸道敏感'],
    rec:'多吃益气食物如山药黄芪；避免过度劳累。',
    horseStyle:'温和文雅型'
  },
  C: {
    name:'阳虚质', title:'温养者', icon:'☀️', color:'#f97316', colorLight:'#fff7ed',
    desc:'阳气不足，以怕冷、手足不温等虚寒表现为主要特征。',
    features:['❄️ 怕冷尤其四肢冰凉','🔥 喜热饮食','🦴 腰膝冷痛','😴 精神不振易困倦'],
    rec:'多食温补食材如姜羊肉；注意保暖少贪凉。',
    horseStyle:'温暖敦实型'
  },
  D: {
    name:'阴虚质', title:'滋阴者', icon:'🌙', color:'#a78bfa', colorLight:'#ede9fe',
    desc:'阴液亏少，以口燥咽干、手足心热等虚热表现为主要特征。',
    features:['🔥 手足心发热心烦','👄 口干咽燥易渴','😤 性情急躁易怒','💩 大便干燥小便短黄'],
    rec:'少吃辛辣刺激；多食滋阴润燥之品如百合银耳。',
    horseStyle:'灵动敏捷型'
  },
  E: {
    name:'痰湿质', title:'排毒者', icon:'💧', color:'#06b6d4', colorLight:'#ecfeff',
    desc:'痰湿凝聚，以形体肥胖、腹部肥满、口黏苔腻等为主要特征。',
    features:['💧 容易疲劳，身重困倦','👅 舌体胖大有齿痕','🍖 喜食肥甘厚味','🫁 易发湿疹或皮肤问题'],
    rec:'控制饮食清淡为主；加强有氧运动排湿。',
    horseStyle:'圆润憨萌型'
  },
  F: {
    name:'湿热质', title:'清火者', icon:'🔥', color:'#ef4444', colorLight:'#fef2f2',
    desc:'湿热内蕴，以面垢油光、易生痤疮等为主要特征。',
    features:['🛢️ 面部油光易长痘','😤 急躁易怒','😣 口苦口臭','🩸 女性带下增多/男性阴囊潮湿'],
    rec:'忌辛辣油腻烟酒；多食绿豆薏米清热祛湿。',
    horseStyle:'热情活力型'
  },
  G: {
    name:'血瘀质', title:'通络者', icon:'🔴', color:'#ec4899', colorLight:'#fce7f3',
    desc:'血行不畅，以肤色晦黯、舌质紫黯等血瘀表现为主要特征。',
    features:['🌑 肤色偏暗易生斑','💉 身体某处固定刺痛','👄 口唇颜色偏暗','😐 容易健忘'],
    rec:'多做活血运动如瑜伽太极；可适量食用山楂玫瑰。',
    horseStyle:'坚韧沉稳型'
  },
  H: {
    name:'气郁质', title:'舒怀者', icon:'🌿', color:'#8b5cf6', colorLight:'#f5f3ff',
    desc:'气机郁滞，以情志抑郁、脆弱等气郁表现为主要特征。',
    features:['😔 情绪低落爱叹气','🤔 敏感多疑易紧张','😣 胸肋胀满不适','😴 睡眠质量较差'],
    rec:'保持心情舒畅多社交；尝试玫瑰花茶疏肝解郁。',
    horseStyle:'优雅灵秀型'
  },
  I: {
    name:'特禀质', title:'护盾者', icon:'🛡️', color:'#14b8a6', colorLight:'#ccfbf1',
    desc:'先天失常，以生理缺陷、过敏反应等为主要特征。',
    features:['🤧 过敏性鼻炎反复','🎯 荨麻疹/皮肤敏感','⚠️ 药物食物易过敏','💊 对环境变化敏感'],
    rec:'远离已知过敏原；增强免疫力调节体质。',
    horseStyle:'警觉守护型'
  }
}

// 雷达图用 - 9个维度顺序
export const RADAR_KEYS = ['A','B','C','D','E','F','G','H','I']
export const RADAR_LABELS = ['平和质','气虚质','阳虚质','阴虚质','痰湿质','湿热质','血瘀质','气郁质','特禀质']

// ─── 体质结果描述（兼容旧接口） ───
export const CONSTITUTION_INFO: Record<string, {
  emoji: string; title: string; desc: string; diet: string; avoid: string;
}> = {
  '平和质':   { emoji:'⚖️', title:'阴阳调和 平和质',   desc:CONSTITUTION_DB.A.desc, diet:'五谷杂粮为主，荤素搭配，不需特别忌口。', avoid:'避免偏食偏嗜，保持规律作息即可。' },
  '气虚质':   { emoji:'🌬️', title:'元气不足 气虚质',   desc:CONSTITUTION_DB.B.desc, diet:'黄芪、红枣、山药、小米粥、鸡肉。', avoid:'少吃萝卜、山楂等破气食物，避免过劳。' },
  '阳虚质':   { emoji:'☀️',  title:'阳气不足 阳虚质',   desc:CONSTITUTION_DB.C.desc, diet:'羊肉、生姜、桂圆、核桃、韭菜。', avoid:'少吃寒凉食物（西瓜、冷饮、苦瓜），忌生冷。' },
  '阴虚质':   { emoji:'🌙',  title:'阴液不足 阴虚质',   desc:CONSTITUTION_DB.D.desc, diet:'百合、银耳、枸杞、鸭肉、雪梨。', avoid:'少吃辛辣燥热食物（辣椒、羊肉、烧烤），忌熬夜。' },
  '痰湿质':   { emoji:'💧',  title:'痰湿内蕴 痰湿质',   desc:CONSTITUTION_DB.E.desc, diet:'薏米、冬瓜、陈皮、赤小豆、荷叶茶。', avoid:'少吃甜食、肥肉、冷饮，忌暴饮暴食。' },
  '湿热质':   { emoji:'🔥',  title:'湿热内蕴 湿热质',   desc:CONSTITUTION_DB.F.desc, diet:'绿豆、苦瓜、菊花、薏米、冬瓜。', avoid:'少吃辛辣油腻（火锅、烧烤、酒），忌甜食。' },
  '血瘀质':   { emoji:'🩸',  title:'血行不畅 血瘀质',   desc:CONSTITUTION_DB.G.desc, diet:'山楂、黑木耳、红花、玫瑰花、黑豆。', avoid:'少吃寒凉收涩食物，适当运动促进气血运行。' },
  '气郁质':   { emoji:'🍂',  title:'气机郁滞 气郁质',   desc:CONSTITUTION_DB.H.desc, diet:'玫瑰花茶、佛手柑、黄花菜、柑橘、薄荷。', avoid:'少喝咖啡浓茶，避免情绪波动，忌闷闷不乐。' },
  '特禀质':   { emoji:'🛡️',  title:'先天敏感 特禀质',   desc:CONSTITUTION_DB.I.desc, diet:'山药、黄芪、防风、小米、南瓜。', avoid:'避免过敏原食物（海鲜、花生等），忌辛辣刺激。' },
}

// ─── 建筑系统数据 ───
export const BUILDINGS = [
  { id: 'hotpot', name: '食养火锅店', emoji: '🍲', constitution: '阳虚质', seasonBonus: '秋冬+30%', desc: '温阳暖身的食养火锅', unlock: '小马驹' },
  { id: 'milktea', name: '中药奶茶店', emoji: '🧋', constitution: '气郁质', seasonBonus: '四季皆宜', desc: '药食同源的养生茶饮', unlock: '小马驹' },
  { id: 'garden', name: '百草园', emoji: '🌿', constitution: '平和质', seasonBonus: '春季+20%', desc: '顺应天时的药材种植', unlock: '小马驹' },
  { id: 'foodhall', name: '医养食坊', emoji: '🍱', constitution: '气虚质', seasonBonus: '换季+15%', desc: '辨证施食的药膳工坊', unlock: '小马驹' },
  { id: 'lab', name: '食疗配伍实验室', emoji: '⚗️', constitution: '痰湿质', seasonBonus: '四季皆宜', desc: '食材搭配的科学实验', unlock: '壮年马' },
  { id: 'organ', name: '脏腑体检中心', emoji: '🏥', constitution: '湿热质', seasonBonus: '每月自动', desc: '五脏六腑健康评估', unlock: '小马驹' },
  { id: 'tcm', name: '中医馆', emoji: '🏯', constitution: '血瘀质', seasonBonus: '节气+25%', desc: '望闻问切辨证论治', unlock: '少年马' },
]

// ─── 健康数据卡片配置 ───
export const HEALTH_METRICS = [
  { key: 'calories', label: '今日热量', unit: 'kcal', icon: 'Flame', color: '#EF4444' },
  { key: 'weight', label: '当前体重', unit: 'kg', icon: 'Scale', color: '#8B5CF6' },
  { key: 'streak', label: '连续打卡', unit: '天', icon: 'Calendar', color: '#10B981' },
  { key: 'coins', label: '马粮币', unit: '个', icon: 'Coins', color: '#F59E0B' },
]
