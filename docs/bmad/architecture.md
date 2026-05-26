# 灵砚 LingYan — 技术架构

## 目录结构

```
E:\lingyan\
├── prisma/
│   └── schema.prisma          # 数据库模型定义（11 个模型）
├── src/
│   ├── app/
│   │   ├── (auth)/             # 认证页面（登录/注册）
│   │   ├── (public)/           # 公共页面（探索/详情）
│   │   ├── (workspace)/        # 工作区（主应用）
│   │   │   └── workspace/
│   │   │       ├── page.tsx              # 工作台首页
│   │   │       ├── settings/             # 用户设置
│   │   │       ├── notes/                # 笔记系统（含图谱）
│   │   │       ├── photon/               # 光子内容系统
│   │   │       │   ├── editor/[id]/      # 内容编辑器
│   │   │       │   ├── studio/[id]/      # AI 工作室
│   │   │       │   ├── batch/            # 批量操作
│   │   │       │   ├── calendar/         # 内容日历
│   │   │       │   ├── analytics/        # 数据分析
│   │   │       │   └── templates/        # 模板管理
│   │   │       ├── star/                 # 星辰小说系统
│   │   │       │   ├── [id]/             # 小说详情
│   │   │       │   │   ├── characters/   # 角色管理
│   │   │       │   │   ├── outline/      # 大纲编辑
│   │   │       │   │   ├── graph/        # 关系图谱
│   │   │       │   │   └── settings/     # 小说设置
│   │   │       │   ├── create/           # 创建小说
│   │   │       │   └── analytics/        # 写作统计
│   │   │       ├── wanxiang/             # 万象模拟
│   │   │       └── lab/                  # 实验室
│   │   │           ├── mindmap/[id]/     # 脑图
│   │   │           └── story/            # 故事创作
│   │   ├── api/                # API 路由层
│   │   │   ├── auth/           # 认证 API
│   │   │   ├── novels/         # 小说 CRUD
│   │   │   ├── chapters/       # 章节 CRUD
│   │   │   ├── contents/       # 内容 CRUD
│   │   │   ├── notes/          # 笔记 CRUD + 链接解析
│   │   │   ├── mindmaps/       # 脑图 CRUD
│   │   │   ├── stories/        # 故事 CRUD
│   │   │   ├── photon/         # 光子系统（生成/组装/导出）
│   │   │   ├── wanxiang/       # 万象模拟 API
│   │   │   ├── templates/      # 模板 API
│   │   │   ├── calendar/       # 日历 API
│   │   │   ├── analytics/      # 分析 API
│   │   │   ├── import/         # 导入 API
│   │   │   └── prompts/        # 提示词 API
│   │   └── layout.tsx          # 根布局
│   ├── components/             # 共享组件
│   ├── lib/                    # 工具库
│   └── types/                  # TypeScript 类型定义
├── server/                     # 服务端逻辑（Hono）
└── public/                     # 静态资源
```

## 数据模型关系

```
User (1) ──→ (N) Novel ──→ (N) Chapter
                 │    ──→ (1) WorldSetting
                 │    ──→ (N) Character
                 │    ──→ (N) Outline ──→ (N) Chapter
                 │    ──→ (N) WritingLog
                 │
User (1) ──→ (N) Content
User (1) ──→ (N) MindMap
User (1) ──→ (N) Story
User (1) ──→ (N) Note ──→ (N) NoteLink ──→ (N) Note
User (1) ──→ (N) VideoProject ──→ (N) VideoClip
User (1) ──→ (N) Simulation
```

## 关键设计决策

### 1. AI Key 自带模式
- 用户在设置中配置自己的 API Key
- 支持 DeepSeek / OpenAI / Anthropic
- DashScope 通义万相 Key 单独配置（用于图像/视频生成）
- 平台不存储 AI 调用，直接从客户端调用

### 2. 工作区路由分组
- `(auth)` — 认证相关页面，无布局
- `(public)` — 公共页面，独立布局
- `(workspace)` — 主工作区，共享 WorkspaceLayout

### 3. 内容编辑器双轨制
- `photon/editor` — 富文本编辑器（文章）
- `photon/studio` — AI 工作室（媒体生成、脚本优化）

### 4. 小说系统层级
- Novel → Outline（卷/章节树）→ Chapter
- Novel → WorldSetting（世界观）
- Novel → Character（角色）
- Chapter 包含 factSnapshot（事实快照），用于上下文追踪

### 5. 笔记双向链接
- NoteLink 表实现双向关联
- `resolve-links` API 解析 `[[笔记标题]]` 语法
- 图谱页面可视化知识网络

## API 设计模式

所有 API 使用 Next.js Route Handlers：
- `GET /api/[resource]` — 列表查询
- `POST /api/[resource]` — 创建
- `GET /api/[resource]/[id]` — 单项查询
- `PUT /api/[resource]/[id]` — 更新
- `DELETE /api/[resource]/[id]` — 删除

认证通过 NextAuth session 校验，所有 workspace API 需要登录。

## 依赖关系

### 核心框架
- next@16.2.6 — 框架
- react@19.2.4 — UI 库
- prisma@7.8.0 — ORM
- hono@4.12.22 — API 中间件

### 认证
- next-auth@5.0.0-beta.31 — 认证框架
- @auth/prisma-adapter — Prisma 适配器
- bcryptjs — 密码哈希

### 3D 渲染
- three@0.184.0 — 3D 引擎
- @react-three/fiber — React 绑定
- @react-three/drei — 3D 工具集

### 状态管理
- zustand@5.0.13 — 轻量状态管理

### UI
- lucide-react — 图标库
- Tailwind CSS v4 — 样式框架
