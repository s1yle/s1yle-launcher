# WeCraft! Launcher - One-click Role Switch: Player / Server Owner

[![Version](https://img.shields.io/badge/version-0.1.0--alpha.2-blue.svg)](https://github.com/s1yle/s1yle-launcher/releases)
[![License](https://img.shields.io/badge/license-GPL3.0-green.svg)](LICENSE)

**English** | [**中文**](README.md)

A modern Minecraft launcher with **one-click role switching between player and server owner**, built for small and medium server communities. Server owners can upload their servers for free; players can discover and play on community servers for free. Powered by Tauri 2 + React 19 + Rust.

## 🚀 Usage

### For Server Owners
1. **Switch to Owner Mode** - One-click toggle via the Dynamic Island
2. **Upload Server** - Free server configuration upload, manage whitelist, resource packs, etc.
3. **Dashboard** - Real-time server status and player analytics

### For Players
1. **Switch to Player Mode** - Back to player perspective
2. **Discover Servers** - Browse community server list, join with one click
3. **Account Management** - Add Minecraft accounts (Microsoft / offline)
4. **Download** - Choose game versions with optional Fabric/Forge/NeoForge loaders
5. **Instance Management** - Create instances, configure game settings, mods, resource packs, worlds
6. **Launch** - One-click game launch

## 🏗️ Project Structure

```
s1yle-launcher/
├── src/                              # Frontend (TypeScript + React)
│   ├── api/                          # Backend API wrappers
│   │   ├── account.ts / admin.ts / config.ts / download.ts
│   │   ├── instance.ts / launch.ts / modloader.ts
│   │   ├── skin.ts / font.ts / java.ts / window.ts
│   │   └── client.ts                 # HTTP client
│   ├── components/                   # React components
│   │   ├── common/                   # Shared components
│   │   │   ├── Badge/ / BottomBar/ / ContextStack/ / Loading/
│   │   │   ├── Instance/ / Version/ / SettingsPanel/
│   │   │   ├── header/ / sidebar/ / home/ / navigation/
│   │   │   ├── popup/ / settings/
│   │   │   ├── Portal.tsx            # Smart Portal
│   │   │   └── SkinAvatar.tsx / StartGameButton.tsx / ...
│   │   ├── Portal/ / Popup.tsx
│   │   └── RouterRenderer.tsx
│   ├── pages/                        # Pages
│   │   ├── Home.tsx / Multiplayer.tsx / VersionInstall.tsx
│   │   ├── AccountList/ / Download/ / Instance/ / Settings/
│   │   ├── Feedback/ / Login/
│   │   └── admin/                    # Server owner dashboard
│   │       ├── AdminServers.tsx / AdminAnalytics.tsx / AdminUpload.tsx
│   ├── stores/                       # Zustand state management (18 stores)
│   ├── server/                       # Cloud API SDK (auto-generated)
│   │   ├── client/ / core/
│   │   ├── client.gen.ts / sdk.gen.ts / types.gen.ts
│   ├── router/                       # Routing system
│   │   ├── config.tsx / routes.tsx / models.ts
│   │   ├── actionHandler.tsx / sidebarMenus.tsx / contextMenuConfigs.ts
│   ├── helper/                       # Utilities
│   │   └── rustInvoke.ts / i18n.ts / logger.ts
│   ├── hooks/                        # Custom hooks
│   │   ├── useFloating.ts / useClickOutside.ts / useWindowPosition.ts
│   │   └── useSkinAvatar.ts / useLoading.ts / useAnimation.ts
│   ├── utils/                        # Utility functions
│   │   ├── zIndex.ts / format.ts / animations.ts
│   │   └── versionFilter.ts / modloaderCompat.ts / iconRenderer.ts
│   ├── config/ / styles/ / locales/ (zh-CN / en-US)
│   └── types/
│
├── src-tauri/                        # Backend (Rust)
│   ├── src/
│   │   ├── main.rs / lib.rs          # Entry point
│   │   ├── account.rs / admin_account.rs
│   │   ├── launch.rs / modloader.rs / java.rs
│   │   ├── window.rs / render.rs / font.rs
│   │   ├── background.rs / logging.rs
│   │   ├── config/                   # Configuration
│   │   │   └── commands.rs / manager.rs / models.rs
│   │   ├── download/                 # Download engine
│   │   │   └── commands.rs / deploy.rs / downloader.rs
│   │   │       manager.rs / models.rs / version.rs / utils.rs
│   │   └── instance/                 # Instance management
│   │       └── commands.rs / manager.rs / settings.rs
│   │           models.rs / utils.rs / validator.rs
│   ├── capabilities/ / icons/
│   └── tauri.conf.json
│
└── package.json
```

## 📦 Quick Start

```bash
# Prerequisites: Node.js 18+, Rust, pnpm
git clone https://github.com/s1yle/s1yle-launcher.git
cd s1yle-launcher
pnpm install
pnpm tauri dev     # Development mode
pnpm tauri build   # Production build
pnpm lint          # ESLint
pnpm typecheck     # TypeScript type check
```

## ✨ Features

- 🏝️ **Dynamic Island Navigation** - Floating capsule navigation with glassmorphism and window dragging
- 👤 **Dual Role System** - One-click switch between player and server owner
- 🖥️ **Server Owner Dashboard** - Free server uploads, configuration management, analytics
- 🎮 **Community Servers** - Free server discovery and browsing
- 📌 **Smart Portal** - 5 floating placement modes, anchor and drag support
- 🎨 **Theme System** - Dark/light presets + 7 accent colors + 3 terminal themes
- 🔐 **Account Management** - Microsoft and offline accounts
- 🎮 **Instance Management** - Versioned directory structure, shared global resources
- 📥 **Download Manager** - Game version downloads with Fabric/Forge/NeoForge loaders
- ⚡ **High Performance** - Rust backend with Tokio async runtime
- 🌐 **Internationalization** - Chinese and English support

## 📄 Open Source Strategy

This project follows a **client open-source, cloud closed-source** model:

| Layer | License | Description |
|-------|---------|-------------|
| **Client** | **GPL-3.0 Open Source** | All code in this repository is licensed under GPL-3.0 |
| **Cloud Services** | **Closed Source** | Server-side code, API, and infrastructure are not public |

Server uploads are **completely free** for owners, server discovery and play are **completely free** for players.

## 🙏 Acknowledgments

- [HMCL](https://github.com/huanghongxun/HMCL) / [PCL](https://github.com/Hex-Dragon/PCL2) / [SJMC Launcher](https://github.com/SJMC-HUB/SJMC-Launcher) / [Prism Launcher](https://github.com/PrismLauncher/PrismLauncher)
- [Tauri](https://github.com/tauri-apps/tauri) / [React](https://github.com/facebook/react)

## 💬 About

I am a Minecraft server owner myself. This project was built to help small and medium server owners and provide players with a great launcher.

- **QQ**: 1373003655
- **QQ Group (MC Server)**: 1077212471

## 🤝 Join Us

### Who We're Looking For

**🎨 Frontend** — React, TypeScript, Tailwind CSS, or basic web dev (HTML/CSS/JS)

**🦀 Backend (Rust)** — Rust/Tokio, interested in Minecraft launch mechanics

**🎮 Minecraft Players / Server Owners** — No coding needed, testing, feedback, ideas, promotion

### Why Join

- **Fully open-source** — Client under GPL-3.0, transparent and trustworthy
- **Real impact** — Help small and medium server owners, help players find servers
- **Technical challenges** — Version management, download engine, process management, mod loading
- **Team vibe** — No KPI, no deadlines, pure passion for Minecraft

[View recruitment details →](RECRUIT.md)

## 📄 License

The client code is open-sourced under the [GPL-3.0 License](LICENSE).
