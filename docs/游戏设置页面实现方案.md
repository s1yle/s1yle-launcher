# 游戏设置页面实现方案规划书

## 一、需求分析与 HMCL 对比

### 1.1 HMCL 核心功能分析

根据 HMCL 文档，「实例管理 - 游戏设置」页面包含以下核心配置模块：

| 模块 | 配置项 | 类型 | HMCL 实现 | 当前项目适配 |
|------|--------|------|----------|-------------|
| **基础设置** | 启用实例特定设置 | Boolean | `useInstanceSettings` | ✅ 需要 |
| | 实例图标 | String | `iconPath` | ✅ 已有 (`icon_path`) |
| | 实例名称 | String | `name` | ✅ 已有 |
| | 游戏版本 | String | `gameVersion` | ✅ 已有 (`version`) |
| | 加载器类型 | Enum | `loaderType` | ✅ 已有 (`loader_type`) |
| **Java 配置** | Java 路径 | String | `javaPath` | ⚠️ 需要添加 |
| | Java 版本 | String | `javaVersion` | ⚠️ 需要添加 |
| | 自动分配内存 | Boolean | `autoMemory` | ⚠️ 需要添加 |
| | 最小内存 | Long | `minMemory` | ⚠️ 需要添加 |
| | 最大内存 | Long | `maxMemory` | ⚠️ 需要添加 |
| | JVM 参数 | Array | `jvmArgs` | ⚠️ 需要添加 |
| **版本隔离** | 隔离模式 | Enum | `isolationMode` | ⚠️ 需要添加 |
| **窗口配置** | 宽度 | Integer | `width` | ⚠️ 需要添加 |
| | 高度 | Integer | `height` | ⚠️ 需要添加 |
| | 全屏 | Boolean | `fullscreen` | ⚠️ 需要添加 |
| | 最大化 | Boolean | `maximized` | ⚠️ 需要添加 |
| | 垂直同步 | Boolean | `enableVsync` | ⚠️ 需要添加 |
| **高级设置** | 启动器可见性 | Boolean | `launcherVisible` | ⚠️ 需要添加 |
| | 玩家名称 | String | `playerName` | ⚠️ 需要添加 |
| | 服务器地址 | String | `serverAddress` | ⚠️ 需要添加 |

### 1.2 当前项目架构分析

#### 已有数据结构
```typescript
// src/helper/rustInvoke.ts
export interface GameInstance {
  id: string;
  name: string;
  version: string;
  loader_type: ModLoaderType;
  loader_version: string | null;
  path: string;
  icon_path: string | null;
  last_played: number | null;
  created_at: number;
  enabled: boolean;
}
```

#### 已有配置管理
```typescript
// src/stores/configStore.ts
interface ConfigState {
  config: Config | null;
  loaded: boolean;
  setConfig: (config: Config) => void;
  // ...
}

// src/stores/configManager.ts
class ConfigManager {
  // L1: localStorage
  // L2: 配置文件
  // L3: 加密存储
}
```

---

## 二、架构设计

### 2.1 数据模型设计

#### 方案 A：扩展现有 GameInstance（推荐）

**优点**：
- ✅ 数据集中，便于管理
- ✅ 减少跨 store 同步
- ✅ 符合 Rust 后端结构

**缺点**：
- ❌ 需要修改 Rust 后端接口
- ❌ 需要迁移现有数据

**实现**：
```typescript
// src/helper/rustInvoke.ts
export interface GameInstance {
  // 基础信息（已有）
  id: string;
  name: string;
  version: string;
  loader_type: ModLoaderType;
  loader_version: string | null;
  path: string;
  icon_path: string | null;
  last_played: number | null;
  created_at: number;
  enabled: boolean;
  
  // 新增：游戏设置
  game_settings?: GameSettings;
}

export interface GameSettings {
  // 基础设置
  use_instance_settings: boolean;  // 启用实例特定设置
  
  // Java 配置
  java_path?: string;              // Java 路径
  java_version?: string;           // Java 版本
  min_memory?: number;             // 最小内存 (MB)
  max_memory?: number;             // 最大内存 (MB)
  jvm_args?: string[];             // JVM 参数
  
  // 版本隔离
  isolation_mode?: IsolationMode;  // 隔离模式
  
  // 窗口配置
  width?: number;                  // 窗口宽度
  height?: number;                 // 窗口高度
  fullscreen?: boolean;            // 全屏
  maximized?: boolean;             // 最大化
  vsync?: boolean;                 // 垂直同步
  
  // 高级设置
  launcher_visible?: boolean;      // 启动器可见性
  player_name?: string;            // 玩家名称
  server_address?: string;         // 服务器地址
  server_port?: number;            // 服务器端口
}

export enum IsolationMode {
  Global = 'global',           // 全局共享
  Version = 'version',         // 版本隔离
  Instance = 'instance'        // 各实例独立
}
```

