# 实例配置系统 - 使用示例

> **版本**: v1.0  
> **日期**: 2026-04-29  
> **状态**: 已实现 ✅

---

## 📚 API 概览

### 后端 Rust API

| 命令 | 说明 | 参数 |
|------|------|------|
| `config::get_config` | 获取全局配置 | - |
| `config::update_config` | 更新全局配置 | `new_config: AppConfig` |
| `get_config_value` | 动态获取配置值 | `key: String` |
| `set_config_value` | 动态设置配置值 | `key: String`, `value: Value` |
| `get_instance_config` | 获取实例配置 | `instance_id: String` |
| `update_instance_config` | 更新实例配置 | `instance_id: String`, `config: InstanceConfig` |
| `remove_instance_config` | 删除实例配置 | `instance_id: String` |
| `reset_config` | 重置配置到默认值 | - |
| `export_config` | 导出配置 | `target_path: String` |
| `import_config` | 导入配置 | `source_path: String` |

### 前端 TypeScript API

```typescript
import {
  getConfig,
  updateConfig,
  getInstanceConfig,
  updateInstanceConfig,
  removeInstanceConfig,
  resetConfig,
  exportConfig,
  importConfig,
} from '@/helper/configApi';
```

### 自定义 Hooks

```typescript
import {
  useConfig,           // 全局配置
  usePreferences,      // 用户偏好
  useInstanceConfig,   // 实例配置
  useDownloadConfig,   // 下载配置
} from '@/hooks/useConfig';
```

---

## 💡 使用示例

### 1. 获取和更新全局配置

#### **Rust 后端**

```rust
// 获取配置
let config = config_manager.get_config()?;
println!("应用路径：{}", config.base_path.display());

// 更新配置
let mut new_config = config.clone();
new_config.download.concurrent_limit = 32;
config_manager.update_config(new_config)?;

// 动态获取配置值
let theme = config_manager.get_value("preferences.theme")?;
println!("当前主题：{:?}", theme);

// 动态设置配置值
config_manager.write_config("preferences.theme", serde_json::json!("dark"))?;
```

#### **TypeScript 前端**

```typescript
import { useConfig } from '@/hooks/useConfig';

function SettingsPage() {
  const { config, loading, error, init } = useConfig();
  
  useEffect(() => {
    init(); // 初始化配置
  }, []);
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误：{error}</div>;
  if (!config) return null;
  
  return (
    <div>
      <h1>设置</h1>
      <p>应用路径：{config.base_path}</p>
      <p>并发下载数：{config.download.concurrent_limit}</p>
    </div>
  );
}
```

---

### 2. 实例配置管理

#### **获取实例配置**

```typescript
import { useInstanceConfig } from '@/hooks/useConfig';

function InstanceSettings({ instanceId }: { instanceId: string }) {
  const { instanceConfig, updateJava, updateMemory } = useInstanceConfig(instanceId);
  
  if (!instanceConfig) {
    return <div>实例配置不存在</div>;
  }
  
  return (
    <div>
      <h2>{instanceConfig.name} - 配置</h2>
      <p>版本：{instanceConfig.version}</p>
      <p>加载器：{instanceConfig.loader_type}</p>
      
      <h3>Java 设置</h3>
      <p>Java 路径：{instanceConfig.java.java_path || '使用内置 Java'}</p>
      <p>Java 参数：{instanceConfig.java.java_args.join(' ')}</p>
      
      <h3>内存设置</h3>
      <p>最小内存：{instanceConfig.memory.min_memory} MB</p>
      <p>最大内存：{instanceConfig.memory.max_memory} MB</p>
    </div>
  );
}
```

#### **更新实例配置**

