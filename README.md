# OKX 交易监控面板 / OKX Trading Web Monitor

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/jjbb013/okx-multi-trading-web-demo)

> **Language / 语言**: [中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文

### 🚀 最快部署：点击上方按钮（推荐）

点击顶部的 **「Deploy to Cloudflare Workers」** 按钮，登录你的 Cloudflare 账号，即可一键部署。部署完成后，在 Cloudflare Dashboard → Workers → 你的 Worker → Settings → Variables 中设置以下 Secrets：

| Secret 名称 | 说明 |
|-------------|------|
| `OKX_API_KEY` | OKX API Key（建议只读权限） |
| `OKX_API_SECRET` | OKX API Secret |
| `OKX_API_PASSPHRASE` | OKX API Passphrase |

然后访问 Worker URL 即可查看监控面板。

### 项目概述

本项目是一个基于 **Cloudflare Workers** 的轻量级监控面板，完全独立于交易机器人运行。通过调用 OKX 官方 API 实时获取账户数据，并以响应式网页形式展示总权益、当前持仓、最近成交和盈亏记录。无需服务器维护，全球边缘节点加速，支持从任何设备访问。

### 核心特性

- **完全独立**：与交易机器人分离部署，互不影响
- **零服务器维护**：Cloudflare 全球边缘节点托管，自动扩缩容
- **实时数据**：每次刷新页面即从 OKX API 获取最新数据
- **响应式设计**：桌面端与移动端完美适配
- **API 接口**：同时提供 `/api/data` JSON 端点，供第三方集成
- **一键部署**：GitHub Actions 自动部署，推送即上线

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户 / User                           │
│                     (浏览器 / Browser)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           Cloudflare Workers (全球边缘节点 / Edge)            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  src/index.js                                       │  │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────────┐     │  │
│  │  │  OKXClient │  │  签名模块 │  │  HTML 渲染   │     │  │
│  │  │ (API 封装) │  │ (HMAC256)│  │ (Dashboard)  │     │  │
│  │  └──────┬─────┘  └────┬─────┘  └──────┬───────┘     │  │
│  │         └─────────────┴───────────────┘             │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                               │
│                            ▼                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Secrets: OKX_API_KEY / OKX_SECRET / OKX_PASSPHRASE   │ │
│  │  Vars: OKX_DEMO                                       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    OKX 交易所 API / OKX API                 │
│                (模拟盘 / Demo 或 实盘 / Live)               │
└─────────────────────────────────────────────────────────────┘
```

> **注意**：本 Worker 仅与 OKX API 通信，与 Northflank 上的交易机器人无任何耦合。即使机器人停止运行，监控面板仍可正常查看账户状态。

### 手动部署（Wrangler CLI）

```bash
# 1. 克隆仓库并进入目录
cd okx-multi-trading-web-demo

# 2. 安装依赖
npm install

# 3. 登录 Cloudflare（浏览器授权）
npx wrangler login

# 4. 设置密钥（OKX API 凭证）
npx wrangler secret put OKX_API_KEY
npx wrangler secret put OKX_API_SECRET
npx wrangler secret put OKX_API_PASSPHRASE

# 5. 部署
npx wrangler deploy

# 6. 获取访问地址
# 部署成功后终端会显示类似：
# https://okx-trading-dashboard.your-account.workers.dev
```

### GitHub Actions 一键部署

配置完成后，每次推送 `main` 分支都会自动触发部署。

**步骤 1：Fork 仓库**
- 将本仓库 Fork 到你的 GitHub 账户

**步骤 2：获取 Cloudflare 凭证**
- 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
- 前往 "My Profile" → "API Tokens" → "Create Token"
- 使用模板 **"Edit Cloudflare Workers"** 创建 Token
- 记录你的 `Account ID`（在右侧边栏 Overview 页面）

**步骤 3：设置 GitHub 仓库 Secrets**
- 进入你的 GitHub 仓库 → "Settings" → "Secrets and variables" → "Actions"
- 点击 "New repository secret" 依次添加：

| Secret 名称 | 说明 | 获取位置 |
|-------------|------|----------|
| `CF_API_TOKEN` | Cloudflare API Token | Cloudflare Dashboard → API Tokens |
| `CF_ACCOUNT_ID` | Cloudflare Account ID | Cloudflare Dashboard → 右侧 Overview |

- 截图说明：你会看到 "Secrets" 标签页，点击绿色 "New repository secret" 按钮，Name 填 `CF_API_TOKEN`，Secret 粘贴刚才复制的 Token，然后点击 "Add secret"。重复此步骤添加 `CF_ACCOUNT_ID`。

**步骤 4：触发首次部署**
- 修改任意文件（例如 `README.md`）并推送，或进入 Actions 页面手动触发 `Deploy to Cloudflare Workers` workflow
- 等待约 30 秒，部署完成后在 Actions 日志中可看到 Workers 访问地址

### 环境变量 / Secrets 说明

| 名称 | 类型 | 说明 |
|------|------|------|
| `OKX_API_KEY` | Secret | OKX API Key（只读权限即可） |
| `OKX_API_SECRET` | Secret | OKX API Secret |
| `OKX_API_PASSPHRASE` | Secret | OKX API Passphrase |
| `OKX_DEMO` | Variable | `true` = 模拟盘, `false` = 实盘 |
| `CF_API_TOKEN` | GitHub Secret | Cloudflare API Token（仅 CI 需要） |
| `CF_ACCOUNT_ID` | GitHub Secret | Cloudflare Account ID（仅 CI 需要） |

### 安全建议

⚠️ **强烈建议为监控面板使用只读 API Key！** ⚠️

1. 在 OKX 创建 API Key 时，仅勾选 **"读取"** 权限（账户余额、持仓、成交记录）
2. **不要**勾选交易、提现等写入权限
3. 绑定 IP 白名单（可选但推荐）：将你的 Cloudflare Worker IP 范围或本地 IP 加入白名单
4. 定期轮换 API Key（建议每 90 天）
5. 如果面板仅用于展示，无需任何交易权限

### 模拟盘与实盘切换

**方式一：修改 wrangler.toml（推荐）**
```toml
[vars]
OKX_DEMO = "true"   # 模拟盘
# OKX_DEMO = "false"  # 实盘
```
修改后执行 `npx wrangler deploy` 或推送到 GitHub 触发自动部署。

**方式二：Cloudflare Dashboard 修改**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages → 你的 Worker → Settings → Variables
3. 找到 `OKX_DEMO`，修改值为 `true` 或 `false`
4. 点击 "Save and deploy"

> 注意：切换为实盘时，请确保 Worker 中配置的 `OKX_API_KEY` 具有实盘读取权限。

### 文件结构

```
okx-multi-trading-web-demo/
├── src/
│   └── index.js              # Worker 主入口：API 请求 + 前端渲染
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 自动部署工作流
├── wrangler.toml             # Cloudflare Worker 配置
├── package.json              # 项目依赖（仅 wrangler）
└── README.md                 # 本文件
```

---

<a name="english"></a>
## English

### 🚀 Quickest Deploy: Click the Button Above (Recommended)

Click the **「Deploy to Cloudflare Workers」** button at the top, sign in to your Cloudflare account, and deploy in one click. After deployment, go to Cloudflare Dashboard → Workers → Your Worker → Settings → Variables and set the following Secrets:

| Secret Name | Description |
|-------------|-------------|
| `OKX_API_KEY` | OKX API Key (read-only recommended) |
| `OKX_API_SECRET` | OKX API Secret |
| `OKX_API_PASSPHRASE` | OKX API Passphrase |

Then visit the Worker URL to view the dashboard.

### Project Overview

This is a lightweight monitoring dashboard built on **Cloudflare Workers**, completely independent from the trading bot. It fetches real-time account data from the OKX official API and displays it as a responsive web page — showing total equity, current positions, recent fills, and P&L records. No server maintenance required, served by Cloudflare's global edge network, accessible from any device.

### Key Features

- **Fully independent**: Deployed separately from the trading bot with zero coupling
- **Zero server maintenance**: Hosted on Cloudflare's global edge network with auto-scaling
- **Real-time data**: Fetches latest data from OKX API on every page refresh
- **Responsive design**: Perfectly adapted for both desktop and mobile
- **API endpoint**: Provides `/api/data` JSON endpoint for third-party integrations
- **One-click deploy**: GitHub Actions auto-deploy — push to deploy

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User                                 │
│                     (Browser)                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           Cloudflare Workers (Global Edge)                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  src/index.js                                       │  │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │  OKXClient │  │  Signer  │  │ HTML Renderer│   │  │
│  │  │ (API Wrap) │  │ (HMAC256)│  │ (Dashboard)  │   │  │
│  │  └──────┬─────┘  └────┬─────┘  └──────┬───────┘   │  │
│  │         └─────────────┴───────────────┘           │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                               │
│                            ▼                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Secrets: OKX_API_KEY / OKX_SECRET / OKX_PASSPHRASE   │ │
│  │  Vars: OKX_DEMO                                       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    OKX Exchange API                           │
│                (Demo / Paper or Live)                         │
└─────────────────────────────────────────────────────────────┘
```

> **Note**: This Worker only communicates with the OKX API. It has zero coupling with the trading bot running on Northflank. Even if the bot stops, the dashboard continues to show account status normally.

### Manual Deployment (Wrangler CLI)

```bash
# 1. Clone and enter the directory
cd okx-multi-trading-web-demo

# 2. Install dependencies
npm install

# 3. Login to Cloudflare (browser authorization)
npx wrangler login

# 4. Set secrets (OKX API credentials)
npx wrangler secret put OKX_API_KEY
npx wrangler secret put OKX_API_SECRET
npx wrangler secret put OKX_API_PASSPHRASE

# 5. Deploy
npx wrangler deploy

# 6. Get the access URL
# After deployment, the terminal will show something like:
# https://okx-trading-dashboard.your-account.workers.dev
```

### GitHub Actions One-Click Deployment

Once configured, every push to the `main` branch will automatically trigger deployment.

**Step 1: Fork the Repository**
- Fork this repository to your GitHub account

**Step 2: Get Cloudflare Credentials**
- Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
- Go to "My Profile" → "API Tokens" → "Create Token"
- Use the **"Edit Cloudflare Workers"** template to create a Token
- Note your `Account ID` (found in the right sidebar on the Overview page)

**Step 3: Set GitHub Repository Secrets**
- Go to your GitHub repository → "Settings" → "Secrets and variables" → "Actions"
- Click "New repository secret" and add the following:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `CF_API_TOKEN` | Cloudflare API Token | Cloudflare Dashboard → API Tokens |
| `CF_ACCOUNT_ID` | Cloudflare Account ID | Cloudflare Dashboard → right sidebar Overview |

- Screenshot description: You'll see a "Secrets" tab. Click the green "New repository secret" button. For Name, enter `CF_API_TOKEN`. For Secret, paste the Token you just copied. Click "Add secret". Repeat to add `CF_ACCOUNT_ID`.

**Step 4: Trigger Initial Deployment**
- Modify any file (e.g., `README.md`) and push, or go to the Actions page and manually trigger the `Deploy to Cloudflare Workers` workflow
- Wait about 30 seconds. After deployment, the Workers URL will appear in the Actions logs

### Environment Variables / Secrets

| Name | Type | Description |
|------|------|-------------|
| `OKX_API_KEY` | Secret | OKX API Key (read-only permission is sufficient) |
| `OKX_API_SECRET` | Secret | OKX API Secret |
| `OKX_API_PASSPHRASE` | Secret | OKX API Passphrase |
| `OKX_DEMO` | Variable | `true` = demo, `false` = live |
| `CF_API_TOKEN` | GitHub Secret | Cloudflare API Token (CI only) |
| `CF_ACCOUNT_ID` | GitHub Secret | Cloudflare Account ID (CI only) |

### Security Recommendations

⚠️ **Strongly recommend using a read-only API Key for the dashboard!** ⚠️

1. When creating an OKX API Key, only check **"Read"** permissions (account balance, positions, fills)
2. **Do NOT** check trading, withdrawal, or any write permissions
3. Bind IP whitelist (optional but recommended): add your Cloudflare Worker IP range or local IP to the whitelist
4. Rotate API Keys regularly (recommended every 90 days)
5. If the dashboard is for display only, no trading permissions are needed

### Switching Between Demo and Live Mode

**Method 1: Edit wrangler.toml (Recommended)**
```toml
[vars]
OKX_DEMO = "true"   # Demo mode
# OKX_DEMO = "false"  # Live mode
```
After editing, run `npx wrangler deploy` or push to GitHub to trigger auto-deployment.

**Method 2: Cloudflare Dashboard**
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to Workers & Pages → your Worker → Settings → Variables
3. Find `OKX_DEMO`, change its value to `true` or `false`
4. Click "Save and deploy"

> Note: When switching to live mode, ensure the Worker is configured with an OKX API Key that has live read permissions.

### File Structure

```
okx-multi-trading-web-demo/
├── src/
│   └── index.js              # Worker main entry: API calls + frontend rendering
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions auto-deployment workflow
├── wrangler.toml             # Cloudflare Worker configuration
├── package.json              # Project dependencies (wrangler only)
└── README.md                 # This file
```

---

## License

MIT License — 使用本软件产生的任何风险由使用者自行承担。
MIT License — Any risks arising from the use of this software are solely the responsibility of the user.