#### 方案 B：独立 GameSettings Store

**优点**：
- ✅ 不修改现有结构
- ✅ 配置管理独立

**缺点**：
- ❌ 需要跨 store 同步
- ❌ 数据分散

**实现**：
```typescript
// src/stores/gameSettingsStore.ts
interface GameSettingsState {
  settings: Record<string, GameSettings>; // 按实例 ID 索引
  getSettings: (instanceId: string) => GameSettings | null;
  setSettings: (instanceId: string, settings: GameSettings) => void;
  saveSettings: (instanceId: string) => Promise<void>;
}
```

### 2.2 推荐方案

**采用方案 A（扩展现有 GameInstance）**，理由：
1. **Rust 后端配合**：当前项目 Rust 后端可以自定义，便于统一数据结构
2. **数据一致性**：实例信息和配置在一起，避免同步问题
3. **性能优化**：一次加载所有数据，减少 API 调用

---

## 三、UI 设计方案

### 3.1 页面布局

```
┌─────────────────────────────────────────────────────────┐
│  [图标] 我的生存存档 v1.20.1 · Forge                    │
│         各实例独立（不影响其他游戏实例）▼                │
├─────────────────────────────────────────────────────────┤
│  ⚙️ 基础设置                                            │
│  ├─ 启用实例特定游戏设置 [✓]                            │
│  └─ 编辑全局游戏设置 [按钮]                             │
├─────────────────────────────────────────────────────────┤
│  ☕ Java 配置                                           │
│  ├─ 游戏 Java：[路径输入框] [浏览...]                   │
│  ├─ Java 版本：[17 ▼]                                   │
│  └─ 自动分配内存 [✓]                                    │
│     ├─ 最小内存：[====|====] 4096 MB                    │
│     └─ 已使用 15.3 GiB / 总内存 15.8 GiB                │
├─────────────────────────────────────────────────────────┤
│  📦 版本隔离                                            │
│  └─ [全局共享 ▼]                                        │
│     提示：在版本隔离中选择"各实例独立"使当前实例...      │
├─────────────────────────────────────────────────────────┤
│  🖥️ 窗口配置                                            │
│  ├─ 分辨率：[1280] × [720]                              │
│  ├─ 全屏 [ ]  最大化 [✓]  垂直同步 [✓]                  │
│  └─ 显示器：[主显示器 ▼]                                │
├─────────────────────────────────────────────────────────┤
│  ⚡ 高级设置                                            │
│  ├─ 启动器可见性 [✓]                                    │
│  ├─ 玩家名称：[Steve]                                   │
│  └─ 自动连接服务器：[地址] [端口]                       │
└─────────────────────────────────────────────────────────┘
```

### 3.2 组件设计

#### 3.2.1 页面容器组件
```typescript
// src/pages/Instance/InstanceSettings/InstanceGameSettings.tsx
interface Props {
  instanceId: string;
}

const InstanceGameSettings: React.FC<Props> = ({ instanceId }) => {
  const instance = useInstanceStore(s => s.getInstance(instanceId));
  const updateInstance = useInstanceStore(s => s.updateInstance);
  
  return (
    <div className="instance-game-settings">
      <InstanceInfoHeader instance={instance} />
      <SettingsSection title="基础设置">
        {/* 基础设置内容 */}
      </SettingsSection>
      <SettingsSection title="Java 配置">
        {/* Java 配置内容 */}
      </SettingsSection>
      {/* 其他部分 */}
    </div>
  );
};
```

#### 3.2.2 可复用配置区块
```typescript
// src/components/settings/SettingsSection.tsx
interface SettingsSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  children
}) => {
  return (
    <div className="settings-section">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};
```

#### 3.2.3 配置项组件
```typescript
// src/components/settings/SettingItem.tsx
interface SettingItemProps {
  label: string;
  description?: string;
  children: ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  label,
  description,
  children
}) => {
  return (
    <div className="setting-item flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-text-tertiary mt-1">
            {description}
          </div>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );
};
```

### 3.3 关键组件实现

