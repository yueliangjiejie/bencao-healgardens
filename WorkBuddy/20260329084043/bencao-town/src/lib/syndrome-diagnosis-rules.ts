/**
 * 中医证型诊断规则库
 *
 * 数据来源：
 * - 《中医诊断学》第9版（朱文锋，中国中医药出版社）
 * - 《中医证候诊断标准》（卫生部标准）
 * - 《中医内科学》第9版（吴勉华，中国中医药出版社）
 * - 《中医药学名词》（全国科学技术名词审定委员会）
 * - 罗大伦《图解舌诊》临床经验补充
 *
 * 15个基础证型：气血津液辨证(5) + 脏腑辨证·脾胃(4) + 六经辨证(3) + 其他(3)
 */

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

export interface SymptomItem {
  symptom: string
  weight: number
  required?: boolean
}

export interface TonguePulse {
  tongue: string
  tongueDetail: {
    tongueColor: string
    tongueShape?: string
    coating: string
    special?: string
  }
  pulse: string
  luoDalunNote?: string
}

export interface SyndromeDefinition {
  name: string
  code: string
  definition: string
  system: '气血津液辨证' | '脏腑辨证' | '六经辨证' | '其他常见证型'
  primarySymptoms: SymptomItem[]
  secondarySymptoms: SymptomItem[]
  tonguePulse: TonguePulse
  diagnosticCriteria: {
    minPrimary: number
    minSecondary: number
    scoreThreshold: number
    rule: string
  }
  excludeSyndromes: string[]
  source: string
  constitutionMapping: string[]
  careAdvice: {
    diet: string
    herbs: string
    lifestyle: string
    acupoints?: string
  }
}

export interface DifferentialDiagnosis {
  pair: [string, string]
  similarities: string[]
  differences: { syndrome1: string; syndrome2: string }
  keyPoint: string
}

// ═══════════════════════════════════════════════════════════════
// 证型诊断规则（15个）
// ═══════════════════════════════════════════════════════════════

