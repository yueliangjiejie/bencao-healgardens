import type { Metadata, Viewport } from 'next'
import './globals.css'
import TabBar from '@/components/TabBar'
import { I18nProvider } from '@/lib/i18n'
import JsonLd from '@/components/JsonLd'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: {
    default: '本草纲目健康小镇 — AI中医食疗养生减脂',
    template: '%s | 本草纲目健康小镇',
  },
  description: '以中医食疗养生减脂为核心的模拟经营养宠游戏。AI食物识别、九种体质测评、药膳食疗方案、养马互动，21天科学减脂。',
  keywords: [
    '中医养生', '食疗减脂', '体质测评', '药膳', '本草纲目',
    'AI食物识别', '九种体质', '健康减脂', '养生游戏', '减脂训练营',
    '中医馆', '健康小镇', '马匹养成', '健康记录',
    'TCM wellness', 'constitution assessment', 'medicinal diet', 'AI food recognition',
  ],
  authors: [{ name: '本草纲目健康小镇' }],
  creator: '本草纲目健康小镇',
  publisher: '本草纲目健康小镇',
  metadataBase: new URL('https://bencao.town'),
  alternates: {
    canonical: '/',
    languages: { 'zh-CN': '/', 'en': '/?lang=en' },
  },
  openGraph: {
    title: '本草纲目健康小镇 — AI中医食疗养生减脂',
    description: 'AI食物识别 + 九种体质测评 + 药膳食疗 + 养马互动，21天科学减脂之旅',
    url: 'https://bencao.town',
    siteName: '本草纲目健康小镇',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '本草纲目健康小镇',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '本草纲目健康小镇 — AI中医食疗养生减脂',
    description: 'AI食物识别 + 九种体质测评 + 药膳食疗 + 养马互动',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F1419',
}

import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ThemeProvider } from '@/components/ThemeProvider'
import ThemeToggle from '@/components/ThemeToggle'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
              } else {
                document.documentElement.style.colorScheme = 'light';
              }
            } catch(e){}
          })();
        ` }} />
      </head>
      <body className="min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <ThemeProvider>
          <JsonLd />
          <AuthProvider>
            <I18nProvider>
              <div className="mx-auto max-w-[430px] min-h-dvh relative">
                <ThemeToggle />
                <main className="pb-20">
                  {children}
                </main>
                <TabBar />
              </div>
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
