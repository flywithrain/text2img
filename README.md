# StepPix · AI 文生图 / 图像编辑

一个基于 **StepFun Step Plan** 的 AI 图像生成网站，支持「文生图」与「图像编辑」两种能力（同一模型 `step-image-edit-2`），可一键部署到 **Vercel**。

- 文生图：输入提示词，可选参数（cfg_scale / steps / seed / text_mode）生成图片
- 图像编辑：上传参考图 + 编辑提示词，调用同源编辑接口
- 本地历史画廊：生成结果以浏览器 `localStorage` 持久化，支持查看大图 / 下载 / 分享 / 删除
- 安全代理：所有 StepFun 调用经本站服务端 API Route 转发，API Key 仅存于服务端环境变量，**不下发前端**

## 技术栈

- Next.js 14（App Router）+ TypeScript
- Tailwind CSS + 自研玻璃拟态组件（无额外 UI 依赖）
- lucide-react 图标
- Vercel 部署（零配置，绑定 Git 自动部署）

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 STEP_API_KEY
# 在 https://platform.stepfun.com/interface-key 获取

# 3. 启动开发服务器
npm run dev
# 打开 http://localhost:3000
```

## 环境变量

| 变量名         | 说明                                              | 必需 |
| -------------- | ------------------------------------------------- | ---- |
| `STEP_API_KEY` | StepFun API Key，服务端读取，绝不暴露给浏览器     | 是   |

## 部署到 Vercel

1. 将本仓库推送到 GitHub / GitLab。
2. 在 [Vercel](https://vercel.com) 导入该仓库，框架自动识别为 Next.js。
3. 在 **Settings → Environment Variables** 中添加 `STEP_API_KEY`。
4. 点击 Deploy，完成后即可访问分配的域名。

> 由于使用了服务端 API Route（Node.js Runtime），无需额外配置；函数会自动读取环境变量并在 `Cache-Control: no-store` 下转发请求。

## 接口说明（服务端代理）

| 前端调用            | 转发目标                                                  | 说明     |
| ------------------- | --------------------------------------------------------- | -------- |
| `POST /api/images/generations` | `https://api.stepfun.com/step_plan/v1/images/generations` | 文生图   |
| `POST /api/images/edits`       | `https://api.stepfun.com/step_plan/v1/images/edits`       | 图像编辑 |

请求体关键参数（与 StepFun 开放平台一致）：

- `model`: 固定 `step-image-edit-2`
- `prompt`: 提示词（必填）
- `response_format`: 固定 `b64_json`
- `cfg_scale`: 引导系数（0–20）
- `steps`: 推理步数（1–50）
- `seed`: 随机种子（整数）
- `text_mode`: 是否文本模式（布尔）

## 安全说明

- `STEP_API_KEY` 仅在服务端 `lib/stepfun.ts` 中读取，绝不会出现在前端打包产物。
- API Route 对入参做校验与数值裁剪（prompt 必填、数值范围限制），非法请求直接返回 400，不转发上游。
- 所有代理请求设置 `Cache-Control: no-store`，且不打印 API Key；错误返回已脱敏。
- 历史记录仅存于用户本地浏览器 `localStorage`，不经过任何服务器。

## 目录结构

```
app/
  layout.tsx            根布局（顶部固定导航）
  page.tsx              主页：文生图 / 编辑双模式 + 结果 + 画廊
  globals.css           Tailwind 指令 + 玻璃拟态主题
  api/images/
    generations/route.ts  文生图代理
    edits/route.ts        图像编辑代理
components/
  prompt-form.tsx       提示词输入 + 提交
  param-controls.tsx    cfg_scale / steps / seed / text_mode 控件
  image-upload.tsx      编辑模式参考图上传
  image-result.tsx      结果展示 + 下载/分享
  gallery.tsx           localStorage 历史画廊
  ui/                   轻量 UI 原语（button / glass-card / slider / switch / tabs）
lib/
  types.ts              类型定义
  stepfun.ts            服务端 StepFun 客户端（超时 / 错误处理）
  storage.ts            历史记录读写（含配额淘汰）
```
