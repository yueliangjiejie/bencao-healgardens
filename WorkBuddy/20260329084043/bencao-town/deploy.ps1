# Cloudflare Pages 快速部署脚本 (Windows PowerShell)
# 使用方法：.\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 Cloudflare Pages 快速部署脚本" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否已初始化 Git
if (-not (Test-Path .git)) {
  Write-Host "❌ 未检测到 Git 仓库，正在初始化..." -ForegroundColor Red
  git init
  Write-Host "✅ Git 仓库初始化完成" -ForegroundColor Green
  Write-Host ""
}

# 检查远程仓库
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
  Write-Host "⚠️  未设置远程仓库" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "请输入你的 GitHub 仓库地址（格式：https://github.com/你的用户名/bencao-town.git）："
  $repoUrl = Read-Host

  if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ 仓库地址不能为空" -ForegroundColor Red
    exit 1
  }

  git remote add origin $repoUrl
  Write-Host "✅ 远程仓库已设置：$repoUrl" -ForegroundColor Green
  Write-Host ""
}

# 检查是否有未提交的更改
$status = git status --porcelain
if ($status) {
  Write-Host "📦 检测到未提交的更改，正在提交..." -ForegroundColor Yellow
  Write-Host ""

  # 添加所有文件
  git add .

  # 提交
  git commit -m "chore: 准备 Cloudflare Pages 部署

- 优化 next.config.ts（Cloudflare Pages 兼容）
- 添加环境变量示例文件
- 更新部署文档"

  Write-Host "✅ 更改已提交" -ForegroundColor Green
  Write-Host ""
} else {
  Write-Host "✅ 工作区干净，无需提交" -ForegroundColor Green
  Write-Host ""
}

# 检查当前分支
$currentBranch = git branch --show-current
Write-Host "📌 当前分支：$currentBranch" -ForegroundColor Cyan
Write-Host ""

# 询问是否推送
Write-Host "🚀 准备推送到 GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "下一步："
Write-Host "  1. 代码将推送到远程仓库"
Write-Host "  2. Cloudflare Pages 将自动检测并部署"
Write-Host ""
$confirm = Read-Host "确认推送吗？(y/n)"

if ($confirm -eq "y" -or $confirm -eq "Y") {
  # 推送到 GitHub
  Write-Host "📤 正在推送代码..." -ForegroundColor Yellow
  try {
    git push -u origin main 2>$null
  } catch {
    # 如果 main 分支不存在，尝试 master
    git push -u origin master
  }

  Write-Host ""
  Write-Host "✅ 代码推送成功！" -ForegroundColor Green
  Write-Host ""
  Write-Host "================================" -ForegroundColor Cyan
  Write-Host "🎉 接下来的步骤：" -ForegroundColor Yellow
  Write-Host "================================" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "1. 访问 Cloudflare Dashboard："
  Write-Host "   https://dash.cloudflare.com/" -ForegroundColor Blue
  Write-Host ""
  Write-Host "2. 选择：Workers & Pages → 创建应用程序 → Pages" -ForegroundColor White
  Write-Host ""
  Write-Host "3. 连接到 Git → 选择你的仓库" -ForegroundColor White
  Write-Host ""
  Write-Host "4. 配置构建设置：" -ForegroundColor White
  Write-Host "   框架：Next.js（自动检测）"
  Write-Host "   构建命令：npm run build"
  Write-Host "   构建输出目录：.next"
  Write-Host ""
  Write-Host "5. 设置环境变量（⚠️ 关键步骤）：" -ForegroundColor Yellow
  Write-Host "   NEXT_PUBLIC_SUPABASE_URL=你的Supabase URL"
  Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥"
  Write-Host "   SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥"
  Write-Host "   GEMINI_API_KEY=你的 Gemini API Key"
  Write-Host "   NODE_ENV=production"
  Write-Host ""
  Write-Host "6. 点击'保存并部署'" -ForegroundColor White
  Write-Host ""
  Write-Host "📚 详细部署指南请查看：CLOUDFLARE_DEPLOYMENT.md" -ForegroundColor Cyan
  Write-Host "================================" -ForegroundColor Cyan
} else {
  Write-Host "❌ 已取消推送" -ForegroundColor Red
  exit 0
}
