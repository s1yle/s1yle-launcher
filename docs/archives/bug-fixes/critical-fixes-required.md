# 问题深度分析与完整修复方案

> **状态**: 已完成 📝  
> **最后更新**: 未知

## 执行时间
2026-04-29

---

## 🔍 问题诊断

### 用户反馈的三个问题

1. ❌ **配置覆盖保存** - window 模块保存配置时直接覆盖 `app_config.json`
2. ❌ **实例文件夹覆盖保存** - 添加游戏文件夹后直接覆盖配置
3. ❌ **部署没有执行** - 下载完成后文件只在 `.smcl/download/`，没有部署到实例

---

## 📋 问题根因分析

### 问题 1：配置覆盖保存

#### 根因：两个函数直接读写文件，绕过 ConfigManager

**文件 1**: `src-tauri/src/window.rs`
```rust
pub fn save_window_position(...) -> Result<(), String> {
    // ❌ 直接创建一个新的 Map，只包含 window_pos
    let mut map = serde_json::Map::new();
    map.insert("window_pos".to_string(), serde_json::to_value(&position).unwrap());
    let json = serde_json::to_string_pretty(&map).map_err(|e| e.to_string())?;
    
    // ❌ 直接写入整个文件，覆盖所有其他配置
    fs::write(&pos_file, json).map_err(|e| e.to_string())?;
}
```

**文件 2**: `src-tauri/src/instance/manager.rs`
```rust
fn save_known_paths(&self, paths: &[KnownPath]) -> Result<(), String> {
    // ❌ 直接序列化 known_paths 数组
    let content = serde_json::to_string_pretty(paths).map_err(|e| e.to_string())?;
    
    // ❌ 直接写入整个文件，覆盖所有其他配置
    fs::write(config_path, content).map_err(|e| e.to_string())?;
}
```

#### 为什么 `set_nested_value` 的修改没有生效？

**原因**: 这两个函数**根本没有调用** `ConfigManager::update_config()`！

```
ConfigManager::update_config()
  ↓
parse_key_path()
  ↓
set_nested_value()  ✅ 这个修改生效了，但没人调用
  ↓
save_to_disk()
```

但实际执行的是：
```
window.rs::save_window_position()
  ↓
fs::write()  ❌ 直接写文件，绕过所有逻辑
```

---

### 问题 2：部署没有执行

#### 代码确实在，但可能没有执行

**文件**: `src/hooks/useDownload.ts` (第 260-279 行)
```typescript
await deployVersionFiles(version.id);
logger.info('版本部署到全局目录成功', version.id);

// 部署到选中的实例目录
const instanceStore = useInstanceStore.getState();
const selectedInstance = instanceStore.getSelectedInstance();

if (selectedInstance) {
  try {
    const instancePath = selectedInstance.path;
    logger.info('开始部署版本到实例', { versionId: version.id, instancePath, instanceName: selectedInstance.name });
    await deployVersionToInstance(instancePath, version.id);  // ✅ 代码在这里
    logger.info('版本部署到实例成功', version.id);
  } catch (deployError) {
    logger.error('部署到实例失败（非致命）', { versionId: version.id, error: deployError });
  }
} else {
  logger.info('未选中实例，跳过部署到实例', version.id);
}
```

#### 可能的问题

1. **没有选中实例** - `selectedInstance` 为 `null`
2. **部署出错被吞掉** - `catch` 块只记录日志，不抛出错误
3. **日志没有显示** - 前端日志可能没有输出到控制台
4. **后端日志没有查看** - 没有检查后端的部署日志

---

## ✅ 完整修复方案

### 修复 1：统一配置保存逻辑

#### 方案 A：修改 window.rs 使用 ConfigManager

**修改前**:
```rust
pub fn save_window_position(
    x: i32, y: i32, width: u32, height: u32, maximized: bool,
    cm: State<'_, ConfigManager>,  // ✅ 添加 ConfigManager
) -> Result<(), String> {
    let mut position = WindowPosition { x, y, width, height, maximized };
    window_check(&mut position);
    
    // ✅ 使用 ConfigManager 更新配置
    cm.update_window_pos(position)
}
```

**ConfigManager 新增方法**:
```rust
impl ConfigManager {
    pub fn update_window_pos(&self, pos: WindowPosition) -> Result<(), String> {
        let mut config = self.get_config()?;
        config.window_position = pos;
        self.update_config(config)  // ✅ 使用统一的 update_config
    }
}
```

