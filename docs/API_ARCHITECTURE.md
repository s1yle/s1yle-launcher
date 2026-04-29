# API 架构统一说明

> **日期**: 2026-04-29  
> **状态**: 已完成 ✅

---

## 📋 架构原则

### 核心原则

1. **统一入口**：所有前端调用后端的 API 都集中在 `rustInvoke.ts` 中
2. **类型安全**：类型定义与 API 函数放在同一文件，便于维护
3. **单一文件**：所有配置相关的 API 和类型都在一个文件中

---

## 🏗️ 架构设计

### 一层架构（完全统一）

```
前端代码
    ↓
┌─────────────────────────────────────┐
│  rustInvoke.ts (统一 API 层)          │
│  - 所有 Rust API 调用函数              │
│  - 所有类型定义                       │
│  - 错误处理和日志                     │
└─────────────────────────────────────┘
```

---

## 📁 文件职责

### `src/helper/rustInvoke.ts` ⭐ **唯一核心文件**

**职责**：
- ✅ 所有 Tauri/Rust 后端 API 调用函数
- ✅ 相关类型定义
- ✅ 统一的错误处理和日志记录

**结构**：
```typescript
// ======================== 模块分类 ========================
// 1. 账户相关
export enum AccountType { ... }
export interface AccountInfo { ... }
export const invokeAddAccount = async (...) => { ... }

// 2. 启动相关
export enum LaunchStatus { ... }
export interface LaunchConfig { ... }
export const launchInstance = async (...) => { ... }

// 3. 下载相关
export interface VersionManifest { ... }
export const getVersionManifest = async (...) => { ... }

// 4. 模组加载器相关
export enum ModLoaderType { ... }
export const getFabricVersions = async (...) => { ... }

// 5. 实例管理相关
export interface GameInstance { ... }
export const scanInstances = async (...) => { ... }

// 6. 配置相关 ⭐
export interface AppConfig { ... }
export const getConfig = async (...) => { ... }

// 7. 其他...
```

**使用方式**：
```typescript
// 直接导入使用
import {
  getConfig,
  updateConfig,
  type AppConfig,
  type InstanceConfig,
} from '@/helper/rustInvoke';

const config: AppConfig = await getConfig();
await updateConfig(config);
```

---

## 🎯 使用指南

### 新代码开发

```typescript
// ✅ 推荐：直接从 rustInvoke.ts 导入函数和类型
import {
  getConfig,
  updateInstanceConfig,
  type AppConfig,
  type InstanceConfig,
  type UserPreferences,
} from '@/helper/rustInvoke';

// 使用
const config: AppConfig = await getConfig();
await updateInstanceConfig('id', config);
```

### Store 和 Hooks

```typescript
// ✅ configStore.ts
import {
  getConfig,
  updateConfig,
  type AppConfig,
  type InstanceConfig,
  type UserPreferences,
} from '@/helper/rustInvoke';

// ✅ useConfig.ts
import { useConfigStore } from '@/stores/configStore';
import type { InstanceConfig, UserPreferences } from '@/helper/rustInvoke';
```

---

## 📊 API 分类

### 已实现的 API 模块

| 模块 | 函数数量 | 类型定义 | 状态 |
|------|----------|----------|------|
| 账户管理 | ~10 | AccountType, AccountInfo, Account | ✅ |
| 游戏启动 | ~5 | LaunchStatus, LaunchConfig | ✅ |
| 下载管理 | ~15 | VersionManifest, DownloadTask | ✅ |
| 模组加载器 | ~10 | ModLoaderType, ModLoaderInfo | ✅ |
| 实例管理 | ~12 | GameInstance, KnownPath | ✅ |
| **配置管理** | **10** | **AppConfig, InstanceConfig** | **✅** |
| 窗口管理 | ~3 | WindowPosition | ✅ |
| 系统工具 | ~3 | - | ✅ |

### 配置管理 API 详情

