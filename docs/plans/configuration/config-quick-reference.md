# 实例配置系统 - 快速参考

> **版本**: v1.0  
> **最后更新**: 2026-04-29

---

## 🚀 快速开始

### 1. 导入 Hooks

```typescript
import {
  useConfig,           // 全局配置
  usePreferences,      // 用户偏好
  useInstanceConfig,   // 实例配置
  useDownloadConfig,   // 下载配置
} from '@/hooks/useConfig';
```

### 2. 初始化配置

```typescript
// 在 App.tsx 或主组件中
function App() {
  const { init } = useConfig();
  
  useEffect(() => {
    init(); // 初始化配置
  }, []);
  
  return <YourApp />;
}
```

---

## 📖 API 速查

### 全局配置

```typescript
const { config, loading, error } = useConfig();

// 访问配置
config?.base_path
config?.window_position
config?.preferences
config?.download
config?.instance_configs
```

### 用户偏好

```typescript
const { preferences, setTheme, setLanguage, toggleAnimation } = usePreferences();

// 设置主题
await setTheme('dark');
await setTheme('light');
await setTheme('system');

// 设置语言
await setLanguage('zh-CN');
await setLanguage('en-US');

// 切换动画
await toggleAnimation();
```

### 实例配置

```typescript
const { instanceConfig, updateJava, updateMemory } = useInstanceConfig(instanceId);

// 访问配置
instanceConfig?.name
instanceConfig?.version
instanceConfig?.loader_type
instanceConfig?.java
instanceConfig?.memory
instanceConfig?.graphics

// 更新 Java 配置
await updateJava('/path/to/java', ['-Xmx2G', '-Xms1G']);

// 更新内存配置
await updateMemory(1024, 4096);
```

### 下载配置

```typescript
const { downloadConfig, setDownloadPath, setConcurrentLimit } = useDownloadConfig();

// 访问配置
downloadConfig?.download_path
downloadConfig?.concurrent_limit
downloadConfig?.auto_verify

// 更新配置
await setDownloadPath('/new/path');
await setConcurrentLimit(32);
```

---

## 🔧 直接 API 调用

### 获取/更新配置

```typescript
import {
  getConfig,
  updateConfig,
  getInstanceConfig,
  updateInstanceConfig,
} from '@/helper/rustInvoke';

// 获取全局配置
const config = await getConfig();

// 更新全局配置
await updateConfig({ ...config, download: { ...config.download, concurrent_limit: 32 } });

// 获取实例配置
const instanceConfig = await getInstanceConfig('instance-id');

// 更新实例配置
await updateInstanceConfig('instance-id', {
  ...instanceConfig,
  memory: { min_memory: 1024, max_memory: 4096 },
});
```

### 动态配置访问

```typescript
import { getConfigValue, setConfigValue } from '@/helper/rustInvoke';

// 获取配置值
const theme = await getConfigValue('preferences.theme');

// 设置配置值
await setConfigValue('preferences.theme', 'dark');
```

### 配置导入导出

```typescript
import { exportConfig, importConfig, resetConfig } from '@/helper/rustInvoke';

// 导出配置
await exportConfig('/path/to/backup.json');

// 导入配置
await importConfig('/path/to/backup.json');

// 重置配置
await resetConfig();
```

---

## 📦 配置文件结构

### 位置

```
{app_data_dir}/.smcl/app_config.json
```

### 结构

```json
{
  "version": 1,
  "base_path": "...",
  "window_position": { "x": 100, "y": 100, "width": 1024, "height": 680, "maximized": false },
  "preferences": { "theme": "dark", "accent_color": "indigo", "language": "zh-CN", "enable_animation": true },
  "download": { "download_path": "...", "concurrent_limit": 16, "auto_verify": true },
  "instance_configs": {
    "uuid-1": {
      "id": "uuid-1",
      "name": "实例名称",
      "version": "1.20.4",
      "loader_type": "Fabric",
      "loader_version": "0.15.7",
      "java": { "java_path": "...", "java_args": [], "use_bundled": false },
      "memory": { "min_memory": 512, "max_memory": 2048 },
      "graphics": { "width": 1920, "height": 1080, "fullscreen": false },
      "custom_args": [],
      "icon_path": null,
      "last_played": null,
      "created_at": 1234567890,
      "enabled": true
    }
  }
}
```