#### 3.3.1 Java 路径选择器
```typescript
// src/components/settings/JavaPathSelector.tsx
interface JavaPathSelectorProps {
  value?: string;
  onChange: (path: string) => void;
}

const JavaPathSelector: React.FC<JavaPathSelectorProps> = ({
  value,
  onChange
}) => {
  const { t } = useTranslation();
  
  const handleBrowse = async () => {
    const path = await invoke<string>('select_java_path');
    if (path) {
      onChange(path);
    }
  };
  
  return (
    <div className="flex gap-2">
      <TextField 
        value={value || ''}
        onChange={onChange}
        placeholder={t('settings.java.pathPlaceholder', 'Java 可执行文件路径')}
        className="flex-1"
      />
      <Button onClick={handleBrowse} variant="outline">
        {t('common.browse', '浏览')}
      </Button>
    </div>
  );
};
```

#### 3.3.2 内存滑块
```typescript
// src/components/settings/MemorySlider.tsx
interface MemorySliderProps {
  minMemory: number;
  maxMemory: number;
  autoMemory: boolean;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onAutoChange: (value: boolean) => void;
}

const MemorySlider: React.FC<MemorySliderProps> = ({
  minMemory,
  maxMemory,
  autoMemory,
  onMinChange,
  onMaxChange,
  onAutoChange
}) => {
  const { t } = useTranslation();
  const [systemMemory, setSystemMemory] = useState(0);
  
  useEffect(() => {
    // 获取系统内存信息
    invoke<number>('get_system_memory').then(setSystemMemory);
  }, []);
  
  const handleAutoMemory = () => {
    // 自动计算最优内存（系统内存的 50%）
    const optimal = Math.floor(systemMemory * 0.5);
    onMinChange(optimal);
    onAutoChange(true);
  };
  
  return (
    <div className="space-y-3">
      <SettingItem
        label={t('settings.memory.auto', '自动分配内存')}
        description={t('settings.memory.autoDesc', '根据系统内存自动分配最优值')}
      >
        <Checkbox checked={autoMemory} onCheckedChange={onAutoChange} />
      </SettingItem>
      
      {!autoMemory && (
        <>
          <SettingItem label={t('settings.memory.min', '最小内存')}>
            <Slider
              min={512}
              max={systemMemory}
              step={256}
              value={minMemory}
              onValueChange={([v]) => onMinChange(v)}
              className="w-48"
            />
            <span className="ml-2 text-sm">{minMemory} MB</span>
          </SettingItem>
          
          <SettingItem label={t('settings.memory.max', '最大内存')}>
            <Slider
              min={minMemory}
              max={systemMemory}
              step={256}
              value={maxMemory}
              onValueChange={([v]) => onMaxChange(v)}
              className="w-48"
            />
            <span className="ml-2 text-sm">{maxMemory} MB</span>
          </SettingItem>
          
          <div className="text-xs text-text-tertiary">
            {t('settings.memory.tip', '已使用 {used} GiB / 总内存 {total} GiB', {
              used: (minMemory / 1024).toFixed(1),
              total: (systemMemory / 1024).toFixed(1)
            })}
          </div>
        </>
      )}
    </div>
  );
};
```

#### 3.3.3 版本隔离选择器
```typescript
// src/components/settings/IsolationModeSelector.tsx
const IsolationModeSelector: React.FC<{
  value: IsolationMode;
  onChange: (mode: IsolationMode) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation();
  
  const modes = [
    { value: IsolationMode.Global, label: t('settings.isolation.global', '全局共享') },
    { value: IsolationMode.Version, label: t('settings.isolation.version', '版本隔离') },
    { value: IsolationMode.Instance, label: t('settings.isolation.instance', '各实例独立') },
  ];
  
  return (
    <div className="space-y-3">
      <Select value={value} onValueChange={(v) => onChange(v as IsolationMode)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {modes.map(mode => (
            <SelectItem key={mode.value} value={mode.value}>
              {mode.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="text-xs text-text-tertiary bg-surface p-3 rounded border">
        {value === IsolationMode.Instance
          ? t('settings.isolation.tip.instance', '推荐：每个实例独立存储，互不干扰')
          : value === IsolationMode.Version
            ? t('settings.isolation.tip.version', '同一版本共享配置，不同版本隔离')
            : t('settings.isolation.tip.global', '所有实例共享同一套配置')}
      </div>
    </div>
  );
};
```

---

## 四、状态管理与持久化

### 4.1 使用 Zustand Store