| 函数 | 说明 | 参数 |
|------|------|------|
| `getConfig()` | 获取全局配置 | - |
| `updateConfig(config)` | 更新全局配置 | `AppConfig` |
| `getConfigValue(key)` | 动态获取配置值 | `key: string` |
| `setConfigValue(key, value)` | 动态设置配置值 | `key: string`, `value: T` |
| `getInstanceConfig(id)` | 获取实例配置 | `instanceId: string` |
| `updateInstanceConfig(id, config)` | 更新实例配置 | `instanceId`, `InstanceConfig` |
| `removeInstanceConfig(id)` | 删除实例配置 | `instanceId: string` |
| `resetConfig()` | 重置配置 | - |
| `exportConfig(path)` | 导出配置 | `targetPath: string` |
| `importConfig(path)` | 导入配置 | `sourcePath: string` |

---

## 🔧 架构演进历程

### Phase 1: 三层架构（初始设计）

```
1. rustInvoke.ts (核心 API 层)
2. configApi.ts (兼容导出层)
3. types/config.ts (类型导出层)
```

### Phase 2: 两层架构（第一次优化）

```
1. rustInvoke.ts (核心 API 层)
2. types/config.ts (类型导出层)
```
- ✅ 删除了 `configApi.ts`

### Phase 3: 一层架构（完全统一） ⭐ 当前

```
1. rustInvoke.ts (统一 API 层)
```
- ✅ 删除了 `types/config.ts`
- ✅ 所有类型和函数集中在一个文件

---

## 📝 最佳实践

### ✅ 推荐做法

```typescript
// 1. 直接从 rustInvoke.ts 导入函数和类型
import {
  getConfig,
  updateConfig,
  type AppConfig,
} from '@/helper/rustInvoke';

// 2. 使用统一的错误处理
try {
  await updateConfig(config);
  success('更新成功');
} catch (e) {
  error('更新失败', e.message);
}

// 3. 类型注解使用导入的类型
const config: AppConfig = await getConfig();
```

### ❌ 避免的做法

```typescript
// 1. 不要直接调用 invoke
import { invoke } from '@tauri-apps/api/core';
await invoke('config::get_config'); // ❌ 应该使用封装的函数

// 2. 不要在多个文件中定义相同的类型
interface AppConfig { ... } // ❌ 应该使用 rustInvoke.ts 中的定义

// 3. 不要分散导入
import { getConfig } from '@/helper/rustInvoke';
import type { AppConfig } from '@/types/config'; // ❌ types/config.ts 已删除
```

---

## 🎓 架构优势

### 1. **统一管理**
- ✅ 所有 Rust API 调用集中在一个文件
- ✅ 类型定义与函数在一起
- ✅ 易于查找和维护
- ✅ 避免重复定义

### 2. **类型安全**
- ✅ 类型定义与函数在一起
- ✅ 减少导入错误
- ✅ IDE 智能提示更准确
- ✅ 跳转更方便

### 3. **简洁清晰**
- ✅ 单一文件，职责明确
- ✅ 减少文件和目录
- ✅ 导入路径更直接
- ✅ 降低认知负担

### 4. **易于扩展**
- ✅ 新增 API 只需在 `rustInvoke.ts` 添加
- ✅ 自动对所有模块可用
- ✅ 减少集成错误
- ✅ 维护成本低

---

## 📚 相关文档

- [配置系统使用示例](./CONFIG_SYSTEM_EXAMPLES.md)
- [配置系统实施总结](./IMPLEMENTATION_SUMMARY.md)
- [配置系统快速参考](./CONFIG_QUICK_REFERENCE.md)
- [configApi.ts 删除总结](./CONFIG_API_REMOVAL_SUMMARY.md)
- [types/config.ts 删除总结](./TYPES_CONFIG_REMOVAL_SUMMARY.md)

---

## 🔄 未来规划

### 自动化测试

- [ ] 添加 API 调用测试
- [ ] 类型定义验证
- [ ] 错误处理测试

### 代码优化

- [ ] 按模块组织 `rustInvoke.ts` 内容
- [ ] 添加更多文档注释
- [ ] 优化类型导出语法

---

**文档状态**: ✅ 完成  
**最后更新**: 2026-04-29  
**架构状态**: 一层架构、清晰、统一、可维护  
**维护者**: S1yle
