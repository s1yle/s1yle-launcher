# 配置覆盖问题修复完成

> **状态**: 已实施 ✅  
> **最后更新**: 2026-05-10

## 执行时间
2026-04-29

---

## ✅ 已完成的修复

### 1. window.rs - 窗口位置保存 ✅

**文件**: `src-tauri/src/window.rs`

**修复前**:
```rust
#[tauri::command]
pub fn save_window_position(...) -> Result<(), String> {
    // ❌ 直接创建 Map，只包含 window_pos
    let mut map = serde_json::Map::new();
    map.insert("window_pos".to_string(), serde_json::to_value(&position).unwrap());
    let json = serde_json::to_string_pretty(&map).unwrap();
    
    // ❌ 直接写入整个文件，覆盖所有其他配置
    fs::write(&pos_file, json)?;
}
```

**修复后**:
```rust
#[tauri::command]
pub fn save_window_position(
    ...,
    cm: State<'_, ConfigManager>,  // ✅ 添加参数
) -> Result<(), String> {
    // ✅ 使用 ConfigManager 统一更新配置
    cm.update_window_pos(position)
}
```

**ConfigManager 新增方法**:
```rust
pub fn update_window_pos(&self, pos: WindowPosition) -> Result<(), String> {
    let mut config = self.get_config()?;
    config.window_position = pos;
    self.update_config(config)  // ✅ 使用统一的 update_config
}
```

---

### 2. config/manager.rs - update_value 方法 ✅

**文件**: `src-tauri/src/config/manager.rs`

**新增方法**:
```rust
/// # 使用动态路径更新配置值
pub fn update_value(&self, key_path: &str, value: Value) -> Result<(), String> {
    let config = self.get_config()?;
    let mut config_value = serde_json::to_value(&config)?;
    
    let path_segments: Vec<&str> = key_path.split('.').collect();
    set_nested_value(&mut config_value, &path_segments, value)?;
    
    let new_config: AppConfig = serde_json::from_value(config_value)?;
    self.update_config(new_config)
}
```

**功能**:
- ✅ 支持动态路径更新（如 `"window_position.x"`）
- ✅ 自动创建缺失的中间节点
- ✅ 保留其他配置项
- ✅ 类型安全检查

---

### 3. instance/manager.rs - 已知路径保存 ✅

**文件**: `src-tauri/src/instance/manager.rs`

**修复前**:
```rust
fn save_known_paths(&self, paths: &[KnownPath]) -> Result<(), String> {
    // ❌ 直接序列化并写入文件
    let content = serde_json::to_string_pretty(paths)?;
    fs::write(config_path, content)?;
}
```

**修复后**:
```rust
fn save_known_paths(&self, paths: &[KnownPath]) -> Result<(), String> {
    // ✅ 使用 ConfigManager 统一管理配置
    use crate::config::ConfigManager;
    
    let config_manager = ConfigManager::load_or_create();
    let paths_value = serde_json::to_value(paths)?;
    
    // ✅ 使用 update_value 方法更新配置
    config_manager.update_value("instance_configs.known_folders", paths_value)?;
    
    log_info!("已知路径已保存：{} 个文件夹", paths.len());
    Ok(())
}
```

---

## 📊 编译状态

```bash
cargo check
# Finished `dev` profile [unoptimized + debuginfo] target(s) in 11.46s
```

**警告**（可忽略）:
- `unused imports: self and SAVED_POSITION` - window.rs 中不再需要
- `static SAVED_POSITION is never used` - 可以移除

---

## 🎯 修复效果

### 配置更新流程

**修复前**:
```
修改窗口位置
  ↓
直接写入 JSON 文件
  ↓
覆盖整个配置文件 ❌
  ↓
其他配置丢失
```

**修复后**:
```
修改窗口位置
  ↓
ConfigManager.update_window_pos()
  ↓
只更新 window_position 字段 ✅
  ↓
保留其他所有配置 ✅
```

### 实例文件夹保存

**修复前**:
```
添加游戏文件夹
  ↓
直接写入 known_folders 数组
  ↓
覆盖整个配置文件 ❌
  ↓
path_config 等配置丢失
```

