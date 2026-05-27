# WeCraft! Launcher - API 文档

> **版本**: 0.1.0-alpha.1  
> **最后更新**: 2026-05-27

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
Rust 后端命令 (lib.rs generate_handler!)
```

---

## 2. 配置相关 API

### 2.1 获取配置

**Rust 命令**: `get_config`  
**TypeScript 封装**: `getConfig(key)`

```typescript
import { getConfig } from '@/helper/rustInvoke';
const theme = await getConfig('theme.mode');
```

### 2.2 获取配置值

**Rust 命令**: `get_config_value`  
**TypeScript 封装**: `getConfigValue(path)`

```typescript
import { getConfigValue } from '@/helper/rustInvoke';
const width = await getConfigValue('ui.sidebarWidth');
```

### 2.3 设置配置值

**Rust 命令**: `set_config_value`  
**TypeScript 封装**: `setConfigValue(path, value)`

```typescript
import { setConfigValue } from '@/helper/rustInvoke';
await setConfigValue('theme.accentColor', 'blue');
```

### 2.4 更新配置

**Rust 命令**: `config::update_config`  
**TypeScript 封装**: `updateConfig(key, value)`

### 2.5 重置配置

**Rust 命令**: `reset_config`  
**TypeScript 封装**: `resetConfig()`

### 2.6 导入导出配置

**Rust 命令**: `export_config` / `import_config`  
**TypeScript 封装**: `exportConfig()` / `importConfig()`

### 2.7 实例配置

| 命令 | 封装 | 说明 |
|------|------|------|
| `get_instance_config` | `getInstanceConfig(id)` | 获取实例配置 |
| `update_instance_config` | `updateInstanceConfig(id, config)` | 更新实例配置 |
| `remove_instance_config` | `removeInstanceConfig(id)` | 删除实例配置 |

---

## 3. 路径配置 API

### 3.1 获取路径配置

**Rust 命令**: `config::get_path_config`  
**TypeScript 封装**: `getPathConfig()`

### 3.2 更新路径配置

**Rust 命令**: `config::update_path_config`  
**TypeScript 封装**: `updatePathConfig(config)`

### 3.3 路径查询

| 命令 | 封装 | 说明 |
|------|------|------|
| `config::get_instance_path` | `getInstancePath()` | 获取实例路径 |
| `config::get_versions_path` | `getVersionsPath()` | 获取版本路径 |
| `config::get_libraries_path` | `getLibrariesPath()` | 获取库文件路径 |
| `config::get_assets_path` | `getAssetsPath()` | 获取资源路径 |
| `config::get_natives_path` | `getNativesPath()` | 获取本地库路径 |

---

## 4. 实例管理 API

### 4.1 实例 CRUD

| 命令 | 封装 | 说明 |
|------|------|------|
| `scan_instances` | `scanInstances()` | 扫描实例列表 |
| `get_instance` | `getInstance(id)` | 获取单个实例 |
| `create_instance` | `createInstance(config)` | 创建实例 |
| `delete_instance` | `deleteInstance(id)` | 删除实例 |
| `copy_instance` | `copyInstance(id)` | 复制实例 |
| `rename_instance` | `renameInstance(id, name)` | 重命名实例 |
| `update_instance` | `updateInstance(id, data)` | 更新实例 |
| `get_instances_path` | `getInstancesPath()` | 获取实例根路径 |

### 4.2 文件夹管理

| 命令 | 封装 | 说明 |
|------|------|------|
| `scan_known_mc_paths` | `scanKnownMcPaths()` | 扫描已知 MC 路径 |
| `add_known_path` | `addKnownPath(path)` | 添加已知路径 |
| `remove_known_path` | `removeKnownPath(path)` | 移除已知路径 |
| `set_default_folder` | `setDefaultFolder(path)` | 设置默认文件夹 |
| `validate_folder` | `validateFolder(path)` | 验证文件夹 |
| `add_validated_folder` | `addValidatedFolder(path)` | 添加已验证文件夹 |
| `migrate_directory_structure` | `migrateDirectoryStructure()` | 迁移目录结构 |

### 4.3 实例设置

| 命令 | 封装 | 说明 |
|------|------|------|
| `get_instance_settings` | `getInstanceSettings(id)` | 获取实例设置 |
| `update_instance_settings` | `updateInstanceSettings(id, settings)` | 更新实例设置 |
| `get_system_memory` | `getSystemMemory()` | 获取系统内存 |
| `select_java_path` | `selectJavaPath()` | 选择 Java 路径 |

---

## 5. 下载管理 API

### 5.1 版本信息

| 命令 | 封装 | 说明 |
|------|------|------|
| `get_version_manifest` | `getVersionManifest()` | 获取版本清单 |
| `get_version_detail` | `getVersionDetail(url)` | 获取版本详情 |
| `get_version_download_manifest` | `getVersionDownloadManifest(url)` | 获取下载清单 |
| `get_game_versions` | `getGameVersions()` | 获取游戏版本列表 |

### 5.2 下载操作

| 命令 | 封装 | 说明 |
|------|------|------|
| `download_file` | `downloadFile(config)` | 下载文件 |
| `download_and_deploy` | `downloadAndDeploy(config)` | 下载并部署 |
| `cancel_download` | `cancelDownload(taskId)` | 取消下载 |
| `clear_completed_tasks` | `clearCompletedTasks()` | 清除已完成任务 |
| `get_download_tasks` | `getDownloadTasks()` | 获取下载任务列表 |
| `get_download_task` | `getDownloadTask(taskId)` | 获取单个下载任务 |

### 5.3 部署操作

| 命令 | 封装 | 说明 |
|------|------|------|
| `deploy_version_files` | `deployVersionFiles(config)` | 部署版本文件 |
| `deploy_version_global` | `deployVersionHmcl(config)` | 全局资源部署 |
| `deploy_version_to_instance` | `deployVersionToInstance(opts)` | 部署到实例 |
| `is_version_deployed` | `isVersionDeployed(id)` | 检查版本是否已部署 |

### 5.4 下载配置

| 命令 | 封装 | 说明 |
|------|------|------|
| `get_download_base_path` | `getDownloadBasePath()` | 获取下载基础路径 |
| `set_download_base_path` | `setDownloadBasePath(path)` | 设置下载基础路径 |

---

## 6. 模组加载器 API

| 命令 | 封装 | 说明 |
|------|------|------|
| `get_fabric_versions` | `getFabricVersions()` | 获取 Fabric 版本列表 |
| `get_fabric_version_detail` | `getFabricVersionDetail(loader, ver)` | 获取 Fabric 版本详情 |
| `build_fabric_launch_config` | `buildFabricLaunchConfig(config)` | 构建 Fabric 启动配置 |
| `get_forge_versions` | `getForgeVersions()` | 获取 Forge 版本列表 |
| `build_forge_launch_config` | `buildForgeLaunchConfig(config)` | 构建 Forge 启动配置 |
| `get_installed_mod_loaders` | `getInstalledModLoaders(id)` | 获取已安装的加载器 |
| `install_with_loaders` | `installWithLoaders(config)` | 安装含加载器的版本 |

---

## 7. 账户管理 API

| 命令 | 封装 | 说明 |
|------|------|------|
| `add_account` | `invokeAddAccount()` | 添加账户 |
| `get_account_list` | `getAccountList()` | 获取账户列表 |
| `get_current_account` | `getCurrentAccount()` | 获取当前账户 |
| `delete_account` | `deleteAccount(uuid)` | 删除账户 |
| `set_current_account` | `setCurrentAccount(uuid)` | 设置当前账户 |
| `save_accounts_to_disk` | `invokeSaveAccount()` | 保存账户到磁盘 |
| `load_accounts_from_disk` | `invokeLoadAccount()` | 从磁盘加载账户 |
| `initialize_account_system` | `invokeAccInit()` | 初始化账户系统 |

---

## 8. 启动管理 API

| 命令 | 封装 | 说明 |
|------|------|------|
| `tauri_launch_instance` | `launchInstance(config)` | 启动实例 |
| `tauri_stop_instance` | `stopInstance()` | 停止实例 |
| `tauri_get_launch_status` | `getLaunchStatus()` | 获取启动状态 |
| `tauri_get_launch_config` | `getLaunchConfig()` | 获取启动配置 |
| `tauri_update_launch_config` | `updateLaunchConfig(config)` | 更新启动配置 |

---

## 9. 窗口管理 API

| 命令 | 封装 | 说明 |
|------|------|------|
| `save_window_position` | `saveWindowPosition(pos)` | 保存窗口位置 |
| `load_window_position` | `loadWindowPosition()` | 加载窗口位置 |

---

## 10. 系统相关 API

| 命令 | 封装 | 说明 |
|------|------|------|
| `open_folder` | `openFolder(path)` | 打开文件夹 |
| `open_url` | `openUrl(url)` | 打开外部链接 |
| `get_system_info` | — | 获取系统信息 |
| `log_frontend` | `invokeLogger(msg)` | 前端日志 |
| `greet` | — | 测试命令 |

---

## 11. 错误处理

### 11.1 错误类型

```typescript
interface RustError {
  code: number;
  message: string;
  details?: string;
}
```

### 11.2 错误处理示例

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

## 12. 最佳实践

### 12.1 使用封装函数

```typescript
// ✅ 推荐：使用封装函数
const theme = await getConfig('theme.mode');

// ❌ 不推荐：直接调用 invoke
const theme = await invoke('get_config', { key: 'theme.mode' });
```

### 12.2 错误处理

```typescript
// ✅ 推荐：完整的错误处理
try {
  await setConfigValue('theme.mode', 'dark');
  notification.success('设置已保存');
} catch (error) {
  notification.error('保存失败', error.message);
}

// ❌ 不推荐：忽略错误
await setConfigValue('theme.mode', 'dark');
```

### 12.3 防抖处理

```typescript
// ✅ 推荐：配置更新防抖
const debouncedUpdate = useCallback(
  debounce((key, value) => {
    setConfigValue(key, value);
  }, 300),
  []
);
```

---

**详细实现**: [`src/helper/rustInvoke.ts`](../src/helper/rustInvoke.ts)

**命令注册**: [`src-tauri/src/lib.rs`](../src-tauri/src/lib.rs)
