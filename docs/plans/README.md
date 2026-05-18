# 方案文档索引

> 这里只列出**已实施且有效**的方案文档

**最后更新**: 2026-05-18  
**维护者**: WeCraft! Launcher Team

---

## 📚 分类导航

### 🟢 配置系统 (Configuration)

| 文档 | 实施日期 | 说明 |
|------|----------|------|
| [统一配置系统实现总结](configuration/unified-config-implementation.md) | 2026-05-10 | 实现统一配置入口，创建 src/config/index.ts |
| [统一配置系统使用指南](configuration/unified-config-usage-guide.md) | 2026-05-10 | 配置系统的使用方法和 API 说明 |
| [配置系统示例](configuration/config-system-examples.md) | 2026-04-29 | 实例配置系统的使用示例 |
| [配置系统快速参考](configuration/config-quick-reference.md) | 2026-04-29 | 配置系统的快速参考指南 |
| [配置覆盖问题修复](configuration/config-overwrite-fix.md) | 2026-05-10 | 修复配置覆盖问题的总结 |
| [配置目录结构优化](configuration/config-directory-structure-fix.md) | 2026-05-10 | 配置目录结构优化方案 |

**核心功能**:
- ✅ 统一配置入口：`src/config/index.ts`
- ✅ 类型安全的配置访问
- ✅ 配置就绪机制
- ✅ 事件订阅系统

### 🔵 实例管理 (Instance Management)

| 文档 | 实施日期 | 说明 |
|------|----------|------|
| [实例配置系统设计](instance-management/instance-config-system-design.md) | 2026-05-08 | 实例配置系统的架构设计 |
| [实例配置系统实现](instance-management/instance-config-implementation.md) | 2026-05-08 | 实例配置系统的实施总结 |
| [路径配置集成](instance-management/path-config-integration.md) | 2026-05-08 | 路径配置集成与实例列表修复 |

**核心功能**:
- ✅ 实例配置管理
- ✅ 路径配置集成
- ✅ 实例列表渲染

### 🟡 UI/交互 (UI & Interaction)

| 文档 | 实施日期 | 说明 |
|------|----------|------|
| [弹窗组件使用指南](ui-interaction/popup-component-guide.md) | 2026-05-06 | 弹窗组件的完整使用文档 |
| [游戏设置页面实现](ui-interaction/game-settings-page-implementation.md) | 2026-05-12 | 游戏设置页面的实现方案 |
| [主界面游戏管理按钮改造](ui-interaction/home-game-button-redesign.md) | 待审查 | 主界面按钮改造为 InstanceInfoHeader |

**核心功能**:
- ✅ 弹窗组件系统
- ✅ 游戏设置页面
- ⚠️ 主界面按钮改造（待审查）

### 🟣 下载与部署 (Download & Deploy)

> 当前暂无活跃文档，所有相关文档已归档至 `archives/download-deploy/`

### 🟠 功能特性 (Features)

| 文档 | 实施日期 | 说明 |
|------|----------|------|
| [主题配色系统](features/theme-color-system.md) | 2026-05-04 | 主题配色系统的设计与实现 |
| [跨平台内存检测](features/cross-platform-memory-detection.md) | 2026-05-05 | 跨平台系统内存获取实现 |
| [Lucide 图标最佳实践](features/lucide-icon-best-practices.md) | 2026-05-07 | Lucide 图标使用最佳实践 |
| [Lucide 图标快速参考](features/lucide-icon-quick-reference.md) | 2026-05-07 | Lucide 图标使用快速参考 |
| [HMCL 游戏设置分析](features/hmcl-game-settings-analysis.md) | 2026-05-12 | HMCL 游戏设置页面源码分析 |

**核心功能**:
- ✅ 主题系统（暗色/亮色预设 + 7 种强调色）
- ✅ 跨平台内存检测
- ✅ Lucide 图标集成

---

## 🔗 相关链接

- [`docs/archives/`](archives/README.md) - 归档文档索引
- [`docs/MAINTENANCE.md`](MAINTENANCE.md) - 文档维护规范
- [`docs/architecture.md`](architecture.md) - 架构设计文档

---

## 📝 使用说明

### 如何引用方案文档

在核心架构文档中引用方案文档时，使用以下格式：

```markdown
**已实施的方案**:
- [`plans/configuration/unified-config-implementation.md`](plans/configuration/unified-config-implementation.md) - 统一配置系统实现总结
```

### 文档状态说明

| 状态 | 标识 | 说明 |
|------|------|------|
| **已实施** | ✅ | 功能已实现，文档有效，正在使用 |
| **进行中** | 🚧 | 功能正在开发中 |
| **待审查** | 🔍 | 状态不确定，需要人工确认 |

---

**维护者**: WeCraft! Launcher Team  
**审查周期**: 每季度一次  
**下次审查日期**: 2026-08-18
