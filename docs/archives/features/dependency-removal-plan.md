# 依赖分析报告：未使用库移除计划

> **状态**: 待审查 🔍  
> **最后更新**: 2026-04-29

## 分析日期：2026-04-29

---

## 一、Rust 后端 (src-tauri/Cargo.toml)

### 1.1 依赖使用情况

| 依赖 | 使用情况 | 说明 |
|------|----------|------|
| tauri | ✅ 使用 | 核心框架 |
| tauri-plugin-opener | ✅ 使用 | open_url, open_folder |
| serde / serde_json | ✅ 使用 | 序列化 |
| once_cell | ✅ 使用 | 静态变量 |
| chrono | ✅ 使用 | 时间处理 (account.rs) |
| tracing | ✅ 使用 | 日志系统 |
| tracing-subscriber | ✅ 使用 | 日志系统 |
| tracing-appender | ✅ 使用 | 日志系统 |
| dirs-next | ✅ 使用 | 目录路径 (instance/manager.rs) |
| tauri-plugin-dialog | ✅ 使用 | 对话框 |
| uuid | ✅ 使用 | UUID生成 (instance, account) |
| reqwest | ✅ 使用 | HTTP客户端 (downloader.rs) |
| tokio | ✅ 使用 | 异步运行时 (downloader.rs) |
| md5 | ✅ 使用 | MD5哈希 (downloader.rs) |
| sha1 | ✅ 使用 | SHA1哈希 (download/utils.rs) |
| **hex** | ❌ **未使用** | 无任何引用 |
| zip | ✅ 使用 | ZIP解压 (download/deploy.rs) |

### 1.2 移除建议

```toml
# 可安全移除
hex = "0.4"
```

---

## 二、前端 (package.json)

### 2.1 生产依赖使用情况

| 依赖 | 使用情况 | 说明 |
|------|----------|------|
| @tauri-apps/api | ✅ 使用 | Tauri API 调用 |
| @tauri-apps/plugin-dialog | ✅ 使用 | 文件对话框 (actionHandler.tsx) |
| clsx | ✅ 使用 | 类名合并 (10+ 文件) |
| framer-motion | ✅ 使用 | 动画 (10+ 文件) |
| i18next | ✅ 使用 | 国际化 (18+ 文件) |
| lucide-react | ✅ 使用 | 图标库 (33+ 文件) |
| react | ✅ 使用 | React 核心 |
| react-dom | ✅ 使用 | React DOM |
| react-i18next | ✅ 使用 | React i18n |
| react-router-dom | ✅ 使用 | 路由 (6+ 文件) |
| tailwind-merge | ✅ 使用 | Tailwind 类名合并 (10+ 文件) |
| zustand | ✅ 使用 | 状态管理 (7 个 store) |

### 2.2 开发依赖使用情况

| 依赖 | 使用情况 | 说明 |
|------|----------|------|
| @tailwindcss/postcss | ✅ 使用 | Tailwind CSS |
| @tauri-apps/cli | ✅ 使用 | Tauri CLI |
| @types/node | ⚠️ 间接使用 | vite 间接依赖，可能需要保留 |
| @types/react | ❌ 可移除 | React 19 内置类型 |
| @types/react-dom | ❌ 可移除 | React 19 内置类型 |
| @types/react-router-dom | ❌ 可移除 | react-router-dom v7 已内置类型 |
| @vitejs/plugin-react | ✅ 使用 | Vite React 插件 |
| autoprefixer | ✅ 使用 | PostCSS 插件 |
| postcss | ✅ 使用 | PostCSS 核心 |
| postcss-nested | ✅ 使用 | PostCSS 嵌套 |
| tailwindcss | ✅ 使用 | Tailwind CSS |
| typescript | ✅ 使用 | TypeScript 编译 |
| vite | ✅ 使用 | Vite 构建工具 |

### 2.3 移除建议

```json
{
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@types/react-router-dom": "^5.3.3"
  }
}
```

**注意**：@types/node 建议保留，因为某些开发工具和环境可能需要它。

---

## 三、实施步骤

### 步骤 1：移除 Rust 后端未使用依赖

编辑 `src-tauri/Cargo.toml`，移除：

```toml
[dependencies.hex]
version = "0.4"
```

### 步骤 2：移除前端未使用依赖

编辑 `package.json`，移除：

```json
"@types/react": "^19.1.8",
"@types/react-dom": "^19.1.6",
"@types/react-router-dom": "^5.3.3",
```

### 步骤 3：验证构建

```bash
# Rust
cd src-tauri && cargo check

# 前端
pnpm install
pnpm build
```

---

## 四、总结

| 类别 | 可移除数量 | 风险 |
|------|-----------|------|
| Rust 后端 | 1 个 (hex) | 低 |
| 前端开发依赖 | 3 个 (@types/*) | 低 |
| 总计 | 4 个 | - |

移除这些未使用的依赖可以：
- 减少安装时间
- 减少构建产物大小
- 减少潜在的安全漏洞
