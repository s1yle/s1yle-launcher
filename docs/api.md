# S1yle Launcher - API 文档

> **版本**: 0.2.0  
> **最后更新**: 2026-05-18

**相关文档**:
- 文档维护规范：[`MAINTENANCE.md`](MAINTENANCE.md) - 文档编写与更新指南
- 架构设计：[`architecture.md`](architecture.md) - 技术架构、配置系统
- 组件文档：[`components.md`](components.md) - 所有组件的详细说明

---

## 1. 统一 API 层

### 1.1 设计原则

1. **统一入口**: 所有前端调用后端的 API 都集中在 `rustInvoke.ts` 中
2. **类型安全**: 类型定义与 API 函数放在同一文件，便于维护
3. **单一文件**: 所有配置相关的 API 和类型都在一个文件中

### 1.2 架构

```
前端代码
    ↓
rustInvoke.ts (统一 API 层)
    ↓
Rust 后端命令
```

---

## 2. 配置相关 API

### 2.1 获取配置

**Rust 命令**: `get_config`  
**TypeScript 封装**: `getConfig(key)`

**使用示例**:
```typescript
import { getConfig } from '@/helper/rustInvoke';

const theme = await getConfig('theme.mode');
const sidebarWidth = await getConfig('ui.sidebarWidth');
```

### 2.2 更新配置

**Rust 命令**: `update_config`  
**TypeScript 封装**: `updateConfig(key, value)`

**使用示例**:
```typescript
import { updateConfig } from '@/helper/rustInvoke';

await updateConfig('theme.accentColor', 'blue');
await updateConfig('ui.sidebarWidth', 280);
```

### 2.3 批量更新配置

**Rust 命令**: `set_config_value`  
**TypeScript 封装**: `setConfigValue(path, value)`

**使用示例**:
```typescript
import { setConfigValue } from '@/helper/rustInvoke';

// 嵌套路径更新
await setConfigValue('theme.mode', 'dark');
```

---

## 3. 实例管理 API

### 3.1 获取实例列表

**Rust 命令**: `get_instances`  
**TypeScript 封装**: `getInstances()`

### 3.2 创建实例

**Rust 命令**: `create_instance`  
**TypeScript 封装**: `createInstance(config)`

### 3.3 删除实例

**Rust 命令**: `delete_instance`  
**TypeScript 封装**: `deleteInstance(instanceId)`

---

## 4. 下载管理 API

### 4.1 启动下载

**Rust 命令**: `start_download`  
**TypeScript 封装**: `startDownload(url, path)`

### 4.2 取消下载

**Rust 命令**: `cancel_download`  
**TypeScript 封装**: `cancelDownload(taskId)`

### 4.3 获取下载进度

**Rust 命令**: `get_download_progress`  
**TypeScript 封装**: `getDownloadProgress(taskId)`

---

## 5. 账户管理 API

### 5.1 添加微软账户

**Rust 命令**: `add_microsoft_account`  
**TypeScript 封装**: `addMicrosoftAccount()`

### 5.2 添加离线账户

**Rust 命令**: `add_offline_account`  
**TypeScript 封装**: `addOfflineAccount(name)`

### 5.3 删除账户

**Rust 命令**: `remove_account`  
**TypeScript 封装**: `removeAccount(uuid)`

### 5.4 获取当前账户

**Rust 命令**: `get_current_account`  
**TypeScript 封装**: `getCurrentAccount()`

---

## 6. 系统相关 API

### 6.1 获取应用路径

**Rust 命令**: `get_app_path`  
**TypeScript 封装**: `getAppPath()`

### 6.2 打开文件夹

**Rust 命令**: `open_folder`  
**TypeScript 封装**: `openFolder(path)`

### 6.3 打开外部链接

**Rust 命令**: `open_url` (Tauri plugin)  
**TypeScript 封装**: `openUrl(url)`

---

## 7. 错误处理

### 7.1 错误类型

```typescript
interface RustError {
  code: number;
  message: string;
  details?: string;
}
```

### 7.2 错误处理示例

```typescript
try {
  const config = await getConfig('theme.mode');
} catch (error) {
  if (error.code === 404) {
    console.error('配置项不存在');
  } else {
    console.error('未知错误:', error.message);
  }
}
```

---

## 8. 最佳实践

### 8.1 使用封装函数

```typescript
// ✅ 推荐：使用封装函数
const theme = await getConfig('theme.mode');

// ❌ 不推荐：直接调用 invoke
const theme = await invoke('get_config', { key: 'theme.mode' });
```

### 8.2 错误处理

```typescript
// ✅ 推荐：完整的错误处理
try {
  await updateConfig('theme.mode', 'dark');
  notification.success('设置已保存');
} catch (error) {
  notification.error('保存失败', error.message);
}

// ❌ 不推荐：忽略错误
await updateConfig('theme.mode', 'dark');
```

### 8.3 防抖处理

```typescript
// ✅ 推荐：配置更新防抖
const debouncedUpdate = useCallback(
  debounce((key, value) => {
    updateConfig(key, value);
  }, 300),
  []
);
```

---

**详细实现**: [`src/helper/rustInvoke.ts`](../src/helper/rustInvoke.ts)
