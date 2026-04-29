# 实例目录结构重构

## 重构目标

将实例目录结构从 `.minecraft` 子目录模式改为直接实例目录模式。

## 目录结构变更

### 旧结构
```
{base}/minecraft/
  └── {instance_name}/
      └── .minecraft/          # ❌ 多余的子目录
          ├── versions/
          │   └── {version_name}/
          │       ├── {version_name}.jar
          │       └── ...
          ├── libraries/
          ├── assets/
          └── natives/
```

### 新结构
```
{base}/minecraft/
  └── {instance_name}/         # ✅ 直接使用实例名
      ├── versions/
      │   └── {version_name}/
      │       ├── {version_name}.jar
      │       └── ...
      ├── libraries/
      ├── assets/
      └── natives/
```

## 修改内容

### 1. config/models.rs

**修改内容**:
- 保持 `DEAMON_BASE_PATH` 为 `{base}/minecraft`
- 保持 `DEFAULT_DEAMON_PATH` 为 `{base}/minecraft/default`
- 简化 `INSTANCE_META_PATH` 为 `{base}/minecraft/instance_meta.json`

**代码变更**:
```rust
// 旧代码
pub static INSTANCE_META_PATH: Lazy<PathBuf> =
    Lazy::new(|| DEAMON_BASE_PATH.join(PathBuf::from(INSTANCE_META_FILE_NAME)));

// 新代码
pub static INSTANCE_META_PATH: Lazy<PathBuf> =
    Lazy::new(|| DEAMON_BASE_PATH.join(INSTANCE_META_FILE_NAME));
```

### 2. instance/manager.rs

**主要修改**:

1. **`scan_instances_in_folder` 函数**
   - 移除 `.minecraft` 子目录检查
   - 直接扫描文件夹本身作为实例目录

```rust
// 旧代码
let minecraft_dir = path.join(".minecraft");
if minecraft_dir.is_dir() {
    let versions_dir = minecraft_dir.join("versions");
    // ...
}

// 新代码
let versions_dir = path.join("versions");
let has_versions = versions_dir.is_dir()
    && fs::read_dir(&versions_dir).map(|e| e.count()).unwrap_or(0) > 0;
```

2. **`load_instance_from_path` 函数**
   - 参数名从 `minecraft_dir` 改为 `instance_dir`
   - 路径逻辑相应更新

3. **`load_instance` 函数**
   - `GameInstance.path` 从 `minecraft_dir` 改为 `instance_dir`

4. **`create_instance` 函数**
   - 变量名从 `daemon_dir` 改为 `instance_dir`
   - 错误消息保持一致

### 3. launch.rs

**修改内容**:
- 默认配置中的路径保持不变（`"./.minecraft"`）
- 实际运行时使用前端传入的 `selectedInstance.path`
- 后端返回的 `instance.path` 已经是正确的路径

### 4. deploy.rs

**修改内容**:
- `deploy_version_to_instance` 接收 `instance_path` 参数
- 该参数从前端传入，已经是正确的实例路径
- 无需修改后端代码

## 数据迁移

### 迁移脚本（手动执行）

对于已存在的实例，需要手动迁移目录结构：

```bash
# Windows PowerShell
$instances = Get-ChildItem -Path ".\minecraft" -Directory
foreach ($instance in $instances) {
    $oldPath = Join-Path $instance.FullName ".minecraft"
    $newPath = $instance.FullName
    
    if (Test-Path $oldPath) {
        # 移动 .minecraft 子目录内容到父目录
        Get-ChildItem -Path $oldPath | Move-Item -Destination $newPath -Force
        Remove-Item -Path $oldPath -Recurse -Force
        Write-Host "迁移实例：$($instance.Name)"
    }
}
```

### 迁移步骤

1. **备份数据**
   ```bash
   cp -r minecraft minecraft.backup
   ```

2. **执行迁移**
   - 运行上述迁移脚本
   - 或使用文件管理器手动移动

3. **验证迁移**
   ```bash
   # 检查目录结构
   ls minecraft/{instance_name}
   # 应该看到：versions/, libraries/, assets/, natives/
   ```

4. **启动测试**
   - 运行启动器
   - 检查实例列表是否正常
   - 尝试启动一个实例

## 影响范围

### 后端影响
- ✅ `config/models.rs` - 路径定义
- ✅ `instance/manager.rs` - 实例管理逻辑
- ✅ `launch.rs` - 启动配置（使用传入路径）
- ✅ `deploy.rs` - 部署逻辑（使用传入路径）

### 前端影响
- ⚠️ 无代码修改
- ⚠️ 但需要迁移现有实例数据

### 用户影响
- ⚠️ 需要手动迁移现有实例
- ✅ 新创建的实例自动使用新结构
- ✅ 目录结构更清晰，减少嵌套层级

## 优点

1. **简化目录结构**
   - 减少一层嵌套
   - 更符合直觉

2. **与其他启动器一致**
   - 类似 MultiMC、Prism Launcher 的结构
   - 用户更容易理解

3. **减少路径长度**
   - Windows 系统路径长度限制为 260 字符
   - 减少一层目录有助于避免路径过长问题

4. **便于管理**
   - 直接打开实例目录即可看到所有文件
   - 不需要进入 `.minecraft` 子目录

## 测试验证

### 编译测试
```bash
cd src-tauri
cargo check
# ✅ 编译通过
```

### 功能测试清单

- [ ] 创建新实例
- [ ] 删除实例
- [ ] 复制实例
- [ ] 重命名实例
- [ ] 扫描现有实例
- [ ] 部署版本到实例
- [ ] 启动实例
- [ ] 迁移旧实例

## 注意事项

1. **向后兼容性**
   - 此修改不向后兼容
   - 必须手动迁移现有实例

2. **元数据文件位置**
   - `instance_meta.json` 现在位于 `{base}/minecraft/`
   - 不再位于 `{base}/minecraft/default/.minecraft/`

3. **路径硬编码**
   - 前端默认配置中的 `"./.minecraft"` 仅用于回退
   - 实际路径从后端获取

4. **文档更新**
   - 需要更新用户文档
   - 说明新的目录结构

## 回退方案

如果需要回退到旧结构：

```bash
# Windows PowerShell
$instances = Get-ChildItem -Path ".\minecraft" -Directory
foreach ($instance in $instances) {
    $oldPath = Join-Path $instance.FullName ".minecraft"
    $newPath = $instance.FullName
    
    if (-not (Test-Path $oldPath)) {
        New-Item -ItemType Directory -Path $oldPath | Out-Null
        Get-ChildItem -Path $newPath -Exclude ".minecraft" | 
            Move-Item -Destination $oldPath -Force
        Write-Host "回退实例：$($instance.Name)"
    }
}
```

## 相关文档

- [部署路径优化修复](./DEPLOY_PATH_FIX.md)
- [实例配置系统设计](./INSTANCE_CONFIG_SYSTEM_DESIGN.md)
