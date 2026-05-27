# 归档文档索引

> 这里列出**已完成**、**过时**或**未实施**的文档

**最后更新**: 2026-05-27  
**维护者**: WeCraft! Launcher Team

---

## 📚 分类导航

### 🟡 配置系统归档 (Configuration Archives)

| 文档 | 状态 | 归档日期 | 说明 |
|------|------|----------|------|
| [配置系统迁移方案](configuration/config-migration-plan.md) | 📝 已完成 | 2026-05-10 | 迁移到统一配置的方案（已完成） |
| [types/config.ts 删除总结](configuration/types-config-removal.md) | 📝 已完成 | 2026-05-10 | 删除旧类型定义文件的总结 |
| [configApi.ts 删除总结](configuration/config-api-removal.md) | 📝 已完成 | 2026-05-10 | 删除旧配置 API 的总结 |

### 🔵 实例管理归档 (Instance Management Archives)

| 文档 | 状态 | 归档日期 | 说明 |
|------|------|----------|------|
| [实例目录重构](instance-management/instance-dir-refactor.md) | 📝 已完成 | 2026-05-07 | 实例目录结构重构（部分已过时） |
| [路径配置修复方案](instance-management/path-config-fix-plan.md) | 📝 已完成 | 2026-05-08 | 路径配置集成方案（已被替代） |

### 🟣 下载与部署归档 (Download & Deploy Archives)

| 文档 | 状态 | 归档日期 | 说明 |
|------|------|----------|------|
| [下载进度修复](download-deploy/download-progress-fix.md) | 📝 已完成 | 2026-05-05 | 下载进度组件与部署修复 |
| [下载问题修复总结](download-deploy/download-fix-summary.md) | 📝 已完成 | 2026-05-05 | 下载失败问题诊断与修复 |
| [部署到实例目录修复](download-deploy/deploy-to-instance-fix.md) | 📝 已完成 | 2026-05-05 | 部署到实例目录问题修复 |
| [部署路径优化](download-deploy/deploy-path-optimization.md) | 📝 已完成 | 2026-05-05 | 部署路径优化修复总结 |

### 🟠 问题修复归档 (Bug Fixes Archives)

| 文档 | 状态 | 归档日期 | 说明 |
|------|------|----------|------|
| [关键问题修复方案](bug-fixes/critical-fixes-required.md) | 📝 已完成 | - | 问题深度分析与完整修复方案 |
| [API 架构说明](bug-fixes/api-architecture.md) | 📝 已完成 | - | API 架构统一说明 |
| [Lucide 图标渲染修复](bug-fixes/lucide-icon-rendering-fix.md) | 📝 已完成 | 2026-05-07 | Lucide 图标渲染问题修复总结 |

### ⚪ 功能特性归档 (Features Archives)

| 文档 | 状态 | 归档日期 | 说明 |
|------|------|----------|------|
| [分层配置存储设计](features/layered-config-storage-design.md) | ❌ 未实施 | - | 分层配置存储系统方案（未实施） |
| [依赖分析移除计划](features/dependency-removal-plan.md) | 🔍 待审查 | - | 未使用库移除计划（需审查） |
| [删除游戏文件夹功能](features/delete-game-folder-feature.md) | ❌ 未实施 | - | 删除游戏文件夹功能方案（未实施） |

### 🔍 待审查文档 (Pending Review)

| 文档 | 归档日期 | 说明 |
|------|----------|------|
| [游戏管理侧边栏改造](pending-review/game-sidebar-redesign.md) | - | 游戏管理侧边栏改造方案（需确认是否实施） |

---

## 📋 文档状态说明

| 状态 | 标识 | 说明 |
|------|------|------|
| **已完成 (已归档)** | 📝 | 功能已完成，文档具有历史参考价值 |
| **未实施** | ❌ | 功能未实现或已放弃 |
| **已废弃** | ⚰️ | 功能已被其他方案替代 |
| **待审查** | 🔍 | 状态不确定，需要人工确认 |

---

## 🔗 相关链接

- [`docs/plans/`](plans/README.md) - 活跃方案文档索引
- [`docs/MAINTENANCE.md`](MAINTENANCE.md) - 文档维护规范
- [`docs/architecture.md`](architecture.md) - 架构设计文档

---

## 📝 使用说明

### 何时查阅归档文档

归档文档**不应**作为实现依据，但在以下情况下可以查阅：

1. **了解历史决策**：了解为什么选择某个方案
2. **寻找替代方案**：当当前方案有问题时，可以参考历史方案
3. **学习参考**：学习问题解决思路和方法

### 引用归档文档的注意事项

在回答或文档中引用归档文档时，应明确说明：

```markdown
⚠️ 注意：此文档已归档，描述的功能可能已过时。

**历史参考**: [`archives/configuration/config-migration-plan.md`](archives/configuration/config-migration-plan.md) - 配置系统迁移方案（已完成）

**当前实现**: [`plans/configuration/unified-config-implementation.md`](plans/configuration/unified-config-implementation.md) - 统一配置系统实现总结
```

---

**维护者**: WeCraft! Launcher Team  
**审查周期**: 每季度一次  
**下次审查日期**: 2026-08-18