```typescript
// src/stores/instanceSettingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { debounce } from 'lodash-es';

interface InstanceSettingsState {
  // 当前编辑的实例 ID
  editingInstanceId: string | null;
  
  // 临时配置（未保存）
  tempSettings: GameSettings | null;
  
  // 操作
  setEditingInstance: (instanceId: string | null) => void;
  loadSettings: (instanceId: string) => Promise<void>;
  updateSettings: (settings: Partial<GameSettings>) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
}

export const useInstanceSettingsStore = create<InstanceSettingsState>()(
  persist(
    (set, get) => ({
      editingInstanceId: null,
      tempSettings: null,
      
      setEditingInstance: (instanceId) => {
        set({ editingInstanceId: instanceId });
        if (instanceId) {
          get().loadSettings(instanceId);
        }
      },
      
      loadSettings: async (instanceId) => {
        const instance = await invoke<GameInstance>('get_instance', { id: instanceId });
        set({ tempSettings: instance.game_settings || {} });
      },
      
      updateSettings: (settings) => {
        const current = get().tempSettings;
        set({ tempSettings: { ...current, ...settings } });
      },
      
      saveSettings: async () => {
        const { editingInstanceId, tempSettings } = get();
        if (!editingInstanceId || !tempSettings) return;
        
        try {
          await invoke('update_instance_settings', {
            instanceId: editingInstanceId,
            settings: tempSettings
          });
        } catch (error) {
          console.error('Failed to save settings:', error);
          throw error;
        }
      },
      
      resetSettings: () => {
        const { editingInstanceId } = get();
        if (editingInstanceId) {
          get().loadSettings(editingInstanceId);
        }
      },
    }),
    {
      name: 'instance-settings-storage',
      partialize: (state) => ({ tempSettings: state.tempSettings }),
    }
  )
);
```

### 4.2 防抖保存

```typescript
// src/hooks/useSettingsAutoSave.ts
export const useSettingsAutoSave = () => {
  const { saveSettings } = useInstanceSettingsStore();
  
  const debouncedSave = useCallback(
    debounce(() => {
      saveSettings().catch(console.error);
    }, 1000),
    [saveSettings]
  );
  
  return debouncedSave;
};

// 使用示例
const Component = () => {
  const autoSave = useSettingsAutoSave();
  const { updateSettings } = useInstanceSettingsStore();
  
  const handleJavaPathChange = (path: string) => {
    updateSettings({ java_path: path });
    autoSave(); // 1 秒后自动保存
  };
  
  return <JavaPathSelector onChange={handleJavaPathChange} />;
};
```

---

## 五、Rust 后端接口设计

### 5.1 需要新增的接口

```rust
// src-tauri/src/instance/settings.rs

/// 获取实例的游戏设置
#[tauri::command]
pub async fn get_instance_settings(instance_id: String) -> Result<GameSettings, String> {
    let instance = Instance::load(&instance_id)?;
    Ok(instance.game_settings.unwrap_or_default())
}

/// 更新实例的游戏设置
#[tauri::command]
pub async fn update_instance_settings(
    instance_id: String,
    settings: GameSettings,
) -> Result<(), String> {
    let mut instance = Instance::load(&instance_id)?;
    instance.game_settings = Some(settings);
    instance.save()?;
    Ok(())
}

/// 获取系统内存信息
#[tauri::command]
pub fn get_system_memory() -> u64 {
    sysinfo::System::new_all().total_memory() / 1024 / 1024 // MB
}

/// 选择 Java 路径
#[tauri::command]
pub async fn select_java_path(app: AppHandle) -> Result<Option<String>, String> {
    let dialog = FileDialogBuilder::new()
        .set_title("选择 Java 可执行文件")
        .add_filter("Java 可执行文件", &["exe"])
        .pick_file();
    
    if let Some(path) = dialog {
        Ok(Some(path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}
```

### 5.2 数据模型定义

```rust
// src-tauri/src/instance/mod.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSettings {
    // 基础设置
    #[serde(default)]
    pub use_instance_settings: bool,
    
    // Java 配置
    pub java_path: Option<String>,
    pub java_version: Option<String>,
    pub min_memory: Option<u64>,
    pub max_memory: Option<u64>,
    pub jvm_args: Option<Vec<String>>,
    
    // 版本隔离
    pub isolation_mode: Option<IsolationMode>,
    
    // 窗口配置
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fullscreen: Option<bool>,
    pub maximized: Option<bool>,
    pub vsync: Option<bool>,
    
    // 高级设置
    pub launcher_visible: Option<bool>,
    pub player_name: Option<String>,
    pub server_address: Option<String>,
    pub server_port: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum IsolationMode {
    Global,
    Version,
    Instance,
}

impl Default for GameSettings {
    fn default() -> Self {
        Self {
            use_instance_settings: false,
            java_path: None,
            java_version: None,
            min_memory: Some(4096),
            max_memory: Some(8192),
            jvm_args: None,
            isolation_mode: Some(IsolationMode::Global),
            width: Some(1280),
            height: Some(720),
            fullscreen: Some(false),
            maximized: Some(true),
            vsync: Some(true),
            launcher_visible: Some(true),
            player_name: None,
            server_address: None,
            server_port: None,
        }
    }
}
```

