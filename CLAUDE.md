# 灵砚 LingYan — 项目指南

## 项目概述
灵砚是一个 AI 驱动的创作工作台，面向网文作者和内容创作者。
技术栈：Next.js 16 + React 19 + Prisma 7 + Tailwind CSS v4 + PostgreSQL

## 目录结构
- `src/app/(workspace)/workspace/` — 主工作区页面
- `src/app/(workspace)/workspace/star/` — 星辰小说系统
- `src/app/(workspace)/workspace/photon/` — 光子内容系统
- `src/app/(workspace)/workspace/notes/` — 笔记系统
- `src/app/(workspace)/workspace/wanxiang/` — 万象模拟
- `src/app/(workspace)/workspace/lab/` — 实验室
- `src/app/api/` — API 路由层
- `prisma/schema.prisma` — 数据库模型（11 个模型）
- `server/` — 服务端逻辑（Hono）

## 开发命令
- `npm run dev` — 启动开发服务器
- `npm run build` — 构建（含 prisma generate + db push）
- `npm run lint` — ESLint 检查

## 代码规范
- TypeScript 严格模式
- 组件使用 PascalCase，文件名使用 kebab-case
- API 路由使用 Next.js Route Handlers
- 数据库操作通过 Prisma Client
- 认证通过 NextAuth session 校验

## 关键约定
- AI Key 由用户自带，不存储在平台
- 所有 workspace API 需要登录
- 笔记双向链接使用 `[[标题]]` 语法
- 小说章节包含 factSnapshot 用于上下文追踪
- 内容支持多平台适配（公众号、抖音等）

## 文档
- `docs/bmad/product-brief.md` — 产品简报
- `docs/bmad/architecture.md` — 技术架构
