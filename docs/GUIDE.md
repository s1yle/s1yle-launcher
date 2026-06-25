# WeCraft! Launcher - 文档使用指南

> **最后更新**: 2026-06-25

---

请先使用命令生成文档

```bash
pnpm generate-api
pnpm docs:gen
pnpm docs:gen:api
pnpm docs:gen:rust
pnpm docs:gen:routes
```
---

## 文档体系

```
AGENTS.md              → 快速参考（约定、注意事项、常用命令）
docs/architecture.md   → 架构决策记录（配置系统、UI 架构、设计原则）
docs/api/auto/         → 前端 API 自动生成（pnpm docs:gen:api）
│  ├── api/            #   Rust IPC 调用封装
│  ├── components/     #   通用组件 + Props 接口
│  ├── stores/         #   Zustand 状态管理
│  ├── hooks/          #   自定义 React Hooks
│  ├── pages/          #   页面组件
│  ├── utils/          #   工具函数
│  ├── AppLayouts/     #   布局组件
│  └── config/         #   配置类型定义
docs/rust/             → Rust 后端文档（pnpm docs:gen:rust, cargo doc）
docs/generated/        → 路由表（pnpm docs:gen:routes）
docs/changelog.md      → 变更历史
```

---

## 快速导航

### 场景 1：了解项目

1. **AGENTS.md** — 目录结构、技术栈、路由总览
2. **docs/architecture.md** — 配置系统、UI 架构、设计原则
3. **docs/generated/routes.md** — 完整路由表

### 场景 2：开发新功能

1. **AGENTS.md §3** 查看目录结构
2. **AGENTS.md §5** 查看 Store 列表，确认是否需要新增
3. **docs/api/auto/api/** 查看现有 Rust IPC 封装
4. **AGENTS.md §10** 编码规范

### 场景 3：调用后端 API

1. 查看 `docs/api/auto/api/` 自动生成的 API 文档
2. 或查看 `docs/rust/` Rust 端命令文档
3. 调用链: `组件 → src/api/*.ts → client.ts → Rust`

### 场景 4：查看组件库

1. **AGENTS.md §8** 查看组件分类索引
2. 查看 `docs/api/auto/components/` 各组件的 Props 接口
3. 直接读 `src/components/common/` 源码

### 场景 5：修改路由

1. 修改 `src/router/routes.tsx`
2. 运行 `pnpm docs:gen:routes` 更新路由表
3. 如有需要，更新 AGENTS.md §4 的路由分组描述

---

## AI 全权实现功能

### 提问模板

```
**目标**: 实现 [功能名称]

**需求描述**:
- 功能描述：[详细描述]
- 用户角色：[玩家/服主]
- UI 要求：[参考页面/组件]
- 数据流：[状态管理/API 调用]

**参考文档**:
- AGENTS.md §[章节]
- docs/architecture.md §[章节]

**期望输出**:
1. 完整的代码实现
2. 需要修改的文件列表
3. 文档更新建议
```

### AI 实现后的文档更新

AI 应输出文档更新建议清单，开发者审查代码后：
1. 确认代码质量
2. 测试功能
3. 更新 AGENTS.md（如需）
4. 更新 changelog

---

## 文档自动生成

```bash
pnpm docs:gen         # 更新 API 文档 + 路由表
pnpm docs:gen:api     # 仅 API 文档
pnpm docs:gen:routes  # 仅路由表
```
