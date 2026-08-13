# PixSpring · AI 文生图 / 图像编辑

AI 图像生成网站，支持文生图与图像编辑，带用户体系、积分与云端历史。

- 文生图 / 图像编辑
- **注册**：用户名 + 密码 + 邮箱验证码
- **登录**：用户名 + 密码
- **积分**：注册送 100 次，每日签到随机 10–20 次，每次生成扣 1 次
- **图片存储**：Vercel Blob，每用户最多保留 100 张，超出自动删除最早的
- **历史画廊**：独立 `/history` 页面，支持单张下载、批量下载、删除
- 安全代理：API Key 仅存于服务端环境变量，不下发浏览器

## 技术栈

- Next.js 14（App Router）+ TypeScript + Tailwind
- Prisma 7 + PostgreSQL（Vercel Neo / Neon Serverless）
- Vercel Blob（图片存储）
- Resend（邮箱 SMTP 发验证码）

## 本地运行

```bash
npm install
cp .env.example .env.local
# 编辑 .env.local：IMAGE_API_KEY、AUTH_SECRET、DATABASE_URL 等
# 开发验证码可开 OTP_DEV_MODE=1（验证码打到终端，无需 SMTP）

npx prisma migrate dev   # 初始化 / 迁移数据库
npm run dev              # http://localhost:3000
```

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `IMAGE_API_KEY` | AI 生图 API Key | 是 |
| `DATABASE_URL` | PostgreSQL 连接串，如 `postgresql://user:pass@host/db?sslmode=require` | 是 |
| `AUTH_SECRET` | 会话签名密钥（≥16 字符） | 是 |
| `SMTP_USER` / `SMTP_PASS` | 邮箱 + 授权码 | 用邮箱注册且非 DEV 时 |
| `OTP_DEV_MODE=1` | 验证码只打印到控制台 | 开发推荐 |
| `APP_URL` | 对外 URL | 生产推荐 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写 Token（Vercel 自动注入） | 是（生产） |

## 功能说明

### 注册 / 登录

1. 右上角 **登录** → 跳转 `/login` 页面
2. **注册**：填写用户名、密码、邮箱，获取邮箱验证码，校验后创建账号并送 **100 次**
3. **登录**：输入用户名 + 密码，校验后建立会话

### 积分与签到

- 右上角展示头像、昵称
- 下拉 → **个人资料 / 签到**（`/profile`）
- 每日签到（上海时区自然日）：随机 **10–20** 次
- 生图 / 编辑前检查积分，不足返回 402

### 历史

- 成功生成后写入 `Generation` 表（prompt + 图片 URL）
- 独立 `/history` 页面从 `GET /api/history` 拉取，支持单张 / 批量下载、删除

## 邮箱 SMTP（Resend）

1. Vercel 项目 Settings → Integrations → 连接 Resend
2. 免费发件地址 `onboarding@resend.dev`，绑定域名后可自定义
3. `OTP_DEV_MODE` 关掉后发送真实邮件

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

- `User`：用户名、密码哈希、邮箱、积分、上次签到日、管理员标记
- `OtpCode`：邮箱验证码
- `Generation`：用户生图历史（图片 URL 存 Vercel Blob，数据库只存 `imageUrl`）

## 目录结构（节选）

```
app/
  page.tsx                 主页
  login/page.tsx           登录 / 注册页
  history/page.tsx         历史画廊（下载 / 删除）
  profile/page.tsx         个人资料 + 签到
  admin/page.tsx           用户管理（仅管理员）
  api/auth/…               注册 / 登录 / 会话
  api/user/checkin/        签到
  api/history/             云端历史
  api/images/…             生图代理
  api/blob/                Blob 图片代理
components/
  auth-button.tsx          右上角账户
  gallery.tsx              历史缩略图网格
  image-result.tsx         生图结果展示 + 下载
  ui/                      通用组件（button / tabs / switch 等）
lib/
  db.ts                    Prisma Client（PostgreSQL adapter）
  blob.ts                  Vercel Blob 上传 / 删除
  image-api.ts             生图 API 封装
  password.ts              密码哈希（scrypt）
  users.ts / credits.ts / mail.ts
  auth/                    会话管理
prisma/schema.prisma
```

## 部署注意

- 数据库使用 **Vercel Neo（Neon Serverless PostgreSQL）**，在 Vercel 部署时填入连接串即可。
- 图片存储使用 **Vercel Blob**，在 Vercel 项目 Settings → Storage 创建 Blob Store 后自动注入 `BLOB_READ_WRITE_TOKEN`。
- 每用户最多保留 100 张图片，超出后自动删除最早的记录及其 Blob 文件。
- 生产环境需手动配置 `IMAGE_API_KEY` 和 `AUTH_SECRET` 环境变量。
- 生产环境不要设置 `OTP_DEV_MODE`，以确保真实邮件发送。
