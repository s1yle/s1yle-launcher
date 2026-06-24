# WeCraft! Launcher - 玩家/服主身份一键切换

[![Version](https://img.shields.io/badge/version-0.1.0--alpha.2-blue.svg)](https://github.com/s1yle/s1yle-launcher/releases)
[![License](https://img.shields.io/badge/license-GPL3.0-green.svg)](LICENSE)

[**English**](README.en.md) | **中文**

一个 **玩家/服主身份一键切换** 的现代化 Minecraft 启动器，专注于服务中小服主和玩家。服主可免费上传服务器，玩家可免费寻找并畅玩社区服务器。使用 Tauri 2 + React 19 + Rust 构建。

## 🚀 使用方法

### 服主
1. **切换服主身份** - 灵动岛一键切换至服主后台
2. **上传服务器** - 免费上传服务器配置，管理白名单、资源包等
3. **数据看板** - 实时查看服务器运行状态和玩家数据

### 玩家
1. **切换玩家身份** - 回到玩家视角
2. **发现服务器** - 浏览社区服务器列表，一键加入
3. **账号管理** - 添加 Minecraft 账号（微软/离线）
4. **下载** - 选择游戏版本，可选 Fabric/Forge/NeoForge 加载器
5. **实例管理** - 创建实例，配置游戏设置、模组、材质包、世界
6. **启动** - 一键启动游戏

## 🏗️ 项目结构

```
s1yle-launcher/
├── src/                              # 前端 (TypeScript + React)
│   ├── api/                          # 后端 API 调用封装
│   │   ├── account.ts / admin.ts / config.ts / download.ts
│   │   ├── instance.ts / launch.ts / modloader.ts
│   │   ├── skin.ts / font.ts / java.ts / window.ts
│   │   └── client.ts                 # HTTP 客户端
│   ├── components/                   # React 组件
│   │   ├── common/                   # 通用组件
│   │   │   ├── Badge/ / BottomBar/ / ContextStack/ / Loading/
│   │   │   ├── Instance/ / Version/ / SettingsPanel/
│   │   │   ├── header/ / sidebar/ / home/ / navigation/
│   │   │   ├── popup/ / settings/
│   │   │   ├── Portal.tsx            # 智能 Portal
│   │   │   └── SkinAvatar.tsx / StartGameButton.tsx / ...
│   │   ├── Portal/ / Popup.tsx
│   │   └── RouterRenderer.tsx
│   ├── pages/                        # 页面
│   │   ├── Home.tsx / Multiplayer.tsx / VersionInstall.tsx
│   │   ├── AccountList/ / Download/ / Instance/ / Settings/
│   │   ├── Feedback/ / Login/
│   │   └── admin/                    # 服主后台
│   │       ├── AdminServers.tsx / AdminAnalytics.tsx / AdminUpload.tsx
│   ├── stores/                       # Zustand 状态管理 (18 stores)
│   ├── server/                       # 云端 API SDK (自动生成)
│   │   ├── client/ / core/
│   │   ├── client.gen.ts / sdk.gen.ts / types.gen.ts
│   ├── router/                       # 路由系统
│   │   ├── config.tsx / routes.tsx / models.ts
│   │   ├── actionHandler.tsx / sidebarMenus.tsx / contextMenuConfigs.ts
│   ├── helper/                       # 工具
│   │   └── rustInvoke.ts / i18n.ts / logger.ts
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── useFloating.ts / useClickOutside.ts / useWindowPosition.ts
│   │   └── useSkinAvatar.ts / useLoading.ts / useAnimation.ts
│   ├── utils/                        # 工具函数
│   │   ├── zIndex.ts / format.ts / animations.ts
│   │   └── versionFilter.ts / modloaderCompat.ts / iconRenderer.ts
│   ├── config/ / styles/ / locales/ (zh-CN / en-US)
│   └── types/
```

```
├── src-tauri/                        # 后端 (Rust)
│   ├── src/
│   │   ├── main.rs / lib.rs          # 入口
│   │   ├── account.rs / admin_account.rs
│   │   ├── launch.rs / modloader.rs / java.rs
│   │   ├── window.rs / render.rs / font.rs
│   │   ├── background.rs / logging.rs
│   │   ├── config/                   # 配置管理
│   │   │   └── commands.rs / manager.rs / models.rs
│   │   ├── download/                 # 下载引擎
│   │   │   └── commands.rs / deploy.rs / downloader.rs
│   │   │       manager.rs / models.rs / version.rs / utils.rs
│   │   └── instance/                 # 实例管理
│   │       └── commands.rs / manager.rs / settings.rs
│   │           models.rs / utils.rs / validator.rs
│   ├── capabilities/ / icons/
│   └── tauri.conf.json
│
└── package.json
```

## 📦 快速开始

```bash
# 前置要求: Node.js 18+, Rust, pnpm
git clone https://github.com/s1yle/s1yle-launcher.git
cd s1yle-launcher
pnpm install
pnpm tauri dev     # 开发模式
pnpm tauri build   # 构建发布
pnpm lint          # ESLint 检查
pnpm typecheck     # 类型检查
```

## ✨ 特性

- 🏝️ **灵动岛导航系统** - 悬浮式胶囊导航，毛玻璃效果，支持窗口拖曳
- 👤 **双角色身份系统** - 玩家 ↔ 服主 **一键切换**
- 🖥️ **服主后台** - 免费上传服务器，管理配置、数据看板
- 🎮 **社区服务器** - 玩家免费发现、浏览并加入社区服务器
- 📌 **智能 Portal** - 5 种浮动定位模式，支持锚定、拖拽
- 🎨 **主题系统** - 暗色/亮色预设 + 7 种强调色 + 3 种终端主题
- 🔐 **账号管理** - 微软账号、离线账号
- 🎮 **实例管理** - 版本化目录结构，全局资源共享
- 📥 **下载管理** - 游戏版本下载、Fabric/Forge/NeoForge 加载器
- ⚡ **高性能** - Rust 后端，Tokio 异步运行时
- 🌐 **国际化** - 中文、英文支持

## 📄 开源策略

本项目采用 **前端全开源，云端闭源** 策略：

| 层级 | 许可 | 说明 |
|------|------|------|
| **客户端** | **GPL-3.0 开源** | 本仓库所有代码均以 GPL-3.0 开源 |
| **云端服务** | **闭源** | 服务器端代码、API、基础设施不公开 |

服主上传服务器 **完全免费**，玩家寻找和游玩 **完全免费**。

## 🙏 致谢

- [HMCL](https://github.com/huanghongxun/HMCL) / [PCL](https://github.com/Hex-Dragon/PCL2) / [SJMC Launcher](https://github.com/SJMC-HUB/SJMC-Launcher) / [Prism Launcher](https://github.com/PrismLauncher/PrismLauncher)
- [Tauri](https://github.com/tauri-apps/tauri) / [React](https://github.com/facebook/react)

## 💬 关于

我本人也是一名 Minecraft 服主。这个项目的初衷就是为了帮助中小服主及为玩家提供一个好用的启动器。

- **QQ**: 1373003655
- **QQ群 (MC服务器交流)**: 1077212471

## 🤝 招募志同道合之人

### 我们找什么样的人

**🎨 前端** — 熟悉 React、TypeScript、Tailwind CSS、Web 三件套均可

**🦀 后端 (Rust)** — 熟悉 Rust/Tokio，对 Minecraft 启动原理感兴趣

**🎮 Minecraft 玩家/服主** — 不需要写代码，参与测试反馈、提需求、帮助推广

### 为什么加入

- **完全开源** — 客户端 GPL-3.0，代码透明可信
- **有实际价值** — 帮助中小服主低成本运营，帮助玩家找服务器
- **技术有挑战** — 启动器涉及版本管理、下载引擎、进程管理、模组加载等
- **团队氛围** — 没有 KPI，没有 deadlines，纯粹因为热爱 Minecraft

[查看招募详情 →](RECRUIT.md)


## 📄 许可证

客户端代码基于 [GPL-3.0 许可证](LICENSE) 开源。
