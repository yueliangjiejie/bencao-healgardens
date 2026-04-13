#!/bin/bash

# Cloudflare Pages 快速部署脚本
# 使用方法：./deploy.sh

set -e  # 遇到错误立即退出

echo "================================"
echo "🚀 Cloudflare Pages 快速部署脚本"
echo "================================"
echo ""

# 检查是否已初始化 Git
if [ ! -d .git ]; then
  echo "❌ 未检测到 Git 仓库，正在初始化..."
  git init
  echo "✅ Git 仓库初始化完成"
  echo ""
fi

# 检查远程仓库
if ! git remote get-url origin &> /dev/null; then
  echo "⚠️  未设置远程仓库"
  echo ""
  echo "请输入你的 GitHub 仓库地址（格式：https://github.com/你的用户名/bencao-town.git）："
  read -r REPO_URL

  if [ -z "$REPO_URL" ]; then
    echo "❌ 仓库地址不能为空"
    exit 1
  fi

  git remote add origin "$REPO_URL"
  echo "✅ 远程仓库已设置：$REPO_URL"
  echo ""
fi

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
  echo "📦 检测到未提交的更改，正在提交..."
  echo ""

  # 添加所有文件
  git add .

  # 提交
  git commit -m "chore: 准备 Cloudflare Pages 部署

- 优化 next.config.ts（Cloudflare Pages 兼容）
- 添加环境变量示例文件
- 更新部署文档"

  echo "✅ 更改已提交"
  echo ""
else
  echo "✅ 工作区干净，无需提交"
  echo ""
fi

# 检查当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📌 当前分支：$CURRENT_BRANCH"
echo ""

# 询问是否推送
echo "🚀 准备推送到 GitHub..."
echo ""
echo "下一步："
echo "  1. 代码将推送到远程仓库"
echo "  2. Cloudflare Pages 将自动检测并部署"
echo ""
read -p "确认推送吗？(y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # 推送到 GitHub
  echo "📤 正在推送代码..."
  git push -u origin main || git push -u origin master

  echo ""
  echo "✅ 代码推送成功！"
  echo ""
  echo "================================"
  echo "🎉 接下来的步骤："
  echo "================================"
  echo ""
  echo "1. 访问 Cloudflare Dashboard："
  echo "   https://dash.cloudflare.com/"
  echo ""
  echo "2. 选择：Workers & Pages → 创建应用程序 → Pages"
  echo ""
  echo "3. 连接到 Git → 选择你的仓库"
  echo ""
  echo "4. 配置构建设置："
  echo "   框架：Next.js（自动检测）"
  echo "   构建命令：npm run build"
  echo "   构建输出目录：.next"
  echo ""
  echo "5. 设置环境变量（⚠️ 关键步骤）："
  echo "   NEXT_PUBLIC_SUPABASE_URL=你的Supabase URL"
  echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥"
  echo "   SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥"
  echo "   GEMINI_API_KEY=你的 Gemini API Key"
  echo "   NODE_ENV=production"
  echo ""
  echo "6. 点击'保存并部署'"
  echo ""
  echo "📚 详细部署指南请查看：CLOUDFLARE_DEPLOYMENT.md"
  echo "================================"
else
  echo "❌ 已取消推送"
  exit 0
fi