```typescript
function InstanceConfigForm({ instanceId }: { instanceId: string }) {
  const { instanceConfig, updateJava, updateMemory } = useInstanceConfig(instanceId);
  const [javaPath, setJavaPath] = useState(instanceConfig?.java.java_path || '');
  const [maxMemory, setMaxMemory] = useState(instanceConfig?.memory.max_memory || 2048);
  
  const handleSave = async () => {
    try {
      // 更新 Java 配置
      await updateJava(javaPath, ['-XX:+UseG1GC', '-Xmx2G']);
      
      // 更新内存配置
      await updateMemory(1024, maxMemory);
      
      console.log('配置保存成功');
    } catch (e) {
      console.error('保存失败', e);
    }
  };
  
  return (
    <form onSubmit={handleSave}>
      <input
        type="text"
        value={javaPath}
        onChange={(e) => setJavaPath(e.target.value)}
        placeholder="Java 路径"
      />
      <input
        type="number"
        value={maxMemory}
        onChange={(e) => setMaxMemory(Number(e.target.value))}
        placeholder="最大内存 (MB)"
      />
      <button type="submit">保存</button>
    </form>
  );
}
```

---

### 3. 用户偏好设置

```typescript
import { usePreferences } from '@/hooks/useConfig';

function AppearanceSettings() {
  const { preferences, setTheme, setLanguage, toggleAnimation } = usePreferences();
  
  return (
    <div>
      <h2>外观设置</h2>
      
      <div>
        <label>主题</label>
        <select
          value={preferences?.theme || 'dark'}
          onChange={(e) => setTheme(e.target.value as 'dark' | 'light' | 'system')}
        >
          <option value="dark">暗夜</option>
          <option value="light">晨曦</option>
          <option value="system">系统</option>
        </select>
      </div>
      
      <div>
        <label>语言</label>
        <select
          value={preferences?.language || 'zh-CN'}
          onChange={(e) => setLanguage(e.target.value as 'zh-CN' | 'en-US')}
        >
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
        </select>
      </div>
      
      <div>
        <label>
          <input
            type="checkbox"
            checked={preferences?.enable_animation ?? true}
            onChange={toggleAnimation}
          />
          启用动画
        </label>
      </div>
    </div>
  );
}
```

---

### 4. 下载配置

```typescript
import { useDownloadConfig } from '@/hooks/useConfig';

function DownloadSettings() {
  const { downloadConfig, setDownloadPath, setConcurrentLimit } = useDownloadConfig();
  
  const handleChoosePath = async () => {
    const path = await open({ directory: true });
    if (path) {
      await setDownloadPath(path);
    }
  };
  
  return (
    <div>
      <h2>下载设置</h2>
      
      <div>
        <label>下载路径</label>
        <input
          type="text"
          value={downloadConfig?.download_path || ''}
          readOnly
        />
        <button onClick={handleChoosePath}>选择目录</button>
      </div>
      
      <div>
        <label>并发下载数</label>
        <input
          type="range"
          min="1"
          max="32"
          value={downloadConfig?.concurrent_limit || 16}
          onChange={(e) => setConcurrentLimit(Number(e.target.value))}
        />
        <span>{downloadConfig?.concurrent_limit || 16}</span>
      </div>
      
      <div>
        <label>
          <input
            type="checkbox"
            checked={downloadConfig?.auto_verify ?? true}
            readOnly
          />
          自动校验文件
        </label>
      </div>
    </div>
  );
}
```

---

### 5. 配置导入导出

```typescript
import { useConfig } from '@/hooks/useConfig';
import { useNotification } from '@/components/common';

function ConfigBackup() {
  const { config, exportConfig, importConfig, resetConfig } = useConfig();
  const { success, error } = useNotification();
  
  const handleExport = async () => {
    try {
      const path = await save({ defaultPath: 'app_config.json' });
      if (path) {
        await exportConfig(path);
        success('配置导出成功');
      }
    } catch (e) {
      error('导出失败', e instanceof Error ? e.message : '未知错误');
    }
  };
  
  const handleImport = async () => {
    try {
      const path = await open({
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (path) {
        await importConfig(path);
        success('配置导入成功');
      }
    } catch (e) {
      error('导入失败', e instanceof Error ? e.message : '未知错误');
    }
  };
  
  const handleReset = async () => {
    if (window.confirm('确定要重置所有配置吗？')) {
      await resetConfig();
      success('配置已重置');
    }
  };
  
  return (
    <div>
      <h2>配置备份</h2>
      <button onClick={handleExport}>导出配置</button>
      <button onClick={handleImport}>导入配置</button>
      <button onClick={handleReset}>重置配置</button>
    </div>
  );
}
```

