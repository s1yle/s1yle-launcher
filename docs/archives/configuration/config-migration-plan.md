# 配置系统迁移方案

> **状态**: 已完成 📝  
> **最后更新**: 2026-05-10

> **版本**: 2.0  
> **日期**: 2026-05-10  
> **策略**: 彻底迁移，无需兼容旧版本

---

## 📋 目录

1. [迁移目标](#1-迁移目标)
2. [迁移原则](#2-迁移原则)
3. [迁移范围](#3-迁移范围)
4. [迁移阶段](#4-迁移阶段)
5. [详细迁移步骤](#5-详细迁移步骤)
6. [迁移时间表](#6-迁移时间表)
7. [验收标准](#7-验收标准)
8. [回滚方案](#8-回滚方案)

---

## 1. 迁移目标

### 1.1 核心目标

- ✅ **统一配置入口**：所有配置访问通过 `src/config/index.ts` 的 `config` 单例
- ✅ **类型安全**：使用 `ConfigKey` 和 `ConfigValue<T>` 确保类型安全
- ✅ **配置就绪机制**：确保配置加载完成后再访问
- ✅ **简化架构**：移除冗余的配置管理层
- ✅ **向后不兼容**：彻底清理旧 API，不做兼容层

### 1.2 迁移后的架构

```
应用启动
  ↓
config.initialize() - 统一配置初始化
  ↓
config.whenReady() - 等待配置就绪
  ↓
其他 store 初始化
  ↓
组件使用 Hooks 访问配置
```

---

## 2. 迁移原则

### 2.1 必须遵守的原则

1. **单一入口原则**：所有配置访问必须通过 `config` 单例或官方 Hooks
2. **类型安全原则**：禁止使用 `any` 类型，必须使用 `ConfigKey` 和 `ConfigValue<T>`
3. **配置就绪原则**：访问配置前必须确保配置已加载完成
4. **彻底清理原则**：删除所有旧的配置访问方式，不做兼容层
5. **测试先行原则**：每个组件迁移后必须通过测试

### 2.2 禁止的做法

```typescript
// ❌ 禁止：直接访问 useConfigStore
const config = useConfigStore((s) => s.config);

// ❌ 禁止：使用 configManager
configManager.getPreference('theme');

// ❌ 禁止：直接访问 config?.preferences
const theme = config?.preferences.theme;

// ❌ 禁止：绕过配置系统
localStorage.getItem('preferences.theme');
```

### 2.3 推荐的做法

```typescript
// ✅ 推荐：使用 config 单例
import { config } from '@/config';
const theme = config.getConfigValue('preferences.theme');

// ✅ 推荐：使用官方 Hooks
const { preferences, setTheme } = usePreferences();
const { instanceConfig, updateJava } = useInstanceConfig(instanceId);

// ✅ 推荐：等待配置就绪
await config.whenReady();
const value = config.getConfigValue('key');
```

---

## 3. 迁移范围

### 3.1 需要迁移的文件清单

#### **阶段 1：核心模块（必须迁移）**

| 文件 | 当前状态 | 迁移目标 | 优先级 |
|------|----------|----------|--------|
| `src/stores/themeStore.ts` | 使用 `configManager` | 使用 `config` 单例 | 🔴 高 |
| `src/stores/configStore.ts` | Zustand store | 保留但简化 | 🔴 高 |
| `src/stores/configManager.ts` | 配置管理器 | **删除** | 🔴 高 |
| `src/hooks/useConfig.ts` | Hooks 封装 | 基于 `config` 重构 | 🔴 高 |

#### **阶段 2：业务组件（重要）**

| 文件 | 当前状态 | 迁移目标 | 优先级 |
|------|----------|----------|--------|
| `src/components/InstanceConfigPanel.tsx` | 使用 `useInstanceConfig` | 保持不变（已正确） | 🟡 中 |
| `src/pages/Settings.tsx` | 使用 `useThemeStore` | 使用 `usePreferences` | 🟡 中 |
| `src/stores/downloadStore.ts` | 独立 store | 基于 `config` 重构 | 🟡 中 |
| `src/stores/instanceStore.ts` | 独立 store | 基于 `config` 重构 | 🟡 中 |

#### **阶段 3：其他组件（次要）**

| 文件 | 当前状态 | 迁移目标 | 优先级 |
|------|----------|----------|--------|
| `src/pages/Download/DownloadGame.tsx` | 使用 `useDownloadStore` | 保持不变 | 🟢 低 |
| `src/components/DownloadProgressPanel.tsx` | 使用 `useDownload` | 保持不变 | 🟢 低 |
| `src/pages/VersionInstall.tsx` | 混合使用 | 统一使用 `config` | 🟢 低 |

#### **阶段 4：工具模块（清理）**

| 文件 | 当前状态 | 迁移目标 | 优先级 |
|------|----------|----------|--------|
| `src/utils/configUtils.ts` | 工具函数 | 保留并优化 | 🟢 低 |
| `src/helper/rustInvoke.ts` | Rust API | 保持不变 | 🟢 低 |

---

## 4. 迁移阶段

### 阶段总览

```
阶段 1 (Day 1-2): 核心模块迁移
  ↓
阶段 2 (Day 3-4): 业务组件迁移
  ↓
阶段 3 (Day 5):   其他组件迁移
  ↓
阶段 4 (Day 6):   工具模块清理
  ↓
阶段 5 (Day 7):   测试与验收
```

---

## 5. 详细迁移步骤

### 阶段 1：核心模块迁移（Day 1-2）

#### 5.1.1 删除 configManager.ts

**操作**：
```bash
# 删除文件
rm src/stores/configManager.ts
```

**影响分析**：
- `themeStore.ts` 使用 `configManager.setPreference()`
- `themeStore.ts` 使用 `configManager.getPreference()`

**迁移方案**：
```typescript
// ❌ 旧代码（src/stores/themeStore.ts）
import { configManager } from './configManager';

configManager.setPreference('theme', mode);
const theme = configManager.getPreference<ThemeMode>('theme');

// ✅ 新代码
import { config } from '@/config';

await config.setConfigValue('preferences.theme', mode);
const theme = config.getConfigValue('preferences.theme');
```

#### 5.1.2 重构 useConfig Hooks

**当前代码**：
```typescript
// src/hooks/useConfig.ts
import { useConfigStore } from '@/stores/configStore';

export const usePreferences = () => {
  const preferences = useConfigStore((s) => s.config?.preferences);
  const setPreference = useConfigStore((s) => s.setPreference);
  // ...
};
```

**迁移后代码**：
```typescript
// src/hooks/useConfig.ts
import { config } from '@/config';
import { useState, useEffect, useCallback } from 'react';

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 等待配置就绪
    config.whenReady().then(() => {
      setPreferences(config.getConfig()?.preferences);
      setLoading(false);
    });

    // 订阅配置变更
    const unsubscribe = config.on('change', (key, value) => {
      if (key.startsWith('preferences.')) {
        setPreferences(config.getConfig()?.preferences);
      }
    });

    return unsubscribe;
  }, []);

  const setTheme = useCallback(async (theme: ThemeMode) => {
    await config.setConfigValue('preferences.theme', theme);
  }, []);

  const setLanguage = useCallback(async (language: Language) => {
    await config.setConfigValue('preferences.language', language);
  }, []);

  const toggleAnimation = useCallback(async () => {
    const current = preferences?.enable_animation ?? true;
    await config.setConfigValue('preferences.enable_animation', !current);
  }, [preferences]);

  return {
    preferences,
    loading,
    setTheme,
    setLanguage,
    toggleAnimation,
  };
};
```

#### 5.1.3 简化 configStore.ts

**目标**：移除复杂的配置管理逻辑，只保留状态存储

**迁移前**：
```typescript
// src/stores/configStore.ts
export const useConfigStore = create<ConfigState>()(
  subscribeWithSelector((set, get) => ({
    config: null,
    loading: false,
    error: null,
    initialized: false,

    init: async () => { /* ... */ },
    refresh: async () => { /* ... */ },
    updateGlobalConfig: async (partial) => { /* ... */ },
    setPreference: async (key, value) => { /* ... */ },
    getInstanceConfig: (instanceId) => { /* ... */ },
    updateInstanceConfig: async (instanceId, partial) => { /* ... */ },
    // ... 大量业务逻辑
  }))
);
```

**迁移后**：
```typescript
// src/stores/configStore.ts
import { create } from 'zustand';
import type { AppConfig } from '@/helper/rustInvoke';

interface ConfigState {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // 只保留状态更新方法，不包含业务逻辑
  setConfig: (config: AppConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  loading: false,
  error: null,
  initialized: false,

  setConfig: (config) => set({ config }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setInitialized: (initialized) => set({ initialized }),
}));
```

#### 5.1.4 重构 themeStore.ts

**迁移前**：
```typescript
// src/stores/themeStore.ts
import { configManager } from './configManager';

export const useThemeStore = create<ThemeState>()(
  persist((set, get) => ({
    mode: 'dark',
    accentColor: 'indigo',
    
    setMode: async (mode) => {
      set({ mode });
      configManager.setPreference('theme', mode);
    },
    
    setAccentColor: async (accentColor) => {
      set({ accentColor });
      configManager.setPreference('accent_color', accentColor);
    },
    
    init: async () => {
      const configTheme = configManager.getPreference<ThemeMode>('theme');
      const configAccent = configManager.getPreference<AccentColor>('accent_color');
      // ...
    },
  }))
);
```

**迁移后**：
```typescript
// src/stores/themeStore.ts
import { create } from 'zustand';
import { config } from '@/config';

export const useThemeStore = create<ThemeState>()((set, get) => ({
  mode: 'dark',
  accentColor: 'indigo',
  
  setMode: async (mode) => {
    set({ mode });
    await config.setConfigValue('preferences.theme', mode);
  },
  
  setAccentColor: async (accentColor) => {
    set({ accentColor });
    await config.setConfigValue('preferences.accent_color', accentColor);
  },
  
  init: async () => {
    await config.whenReady();
    const configTheme = config.getConfigValue('preferences.theme');
    const configAccent = config.getConfigValue('preferences.accent_color');
    
    if (configTheme) set({ mode: configTheme });
    if (configAccent) set({ accentColor: configAccent });
  },
}));
```

---

### 阶段 2：业务组件迁移（Day 3-4）

#### 5.2.1 迁移 Settings.tsx

**迁移前**：
```typescript
// src/pages/Settings.tsx
import { useThemeStore } from '../stores/themeStore';

const Settings = () => {
  const { mode, accentColor, setAccentColor, applyPreset } = useThemeStore();
  
  return (
    <div>
      <ThemePreview selected={mode === preset.mode} onSelect={() => applyPreset(preset)} />
    </div>
  );
};
```

**迁移后**：
```typescript
// src/pages/Settings.tsx
import { usePreferences } from '@/hooks/useConfig';

const Settings = () => {
  const { preferences, setTheme, setLanguage } = usePreferences();
  
  return (
    <div>
      <select value={preferences?.theme} onChange={(e) => setTheme(e.target.value as ThemeMode)}>
        <option value="dark">暗夜</option>
        <option value="light">晨曦</option>
      </select>
    </div>
  );
};
```

#### 5.2.2 重构 downloadStore.ts

**迁移前**：
```typescript
// src/stores/downloadStore.ts
import { create } from 'zustand';

interface DownloadState {
  basePath: string;
  // ...
  init: async () => {
    const pathConfig = await getPathConfig();
    set({ basePath: pathConfig.download_base_path });
  },
}
```

**迁移后**：
```typescript
// src/stores/downloadStore.ts
import { create } from 'zustand';
import { config } from '@/config';

interface DownloadState {
  // 移除 basePath，从配置读取
  // ...
  init: async () => {
    await config.whenReady();
    const downloadPath = config.getConfigValue('download.download_path');
    // 使用 downloadPath
  },
  setBasePath: async (path: string) => {
    await config.setConfigValue('download.download_path', path);
  },
}
```

#### 5.2.3 重构 instanceStore.ts

**迁移前**：
```typescript
// src/stores/instanceStore.ts
import { create } from 'zustand';

interface InstanceState {
  pathConfig: PathConfig | null;
  // ...
  init: async () => {
    const pathConfig = await getPathConfig();
    set({ pathConfig });
  },
}
```

**迁移后**：
```typescript
// src/stores/instanceStore.ts
import { create } from 'zustand';
import { config } from '@/config';

interface InstanceState {
  // 移除 pathConfig，从配置读取
  // ...
  init: async () => {
    await config.whenReady();
    const knownFolders = config.getConfigValue('known_folders');
    const instanceConfigs = config.getConfigValue('instance_configs');
    // 使用配置数据
  },
}
```

---

### 阶段 3：其他组件迁移（Day 5）

#### 5.3.1 迁移 VersionInstall.tsx

**迁移前**：
```typescript
// src/pages/VersionInstall.tsx
import { useConfigStore } from '@/stores/configStore';

const VersionInstall = () => {
  const config = useConfigStore((s) => s.config);
  const downloadPath = config?.download.download_path;
  // ...
};
```

**迁移后**：
```typescript
// src/pages/VersionInstall.tsx
import { config } from '@/config';

const VersionInstall = () => {
  const downloadPath = config.getConfigValue('download.download_path');
  // ...
};
```

---

### 阶段 4：工具模块清理（Day 6）

#### 5.4.1 优化 configUtils.ts

**保留的函数**：
```typescript
// src/utils/configUtils.ts
export { getNestedValue, setNestedValue, hasNestedKey };
```

**删除的函数**：
- 所有与 `configManager` 相关的函数
- 所有与旧配置系统相关的工具函数

#### 5.4.2 清理 rustInvoke.ts

**保留的 API**：
```typescript
// src/helper/rustInvoke.ts
export {
  getConfig,
  updateConfig,
  setConfigValue,
  getInstanceConfig,
  updateInstanceConfig,
  removeInstanceConfig,
  // ... 其他 Rust API
};
```

**删除的 API**：
- 所有已废弃的配置相关 API

---

### 阶段 5：测试与验收（Day 7）

#### 5.5.1 单元测试

**测试用例**：
```typescript
// __tests__/config.test.ts
describe('UnifiedConfigManager', () => {
  test('should initialize successfully', async () => {
    await config.initialize();
    expect(config.isReady()).toBe(true);
  });

  test('should get config value', async () => {
    const theme = config.getConfigValue('preferences.theme');
    expect(theme).toBeDefined();
  });

  test('should set config value', async () => {
    await config.setConfigValue('preferences.theme', 'dark');
    const theme = config.getConfigValue('preferences.theme');
    expect(theme).toBe('dark');
  });
});

describe('usePreferences Hook', () => {
  test('should return preferences', async () => {
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => {
      expect(result.current.preferences).toBeDefined();
    });
  });

  test('should set theme', async () => {
    const { result } = renderHook(() => usePreferences());
    await act(async () => {
      await result.current.setTheme('dark');
    });
    expect(result.current.preferences?.theme).toBe('dark');
  });
});
```

#### 5.5.2 集成测试

**测试场景**：
1. 应用启动时配置加载
2. 配置变更通知
3. 实例配置管理
4. 下载配置管理

#### 5.5.3 手动测试清单

- [ ] 主题切换功能
- [ ] 语言切换功能
- [ ] 实例配置保存
- [ ] 下载路径设置
- [ ] 配置导入导出
- [ ] 配置重置功能

---

## 6. 迁移时间表

### 详细时间安排

| 阶段 | 时间 | 任务 | 交付物 |
|------|------|------|--------|
| **阶段 1** | Day 1-2 | 核心模块迁移 | - configManager 删除<br>- useConfig 重构<br>- configStore 简化<br>- themeStore 重构 |
| **阶段 2** | Day 3-4 | 业务组件迁移 | - Settings 迁移<br>- downloadStore 重构<br>- instanceStore 重构 |
| **阶段 3** | Day 5 | 其他组件迁移 | - VersionInstall 迁移<br>- 其他组件清理 |
| **阶段 4** | Day 6 | 工具模块清理 | - configUtils 优化<br>- rustInvoke 清理 |
| **阶段 5** | Day 7 | 测试与验收 | - 单元测试<br>- 集成测试<br>- 手动测试 |

### 里程碑

```
Day 1: ✅ 删除 configManager
Day 2: ✅ 重构 useConfig Hooks
Day 3: ✅ 迁移 Settings 页面
Day 4: ✅ 重构 downloadStore 和 instanceStore
Day 5: ✅ 完成其他组件迁移
Day 6: ✅ 清理工具模块
Day 7: ✅ 通过所有测试
```

---

## 7. 验收标准

### 7.1 代码验收标准

#### ✅ **必须满足**

1. **无旧 API 使用**
```bash
# 搜索代码，不应找到以下使用
grep -r "configManager\." src/
grep -r "useConfigStore((s) => s.config)" src/
grep -r "config?.preferences" src/
```

2. **类型安全**
```typescript
// ✅ 所有配置访问都有类型
const theme: ThemeMode = config.getConfigValue('preferences.theme');
await config.setConfigValue('preferences.theme', 'dark');

// ❌ 禁止使用 any
const value: any = config.getConfigValue('key');
```

3. **配置就绪检查**
```typescript
// ✅ 所有配置访问前都确保配置已就绪
await config.whenReady();
const value = config.getConfigValue('key');

// 或者
useEffect(() => {
  config.whenReady().then(() => {
    // 访问配置
  });
}, []);
```

### 7.2 功能验收标准

#### ✅ **核心功能**

- [ ] 应用正常启动
- [ ] 主题切换功能正常
- [ ] 语言切换功能正常
- [ ] 实例配置保存正常
- [ ] 下载配置保存正常
- [ ] 配置变更实时生效

#### ✅ **性能指标**

- [ ] 配置加载时间 < 500ms
- [ ] 配置保存延迟 < 100ms
- [ ] 配置变更通知延迟 < 50ms

### 7.3 测试覆盖率

- [ ] 单元测试覆盖率 > 80%
- [ ] 核心模块测试覆盖率 > 90%
- [ ] 集成测试通过所有场景

---

## 8. 回滚方案

### 8.1 回滚触发条件

如果出现以下情况，立即回滚：

1. 应用无法正常启动
2. 配置数据丢失
3. 核心功能无法使用
4. 严重性能问题

### 8.2 回滚步骤

```bash
# 1. 切换到迁移前分支
git checkout config-system-backup

# 2. 恢复配置数据
cp backup/app_config.json src-tauri/.smcl/app_config.json

# 3. 重新安装依赖
pnpm install

# 4. 重新构建
pnpm tauri build
```

### 8.3 回滚验证

- [ ] 应用正常启动
- [ ] 配置数据完整
- [ ] 核心功能正常
- [ ] 性能指标正常

---

## 9. 迁移检查清单

### 阶段 1 检查清单

- [ ] 已删除 `src/stores/configManager.ts`
- [ ] 已重构 `src/hooks/useConfig.ts`
- [ ] 已简化 `src/stores/configStore.ts`
- [ ] 已重构 `src/stores/themeStore.ts`
- [ ] 所有编译错误已修复

### 阶段 2 检查清单

- [ ] 已迁移 `src/pages/Settings.tsx`
- [ ] 已重构 `src/stores/downloadStore.ts`
- [ ] 已重构 `src/stores/instanceStore.ts`
- [ ] 所有编译错误已修复

### 阶段 3 检查清单

- [ ] 已迁移 `src/pages/VersionInstall.tsx`
- [ ] 已清理其他组件中的旧 API 使用
- [ ] 所有编译错误已修复

### 阶段 4 检查清单

- [ ] 已优化 `src/utils/configUtils.ts`
- [ ] 已清理 `src/helper/rustInvoke.ts`
- [ ] 所有编译错误已修复

### 阶段 5 检查清单

- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 所有手动测试通过
- [ ] 性能测试达标
- [ ] 代码审查通过

---

## 10. 风险评估

### 高风险项

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 配置数据丢失 | 低 | 高 | 迁移前备份配置文件 |
| 应用无法启动 | 中 | 高 | 准备回滚方案 |
| 配置访问错误 | 中 | 中 | 完善类型定义 |
| 性能下降 | 低 | 中 | 性能监控 |

### 中风险项

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Hooks 使用错误 | 中 | 中 | 提供使用示例 |
| 配置变更通知失效 | 低 | 中 | 完善测试 |
| 第三方库不兼容 | 低 | 中 | 提前调研 |

---

## 11. 沟通计划

### 团队通知

- [ ] 迁移开始前通知所有开发人员
- [ ] 每日站会同步迁移进度
- [ ] 迁移完成后组织培训

### 文档更新

- [ ] 更新 AGENTS.md
- [ ] 更新 README.md
- [ ] 更新开发文档
- [ ] 提供迁移指南

---

## 12. 总结

### 迁移收益

1. **统一配置入口**：所有配置访问通过单一入口
2. **类型安全**：完整的 TypeScript 类型支持
3. **简化架构**：移除冗余的配置管理层
4. **提高可维护性**：清晰的配置访问模式

### 迁移成本

1. **开发时间**：7 天
2. **测试时间**：1 天
3. **风险**：中等（有回滚方案）

### 建议

✅ **建议立即执行迁移**

理由：
- 当前配置系统混乱，多个入口并存
- 类型安全性差，容易出错
- 维护成本高，需要统一管理
- 迁移方案成熟，风险可控

---

## 📚 附录

### 附录 A：配置键速查表

```typescript
type ConfigKey = 
  // 用户偏好
  | 'preferences.theme'
  | 'preferences.accent_color'
  | 'preferences.language'
  | 'preferences.enable_animation'
  
  // 下载配置
  | 'download.download_path'
  | 'download.concurrent_limit'
  | 'download.auto_verify'
  
  // 窗口位置
  | 'window_position.x'
  | 'window_position.y'
  | 'window_position.width'
  | 'window_position.height'
  | 'window_position.maximized'
  
  // 实例配置
  | 'instance_configs'
  | 'known_folders';
```

### 附录 B：API 映射表

| 旧 API | 新 API | 说明 |
|--------|--------|------|
| `configManager.getPreference()` | `config.getConfigValue()` | 获取配置值 |
| `configManager.setPreference()` | `config.setConfigValue()` | 设置配置值 |
| `configManager.getInstanceConfig()` | `config.getInstanceConfig()` | 获取实例配置 |
| `configManager.updateInstanceConfig()` | `config.updateInstanceConfig()` | 更新实例配置 |
| `useConfigStore((s) => s.config)` | `config.getConfig()` | 获取完整配置 |

### 附录 C：迁移示例

```typescript
// ❌ 旧代码
import { configManager } from '@/stores/configManager';

const theme = configManager.getPreference<ThemeMode>('theme');
await configManager.setPreference('theme', 'dark');

// ✅ 新代码
import { config } from '@/config';

await config.whenReady();
const theme = config.getConfigValue('preferences.theme');
await config.setConfigValue('preferences.theme', 'dark');
```

---

**文档结束**
