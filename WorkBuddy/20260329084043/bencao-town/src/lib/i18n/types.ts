// ═══════════════════════════════════════════════
// 本草纲目药膳小镇 - i18n 类型定义
// ═══════════════════════════════════════════════

export type Locale = 'zh' | 'en'

/** 翻译值：可以是字符串、嵌套对象或字符串数组 */
export type TranslationValue = string | Record<string, any> | string[]

/** 翻译字典（嵌套结构） */
export interface Translations {
  // ─── App 全局 ───
  app: {
    name: string
    subtitle: string
    description: string
    keywords: string[]
  }
  
  // ─── Tab Bar ───
  tab: {
    home: string
    record: string
    tcm: string
    games: string
    settings: string
  }
  
  // ─── 首页 ───
  home: {
    greetingNight: string
    greetingMorning: string
    greetingForenoon: string
    greetingNoon: string
    greetingAfternoon: string
    greetingEvening: string
    greetingLateNight: string
    startAdoption: string
    adoptCta: string
    todayCalories: string
    currentWeight: string
    streakDays: string
    horseCoins: string
    wellnessPoints: string
    earnPoints: string
    quickEntry: string
    dietRecord: string
    weightRecord: string
    tcmHall: string
    miniGames: string
    bag: string
    growthRecord: string
    gotIt: string
    noHorseTitle: string
    noHorseDesc1: string
    noHorseDesc2: string
    constitutionTag: string
  }
  
  // ─── 记录页 ───
  record: {
    dietLog: string
    weightLog: string
    todayTotal: string
    kcal: string
    kg: string
    breakfast: string
    lunch: string
    dinner: string
    snack: string
    addItem: string
    foodName: string
    calories: string
    addFood: string
    saveWeight: string
    currentWeightPlaceholder: string
    weightHistory: string
    noData: string
    aiCameraTitle: string
    aiCameraSubtitle: string
    aiCameraHint: string
    analyzing: string
    resultFoodName: string
    resultPortion: string
    resultConfidence: string
    resultNutrition: {
      protein: string
      carbs: string
      fat: string
      fiber: string
    }
    resultTcmAdvice: string
    resultAddToMeal: string
    demoModeNotice: string
    errorNoImage: string
    errorApiFailed: string
    errorNoKey: string
    errorQuota: string
    errorSafety: string
    errorUnknown: string
    retry: string
    backToHome: string
    clearToday: string
    confirmClear: string
  }
  
  // ─── 中医馆 ───
  tcm: {
    title: string
    knowledgeCards: string
    cards: Record<string, Array<{
      title: string
      content: string
      tag: string
    }>>
    buildings: Array<{
      name: string
      desc: string
      seasonBonus: string
      unlock: string
    }>
    constitutionAdapt: string
    wellnessScore: string
    healthTips: string
    shareQr: string
  }
  
  // ─── 游戏页 ───
  games: {
    title: string
    catchFood: {
      title: string
      desc: string
      score: string
      best: string
      gameOver: string
      restart: string
      good: string[]
      bad: string[]
    }
    memoryMatch: {
      title: string
      desc: string
      moves: string
      time: string
      win: string
      restart: string
      cards: Array<{ name: string }>
    }
    dailyCheckin: {
      title: string
      desc: string
      checked: string
      checkin: string
      completed: string
      resetTomorrow: string
      tasks: Array<{ name: string }>
    }
    fatLossCamp: {
      title: string
      subtitle: string
      adventure: string
      day: string
      startAdventure: string
      courseTitle: string
      phaseLabel: string[] | null
      bossBattle: {
        title: string
        hp: string
        defeat: string
        victory: string
        defeatDesc: string
        bosses: Array<{
          name: string
          fullHp: number
          tasks: string[]
          reward: string
        }>
      }
      report: {
        title: string
        totalDays: string
        totalCourses: string
        bossDefeated: string
        pointsEarned: string
        keepGoing: string
        share: string
      }
    }
    shop: {
      title: string
      buy: string
      owned: string
      notEnoughCoins: string
      notEnoughPoints: string
      confirmBuy: string
    }
  }
  