---

### 6. 直接使用 Store

```typescript
import { useConfigStore } from '@/stores/configStore';

function AdvancedConfig() {
  const config = useConfigStore((s) => s.config);
  const updateInstanceConfig = useConfigStore((s) => s.updateInstanceConfig);
  const setConfigValue = useConfigStore((s) => s.setConfigValue);
  
  // 直接更新实例配置
  const handleAdvancedUpdate = async () => {
    await updateInstanceConfig('instance-id', {
      custom_args: ['--tweakClass=com.example.Tweak'],
      graphics: {
        width: 2560,
        height: 1440,
        fullscreen: true,
      },
    });
  };
  
  // 动态设置任意配置值
  const handleDynamicSet = async () => {
    await setConfigValue('download.concurrent_limit', 64);
  };
  
  return (
    <div>
      <button onClick={handleAdvancedUpdate}>高级更新</button>
      <button onClick={handleDynamicSet}>动态设置</button>
    </div>
  );
}
```

---

## 🔧 配置文件结构

### 配置文件位置

```
{app_data_dir}/.smcl/app_config.json
```

### 配置文件示例

```json
{
  "version": 1,
  "base_path": "C:/Users/User/AppData/Local/s1yle/mc_launcher",
  "window_position": {
    "x": 100,
    "y": 100,
    "width": 1024,
    "height": 680,
    "maximized": false
  },
  "preferences": {
    "theme": "dark",
    "accent_color": "indigo",
    "language": "zh-CN",
    "enable_animation": true
  },
  "download": {
    "download_path": "C:/Users/User/AppData/Local/s1yle/mc_launcher/download",
    "concurrent_limit": 16,
    "auto_verify": true
  },
  "instance_configs": {
    "uuid-1": {
      "id": "uuid-1",
      "name": "生存服务器",
      "version": "1.20.4",
      "loader_type": "Fabric",
      "loader_version": "0.15.7",
      "java": {
        "java_path": "C:/Program Files/Java/jdk-17/bin/java.exe",
        "java_args": ["-XX:+UseG1GC"],
        "use_bundled": false
      },
      "memory": {
        "min_memory": 1024,
        "max_memory": 4096
      },
      "graphics": {
        "width": 1920,
        "height": 1080,
        "fullscreen": false
      },
      "custom_args": [],
      "icon_path": null,
      "last_played": 1714377600,
      "created_at": 1714291200,
      "enabled": true
    }
  }
}
```

---

## 📝 最佳实践

### 1. 使用 Hooks 而非直接调用 API

```typescript
// ✅ 推荐
const { instanceConfig } = useInstanceConfig(instanceId);

// ❌ 避免
const config = await getInstanceConfig(instanceId);
```

### 2. 错误处理

```typescript
try {
  await updateInstanceConfig(instanceId, config);
  success('保存成功');
} catch (e) {
  const msg = e instanceof Error ? e.message : '保存失败';
  error('保存失败', msg);
  logger.error('保存实例配置失败', e);
}
```

### 3. 配置初始化

```typescript
function App() {
  const { init } = useConfig();
  
  useEffect(() => {
    init().catch(console.error);
  }, []);
  
  return <YourApp />;
}
```

### 4. 避免频繁写入

```typescript
// ✅ 推荐：防抖更新
const debouncedUpdate = useMemo(
  () => debounce((value) => updateConfig(value), 300),
  []
);

// ❌ 避免：每次变更都写入
onChange={(e) => updateConfig({ theme: e.target.value })}
```

---

## 🎯 下一步

配置系统已完全实现，可以开始使用。后续可以：

1. 在实例管理页面集成配置编辑功能
2. 在游戏设置页面添加全局配置 UI
3. 实现配置迁移逻辑（当配置文件版本升级时）
4. 添加配置验证和错误提示

---

**文档状态**: ✅ 完成  
**最后更新**: 2026-04-29
