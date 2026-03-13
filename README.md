# S1yle Launcher 🎮

[![Version](https://img.shields.io/badge/version-0.1.3-blue.svg)](https://github.com/s1yle/s1yle-launcher/releases)
[![License](https://img.shields.io/badge/license-GPL3.0-green.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/built%20with-Tauri-24c8d8.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/frontend-React-61dafb.svg)](https://react.dev/)

一个现代化的 Minecraft 启动器，使用 Tauri、React 和 Rust 构建。提供流畅的用户体验和强大的功能。

![S1yle Launcher Screenshot](image.png)

## ✨ 特性

- 🚀 **跨平台支持** - 使用 Tauri 构建，支持 Windows、macOS 和 Linux
- 🎨 **现代化 UI** - 基于 React + Tailwind CSS 的美观界面，支持动画过渡
- 🔐 **账号管理** - 添加、删除、切换 Minecraft 账号
- 🎮 **实例管理** - 创建和管理不同的游戏实例
- 📥 **下载管理** - 下载游戏版本、资源包和模组
- ⚡ **高性能** - Rust 后端确保高效的资源管理
- 🔄 **实时更新** - 自动检查更新和版本管理
- 🎯 **模块化设计** - 易于扩展和维护的组件架构

## 🛠️ 技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| **Tauri** | 应用框架 | ^2 |
| **React** | 前端框架 | ^19.1.0 |
| **TypeScript** | 类型安全 | ~5.8.3 |
| **Rust** | 后端逻辑 | 最新稳定版 |
| **Tailwind CSS** | 样式系统 | ^4.1.18 |
| **Framer Motion** | 动画库 | ^12.34.3 |
| **React Router** | 路由管理 | ^7.3.0 |

## 📦 快速开始

### 前置要求

- **Node.js** 18+ 或更高版本
- **Rust** 最新稳定版 (通过 [rustup](https://rustup.rs/) 安装)
- **pnpm** (推荐) 或 npm/yarn

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/s1yle/s1yle-launcher.git
   cd s1yle-launcher
   ```

2. **安装依赖**
   ```bash
   # 使用 pnpm (推荐)
   pnpm install
   
   # 或使用 npm
   npm install
   
   # 安装 Tauri CLI
   pnpm add -D @tauri-apps/cli
   ```

3. **开发模式运行**
   ```bash
   # 启动开发服务器
   pnpm tauri dev
   ```

4. **构建应用**
   ```bash
   # 构建可执行文件
   pnpm tauri build
   ```

构建完成后，可在 `src-tauri/target/release` 目录找到应用程序。

## 🚀 使用方法

### 首次启动
1. 启动应用后，进入"账号管理"页面添加 Minecraft 账号
2. 在"下载"页面选择并下载游戏版本
3. 在"实例管理"页面创建游戏实例
4. 启动游戏！

### 主要功能
- **首页** - 应用概览和快捷操作
- **账号管理** - 管理多个 Minecraft 账号
- ~~**实例列表** - 查看所有游戏实例~~
- ~~**实例管理** - 创建和配置游戏实例~~
- ~~**下载** - 下载游戏资源和版本~~
- ~~**多人游戏** - 服务器列表和快速连接~~
- ~~**设置** - 应用程序配~~
- ~~**反馈** - 提交问题和建议~~
- ~~**帮助** - 使用指南和提示~~

## 🏗️ 项目结构

```
s1yle-launcher/
├── src/                    # 前端源代码
│   ├── components/        # 可复用组件
│   │   ├── popup/        # 弹窗组件
│   │   ├── Header.tsx    # 顶部导航栏
│   │   ├── Sidebar.tsx   # 侧边栏
│   │   └── Popup.tsx     # 弹窗管理
│   ├── pages/            # 页面组件
│   │   ├── Home.tsx      # 首页
│   │   ├── AccountList.tsx # 账号管理
│   │   ├── InstanceList.tsx # 实例列表
│   │   └── ...
│   ├── helper/           # 工具函数
│   ├── router/           # 路由配置
│   └── App.tsx           # 主应用组件
├── src-tauri/            # Rust 后端代码
│   ├── src/
│   │   ├── account.rs    # 账号管理逻辑
│   │   ├── config.rs     # 配置管理
│   │   ├── launch.rs     # 游戏启动逻辑
│   │   └── lib.rs        # 主模块
│   └── tauri.conf.json   # Tauri 配置
├── public/               # 静态资源
└── package.json          # 项目配置
```

### 常用命令

```bash
# 开发模式 (热重载)
pnpm tauri dev

# 构建发布版本
pnpm tauri build

# 仅构建前端
pnpm build

# 类型检查
pnpm tsc --noEmit

# 清理构建缓存
cd src-tauri && cargo clean
```

### 创建新组件

项目使用模块化组件架构，参考 `src/components/` 中的现有组件。~~详细的组件创建指南请查看 [GUIDE.md](GUIDE.md)~~。

## 🤝 贡献指南

我们欢迎所有形式的贡献！以下是参与项目的方式：

### 报告问题
- 在 [GitHub Issues](https://github.com/s1yle/s1yle-launcher/issues) 提交问题
- 提供详细的重现步骤和环境信息

### 功能建议
- 在 Issues 中创建"功能请求"标签
- 描述功能的使用场景和预期效果

### 提交代码
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范
- 遵循现有的代码风格和项目结构
- 添加适当的 TypeScript 类型定义
- 为复杂的逻辑添加注释
- 确保代码通过 TypeScript 类型检查

所有贡献者将在项目贡献者列表中展示！

## 📊 项目进度

### 已完成功能
- ✅ 现代化的 UI 界面和动画效果
- ✅ 账号管理系统（添加、删除、切换）
- ✅ 页面路由和导航系统
- ✅ 弹窗组件系统（提示、确认、加载）
- ✅ 响应式布局和主题支持

### 近期更新
- **v0.1.3** - 完善账号模块，改进前后端交互
- **v0.1.2** - UI 优化和动画改进
- **v0.1.1** - 更新 UI 设计和动画系统
- **v0.1.0** - 初始版本，基础 UI 框架

### 开发计划

#### UI 改进
- [ ] 多级侧边栏导航系统
- [ ] 侧边栏背景和按钮优化
- [ ] 实例管理页面内容展示

#### 核心功能
- [ ] 游戏版本列表获取
- [ ] 版本下载和管理
- [ ] Java 环境检测和配置
- [ ] 游戏启动功能
- [ ] 模组和资源包管理

查看最新进展和计划，请关注项目更新。

## 📞 联系方式

遇到问题或有建议？欢迎联系我们：

- **QQ**: 1373003655 
- **QQ群 (MC群)**: 1077212471
- **GitHub**: [s1yle/s1yle-launcher](https://github.com/s1yle/s1yle-launcher)
- **项目博客**: [S1yle's Blog](https://s1yle.github.io/2026/02/18/MCLauncher/)

## 📄 许可证

本项目基于 [GPL-3.0 许可证](LICENSE) 开源。详细信息请查看 LICENSE 文件。

## 🙏 致谢

感谢所有为项目做出贡献的开发者！

- [Tauri](https://tauri.app/) - 提供强大的跨平台应用框架
- [React](https://react.dev/) - 优秀的 UI 开发体验
- [Tailwind CSS](https://tailwindcss.com/) - 高效的样式解决方案
- 所有参与测试和反馈的用户

---

> **提示**: <br>本项目优先开发核心功能 <br>
>           项目仍在积极开发中，欢迎提交 Issue 和 Pull Request！让我们一起打造更好的 Minecraft 启动器！

