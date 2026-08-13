# StepPix · AI 文生图 / 图像编辑

基于 **StepFun Step Plan** 的 AI 图像生成网站，支持文生图与图像编辑，带用户体系、积分与云端历史。

- 文生图 / 图像编辑（模型 `step-image-edit-2`）
- **注册**：用户名 + 密码 + 邮箱验证码
- **登录**：用户名 + 密码
- **积分**：注册送 20 次，每日签到随机 10–20 次，每次生成扣 1 次
- **图片存储**：Vercel Blob，每用户最多保留 100 张，超出自动删除最早的
- **历史画廊**：独立 `/history` 页面，支持单张下载、批量下载、删除
- 安全代理：StepFun API Key 仅服务端环境变量

## 技术栈

- Next.js 14（App Router）+ TypeScript + Tailwind
- Prisma 7 + PostgreSQL（Vercel Neo / Neon Serverless）
- Vercel Blob（图片存储）
- nodemailer（邮箱 SMTP 发验证码）

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
| `DATABASE_URL` | PostgreSQL 连接串，如 `postgresql://user:pass@host/db?sslmode=require` | 是 |
| `AUTH_SECRET` | 会话签名密钥（≥16 字符） | 是 |
| `SMTP_USER` / `SMTP_PASS` | 邮箱 + 授权码 | 用邮箱注册且非 DEV 时 |
| `OTP_DEV_MODE=1` | 验证码只打印到控制台 | 开发推荐 |
| `APP_URL` | 对外 URL | 生产推荐 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写 Token（Vercel 自动注入） | 是（生产） |

## 功能说明

### 注册 / 登录

1. 右上角 **登录** → 跳转 `/login` 页面
2. **注册**：填写用户名、密码、邮箱，获取邮箱验证码，校验后创建账号并送 **20 次**
3. **登录**：输入用户名 + 密码，校验后建立会话

### 积分与签到

- 右上角展示头像、昵称、剩余次数
- 下拉 → **个人资料 / 签到**（`/profile`）
- 每日签到（上海时区自然日）：随机 **10–20** 次
- 生图 / 编辑前检查积分，不足返回 402

### 历史

- 成功生成后写入 `Generation` 表（prompt + 图片 data URL）
- 首页「历史画廊」从 `GET /api/history` 拉取，支持删除

## 邮箱 SMTP

1. QQ 邮箱 → 设置 → 账户 → 开启 SMTP → 生成**授权码**
2. `SMTP_USER=你的邮箱`，`SMTP_PASS=授权码`，`OTP_DEV_MODE` 关掉

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（用户名 + 密码 + 邮箱验证码） |
| POST | `/api/auth/login` | 登录（用户名 + 密码） |
| POST | `/api/auth/logout` | 退出登录 |
| POST | `/api/auth/email/send` | 发送邮箱验证码 |
| GET | `/api/auth/me` | 当前用户 |
| POST | `/api/user/checkin` | 签到 |
| GET/DELETE | `/api/history` | 历史列表 / 删除 |
| POST | `/api/images/generations` | 文生图（扣积分） |
| POST | `/api/images/edits` | 编辑（扣积分） |

## 数据模型（Prisma）

- `User`：用户名、密码哈希、邮箱、积分、上次签到日
- `OtpCode`：邮箱验证码
- `Generation`：用户生图历史（图片 URL 存 Vercel Blob，数据库只存 `imageUrl`）

## 目录结构（节选）

```
app/
  page.tsx                 主页
  login/page.tsx           登录 / 注册页
  history/page.tsx         历史画廊（下载 / 删除）
  profile/page.tsx         个人资料 + 签到
  api/auth/…               注册 / 登录 / 会话
  api/user/checkin/        签到
  api/history/             云端历史
  api/images/…             生图代理
components/
  auth-button.tsx          右上角账户
  gallery.tsx              历史缩略图网格
  image-result.tsx         生图结果展示 + 下载
  ui/                      通用组件（button / tabs / switch 等）
lib/
  db.ts                    Prisma Client（PostgreSQL adapter）
  blob.ts                  Vercel Blob 上传 / 删除
  password.ts              密码哈希（scrypt）
  users.ts / credits.ts / mail.ts
  auth/                    会话管理
prisma/schema.prisma
```

## 部署注意

- 数据库使用 **Vercel Neo（Neon Serverless PostgreSQL）**，在 Vercel 部署时填入连接串即可。
- 图片存储使用 **Vercel Blob**，在 Vercel 项目 Settings → Storage 创建 Blob Store 后自动注入 `BLOB_READ_WRITE_TOKEN`。
- 每用户最多保留 100 张图片，超出后自动删除最早的记录及其 Blob 文件。