---

## 🎯 常用模式

### 模式 1: 表单编辑

```typescript
function InstanceConfigForm({ instanceId }: { instanceId: string }) {
  const { instanceConfig, updateMemory } = useInstanceConfig(instanceId);
  const [maxMemory, setMaxMemory] = useState(instanceConfig?.memory.max_memory || 2048);
  
  const handleSave = async () => {
    await updateMemory(1024, maxMemory);
  };
  
  return (
    <form onSubmit={handleSave}>
      <input
        type="number"
        value={maxMemory}
        onChange={(e) => setMaxMemory(Number(e.target.value))}
      />
      <button type="submit">保存</button>
    </form>
  );
}
```

### 模式 2: 设置页面

```typescript
function SettingsPage() {
  const { config } = useConfig();
  const { preferences, setTheme } = usePreferences();
  
  return (
    <div>
      <h1>设置</h1>
      
      <select value={preferences?.theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="dark">暗夜</option>
        <option value="light">晨曦</option>
        <option value="system">系统</option>
      </select>
      
      <p>下载路径：{config?.download.download_path}</p>
      <p>并发数：{config?.download.concurrent_limit}</p>
    </div>
  );
}
```

### 模式 3: 配置备份

```typescript
function ConfigBackup() {
  const { exportConfig, importConfig, resetConfig } = useConfig();
  
  const handleExport = async () => {
    const path = await save({ defaultPath: 'config.json' });
    await exportConfig(path);
  };
  
  const handleImport = async () => {
    const path = await open({ filters: [{ name: 'JSON', extensions: ['json'] }] });
    await importConfig(path);
  };
  
  const handleReset = async () => {
    if (confirm('确定重置？')) {
      await resetConfig();
    }
  };
  
  return (
    <div>
      <button onClick={handleExport}>导出</button>
      <button onClick={handleImport}>导入</button>
      <button onClick={handleReset}>重置</button>
    </div>
  );
}
```

---

## ⚠️ 注意事项

### ✅ 推荐做法

```typescript
// 1. 使用 Hooks
const { instanceConfig } = useInstanceConfig(instanceId);

// 2. 错误处理
try {
  await updateInstanceConfig(instanceId, config);
  success('保存成功');
} catch (e) {
  error('保存失败', e.message);
}

// 3. 初始化配置
useEffect(() => {
  init();
}, []);
```

### ❌ 避免的做法

```typescript
// 1. 直接调用 API（除非必要）
const config = await invoke('get_config'); // ❌

// 2. 忽略错误
updateInstanceConfig(instanceId, config); // ❌ 没有 try-catch

// 3. 频繁写入
onChange={(e) => updateConfig({ theme: e.target.value })} // ❌ 应该防抖
```

---

## 🐛 故障排除

### 问题 1: 配置未加载

**症状**: `config` 为 `null`

**解决**:
```typescript
// 确保在 App.tsx 中调用 init()
const { init } = useConfig();
useEffect(() => {
  init();
}, []);
```

### 问题 2: 配置未保存

**症状**: 配置更新后重启丢失

**解决**:
```typescript
// 检查后端日志
// 确保配置文件路径可写
// 检查 .smcl 目录权限
```

### 问题 3: 类型错误

**症状**: TypeScript 报错

**解决**:
```typescript
// 确保导入正确的类型
import type { InstanceConfig } from '@/types/config';

// 检查配置对象结构
console.log(instanceConfig);
```

---

## 📚 相关文档

- [设计方案](./INSTANCE_CONFIG_SYSTEM_DESIGN.md)
- [使用示例](./CONFIG_SYSTEM_EXAMPLES.md)
- [实施总结](./IMPLEMENTATION_SUMMARY.md)

---

**快速参考版本**: v1.0  
**最后更新**: 2026-04-29