export const SYNDROME_RULES: Record<string, SyndromeDefinition> = {

  // ──────── 气血津液辨证 ────────

  '气虚证': {
    name: '气虚证', code: 'QD',
    definition: '元气不足，气的推动、温煦、固摄、防御、气化等功能减退，致脏腑功能低下的证候',
    system: '气血津液辨证',
    primarySymptoms: [
      { symptom: '神疲乏力', weight: 0.3, required: true },
      { symptom: '少气懒言', weight: 0.2 },
      { symptom: '自汗', weight: 0.15 },
      { symptom: '动则诸症加重', weight: 0.2, required: true },
    ],
    secondarySymptoms: [
      { symptom: '面色淡白或萎黄', weight: 0.1 },
      { symptom: '头晕目眩', weight: 0.08 },
      { symptom: '语声低微', weight: 0.08 },
      { symptom: '易感冒', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌淡苔白',
      tongueDetail: { tongueColor: '淡白', tongueShape: '胖大有齿痕', coating: '薄白' },
      pulse: '脉虚无力',
      luoDalunNote: '齿痕是气虚最典型特征，舌苔铺满舌头说明体内湿重，舌体胖大是气虚+湿气',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(含至少1个必须症状) AND 次症≥1个；或主症3个以上' },
    excludeSyndromes: ['气滞证', '湿热证', '实热证'],
    source: '《中医诊断学》第9版 P131-133',
    constitutionMapping: ['B(气虚质)', 'C(阳虚质)'],
    careAdvice: {
      diet: '健脾益气：山药、黄芪炖鸡、人参粥、小米粥、红枣粥、莲子粥',
      herbs: '四君子汤、补中益气丸、玉屏风散',
      lifestyle: '规律作息，避免过劳；早起不宜喝凉白开（伤阳气）；适度运动，不宜大汗',
      acupoints: '足三里、气海、关元、脾俞',
    },
  },

  '气滞证': {
    name: '气滞证', code: 'QS',
    definition: '人体某一部分或某一脏腑经络的气机阻滞、运行不畅所表现的证候',
    system: '气血津液辨证',
    primarySymptoms: [
      { symptom: '胀满疼痛（痛无定处，时轻时重）', weight: 0.3, required: true },
      { symptom: '情志抑郁或易怒', weight: 0.25, required: true },
      { symptom: '胸闷善太息', weight: 0.2 },
    ],
    secondarySymptoms: [
      { symptom: '脘腹痞满', weight: 0.1 },
      { symptom: '咽部异物感（梅核气）', weight: 0.08 },
      { symptom: '胁肋胀痛', weight: 0.1 },
      { symptom: '嗳气频作', weight: 0.08 },
      { symptom: '症状随情志变化', weight: 0.1 },
    ],
    tonguePulse: {
      tongue: '舌淡红苔薄白',
      tongueDetail: { tongueColor: '淡红', tongueShape: '正常或偏暗', coating: '薄白或薄黄' },
      pulse: '脉弦',
      luoDalunNote: '舌头伸出来尖尖的是气郁（肝气不舒）的典型特征，舌尖尖+边红+白苔=气郁质核心表现',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(含必须症状) AND 次症≥1个；胀痛+情志变化是核心组合' },
    excludeSyndromes: ['气虚证', '血瘀证'],
    source: '《中医诊断学》第9版 P134-136',
    constitutionMapping: ['H(气郁质)'],
    careAdvice: {
      diet: '疏肝理气：玫瑰花茶、佛手柑、陈皮、柑橘类、萝卜、荞麦',
      herbs: '柴胡疏肝散、逍遥丸、舒肝和胃丸',
      lifestyle: '调整情绪是关键！不生气、不焦虑；适当运动疏泄肝气；泡脚疏肝安神',
      acupoints: '太冲、期门、膻中、合谷',
    },
  },

  '血虚证': {
    name: '血虚证', code: 'BD',
    definition: '血液亏少，不能濡养脏腑、经络、组织而表现的证候',
    system: '气血津液辨证',
    primarySymptoms: [
      { symptom: '面色淡白或萎黄', weight: 0.25, required: true },
      { symptom: '头晕眼花', weight: 0.2 },
      { symptom: '心悸失眠', weight: 0.2 },
      { symptom: '手足发麻', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '口唇爪甲色淡', weight: 0.1 },
      { symptom: '视物模糊', weight: 0.08 },
      { symptom: '记忆力减退', weight: 0.08 },
      { symptom: '蹲起头晕', weight: 0.1 },
      { symptom: '妇女经少经闭', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌淡苔薄',
      tongueDetail: { tongueColor: '淡白（甚至有透明感）', tongueShape: '偏瘦薄', coating: '薄白或薄' },
      pulse: '脉细弱',
      luoDalunNote: '舌质颜色非常浅甚至有透明感是典型血虚；舌边颜色很浅=轻微血虚；舌质由红变白=阴虚转血虚',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.45,
      rule: '主症≥2个(含面色异常必须) AND 次症≥1个' },
    excludeSyndromes: ['阴虚证', '血瘀证'],
    source: '《中医诊断学》第9版 P137-139',
    constitutionMapping: ['B(气虚质)', 'D(阴虚质)'],
    careAdvice: {
      diet: '补血养血：当归养血鸡汤、龙眼肉（桂圆）、红枣、菠菜、猪肝、黑芝麻、桑葚',
      herbs: '四物汤、归脾丸、玉灵膏（龙眼肉+西洋参）',
      lifestyle: '避免过度思虑（伤血）；不要熬夜（最耗血）；饮食有节；保持情绪平和',
      acupoints: '血海、三阴交、足三里、脾俞',
    },
  },

  '血瘀证': {
    name: '血瘀证', code: 'BS',
    definition: '瘀血内阻，血液运行不畅，以疼痛、肿块、出血、瘀斑等为主要表现的证候',
    system: '气血津液辨证',
    primarySymptoms: [
      { symptom: '固定刺痛（拒按，夜间加重）', weight: 0.3, required: true },
      { symptom: '肿块（质硬，固定不移）', weight: 0.2 },
      { symptom: '出血色紫暗有块', weight: 0.2 },
      { symptom: '面色黧黑或唇甲紫暗', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '肌肤甲错（皮肤干燥粗糙）', weight: 0.1 },
      { symptom: '皮下瘀斑', weight: 0.1 },
      { symptom: '善忘', weight: 0.08 },
      { symptom: '口干不欲饮', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌紫暗有瘀斑，舌下静脉青紫',
      tongueDetail: { tongueColor: '暗紫或青紫', tongueShape: '有瘀斑瘀点', coating: '薄白', special: '舌下静脉粗大青紫迂曲' },
      pulse: '脉涩',
      luoDalunNote: '舌尖有明显瘀点=瘀血正在形成；舌下两条静脉又黑又粗=瘀血严重；女性舌有瘀血+嘴唇汗毛重→警惕子宫肌瘤',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(含疼痛症状必须) AND 次症≥1个；或舌脉有典型瘀血征象' },
    excludeSyndromes: ['气滞证（气滞致瘀者除外）'],
    source: '《中医诊断学》第9版 P140-143',
    constitutionMapping: ['G(血瘀质)'],
    careAdvice: {
      diet: '活血化瘀：山楂、玫瑰花茶、黑豆、黑木耳、生姜、洋葱',
      herbs: '血府逐瘀汤、三七粉配西洋参粉（化瘀名方）、桂枝茯苓丸',
      lifestyle: '泡脚去瘀血效果比喝药好；保持运动促进循环；避免生气、受寒、外伤',
      acupoints: '血海、三阴交、合谷、膈俞',
    },
  },

  '津液不足证': {
    name: '津液不足证', code: 'FD',
    definition: '体内津液亏少，脏腑组织失其濡润滋养而表现的干燥证候',
    system: '气血津液辨证',
    primarySymptoms: [
      { symptom: '口渴咽干', weight: 0.3, required: true },
      { symptom: '皮肤干燥', weight: 0.2 },
      { symptom: '大便干结', weight: 0.2 },
      { symptom: '小便短少', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '目眶凹陷', weight: 0.08 },
      { symptom: '唇焦口燥', weight: 0.08 },
      { symptom: '干咳无痰', weight: 0.08 },
      { symptom: '毛发干枯', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌红少津，苔少或无苔',
      tongueDetail: { tongueColor: '红或偏红', tongueShape: '偏瘦薄', coating: '少苔或无苔' },
      pulse: '脉细数',
      luoDalunNote: '津液不足舌象与阴虚类似但程度较轻；以干燥少津为主要特征',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.45,
      rule: '主症≥2个(含口渴咽干必须) AND 次症≥1个' },
    excludeSyndromes: ['湿热证', '实热证'],
    source: '《中医诊断学》第9版 P147-149',
    constitutionMapping: ['D(阴虚质)'],
    careAdvice: {
      diet: '生津润燥：梨汁、甘蔗汁、百合银耳羹、蜂蜜水、麦冬泡水',
      herbs: '增液汤（玄参/麦冬/生地）、沙参麦冬汤',
      lifestyle: '多饮温水；避免辛辣燥热；秋冬注意保湿；避免大汗伤津',
      acupoints: '三阴交、太溪、照海、廉泉',
    },
  },

  // ──────── 脏腑辨证（脾胃） ────────

  '脾气虚证': {
    name: '脾气虚证', code: 'SQD',
    definition: '脾气不足，运化失常所表现的证候。以食少腹胀、便溏与气虚共见为特征',
    system: '脏腑辨证',
    primarySymptoms: [
      { symptom: '食少腹胀（食后尤甚）', weight: 0.25, required: true },
      { symptom: '便溏', weight: 0.2 },
      { symptom: '神疲乏力', weight: 0.2, required: true },
      { symptom: '少气懒言', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '面色萎黄', weight: 0.1 },
      { symptom: '形体消瘦或虚胖', weight: 0.08 },
      { symptom: '肢体倦怠', weight: 0.08 },
      { symptom: '脘腹坠胀（内脏下垂）', weight: 0.08 },
      { symptom: '出血（脾不统血）', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌淡苔白',
      tongueDetail: { tongueColor: '淡白', tongueShape: '胖大有齿痕', coating: '薄白或白腻' },
      pulse: '脉细弱',
      luoDalunNote: '舌中苔白腻厚=脾胃湿滞；舌中裂纹=脾胃气虚；舌体胖大+齿痕+白苔=脾气虚典型组合',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 2, scoreThreshold: 0.5,
      rule: '主症≥2个(含食少腹胀必须) AND 次症≥2个' },
    excludeSyndromes: ['湿热证', '实热证', '胃阴虚证'],
    source: '《中医诊断学》第9版 P245；《中医内科学》P162-164',
    constitutionMapping: ['B(气虚质)', 'E(痰湿质)'],
    careAdvice: {
      diet: '健脾益气：山药薏仁粥、黄芪炖鸡、人参粥、小米粥、八珍糕',
      herbs: '四君子汤、参苓白术散、补中益气丸',
      lifestyle: '饮食定时定量；忌生冷寒凉；不过度思虑（思伤脾）；适度运动',
      acupoints: '足三里、脾俞、中脘、天枢',
    },
  },

  '脾阳虚证': {
    name: '脾阳虚证', code: 'SYD',
    definition: '脾阳虚衰，阴寒内生，以食少腹胀、腹痛喜温按、便溏为主要表现的虚寒证候',
    system: '脏腑辨证',
    primarySymptoms: [
      { symptom: '腹痛喜温喜按', weight: 0.25, required: true },
      { symptom: '便溏或完谷不化', weight: 0.2 },
      { symptom: '畏寒肢冷', weight: 0.2, required: true },
      { symptom: '食少腹胀', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '面色㿠白', weight: 0.08 },
      { symptom: '口淡不渴', weight: 0.08 },
      { symptom: '肢体浮肿', weight: 0.08 },
      { symptom: '小便不利', weight: 0.08 },
      { symptom: '带下清稀（女）', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌淡胖苔白滑',
      tongueDetail: { tongueColor: '淡白', tongueShape: '胖嫩湿润', coating: '白滑' },
      pulse: '脉沉迟无力',
      luoDalunNote: '脾阳虚舌象比脾气虚更偏寒——舌淡嫩湿润甚至水滑；白滑苔是阳虚有寒湿标志',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(含畏寒肢冷必须) AND 次症≥1个；脾气虚+寒象=脾阳虚' },
    excludeSyndromes: ['湿热证', '胃阴虚证', '实寒证'],
    source: '《中医诊断学》第9版 P246-247；《中医内科学》P165-167',
    constitutionMapping: ['C(阳虚质)', 'B(气虚质)'],
    careAdvice: {
      diet: '温中健脾：干姜粥、羊肉汤、附子炖鸡、生姜红糖水、胡椒猪肚汤',
      herbs: '理中丸/汤、附子理中丸、小建中汤',
      lifestyle: '注意保暖（尤其腹部）；不食寒凉生冷；可常灸中脘、关元；泡脚温阳',
      acupoints: '中脘、关元、脾俞、足三里（可艾灸）',
    },
  },

  '胃气虚证': {
    name: '胃气虚证', code: 'WQD',
    definition: '胃气虚弱，胃失和降，以胃脘隐痛、食少、嗳气为主要表现的证候',
    system: '脏腑辨证',
    primarySymptoms: [
      { symptom: '胃脘隐痛（按之则舒）', weight: 0.3, required: true },
      { symptom: '食少纳呆', weight: 0.2 },
      { symptom: '嗳气', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '面色萎黄', weight: 0.08 },
      { symptom: '气短懒言', weight: 0.08 },
      { symptom: '口淡无味', weight: 0.08 },
      { symptom: '胃脘痞满', weight: 0.08 },
      { symptom: '大便不调', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌淡苔白',
      tongueDetail: { tongueColor: '淡白', tongueShape: '偏淡嫩', coating: '薄白' },
      pulse: '脉弱',
      luoDalunNote: '胃气虚与脾气虚常并见；若舌中部苔明显减少=胃气虚弱的重要线索',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.45,
      rule: '主症≥2个(含胃脘隐痛必须) AND 次症≥1个' },
    excludeSyndromes: ['胃火炽盛', '食积胃脘', '胃阴虚证'],
    source: '《中医诊断学》第9版 P252-253；《中医内科学》P186-188',
    constitutionMapping: ['B(气虚质)'],
    careAdvice: {
      diet: '养胃益气：小米粥（最养胃）、山药粥、南瓜粥、红枣粥；饮食细嚼慢咽',
      herbs: '香砂六君子汤、参苓白术散',
      lifestyle: '饮食规律、少食多餐；忌暴饮暴食、辛辣刺激；饭后不宜立即运动',
      acupoints: '中脘、足三里、内关、胃俞',
    },
  },

  '胃阴虚证': {
    name: '胃阴虚证', code: 'WYD',
    definition: '胃阴亏虚，胃失濡润和降，以胃脘隐痛、饥不欲食为主要表现的虚热证候',
    system: '脏腑辨证',
    primarySymptoms: [
      { symptom: '胃脘隐痛（灼痛）', weight: 0.25, required: true },
      { symptom: '饥不欲食', weight: 0.25, required: true },
      { symptom: '口燥咽干', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '干呕呃逆', weight: 0.1 },
      { symptom: '大便干结', weight: 0.08 },
      { symptom: '形体消瘦', weight: 0.08 },
      { symptom: '五心烦热', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌红少苔或无苔',
      tongueDetail: { tongueColor: '红', tongueShape: '偏瘦薄或有裂纹', coating: '少苔或无苔' },
      pulse: '脉细数',
      luoDalunNote: '舌中部裂纹+苔少或无苔=脾胃阴虚；苔分布不均+舌质红=绝大多数阴虚引起',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.45,
      rule: '主症≥2个(含饥不欲食必须) AND 次症≥1个' },
    excludeSyndromes: ['胃火炽盛', '脾气虚证', '脾阳虚证'],
    source: '《中医诊断学》第9版 P254-255；《中医内科学》P189-190',
    constitutionMapping: ['D(阴虚质)'],
    careAdvice: {
      diet: '滋养胃阴：百合粥、银耳羹、沙参麦冬粥、石斛茶、梨汁',
      herbs: '益胃汤、沙参麦冬汤',
      lifestyle: '忌辛辣燥热；多食滋润之品；不宜过饥；避免熬夜（最伤阴）',
      acupoints: '中脘、内关、三阴交、太溪',
    },
  },

  // ──────── 六经辨证 ────────

  '太阳证': {
    name: '太阳证', code: 'TY',
    definition: '外邪侵袭肌表，正邪相争于表，以恶寒发热、头项强痛为主要表现的表证',
    system: '六经辨证',
    primarySymptoms: [
      { symptom: '恶寒发热（恶寒重发热轻）', weight: 0.3, required: true },
      { symptom: '头项强痛', weight: 0.25, required: true },
      { symptom: '身痛腰痛', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '无汗（伤寒）或汗出（中风）', weight: 0.1 },
      { symptom: '鼻塞流涕', weight: 0.08 },
      { symptom: '咳嗽', weight: 0.08 },
      { symptom: '骨节酸痛', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌淡红苔薄白',
      tongueDetail: { tongueColor: '淡红', tongueShape: '正常', coating: '薄白' },
      pulse: '脉浮紧（伤寒）或脉浮缓（中风）',
      luoDalunNote: '太阳证为外感表证，舌象变化不明显，以薄白苔为主；苔开始变黄=邪气入里化热',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(含恶寒发热必须) AND 次症≥1个；起病急，病程短' },
    excludeSyndromes: ['少阳证', '阳明证'],
    source: '《伤寒论》第1-7条；《中医诊断学》第9版 P168-171',
    constitutionMapping: ['A(平和质，外感)'],
    careAdvice: {
      diet: '辛温解表：生姜红糖葱白汤、桂枝汤粥',
      herbs: '麻黄汤（伤寒无汗）、桂枝汤（中风有汗）',
      lifestyle: '注意保暖，适当发汗；多饮温水；注意休息',
      acupoints: '风池、大椎、合谷、列缺',
    },
  },

  '少阳证': {
    name: '少阳证', code: 'SY',
    definition: '邪犯少阳，枢机不利，以寒热往来、胸胁苦满、口苦为主要表现的半表半里证',
    system: '六经辨证',
    primarySymptoms: [
      { symptom: '寒热往来（忽冷忽热）', weight: 0.3, required: true },
      { symptom: '胸胁苦满', weight: 0.2 },
      { symptom: '口苦咽干', weight: 0.2, required: true },
      { symptom: '目眩', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '不欲饮食', weight: 0.1 },
      { symptom: '心烦喜呕', weight: 0.1 },
      { symptom: '默默不语', weight: 0.05 },
    ],
    tonguePulse: {
      tongue: '舌淡红或偏红苔薄白或微黄',
      tongueDetail: { tongueColor: '淡红或偏红', tongueShape: '正常', coating: '薄白或薄黄' },
      pulse: '脉弦',
      luoDalunNote: '少阳证舌象介于太阳和阳明之间；苔开始转黄但未到黄厚=邪在半表半里',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(含寒热往来必须) AND 次症≥1个；少阳三主症：寒热往来+口苦+目眩' },
    excludeSyndromes: ['太阳证', '阳明证', '肝气郁结证'],
    source: '《伤寒论》第96-101条；《中医诊断学》第9版 P172-174',
    constitutionMapping: ['H(气郁质，外感)'],
    careAdvice: {
      diet: '和解少阳：小柴胡汤粥、菊花茶、薄荷粥',
      herbs: '小柴胡汤（柴胡/黄芩/人参/半夏/甘草/生姜/大枣）',
      lifestyle: '注意休息；保持情绪舒畅；饮食清淡',
      acupoints: '风池、外关、足临泣、期门',
    },
  },

  '阳明证': {
    name: '阳明证', code: 'YM',
    definition: '邪热内传阳明，胃肠燥热亢盛，以大热大汗大渴或腹满痛便秘为主要表现的里热实证',
    system: '六经辨证',
    primarySymptoms: [
      { symptom: '壮热（大热不退）', weight: 0.25, required: true },
      { symptom: '大汗出', weight: 0.2 },
      { symptom: '大渴引饮', weight: 0.2 },
      { symptom: '腹满痛拒按/便秘', weight: 0.2 },
    ],
    secondarySymptoms: [
      { symptom: '心烦', weight: 0.08 },
      { symptom: '谵语', weight: 0.08 },
      { symptom: '面赤', weight: 0.08 },
      { symptom: '小便短赤', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌红苔黄燥',
      tongueDetail: { tongueColor: '红', tongueShape: '正常或偏红', coating: '黄燥或黄厚' },
      pulse: '脉洪大或沉实',
      luoDalunNote: '阳明证舌苔黄燥是重要标志，区别于少阳证的薄黄；苔黄厚燥甚至焦黑=热极伤津',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(含壮热必须) AND 次症≥1个；经证(四大症)与腑证(便秘腹满)可分可合' },
    excludeSyndromes: ['太阳证', '少阳证', '阴虚证（虚热）'],
    source: '《伤寒论》第176-184条、208-215条；《中医诊断学》第9版 P175-177',
    constitutionMapping: ['F(湿热质，热重)'],
    careAdvice: {
      diet: '清热生津：石膏粳米汤、西瓜汁、绿豆汤、梨汁',
      herbs: '白虎汤（经证）、大承气汤（腑证）',
      lifestyle: '卧床休息；多饮温水；注意退热防脱水；饮食清淡流质',
      acupoints: '合谷、曲池、大椎、内庭',
    },
  },

  // ──────── 其他常见证型 ────────

  '肝气郁结证': {
    name: '肝气郁结证', code: 'GQY',
    definition: '肝失疏泄，气机郁滞，以情志抑郁、胸胁或少腹胀痛为主要表现的证候',
    system: '其他常见证型',
    primarySymptoms: [
      { symptom: '情志抑郁或易怒', weight: 0.3, required: true },
      { symptom: '胸胁或少腹胀痛', weight: 0.25, required: true },
      { symptom: '善太息', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '咽部梅核气', weight: 0.1 },
      { symptom: '女性乳房胀痛/月经不调', weight: 0.1 },
      { symptom: '脘腹胀满', weight: 0.08 },
      { symptom: '纳呆（食欲差）', weight: 0.08 },
      { symptom: '凌晨3-5点早醒', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌淡红偏暗苔薄白',
      tongueDetail: { tongueColor: '淡红偏暗', tongueShape: '尖形（罗大伦发现）', coating: '薄白或微黄' },
      pulse: '脉弦',
      luoDalunNote: '尖形舌头是肝气郁结最典型特征（罗大伦原创发现）；舌尖尖+边红+白苔=核心表现；舌由尖变胖圆=肝气不舒+湿重',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(必须含情志+胸胁症状) AND 次症≥1个' },
    excludeSyndromes: ['气滞证（肝气郁结是气滞的具体表现）', '少阳证'],
    source: '《中医诊断学》第9版 P230-232；《中医内科学》P258-260',
    constitutionMapping: ['H(气郁质)'],
    careAdvice: {
      diet: '疏肝理气：玫瑰花茶、佛手柑、陈皮、柑橘类、萝卜、荞麦',
      herbs: '逍遥丸、柴胡疏肝散、舒肝和胃丸',
      lifestyle: '调整情绪是关键！不生气、不焦虑；可泡脚疏肝安神；敲肺经',
      acupoints: '太冲、期门、膻中、阳陵泉',
    },
  },

  '肾阳虚证': {
    name: '肾阳虚证', code: 'KSYD',
    definition: '肾阳亏虚，机体失其温煦，以腰膝酸冷、性欲减退、夜尿多为主要表现的虚寒证候',
    system: '其他常见证型',
    primarySymptoms: [
      { symptom: '腰膝酸冷', weight: 0.25, required: true },
      { symptom: '畏寒肢冷（下肢尤甚）', weight: 0.25, required: true },
      { symptom: '性欲减退/阳痿早泄', weight: 0.2 },
      { symptom: '夜尿多或小便清长', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '精神不振', weight: 0.08 },
      { symptom: '五更泄泻', weight: 0.1 },
      { symptom: '浮肿（腰以下）', weight: 0.08 },
      { symptom: '面色㿠白或黧黑', weight: 0.08 },
      { symptom: '女子宫寒不孕', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌淡胖苔白',
      tongueDetail: { tongueColor: '淡白', tongueShape: '胖嫩', coating: '白滑', special: '舌根区域尤为淡嫩' },
      pulse: '脉沉迟无力',
      luoDalunNote: '肾阳虚舌根区域（对应肾）苔白滑或淡嫩是重要分区线索',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(含腰膝酸冷必须) AND 次症≥1个' },
    excludeSyndromes: ['肾阴虚证', '脾阳虚证', '实寒证'],
    source: '《中医诊断学》第9版 P259-261；《中医内科学》P296-298',
    constitutionMapping: ['C(阳虚质)'],
    careAdvice: {
      diet: '温补肾阳：羊肉汤、鹿茸炖鸡、韭菜炒核桃、肉桂红茶、杜仲猪腰汤',
      herbs: '金匮肾气丸、右归丸、附子理中丸（兼脾胃虚寒）',
      lifestyle: '注意保暖（尤其腰部下肢）；不喝凉水；可常灸关元、命门；节制房事',
      acupoints: '肾俞、命门、关元、太溪（可艾灸）',
    },
  },

  '肾阴虚证': {
    name: '肾阴虚证', code: 'KDYD',
    definition: '肾阴亏虚，失其滋养，以腰膝酸痛、头晕耳鸣、五心烦热为主要表现的虚热证候',
    system: '其他常见证型',
    primarySymptoms: [
      { symptom: '腰膝酸痛', weight: 0.25, required: true },
      { symptom: '头晕耳鸣', weight: 0.2, required: true },
      { symptom: '五心烦热或潮热盗汗', weight: 0.2 },
      { symptom: '失眠多梦', weight: 0.15 },
    ],
    secondarySymptoms: [
      { symptom: '遗精早泄（男）', weight: 0.08 },
      { symptom: '经少经闭（女）', weight: 0.08 },
      { symptom: '大便干结', weight: 0.08 },
      { symptom: '小便短黄', weight: 0.08 },
    ],
    tonguePulse: {
      tongue: '舌红少苔或无苔',
      tongueDetail: { tongueColor: '红', tongueShape: '偏瘦薄或有裂纹', coating: '少苔或无苔', special: '舌根区域苔少尤为明显' },
      pulse: '脉细数',
      luoDalunNote: '老人舌头有深裂纹=阴虚或脾胃虚弱；六味地黄丸是肾阴虚经典方',
    },
    diagnosticCriteria: { minPrimary: 2, minSecondary: 1, scoreThreshold: 0.5,
      rule: '主症≥2个(含腰膝酸痛必须) AND 次症≥1个' },
    excludeSyndromes: ['肾阳虚证', '阴虚火旺证', '肝阴虚证'],
    source: '《中医诊断学》第9版 P256-258；《中医内科学》P293-295',
    constitutionMapping: ['D(阴虚质)'],
    careAdvice: {
      diet: '滋补肾阴：枸杞桑葚茶、百合银耳羹、山药粥、黑芝麻糊、甲鱼汤',
      herbs: '六味地黄丸（经典方）、知柏地黄丸（阴虚火旺）、左归丸',
      lifestyle: '避免熬夜（最伤肾阴）；忌辛辣燥热；节制房事；可练八段锦',
      acupoints: '太溪、三阴交、肾俞、照海',
    },
  },
}

// ═══════════════════════════════════════════════════════════════
// 证型间鉴别要点对照表（12组）
// ═══════════════════════════════════════════════════════════════

export const DIFFERENTIAL_DIAGNOSIS: DifferentialDiagnosis[] = [
  {
    pair: ['气虚证', '血虚证'] as [string, string],
    similarities: ['均有面色淡白、头晕、乏力'],
    differences: { syndrome1: '气虚以乏力、自汗、气短为主，舌胖大有齿痕', syndrome2: '血虚以面色萎黄、心悸、手足麻为主，舌淡瘦薄甚至透明感' },
    keyPoint: '气虚重在"力不足"，血虚重在"色不华"',
  },
  {
    pair: ['气虚证', '脾阳虚证'] as [string, string],
    similarities: ['均有乏力、食少、便溏'],
    differences: { syndrome1: '气虚以乏力为主，无明显寒象', syndrome2: '阳虚在气虚基础上加寒象（畏寒肢冷、腹痛喜温）' },
    keyPoint: '阳虚=气虚+寒象；苔从薄白变为白滑',
  },
  {
    pair: ['气滞证', '血瘀证'] as [string, string],
    similarities: ['均有疼痛、情志因素'],
    differences: { syndrome1: '胀痛走窜，时轻时重，舌象变化不明显', syndrome2: '刺痛固定，夜间加重，舌紫暗有瘀斑' },
    keyPoint: '胀痛走窜=气滞，刺痛固定=血瘀',
  },
  {
    pair: ['血虚证', '肾阴虚证'] as [string, string],
    similarities: ['面色淡白/萎黄、头晕'],
    differences: { syndrome1: '血虚无热象，以"淡"为特征', syndrome2: '阴虚有虚热象（五心烦热、盗汗、舌红少苔）' },
    keyPoint: '血虚=色不华（淡），阴虚=有虚热（红/热）',
  },
  {
    pair: ['脾气虚证', '脾阳虚证'] as [string, string],
    similarities: ['食少腹胀、便溏、面色萎黄'],
    differences: { syndrome1: '消化功能减弱为主，无明显寒象', syndrome2: '加寒象：腹痛喜温按、畏寒肢冷、舌淡嫩湿润' },
    keyPoint: '脾阳虚=脾气虚+寒象',
  },
  {
    pair: ['胃阴虚证', '脾气虚证'] as [string, string],
    similarities: ['食少、胃脘不适'],
    differences: { syndrome1: '饥不欲食、灼痛、口干、舌红少苔（虚热）', syndrome2: '食少腹胀、隐痛、便溏、舌淡胖有齿痕（虚寒）' },
    keyPoint: '一寒一热；舌象截然相反',
  },
  {
    pair: ['太阳证', '少阳证'] as [string, string],
    similarities: ['均为外感表证，有发热'],
    differences: { syndrome1: '恶寒发热同时出现，头项强痛，脉浮', syndrome2: '寒热往来交替出现，口苦咽干目眩，脉弦' },
    keyPoint: '恶寒发热同时=太阳，寒热往来交替=少阳',
  },
  {
    pair: ['少阳证', '阳明证'] as [string, string],
    similarities: ['均有热象'],
    differences: { syndrome1: '热势不重，寒热往来，苔薄白或薄黄', syndrome2: '壮热不退，大渴大汗，苔黄燥，脉洪大' },
    keyPoint: '半表半里=少阳，热入里=阳明',
  },
  {
    pair: ['肝气郁结证', '气滞证'] as [string, string],
    similarities: ['胀痛、情志不畅、脉弦'],
    differences: { syndrome1: '胸胁胀痛、善太息、女性经前乳胀，舌可尖形', syndrome2: '范围更广，可涉及各脏腑' },
    keyPoint: '肝气郁结是气滞的脏腑定位版+尖形舌',
  },
  {
    pair: ['肾阳虚证', '肾阴虚证'] as [string, string],
    similarities: ['腰膝酸软、头晕耳鸣'],
    differences: { syndrome1: '畏寒肢冷、夜尿多、舌淡胖白滑、脉沉迟', syndrome2: '五心烦热、盗汗、舌红少苔、脉细数' },
    keyPoint: '一寒一热：阳虚=寒象+舌淡胖，阴虚=热象+舌红瘦',
  },
  {
    pair: ['气虚证', '津液不足证'] as [string, string],
    similarities: ['乏力、口渴'],
    differences: { syndrome1: '功能减退为主，舌胖有齿痕', syndrome2: '干燥为主（口干、皮肤干、大便干），舌红少津' },
    keyPoint: '气虚重在"力不足"，津亏重在"干燥少津"',
  },
  {
    pair: ['脾阳虚证', '肾阳虚证'] as [string, string],
    similarities: ['畏寒肢冷、便溏/五更泻'],
    differences: { syndrome1: '消化系统为主（腹胀、食少），腹痛喜温按', syndrome2: '泌尿生殖为主（腰膝酸冷、夜尿多、性功能减退）' },
    keyPoint: '脾阳虚=中焦（消化），肾阳虚=下焦（泌尿生殖+腰膝）',
  },
]

// ═══════════════════════════════════════════════════════════════
// 量化诊断引擎
// ═══════════════════════════════════════════════════════════════

export interface DiagnosisInput {
  symptoms: string[]
  tongueColor?: string
  tongueShape?: string
  coating?: string
  pulse?: string
}

export interface DiagnosisResult {
  syndrome: string
  score: number
  matchedPrimary: string[]
  matchedSecondary: string[]
  confidence: 'high' | 'medium' | 'low'
}

/** 根据症状列表进行证型诊断，返回匹配度最高的证型列表（按得分降序） */
export function diagnoseSyndromes(input: DiagnosisInput): DiagnosisResult[] {
  const results: DiagnosisResult[] = []

  for (const [, def] of Object.entries(SYNDROME_RULES)) {
    let totalScore = 0
    const matchedPrimary: string[] = []
    const matchedSecondary: string[] = []
    let requiredMet = true

    for (const ps of def.primarySymptoms) {
      const matched = input.symptoms.some(s =>
        ps.symptom.includes(s) || s.includes(ps.symptom.split('（')[0])
      )
      if (matched) { totalScore += ps.weight; matchedPrimary.push(ps.symptom) }
      else if (ps.required) { requiredMet = false }
    }

    for (const ss of def.secondarySymptoms) {
      const matched = input.symptoms.some(s =>
        ss.symptom.includes(s) || s.includes(ss.symptom.split('（')[0])
      )
      if (matched) { totalScore += ss.weight; matchedSecondary.push(ss.symptom) }
    }

    if (input.tongueColor && def.tonguePulse.tongueDetail.tongueColor.includes(input.tongueColor)) totalScore += 0.1
    if (input.coating && def.tonguePulse.tongueDetail.coating.includes(input.coating)) totalScore += 0.1
    if (input.pulse && def.tonguePulse.pulse.includes(input.pulse)) totalScore += 0.05

    const criteria = def.diagnosticCriteria
    if (matchedPrimary.length >= criteria.minPrimary && matchedSecondary.length >= criteria.minSecondary
        && totalScore >= criteria.scoreThreshold && requiredMet) {
      results.push({
        syndrome: def.name,
        score: Math.round(totalScore * 100) / 100,
        matchedPrimary,
        matchedSecondary,
        confidence: totalScore >= 0.7 ? 'high' : totalScore >= 0.55 ? 'medium' : 'low',
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results
}

/** 获取证型间的鉴别要点 */
export function getDifferentialInfo(s1: string, s2: string): DifferentialDiagnosis | undefined {
  return DIFFERENTIAL_DIAGNOSIS.find(d =>
    (d.pair[0] === s1 && d.pair[1] === s2) || (d.pair[0] === s2 && d.pair[1] === s1)
  )
}

/** 获取指定证型的完整定义 */
export function getSyndromeDefinition(name: string): SyndromeDefinition | undefined {
  return SYNDROME_RULES[name]
}

/** 按辨证体系获取证型列表 */
export function getSyndromesBySystem(system: SyndromeDefinition['system']): SyndromeDefinition[] {
  return Object.values(SYNDROME_RULES).filter(s => s.system === system)
}