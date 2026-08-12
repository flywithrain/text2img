# StepPix · AI 文生图 / 图像编辑

基于 **StepFun Step Plan** 的 AI 图像生成网站，支持文生图与图像编辑，带用户体系、积分与云端历史。

- 文生图 / 图像编辑（模型 `step-image-edit-2`）
- **双登录**：Linux.do OAuth + **QQ 邮箱验证码**
- **积分**：注册送 20 次，每日签到随机 10–20 次，每次生成扣 1 次
- **云端历史**：提示词 + 图片存数据库，登录后可查看 / 删除
- 安全代理：StepFun API Key 仅服务端环境变量

## 技术栈

- Next.js 14（App Router）+ TypeScript + Tailwind
- Prisma 7 + SQLite（本地；生产可换 Postgres）
- nodemailer（QQ 邮箱 SMTP 发验证码）

## 本地运行

```bash
npm install
cp .env.example .env.local
# 编辑 .env.local：STEP_API_KEY、AUTH_SECRET、DATABASE_URL 等
# 开发验证码可开 OTP_DEV_MODE=1（验证码打到终端，无需 SMTP）

npx prisma migrate dev   # 初始化 / 迁移数据库
npm run dev              # http://localhost:3000
```

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `STEP_API_KEY` | StepFun API Key | 是 |
| `DATABASE_URL` | 如 `file:./dev.db` | 是 |
| `AUTH_SECRET` | 会话签名密钥（≥16 字符） | 是 |
| `LINUXDO_CLIENT_ID` / `LINUXDO_CLIENT_SECRET` | Linux.do Connect | 用 Linux.do 时 |
| `SMTP_USER` / `SMTP_PASS` | QQ 邮箱 + 授权码 | 用邮箱登录且非 DEV 时 |
| `OTP_DEV_MODE=1` | 验证码只打印到控制台 | 开发推荐 |
| `APP_URL` | 对外 URL（拼 OAuth 回调） | 生产推荐 |

## 功能说明

### 登录

1. 右上角 **登录** → 弹窗  
2. **Linux.do**：跳转 Connect 授权，回调后建用户 / 会话  
3. **QQ 邮箱**：填 `@qq.com` → 获取验证码 → 校验登录；新用户自动注册并送 **20 次**

### 积分与签到

- 右上角展示头像、昵称、剩余次数  
- 下拉 → **个人资料 / 签到**（`/profile`）  
- 每日签到（上海时区自然日）：随机 **10–20** 次  
- 生图 / 编辑前检查积分，不足返回 402

### 历史

- 成功生成后写入 `Generation` 表（prompt + 图片 data URL）  
- 首页「历史画廊」从 `GET /api/history` 拉取，支持删除  

## Linux.do 接入

1. [connect.linux.do](https://connect.linux.do/) 申请应用  
2. 回调：`http://localhost:3000/api/auth/callback`（生产换正式域名）  
3. 填入 `LINUXDO_CLIENT_ID` / `LINUXDO_CLIENT_SECRET`

## QQ 邮箱 SMTP

1. QQ 邮箱 → 设置 → 账户 → 开启 SMTP → 生成**授权码**  
2. `SMTP_USER=你的@qq.com`，`SMTP_PASS=授权码`，`OTP_DEV_MODE` 关掉  

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/login` | Linux.do 授权跳转 |
| GET | `/api/auth/callback` | OAuth 回调 |
| POST | `/api/auth/email/send` | 发验证码 |
| POST | `/api/auth/email/verify` | 校验并登录 |
| GET | `/api/auth/me` | 当前用户 |
| POST | `/api/user/checkin` | 签到 |
| GET/DELETE | `/api/history` | 历史列表 / 删除 |
| POST | `/api/images/generations` | 文生图（扣积分） |
| POST | `/api/images/edits` | 编辑（扣积分） |

## 数据模型（Prisma）

- `User`：登录方式、积分、上次签到日  
- `OtpCode`：邮箱验证码  
- `Generation`：用户生图历史  

## 目录结构（节选）

```
app/
  page.tsx                 主页
  profile/page.tsx         个人资料 + 签到
  api/auth/…               登录 / 会话
  api/user/checkin/        签到
  api/history/             云端历史
  api/images/…             生图代理
components/
  auth-button.tsx          右上角账户
  login-modal.tsx          登录弹窗
lib/
  db.ts                    Prisma Client
  users.ts / credits.ts / mail.ts
  auth/                    OAuth + 会话
prisma/schema.prisma
```

## 部署注意

- **SQLite + better-sqlite3** 适合单机 / 自建 VPS；Vercel Serverless 无持久磁盘，生产请改 **Postgres** 并调整 Prisma adapter。  
- 图片以 base64 存库，量大时建议改对象存储（OSS/S3）。  