  // ─── 设置页 / 我的 ───
  settings: {
    profile: string
    shop: string
    bag: string
    stats: string
    nickname: string
    constitution: string
    horseLevel: string
    horseStyle: string
    joinDate: string
    totalPoints: string
    totalCoins: string
    loginDays: string
    cardsRead: string
    achievements: string
    unlocked: string
    locked: string
    logout: string
    about: string
    version: string
    categoryDecor: string
    categoryFoodTherapy: string
    categoryStable: string
  }
  
  // ─── 引导页 ───
  onboard: {
    welcomeTitle: string
    welcomeSubtitle1: string
    welcomeSubtitle2: string
    quizTime: string
    quizQuestions: string
    quizDiagnosis: string
    quizPlan: string
    quizPrivacy: string
    quizLocal: string
    startQuiz: string
    questionProgress: string
    prevQuestion: string
    submitQuiz: string
    nextQuestion: string
    analyzingTitle: string
    analyzingDesc1: string
    analyzingDesc2: string
    analyzingWait: string
    resultScore: string
    radarChart: string
    bodyFeatures: string
    recommendedDiet: string
    dietaryTaboos: string
    wellnessTips: string
    adoptHorse: string
    chooseHorse: string
    chooseHorseDesc: string
    nameYourHorse: string
    namePlaceholder: string
    adoptBtn: string
    horseStyles: Array<{
      style: string
      desc: string
    }>
  }
  
  // ─── 马匹组件 ───
  horse: {
    notAdopted: string
    goAdopt: string
    speechFeed: string
    speechClean: string
    speechPlay: string
    speechExercise: string
    speechPoke: string
    statSatiety: string
    statClean: string
    statJoy: string
    statFitness: string
    actionFeed: string
    actionClean: string
    actionPlay: string
    actionExercise: string
  }
  
  // ─── 马匹风格名称（store 类型需要） ───
  horseStyles: {
    golden: string
    azure: string
    chestnut: string
    sakura: string
  }
  horseLevels: {
    foal: string
    youth: string
    adult: string
    steed: string
    divine: string
  }
  
  // ─── 通知中心 ───
  notification: {
    title: string
    enabledCount: string
    quickAdd: string
    custom: string
    placeholder: string
    confirmAdd: string
    empty: string
    emptyHint: string
    bottomTip: string
    triggeredMsg: string
    templates: Array<{
      label: string
      desc: string
    }>
    defaultReminders: Array<{
      label: string
    }>
  }
  
  // ─── 体质系统（9种） ───
  constitutions: {
    balanced: {
      name: string
      title: string
      icon: string
      desc: string
      features: string[]
      rec: string
      horseStyle: string
      diet: string
      avoid: string
    }
    qiDef: {
      name: string
      title: string
      icon: string
      desc: string
      features: string[]
      rec: string
      horseStyle: string
      diet: string
      avoid: string
    }
    yangDef: {
      name: string
      title: string
      icon: string
      desc: string
      features: string[]
      rec: string
      horseStyle: string
      diet: string
      avoid: string
    }
    yinDef: {
      name: string
      title: string
      icon: string
      desc: string
      features: string[]
      rec: string
      horseStyle: string
      diet: string
      avoid: string
    }
    phlegm: {
      name: string
      title: string
      icon: string
      desc: string
      features: string[]
      rec: string
      horseStyle: string
      diet: string
      avoid: string
    }
    dampHeat: {
      name: string
      title: string
      icon: string
      desc: string
      features: string[]
      rec: string
      horseStyle: string
      diet: string
      avoid: string
    }
    bloodStasis: {
      name: string
      title: string
      icon: string
      desc: string
      features: string[]
      rec: string
      horseStyle: string
      diet: string
      avoid: string
    }
    qiStag: {
      name: string
      title: string
      icon: string
      desc: string
      features: string[]
      rec: string
      horseStyle: string
      diet: string
      avoid: string
    }
    special: {
      name: string
      title: string
      icon: string
      desc: string
      features: string[]
      rec: string
      horseStyle: string
      diet: string
      avoid: string
    }
  }
  
  // ─── 27题测评 ───
  quiz: Array<{
    cat: string
    question: string
    options: string[]
  }>

  // ─── 雷达图标签 ───
  radarLabels: string[]

  // ─── 通用 ───
  common: {
    cancel: string
    confirm: string
    save: string
    delete: string
    edit: string
    close: string
    loading: string
    noData: string
    unitDay: string
    unitPiece: string
    language: string
  }

  // ─── AI识别系统提示词（不变） ───
  aiSystemPrompt: string
}