#### 方案 B：使用配置路径更新（推荐）

**修改 `window.rs`**:
```rust
pub fn save_window_position(
    x: i32, y: i32, width: u32, height: u32, maximized: bool,
    cm: State<'_, ConfigManager>,
) -> Result<(), String> {
    let position = WindowPosition { x, y, width, height, maximized };
    window_check(&position);
    
    // ✅ 使用动态配置更新
    cm.update_value("window_position", serde_json::to_value(&position)?)
}
```

**修改 `instance/manager.rs`**:
```rust
fn save_known_paths(&self, paths: &[KnownPath]) -> Result<(), String> {
    // ✅ 获取 ConfigManager
    let config_manager = ConfigManager::new();
    
    // ✅ 使用统一的更新方法
    config_manager.update_value(
        "known_folders",
        serde_json::to_value(paths)?
    )
}
```

---

### 修复 2：确保部署执行

#### Step 1: 添加详细日志

**修改 `useDownload.ts`**:
```typescript
if (selectedInstance) {
  try {
    const instancePath = selectedInstance.path;
    console.log('[DEBUG] 开始部署到实例:', {
      versionId: version.id,
      instancePath,
      instanceName: selectedInstance.name,
    });
    
    const result = await deployVersionToInstance(instancePath, version.id);
    console.log('[DEBUG] 部署结果:', result);
    logger.info('版本部署到实例成功', version.id);
  } catch (deployError) {
    console.error('[DEBUG] 部署到实例错误:', deployError);
    logger.error('部署到实例失败（非致命）', { 
      versionId: version.id, 
      error: deployError,
      stack: deployError instanceof Error ? deployError.stack : undefined
    });
  }
} else {
  console.warn('[DEBUG] 未选中实例，跳过部署');
  logger.info('未选中实例，跳过部署到实例', version.id);
}
```

#### Step 2: 检查实例选择

在部署前，确保：
1. **实例列表中有实例**
2. **选中了实例**（`selectedInstanceId` 不为 `null`）
3. **实例路径正确**（指向 `minecraft/default`）

**调试代码**:
```typescript
const instanceStore = useInstanceStore.getState();
const state = instanceStore.getState();
console.log('[DEBUG] 实例状态:', {
  instances: state.instances.length,
  selectedFolderId: state.selectedFolderId,
  selectedInstanceId: state.selectedInstanceId,
  instancesPath: state.instancesPath,
});

const selectedInstance = state.getSelectedInstance();
console.log('[DEBUG] 选中的实例:', selectedInstance);
```

#### Step 3: 查看后端日志

启动应用时，在终端查看后端日志：
```bash
pnpm tauri dev
```

**关键日志**:
```
==================== 开始部署版本到实例 ====================
版本 ID: 1.20.4
实例路径：F:\i86\repos\s1yle-launcher\minecraft\default
版本名称：1.20.4
...
```

如果没有看到这些日志，说明：
- ❌ 没有调用 `deployVersionToInstance`
- ❌ 或者调用前就出错了

---

### 修复 3：目录结构验证

#### 当前代码（已修改）

**文件**: `src-tauri/src/download/deploy.rs` (第 197-203 行)
```rust
// ✅ 所有文件都放在 versions/{version_name}/ 目录下
let version_base_dir = instance_dir.join("versions").join(&version_name);
let libraries_dir = version_base_dir.join("libraries");
let assets_dir = version_base_dir.join("assets");
let natives_dir = version_base_dir.join("natives");
let indexes_dir = version_base_dir.join("indexes");
let objects_dir = version_base_dir.join("objects");
```

#### 验证方法

下载完成后，检查目录结构：
```bash
cd /mnt/f/i86/repos/s1yle-launcher/src-tauri
tree minecraft/default/versions/1.20.4/ -L 2
```

**预期结构**:
```
minecraft/default/versions/1.20.4/
├── 1.20.4.jar
├── 1.20.4.json
├── libraries/
├── assets/
│   ├── indexes/
│   └── objects/
├── natives/
└── indexes/
```

**如果结构不对**，说明：
- ❌ 代码没有重新编译
- ❌ 或者部署的是旧版本

---

## 🔧 立即修复步骤

### 第一步：修复 window.rs