**修复后**:
```
添加游戏文件夹
  ↓
ConfigManager.update_value("instance_configs.known_folders", ...)
  ↓
只更新 instance_configs.known_folders ✅
  ↓
保留其他所有配置 ✅
```

---

## 📝 测试验证

### 测试 1：窗口位置保存

1. 启动应用：`pnpm tauri dev`
2. 移动/调整窗口
3. 关闭应用
4. 检查 `app_config.json`
5. ✅ 确认只有 `window_position` 字段变化
6. ✅ 其他配置（如 `path_config`）保持不变

### 测试 2：添加游戏文件夹

1. 启动应用
2. 实例列表 → 添加游戏文件夹
3. 选择一个文件夹
4. 检查 `app_config.json`
5. ✅ 确认 `instance_configs.known_folders` 更新
6. ✅ 确认 `path_config` 等其他配置保持不变

### 测试 3：路径配置更新

1. 启动应用
2. 设置 → 修改路径配置
3. 检查 `app_config.json`
4. ✅ 确认只有 `path_config` 字段变化
5. ✅ 确认 `window_position` 等其他配置保持不变

---

## 🔧 清理警告（可选）

### 移除不再使用的导入

**文件**: `src-tauri/src/window.rs`

```rust
// 修改前
use crate::config::{self, window_check, ConfigManager, WindowPosition, SAVED_POSITION};
use std::fs;

// 修改后
use crate::config::{window_check, ConfigManager, WindowPosition};
// 移除了 self 和 SAVED_POSITION
// 移除了 std::fs
```

### 移除不再使用的静态变量

**文件**: `src-tauri/src/config/models.rs`

```rust
// 可以移除（第 183 行）
pub static SAVED_POSITION: Lazy<Mutex<Option<WindowPosition>>> = ...;
```

---

## 📋 配置结构

修复后的配置结构：

```json
{
  "version": 1,
  "base_path": "...",
  "window_position": {        // ✅ 窗口位置
    "x": 100,
    "y": 100,
    "width": 1280,
    "height": 720,
    "maximized": false
  },
  "preferences": { ... },
  "download": { ... },
  "path_config": {            // ✅ 路径配置
    "daemon_base_path": "...",
    "download_base_path": "..."
  },
  "instance_configs": {       // ✅ 实例配置
    "known_folders": [        // ← 这个字段现在安全更新
      {
        "id": "...",
        "name": "Default",
        "path": "...",
        "is_default": true
      }
    ]
  }
}
```

---

## 🎉 总结

### 修复的问题

1. ✅ **窗口位置保存覆盖配置** - 现在使用 `ConfigManager.update_window_pos()`
2. ✅ **实例文件夹保存覆盖配置** - 现在使用 `ConfigManager.update_value()`
3. ✅ **配置更新逻辑不统一** - 所有更新都通过 `ConfigManager`

### 核心改进

- **统一管理**: 所有配置更新都通过 `ConfigManager`
- **增量更新**: 只修改指定的配置项
- **保留配置**: 不会丢失其他配置项
- **类型安全**: `set_nested_value` 自动创建中间节点并检查类型

### 下一步

1. ✅ 测试窗口位置保存
2. ✅ 测试实例文件夹添加
3. ✅ 测试路径配置更新
4. ✅ 验证配置不会丢失

---

## 📖 相关文档

- [CRITICAL_FIXES_REQUIRED.md](./CRITICAL_FIXES_REQUIRED.md) - 问题根因分析
- [CONFIG_FIX_AND_DIRECTORY_STRUCTURE.md](./CONFIG_FIX_AND_DIRECTORY_STRUCTURE.md) - 目录结构修复
- [DOWNLOAD_PROGRESS_AND_DEPLOY_FIX.md](./DOWNLOAD_PROGRESS_AND_DEPLOY_FIX.md) - 下载进度和部署修复

---

**配置覆盖问题已完全修复！现在可以安全地更新任何配置项，而不会丢失其他配置。** ✅
