# Cloudflare Pages 原生 GitHub 集成部署指南

## 📋 前置要求

### 1. 账号准备

- ✅ **GitHub 账号**：项目代码需要推送到 GitHub 仓库
- ✅ **Cloudflare 账号**：用于 Pages 部署和域名绑定
- ✅ **GitHub Personal Access Token（PAT）**：Cloudflare 访问你的私有仓库
- ✅ **Supabase 凭证**：生产环境的数据库连接信息

### 2. Token 获取指南

#### GitHub Personal Access Token（必需）

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 配置权限：
   - `repo` - 完整仓库访问权限（如果仓库是私有的）
   - `workflow` - 运行 GitHub Actions（可选）
4. 点击 "Generate token"
5. **重要**：立即复制 token，刷新页面后会消失

⚠️ **不需要提供给我**：你将在 Cloudflare 控制台输入此 token

---

## 🚀 部署步骤

### 步骤 1：推送代码到 GitHub

```bash
cd c:\Users\Lenovo\WorkBuddy\20260329084043\bencao-town

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "chore: 初始化 Cloudflare Pages 部署准备"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/bencao-town.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步骤 2：在 Cloudflare 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单选择 **"Workers & Pages"** → **"创建应用程序"**
3. 选择 **"Pages"** 标签
4. 点击 **"连接到 Git"**
5. 授权 Cloudflare 访问你的 GitHub（首次需要登录 GitHub）
6. 输入刚才创建的 **GitHub PAT**（如果仓库是私有的）
7. 选择你的 `bencao-town` 仓库

### 步骤 3：配置构建设置

在 "构建配置" 页面：

**框架预设**：
- 选择 **"Next.js"**（Cloudflare 会自动检测并填充以下设置）

**构建配置**（如果自动检测失败，手动填入）：
```
构建命令：npm run build
构建输出目录：.next
```

**环境变量**（**关键！**）：
```
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥（仅服务端使用）
NODE_ENV=production
```

获取 Supabase 凭证：
1. 访问 https://supabase.com/dashboard
2. 选择你的项目 → **Settings** → **API**
3. 复制以下内容：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 步骤 4：部署

点击 **"保存并部署"**。

首次部署通常需要 3-5 分钟，之后每次推送代码到 `main` 分支会自动重新部署。

### 步骤 5：自定义域名（可选但推荐）

1. 部署成功后，在 Pages 项目概览页找到 **"自定义域"**
2. 点击 **"设置"** → **"自定义域"**
3. 选择：
   - 使用 Cloudflare 提供的免费域名：`your-project.pages.dev`
   - 或绑定自己的域名（需在 Cloudflare 添加 DNS 记录）

---

## 🔑 安全注意事项

### Token 安全

- ✅ **不要**将 GitHub PAT 或 Supabase 密钥提交到代码仓库
- ✅ **不要**在公开渠道分享这些凭据
- ✅ 定期轮换（更新）GitHub PAT

### Supabase 密钥说明

| 密钥 | 用途 | 暴露风险 |
|------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | 客户端连接 Supabase | ✅ 公开，可安全暴露 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 客户端匿名访问 | ✅ 公开，有 RLS 保护 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端绕过 RLS | ❌ **绝不能暴露到客户端** |

---

## 📊 部署验证清单

- [ ] 代码已推送到 GitHub
- [ ] Cloudflare Pages 项目创建成功
- [ ] 环境变量正确配置（4个变量）
- [ ] 首次部署成功（状态 ✅）
- [ ] 自定义域名设置（可选）
- [ ] HTTPS 证书已签发（Cloudflare 自动处理）

---

## 🐛 常见问题

### 1. 部署失败：`Error: Build command failed`

**原因**：Next.js 版本不兼容或依赖缺失

**解决**：
```bash
# 本地测试构建
cd bencao-town
npm install
npm run build
```

确保本地构建成功后再推送代码。

### 2. Supabase 连接失败

**原因**：环境变量未正确设置或密钥过期

**解决**：
1. 检查 Cloudflare Pages 设置 → 环境变量
2. 确认 `NEXT_PUBLIC_` 前缀正确（客户端访问必须）
3. 重新生成 Supabase 密钥并更新环境变量

### 3. 静态资源 404

**原因**：Next.js 图片优化在 Cloudflare 兼容性问题

**解决**：已在 `next.config.ts` 配置 `images.unoptimized: true`

### 4. 环境变量在客户端 undefined

**原因**：Supabase 密钥未以 `NEXT_PUBLIC_` 开头

**解决**：确保客户端访问的变量以 `NEXT_PUBLIC_` 开头：
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ❌ `SUPABASE_SERVICE_ROLE_KEY`（仅服务端）

---

## 📝 后续维护

### 自动部署

每次推送代码到 `main` 分支，Cloudflare Pages 会自动：
1. 拉取最新代码
2. 运行 `npm install`
3. 运行 `npm run build`
4. 部署到生产环境

### 预览部署（可选）

为每个 Pull Request 自动创建预览 URL：
1. Pages 项目设置 → **"构建和部署"**
2. 开启 **"预览部署"**
3. 每次创建 PR 时会生成 `*.pages.dev` 预览链接

### 监控和日志

- **部署日志**：Cloudflare Dashboard → Pages → 你的项目 → **"部署"** → 点击部署版本
- **实时日志**：Pages 项目 → **"函数"** → **"日志"**

---

## 🎯 快速开始（推荐流程）

```bash
# 1. 推送代码
git add .
git commit -m "chore: Cloudflare Pages 部署准备"
git push

# 2. 在 Cloudflare 创建 Pages 项目
# 访问：https://dash.cloudflare.com/
# 选择：Workers & Pages → 连接到 Git → 选择仓库 → Next.js

# 3. 设置环境变量
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
# NODE_ENV=production

# 4. 点击"保存并部署"
```

---

## 📞 需要帮助？

- Cloudflare Pages 文档：https://developers.cloudflare.com/pages/
- Next.js 部署指南：https://developers.cloudflare.com/pages/framework-guides/nextjs/
- Supabase 集成文档：https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

## ✅ 部署成功后检查清单

- [ ] 访问 `https://your-project.pages.dev` 能看到首页
- [ ] 登录/注册功能正常（Supabase 连接成功）
- [ ] AI 食物识别功能正常（需要配置 Gemini API）
- [ ] 游戏功能正常（生理极限、接食物、记忆翻牌）
- [ ] 深色/浅色主题切换正常
- [ ] 场景切换正常（医院场景背景加载）
- [ ] 移动端响应式正常
- [ ] SEO 检查（OpenGraph、Twitter Card 正确）

祝你部署顺利！🚀
