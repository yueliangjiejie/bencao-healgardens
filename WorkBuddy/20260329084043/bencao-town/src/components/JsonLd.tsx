// JSON-LD 结构化数据 — 搜索引擎优化
export default function JsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '本草纲目健康小镇',
    alternateName: 'Bencao Gangmu Health Town',
    description: '以中医食疗养生减脂为核心的模拟经营养宠游戏。AI食物识别、九种体质测评、药膳食疗方案、养马互动，21天科学减脂。',
    url: 'https://bencao.town',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
      description: '基础版免费，企业版按人/月计费',
    },
    featureList: [
      'AI拍照食物识别与热量分析',
      '中医九种体质测评(27题专业版)',
      'AI舌诊辅助体质分析',
      '个性化药膳食疗方案',
      '15种中医证型智能辨证',
      '马匹养成互动系统',
      '21天减脂训练营',
      '接食物/记忆翻牌小游戏',
      '企业健康管理平台',
    ],
    author: {
      '@type': 'Organization',
      name: '本草纲目健康小镇',
    },
  }

  const medicalSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: '中医体质测评与药膳食疗',
    description: '基于王琦九种体质理论的在线体质测评工具，结合AI舌诊和食物识别，提供个性化中医食疗养生方案。',
    about: {
      '@type': 'MedicalCondition',
      name: '亚健康状态',
      associatedAnatomy: {
        '@type': 'AnatomicalStructure',
        name: '全身',
      },
    },
    medicalAudience: {
      '@type': 'MedicalAudience',
      audienceType: '关注健康的成年人群',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalSchema) }}
      />
    </>
  )
}
