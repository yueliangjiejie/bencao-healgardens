/**
 * Auth Callback — 处理 Supabase Auth 重定向
 * Magic Link / OAuth 回调
 */
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Supabase 会通过 cookie 自动处理 code exchange
    // 这里只需重定向到目标页面
    return NextResponse.redirect(`${origin}${next}`)
  }

  // 没有 code，重定向到首页
  return NextResponse.redirect(`${origin}`)
}
