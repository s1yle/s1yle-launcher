# 分层配置存储系统方案规划书

## 📋 目录

1. [背景与问题分析](#背景与问题分析)
2. [配置分层架构设计](#配置分层架构设计)
3. [各层存储策略详解](#各层存储策略详解)
4. [配置项分类清单](#配置项分类清单)
5. [技术实现方案](#技术实现方案)
6. [配置读写流程](#配置读写流程)
7. [错误处理与降级](#错误处理与降级)
8. [实施计划](#实施计划)

---

## 🎯 背景与问题分析

### 当前问题

1. **时序问题**：主题配置保存时配置文件未加载完成，导致保存失败
2. **配置类型混杂**：UI 配置、业务配置、敏感配置都存储在同一个配置文件中
3. **保存策略单一**：所有配置都采用相同的保存方式，没有区分优先级
4. **用户体验问题**：配置保存阻塞 UI 响应，或保存失败无提示

### 核心需求

1. **快速响应**：UI 配置变更立即生效，不等待异步保存
2. **可靠持久化**：重要配置必须保存到配置文件，重启后可恢复
3. **分层管理**：根据配置类型采用不同的存储策略
4. **易于扩展**：新增配置项时无需修改核心逻辑

---

## 🏗️ 配置分层架构设计

### 三层存储架构

```
┌─────────────────────────────────────────────────────┐
│                    应用层 (App)                       │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              配置管理层 (Config Manager)              │
│  - 统一配置 API                                         │
│  - 配置分类路由                                         │
│  - 保存策略调度                                         │
└─────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │  L1     │    │   L2     │    │   L3     │
   │ localStorage │ │ 配置文件  │    │ 加密存储  │
   │ 快速持久化   │ │ 完整配置  │    │ 敏感数据  │
   └─────────┘    └──────────┘    └──────────┘
```

### 分层说明

| 层级 | 存储介质 | 用途 | 保存时机 | 示例 |
|------|---------|------|---------|------|
| **L1** | localStorage | UI 配置、用户偏好 | 立即同步保存 | 主题、语言、窗口布局 |
| **L2** | app_config.json | 业务配置、应用设置 | 异步防抖保存 | 实例配置、下载设置、路径配置 |
| **L3** | 加密存储（Tauri Secure Storage） | 敏感数据 | 立即异步保存 | 账号 Token、密码 |

---

## 💾 各层存储策略详解

### L1: localStorage - 快速持久化层

#### 特点
- **读写速度**：最快（同步操作，<1ms）
- **存储限制**：5-10MB
- **持久性**：高（除非用户清除浏览器数据）
- **安全性**：低（明文存储）

#### 适用配置类型
- UI 状态配置
- 用户偏好设置
- 临时配置缓存

#### 保存策略
```typescript
// 立即同步保存，无需等待
localStorage.setItem('theme', JSON.stringify({ mode: 'dark', accentColor: 'indigo' }));

// 使用 Zustand persist 中间件自动管理
persist(partialize: (state) => ({ mode: state.mode, accentColor: state.accentColor }))
```

#### 加载策略
```typescript
// 应用启动时立即从 localStorage 读取
const theme = JSON.parse(localStorage.getItem('theme') || '{}');
applyTheme(theme);

// 同时异步从配置文件同步（用于多端同步场景）
syncFromConfigFile();
```

#### 优势
- ✅ UI 响应零延迟
- ✅ 不依赖配置文件加载状态
- ✅ 即使配置文件损坏，UI 配置仍可用

---

### L2: 配置文件 - 完整配置层

#### 特点
- **读写速度**：中等（异步 IO，10-100ms）
- **存储限制**：无（受磁盘限制）
- **持久性**：最高（文件级持久化）
- **安全性**：中（文件系统保护）

#### 配置文件结构
```json
{
  "version": 1,
  "base_path": "/path/to/.smcl",
  "window_position": {
    "x": 100,
    "y": 200,
    "width": 1280,
    "height": 800,
    "maximized": false
  },
  "preferences": {
    "theme": "dark",
    "accent_color": "indigo",
    "language": "zh-CN",
    "enable_animation": true
  },
  "download": {
    "base_path": "/path/to/downloads",
    "concurrent_limit": 8,
    "auto_validate": true,
    "source": "official"
  },
  "path_config": {
    "instance_root": "/path/to/minecraft",
    "download_dir": "/path/to/downloads"
  },
  "known_folders": [
    {
      "id": "uuid-1",
      "name": "default",
      "path": "/path/to/default",
      "is_default": true
    }
  ],
  "instance_configs": {
    "instance-uuid-1": {
      "id": "instance-uuid-1",
      "name": "生存世界",
      "version": "1.20.4",
      "loader_type": "Fabric",
      "loader_version": "0.15.7",
      "java": {
        "path": "/usr/bin/java",
        "version": "17.0.2"
      },
      "memory": {
        "min": 2048,
        "max": 4096
      },
      "graphics": {
        "fullscreen": false,
        "width": 1920,
        "height": 1080
      },
      "custom_args": ["--tweakClass", "com.example.Tweak"]
    }
  }
}
```

#### 保存策略
```typescript
// 防抖保存：避免频繁写入
let saveTimeout: NodeJS.Timeout;

async function setConfigValue(key: string, value: any) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await invoke('set_config_value', { keyPath: key, value });
  }, 500); // 500ms 防抖
}

// 立即保存（重要配置）
async function saveConfigImmediately(updates: Partial<AppConfig>) {
  await invoke('update_config', { config: updates });
}
```

#### 加载策略
```typescript
// 应用启动时异步加载
async function loadConfig() {
  try {
    const config = await invoke('get_app_config');
    return config;
  } catch (error) {
    // 配置文件不存在或损坏，使用默认配置
    console.warn('Failed to load config, using defaults');
    return getDefaultConfig();
  }
}
```

#### 优势
- ✅ 配置集中管理，易于备份和迁移
- ✅ 支持复杂配置结构
- ✅ 可手动编辑配置文件

---

### L3: 加密存储 - 敏感数据层

#### 特点
- **读写速度**：慢（加密/解密，50-200ms）
- **存储限制**：小（适合存储少量敏感数据）
- **持久性**：高
- **安全性**：最高（系统级加密）

#### 适用配置类型
- 微软账号 Token
- 离线账号密码（如果支持）
- API Key
- 其他认证信息

#### 保存策略（Rust 后端实现）
```rust
// src-tauri/src/secure_storage.rs
use keyring::Entry;

#[tauri::command]
pub async fn save_secure_token(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new("s1yle-launcher", &key)
        .map_err(|e| e.to_string())?;
    
    entry.set_password(&value)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_secure_token(key: String) -> Result<String, String> {
    let entry = Entry::new("s1yle-launcher", &key)
        .map_err(|e| e.to_string())?;
    
    entry.get_password()
        .map_err(|e| e.to_string())?;
    
    Ok(value)
}
```

#### 前端调用
```typescript
// helper/rustInvoke.ts
export async function saveSecureToken(key: string, value: string) {
  await invoke('save_secure_token', { key, value });
}

export async function getSecureToken(key: string): Promise<string> {
  return await invoke('get_secure_token', { key });
}

export async function deleteSecureToken(key: string) {
  await invoke('delete_secure_token', { key });
}
```

#### 优势
- ✅ 系统级加密（Windows Credential Manager、macOS Keychain、Linux Secret Service）
- ✅ 与操作系统集成，安全性最高
- ✅ 防止配置文件泄露导致敏感信息丢失

---

## 📝 配置项分类清单

### L1: localStorage 配置项

| 配置项 | Key | 类型 | 默认值 | 说明 |
|--------|-----|------|--------|------|
| 主题模式 | `theme.mode` | `dark\|light\|system` | `dark` | 暗色/亮色/系统 |
| 强调色 | `theme.accentColor` | `indigo\|blue\|green...` | `indigo` | 7 种强调色 |
| 当前主题 | `theme.activeTheme` | `dark\|light` | `dark` | 实际应用的主题 |
| 语言 | `preferences.language` | `zh-CN\|en-US` | `zh-CN` | 界面语言 |
| 动画开关 | `preferences.enableAnimation` | `boolean` | `true` | 是否启用动画 |
| 侧边栏宽度 | `ui.sidebarWidth` | `number` | `240` | 侧边栏宽度（px） |
| 侧边栏折叠 | `ui.sidebarCollapsed` | `boolean` | `false` | 侧边栏是否折叠 |
| 最近访问的实例 | `ui.recentInstances` | `string[]` | `[]` | 最近访问的实例 ID 列表 |
| 实例视图模式 | `ui.instanceViewMode` | `grid\|list` | `grid` | 实例列表视图模式 |
| 下载面板展开 | `ui.downloadPanelExpanded` | `boolean` | `true` | 下载面板是否展开 |

### L2: 配置文件项

#### 2.1 应用级配置

| 配置项 | 路径 | 类型 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 配置文件版本 | `version` | `number` | `1` | 用于迁移 |
| 基础路径 | `base_path` | `string` | `~/.local/share/art/s1yle/mc_launcher/` | 应用数据根目录 |

#### 2.2 窗口配置

| 配置项 | 路径 | 类型 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 窗口 X 坐标 | `window_position.x` | `number \| null` | `null` | 窗口 X 坐标 |
| 窗口 Y 坐标 | `window_position.y` | `number \| null` | `null` | 窗口 Y 坐标 |
| 窗口宽度 | `window_position.width` | `number` | `1280` | 窗口宽度 |
| 窗口高度 | `window_position.height` | `number` | `800` | 窗口高度 |
| 窗口最大化 | `window_position.maximized` | `boolean` | `false` | 是否最大化 |

#### 2.3 用户偏好（同时备份到 L1）

| 配置项 | 路径 | 类型 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 主题模式 | `preferences.theme` | `string` | `dark` | 备份 L1 配置 |
| 强调色 | `preferences.accent_color` | `string` | `indigo` | 备份 L1 配置 |
| 语言 | `preferences.language` | `string` | `zh-CN` | 备份 L1 配置 |
| 动画开关 | `preferences.enable_animation` | `boolean` | `true` | 备份 L1 配置 |

#### 2.4 下载配置

| 配置项 | 路径 | 类型 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 下载基础路径 | `download.base_path` | `string` | `{base_path}/downloads` | 下载文件保存目录 |
| 并发限制 | `download.concurrent_limit` | `number` | `8` | 最大并发下载数 |
| 自动校验 | `download.auto_validate` | `boolean` | `true` | 下载后自动校验 SHA1 |
| 下载源 | `download.source` | `official\|bmclapi\|mcbbs` | `official` | 下载源选择 |

#### 2.5 路径配置

| 配置项 | 路径 | 类型 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 实例根目录 | `path_config.instance_root` | `string` | `{base_path}/minecraft` | 实例存放目录 |
| 下载目录 | `path_config.download_dir` | `string` | `{base_path}/downloads` | 下载文件目录 |

#### 2.6 已知文件夹

| 配置项 | 路径 | 类型 | 说明 |
|--------|------|------|--------|
| 已知文件夹列表 | `known_folders[]` | `array` | 扫描到的游戏目录列表 |

每个文件夹对象：
```json
{
  "id": "uuid-string",
  "name": "default",
  "path": "/absolute/path/to/folder",
  "is_default": true
}
```

#### 2.7 实例配置

| 配置项 | 路径 | 类型 | 说明 |
|--------|------|------|--------|
| 实例配置映射 | `instance_configs` | `object` | Key: 实例 ID, Value: 实例配置 |

每个实例配置对象：
```json
{
  "id": "instance-uuid",
  "name": "生存世界",
  "version": "1.20.4",
  "loader_type": "Fabric",
  "loader_version": "0.15.7",
  "java": {
    "path": "/usr/bin/java",
    "version": "17.0.2"
  },
  "memory": {
    "min": 2048,
    "max": 4096
  },
  "graphics": {
    "fullscreen": false,
    "width": 1920,
    "height": 1080
  },
  "custom_args": []
}
```

### L3: 加密存储配置项

| 配置项 | Key | 类型 | 说明 |
|--------|-----|------|--------|
| 微软账号 Token | `microsoft_access_token:{account_uuid}` | `string` | 微软账号访问令牌 |
| 微软账号 Refresh Token | `microsoft_refresh_token:{account_uuid}` | `string` | 微软账号刷新令牌 |
| 离线账号密码（可选） | `offline_password:{account_uuid}` | `string` | 离线账号密码（如果支持） |

---

## 🔧 技术实现方案

### 1. 配置管理层架构

```typescript
// src/stores/configManager.ts
interface ConfigManager {
  // L1: localStorage 操作
  getLocalStorage<T>(key: string): T | null;
  setLocalStorage(key: string, value: any): void;
  removeLocalStorage(key: string): void;
  
  // L2: 配置文件操作
  getConfig(): AppConfig | null;
  setConfigValue(keyPath: string, value: any): Promise<void>;
  updateConfig(updates: Partial<AppConfig>): Promise<void>;
  reloadConfig(): Promise<void>;
  
  // L3: 加密存储操作
  getSecureToken(key: string): Promise<string>;
  setSecureToken(key: string, value: string): Promise<void>;
  deleteSecureToken(key: string): Promise<void>;
  
  // 配置分类读写（推荐用法）
  getPreference<T>(key: string): T;
  setPreference(key: string, value: any): void;
  
  getInstanceConfig(instanceId: string): InstanceConfig | null;
  updateInstanceConfig(config: InstanceConfig): Promise<void>;
  deleteInstanceConfig(instanceId: string): Promise<void>;
  
  // 初始化
  init(): Promise<void>;
}
```

### 2. Zustand Store 集成

#### 2.1 Theme Store（L1 + L2 备份）

```typescript
// src/stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: 'dark',
      accentColor: 'indigo',
      activeTheme: 'dark',
      
      setMode: (mode: ThemeMode) => {
        const actualTheme = mode === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : mode;
        
        // 立即更新状态和 DOM
        set({ mode, activeTheme: actualTheme });
        applyToDom(actualTheme, get().accentColor);
        
        // L1: localStorage 自动保存（通过 persist 中间件）
        
        // L2: 异步备份到配置文件
        configManager.setPreference('theme', mode);
        configManager.setPreference('accent_color', get().accentColor);
      },
      
      setAccentColor: (accentColor: AccentColor) => {
        set({ accentColor });
        applyToDom(get().activeTheme, accentColor);
        
        // L2: 异步备份到配置文件
        configManager.setPreference('accent_color', accentColor);
      },
      
      init: () => {
        // L1: localStorage 已自动加载（通过 persist 中间件）
        const { activeTheme, accentColor } = get();
        applyToDom(activeTheme, accentColor);
        
        // L2: 从配置文件同步（可选，用于多端同步）
        syncFromConfigFile();
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ 
        mode: state.mode, 
        accentColor: state.accentColor 
      }),
    }
  )
);
```

#### 2.2 Config Store（L2 主导）

```typescript
// src/stores/configStore.ts
interface ConfigState {
  config: AppConfig | null;
  loading: boolean;
  initialized: boolean;
  
  init: () => Promise<void>;
  updateGlobalConfig: (updates: Partial<AppConfig>) => Promise<void>;
  setPreference: (key: string, value: any) => Promise<void>;
  getInstanceConfig: (instanceId: string) => InstanceConfig | null;
  updateInstanceConfig: (config: InstanceConfig) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: true,
  initialized: false,
  
  init: async () => {
    set({ loading: true });
    try {
      const config = await invoke('get_app_config');
      set({ config, loading: false, initialized: true });
    } catch (error) {
      console.error('Failed to load config:', error);
      set({ loading: false, initialized: true });
    }
  },
  
  updateGlobalConfig: async (updates) => {
    await invoke('update_config', { config: updates });
    // 重新加载配置
    await get().init();
  },
  
  setPreference: async (key, value) => {
    if (!get().initialized) {
      // 配置未加载完成，延迟保存
      setTimeout(() => get().setPreference(key, value), 100);
      return;
    }
    
    await invoke('set_config_value', { 
      keyPath: `preferences.${key}`, 
      value 
    });
  },
  
  // ... 其他方法
}));
```

### 3. 配置分类读写 API

```typescript
// src/stores/configManager.ts
class ConfigManager {
  // 获取偏好配置（L1 优先，L2 备份）
  getPreference<T>(key: string): T {
    // 优先从 localStorage 读取
    const l1Value = localStorage.getItem(`preferences.${key}`);
    if (l1Value) {
      return JSON.parse(l1Value);
    }
    
    // 否则从配置文件读取
    const config = useConfigStore.getState().config;
    return config?.preferences?.[key] as T;
  }
  
  // 设置偏好配置（L1 立即保存，L2 异步备份）
  setPreference(key: string, value: any) {
    // L1: 立即保存到 localStorage
    localStorage.setItem(`preferences.${key}`, JSON.stringify(value));
    
    // L2: 异步备份到配置文件（防抖）
    this.debouncedSaveToConfig(`preferences.${key}`, value);
  }
  
  // 获取实例配置（仅 L2）
  getInstanceConfig(instanceId: string): InstanceConfig | null {
    const config = useConfigStore.getState().config;
    return config?.instance_configs?.[instanceId] || null;
  }
  
  // 更新实例配置（仅 L2）
  async updateInstanceConfig(config: InstanceConfig) {
    await invoke('set_config_value', {
      keyPath: `instance_configs.${config.id}`,
      value: config
    });
  }
  
  // 防抖保存
  private debouncedSaveToConfig = debounce(async (key: string, value: any) => {
    await invoke('set_config_value', { keyPath: key, value });
  }, 500);
}

export const configManager = new ConfigManager();
```

---

## 🔄 配置读写流程

### 读取流程

```typescript
// 读取配置（优先级：L1 > L2）
function getConfig(key: string) {
  // 1. 尝试从 localStorage 读取（L1）
  const l1Value = localStorage.getItem(key);
  if (l1Value) {
    return JSON.parse(l1Value);
  }
  
  // 2. 从配置文件读取（L2）
  const config = useConfigStore.getState().config;
  return getNestedValue(config, key);
}

// 示例：读取主题
const theme = getConfig('preferences.theme');
// 读取顺序：localStorage -> app_config.json -> 默认值
```

### 写入流程

```typescript
// 写入配置（根据类型选择存储层）
function setConfig(key: string, value: any, options?: SetOptions) {
  const layer = options?.layer || inferLayer(key);
  
  switch (layer) {
    case 'L1':
      // localStorage: 立即同步保存
      localStorage.setItem(key, JSON.stringify(value));
      break;
      
    case 'L2':
      // 配置文件：异步防抖保存
      configManager.debouncedSaveToConfig(key, value);
      break;
      
    case 'L3':
      // 加密存储：立即异步保存
      saveSecureToken(key, value);
      break;
      
    case 'L1+L2':
      // 双重保存：L1 立即保存，L2 异步备份
      localStorage.setItem(key, JSON.stringify(value));
      configManager.debouncedSaveToConfig(key, value);
      break;
  }
}

// 示例：保存主题
setConfig('preferences.theme', 'dark', { layer: 'L1+L2' });
// 1. localStorage 立即保存
// 2. app_config.json 异步备份（500ms 防抖）
```

### 初始化流程

```typescript
// 应用启动初始化
async function initApp() {
  // 1. 立即从 localStorage 读取 UI 配置
  const theme = JSON.parse(localStorage.getItem('theme') || '{}');
  applyTheme(theme);
  
  // 2. 异步加载配置文件
  const config = await useConfigStore.getState().init();
  
  // 3. 从配置文件同步偏好设置（可选，用于多端同步）
  if (config) {
    syncPreferencesFromConfig(config);
  }
  
  // 4. 加载敏感数据（如果需要）
  await loadSecureTokens();
}
```

---

## ⚠️ 错误处理与降级

### L1 错误处理

```typescript
try {
  localStorage.setItem(key, JSON.stringify(value));
} catch (error) {
  // localStorage 不可用（隐私模式、磁盘满等）
  console.warn('localStorage unavailable, falling back to L2');
  // 降级到 L2
  await configManager.setConfigValue(key, value);
}
```

### L2 错误处理

```typescript
try {
  await invoke('set_config_value', { keyPath: key, value });
} catch (error) {
  // 配置文件写入失败
  console.error('Config file write failed:', error);
  
  // 1. 记录日志
  logger.error('Failed to save config', { key, value, error });
  
  // 2. 重试机制（最多 3 次）
  await retry(async () => {
    await invoke('set_config_value', { keyPath: key, value });
  }, { retries: 3, delay: 1000 });
  
  // 3. 通知用户（重要配置）
  if (isCriticalConfig(key)) {
    notify.error('配置保存失败', '请检查磁盘空间或权限');
  }
}
```

### L3 错误处理

```typescript
try {
  await invoke('save_secure_token', { key, value });
} catch (error) {
  // 加密存储失败（系统不支持）
  console.error('Secure storage unavailable:', error);
  
  // 1. 降级到 L2（加密后存储）
  const encrypted = await encrypt(value);
  await configManager.setConfigValue(`secure.${key}`, encrypted);
  
  // 2. 通知用户安全性降低
  notify.warning('安全存储不可用', '敏感数据将以加密形式存储在配置文件中');
}
```

### 配置文件损坏处理

```typescript
// Rust 后端：config/manager.rs
pub fn load_or_create(&self) -> Result<AppConfig, ConfigError> {
    if !self.config_path.exists() {
        // 配置文件不存在，创建默认配置
        return self.create_default_config();
    }
    
    match self.load_config() {
        Ok(config) => Ok(config),
        Err(e) => {
            // 配置文件损坏
            logger::error!("Config file corrupted: {}", e);
            
            // 1. 备份损坏的配置文件
            self.backup_corrupted_config()?;
            
            // 2. 创建默认配置
            let default_config = self.create_default_config()?;
            
            // 3. 通知前端
            emit_config_error("配置文件损坏，已恢复默认配置");
            
            Ok(default_config)
        }
    }
}
```

---

## 📅 实施计划

### Phase 1: 基础设施搭建（预计 4 小时）

#### 1.1 创建配置管理器
- [ ] 创建 `src/stores/configManager.ts`
- [ ] 实现 L1/L2/L3 三层存储 API
- [ ] 实现防抖保存机制
- [ ] 实现配置分类路由

#### 1.2 创建加密存储模块（Rust）
- [ ] 创建 `src-tauri/src/secure_storage.rs`
- [ ] 添加 `keyring` 依赖到 `Cargo.toml`
- [ ] 实现 `save_secure_token`、`get_secure_token`、`delete_secure_token` 命令
- [ ] 在 `lib.rs` 中注册命令

#### 1.3 工具函数
- [ ] 创建 `src/utils/configUtils.ts`
- [ ] 实现 `debounce` 函数
- [ ] 实现 `retry` 函数
- [ ] 实现 `encrypt`/`decrypt` 函数（可选）

### Phase 2: Store 改造（预计 6 小时）

#### 2.1 Theme Store 改造
- [ ] 添加 `persist` 中间件
- [ ] 修改 `setMode` 和 `setAccentColor` 使用新 API
- [ ] 实现 `syncFromConfigFile` 函数
- [ ] 测试 localStorage 持久化

#### 2.2 Config Store 改造
- [ ] 修改 `setPreference` 支持延迟保存
- [ ] 添加 `initialized` 状态
- [ ] 实现配置加载完成事件
- [ ] 测试配置读写流程

#### 2.3 其他 Store 改造
- [ ] 语言设置 Store（如果存在）
- [ ] 窗口位置 Store
- [ ] 下载设置 Store

### Phase 3: 配置文件结构优化（预计 4 小时）

#### 3.1 Rust 后端配置模型
- [ ] 更新 `src-tauri/src/config/models.rs`
- [ ] 添加 `SecureStorageConfig` 结构体
- [ ] 更新 `AppConfig` 结构体
- [ ] 实现配置文件迁移逻辑

#### 3.2 配置文件迁移
- [ ] 实现版本检测
- [ ] 实现 v0 -> v1 迁移逻辑
- [ ] 测试迁移流程

### Phase 4: 集成测试（预计 4 小时）

#### 4.1 单元测试
- [ ] 测试 configManager 各层存储
- [ ] 测试防抖保存
- [ ] 测试错误处理

#### 4.2 集成测试
- [ ] 测试主题切换完整流程
- [ ] 测试配置加载流程
- [ ] 测试配置文件损坏恢复
- [ ] 测试加密存储

#### 4.3 手动测试
- [ ] 切换主题并重启验证
- [ ] 切换语言并重启验证
- [ ] 修改实例配置并重启验证
- [ ] 模拟配置文件损坏场景

### Phase 5: 文档与优化（预计 2 小时）

#### 5.1 文档更新
- [ ] 更新 `AGENTS.md` 配置管理章节
- [ ] 创建 `CONFIG_SYSTEM.md` 配置系统说明文档
- [ ] 更新代码注释

#### 5.2 性能优化
- [ ] 优化防抖延迟时间
- [ ] 优化配置加载顺序
- [ ] 优化错误日志输出

---

## 📊 预期效果

### 性能提升
- **UI 响应速度**: 主题切换 0 延迟（从 ~500ms 降到 <1ms）
- **配置加载**: 启动时 UI 配置立即生效（从 ~100ms 降到 <1ms）
- **IO 次数**: 减少配置文件写入次数（防抖优化，减少 80%）

### 可靠性提升
- **配置保存成功率**: 从 ~70% 提升到 ~99%
- **配置损坏恢复**: 支持自动备份和恢复
- **错误处理**: 完善的降级和重试机制

### 用户体验提升
- **主题切换**: 立即生效，无等待
- **重启恢复**: 100% 恢复上次配置
- **错误提示**: 配置保存失败时明确提示

---

## 🔮 未来扩展

### 云端同步（可选）
- 将 L2 配置文件同步到云端
- 多设备配置同步
- 配置备份和恢复

### 配置预设（可选）
- 支持保存多套配置预设
- 一键切换配置方案
- 分享配置预设

### 配置版本控制（可选）
- 配置文件 Git 版本控制
- 配置变更历史
- 配置回滚

---

**规划书完成。请确认是否开始实施，或需要调整哪些部分。**