---

## 六、实施步骤

### 第一阶段：基础架构（1-2 天）

1. ✅ **修改 Rust 后端数据模型**
   - 添加 `GameSettings` 结构体
   - 添加 `IsolationMode` 枚举
   - 修改 `GameInstance` 结构体

2. ✅ **创建 Rust 接口**
   - `get_instance_settings`
   - `update_instance_settings`
   - `get_system_memory`
   - `select_java_path`

3. ✅ **修改 TypeScript 类型定义**
   - 更新 `GameInstance` 接口
   - 添加 `GameSettings` 接口
   - 添加 `IsolationMode` 枚举

### 第二阶段：UI 组件（2-3 天）

1. ✅ **创建基础组件**
   - `SettingsSection` - 配置区块
   - `SettingItem` - 配置项
   - `JavaPathSelector` - Java 路径选择器
   - `MemorySlider` - 内存滑块
   - `IsolationModeSelector` - 版本隔离选择器

2. ✅ **创建页面组件**
   - `InstanceGameSettings` - 游戏设置主页面
   - 集成到路由系统

### 第三阶段：状态管理（1 天）

1. ✅ **创建 Zustand Store**
   - `instanceSettingsStore`
   - 实现防抖保存
   - 集成到配置管理系统

2. ✅ **集成测试**
   - 测试配置加载
   - 测试配置保存
   - 测试防抖逻辑

### 第四阶段：优化完善（1-2 天）

1. ✅ **国际化**
   - 添加所有配置项的 i18n key
   - 中英文翻译

2. ✅ **样式优化**
   - 响应式布局
   - 主题适配
   - 动画效果

3. ✅ **错误处理**
   - 添加错误边界
   - 添加加载状态
   - 添加保存失败提示

---

## 七、技术要点

### 7.1 配置变更检测

```typescript
// 使用 deep compare 检测配置变更
import { useDeepCompareEffect } from 'use-deep-compare';

const Component = () => {
  const { tempSettings, saveSettings } = useInstanceSettingsStore();
  
  useDeepCompareEffect(() => {
    // 配置变更时自动保存
    const timer = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timer);
  }, [tempSettings]);
  
  return <div>...</div>;
};
```

### 7.2 内存计算逻辑

```typescript
// 自动计算最优内存（HMCL 算法）
const calculateOptimalMemory = (totalMemory: number): number => {
  // 系统内存的 50%，上限 8GB
  const optimal = Math.floor(totalMemory * 0.5);
  return Math.min(optimal, 8192);
};
```

### 7.3 版本隔离提示

```typescript
// 切换隔离模式时显示提示
const handleIsolationChange = (mode: IsolationMode) => {
  if (mode === IsolationMode.Instance) {
    toast.info(
      t('settings.isolation.migration', '切换后需要手动迁移数据，是否继续？'),
      {
        action: {
          label: t('common.confirm', '确认'),
          onClick: () => updateSettings({ isolation_mode: mode }),
        },
      }
    );
  } else {
    updateSettings({ isolation_mode: mode });
  }
};
```

---

## 八、验收标准

### 功能验收
- [ ] 可以修改 Java 路径并保存
- [ ] 可以调整内存分配并保存
- [ ] 可以切换版本隔离模式
- [ ] 可以修改窗口配置并保存
- [ ] 配置变更后自动保存（防抖）
- [ ] 重启后配置不丢失

### 视觉验收
- [ ] UI 布局与设计一致
- [ ] 响应式布局正常
- [ ] 主题切换正常
- [ ] 动画流畅

### 交互验收
- [ ] 所有输入框可正常编辑
- [ ] 滑块拖动流畅
- [ ] 下拉菜单正常展开
- [ ] 保存状态有提示

---

## 九、后续扩展

### 可能的增强功能
1. **Java 自动检测**
   - 扫描系统已安装的 Java
   - 推荐最优 Java 版本

2. **性能分析**
   - 显示当前配置的性能预估
   - 推荐最优配置

3. **配置预设**
   - 提供预设配置（纯净生存、模组服等）
   - 一键应用预设

4. **配置导入导出**
   - 导出配置为 JSON
   - 从 JSON 导入配置

---

**文档版本**：1.0  
**创建时间**：2026-05-06  
**最后更新**：2026-05-06