```rust
// src-tauri/src/window.rs
use crate::config::{self, window_check, ConfigManager, WindowPosition, SAVED_POSITION};
use std::fs;
use tauri::State;

#[tauri::command]
pub fn save_window_position(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    maximized: bool,
    cm: State<'_, ConfigManager>,  // ✅ 添加参数
) -> Result<(), String> {
    let mut position = WindowPosition {
        x, y, width, height, maximized,
    };

    window_check(&mut position);
    
    // ✅ 使用 ConfigManager 更新配置
    cm.update_window_pos(position)
}
```

### 第二步：修复 instance/manager.rs

```rust
// src-tauri/src/instance/manager.rs
fn save_known_paths(&self, paths: &[KnownPath]) -> Result<(), String> {
    // ✅ 使用 ConfigManager 统一管理
    use crate::config::ConfigManager;
    
    let config_manager = ConfigManager::load_or_create();
    let mut config = config_manager.get_config()?;
    
    // ✅ 更新 known_folders 字段
    config.instance_configs.insert(
        "known_folders".to_string(),
        serde_json::to_value(paths)?
    );
    
    config_manager.update_config(config)
}
```

### 第三步：添加部署调试日志

```typescript
// src/hooks/useDownload.ts
const deployVersion = useCallback(async (versionId: string) => {
  try {
    const instanceStore = useInstanceStore.getState();
    const selectedInstance = instanceStore.getSelectedInstance();
    
    console.log('[DEBUG] 部署前检查:', {
      selectedInstance,
      hasInstance: !!selectedInstance,
      instancePath: selectedInstance?.path,
    });
    
    if (!selectedInstance) {
      console.error('[DEBUG] 没有选中的实例！');
      throw new Error('未选择实例');
    }

    const instancePath = selectedInstance.path;
    console.log('[DEBUG] 开始部署版本到实例:', { versionId, instancePath });
    
    await deployVersionToInstance(instancePath, versionId);
    console.log('[DEBUG] 部署完成');
    logger.info('版本部署成功', versionId);
    await loadInstalledVersions();
  } catch (e) {
    console.error('[DEBUG] 部署失败:', e);
    logger.error('版本部署失败', e);
    throw e;
  }
}, [loadInstalledVersions]);
```

### 第四步：重新编译

```bash
cd src-tauri
cargo build
```

### 第五步：测试验证

1. **启动应用**:
   ```bash
   pnpm tauri dev
   ```

2. **打开浏览器控制台**:
   - 按 `F12` 打开开发者工具
   - 查看 `Console` 标签

3. **下载游戏**:
   - 导航到 "下载" → "游戏下载"
   - 选择一个版本下载

4. **观察日志**:
   - 前端日志：`[DEBUG] 部署前检查:...`
   - 后端日志：`==================== 开始部署版本到实例 ====================`

5. **检查目录**:
   ```bash
   cd /mnt/f/i86/repos/s1yle-launcher/src-tauri
   ls -la minecraft/default/versions/1.20.4/
   ```

---

## 📝 总结

### 为什么之前的修改没有生效？

1. **配置覆盖问题**:
   - ✅ `set_nested_value` 修改了，但**没人调用**
   - ❌ `window.rs` 和 `instance/manager.rs` 直接写文件

2. **部署问题**:
   - ✅ 代码修改了，但**可能没有执行**
   - ❌ 没有选中实例
   - ❌ 错误被吞掉，看不到问题

3. **目录结构问题**:
   - ✅ 代码修改了
   - ❌ 但可能没有重新编译
   - ❌ 或者部署逻辑根本没被调用

### 核心问题

**绕过 ConfigManager，直接读写文件**是导致配置覆盖的根本原因！

### 解决方案

1. **统一使用 ConfigManager** - 所有配置更新都通过 `update_config()`
2. **添加详细日志** - 前端和后端都输出调试信息
3. **查看后端日志** - 在终端查看实际的部署过程
4. **重新编译** - 确保修改的代码被编译

---

## 🎯 下一步行动

1. ✅ 修复 `window.rs` - 使用 `ConfigManager`
2. ✅ 修复 `instance/manager.rs` - 使用 `ConfigManager`
3. ✅ 添加调试日志 - 前端和后端
4. ✅ 重新编译 - `cargo build`
5. ✅ 测试验证 - 查看日志和目录结构

**需要我立即执行这些修复吗？**
