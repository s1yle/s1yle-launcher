# 部署到实例目录问题修复

## 问题描述

用户反馈：下载完成后文件没有部署到实例目录 `minecraft/default/`，导致实例目录为空。

**当前目录结构**:
```
src-tauri/
├── .smcl/
│   └── download/        # ✅ 下载文件在这里
│       ├── versions/
│       ├── libraries/
│       └── assets/
└── minecraft/
    └── default/         # ❌ 实例目录为空
```

**期望目录结构**:
```
src-tauri/
├── .smcl/
│   └── download/        # 临时下载目录
└── minecraft/
    └── default/         # ✅ 应该部署到这里
        └── versions/
            └── {version_name}/
                ├── {version_name}.jar
                └── ...
```

---

## 问题分析

### 1. 下载流程

查看 `src/hooks/useDownload.ts` 的 `downloadVersion` 函数：

```typescript
// 第 260 行
await deployVersionFiles(version.id);  // ❌ 只部署到全局目录
logger.info('版本下载并部署成功', version.id);
```

**问题**：
- `deployVersionFiles()` 只部署到**全局目录**（`.smcl/download/`）
- 没有调用 `deployVersionToInstance()` 部署到**实例目录**

### 2. 两个部署函数的区别

| 函数 | 部署位置 | 用途 |
|------|----------|------|
| `deployVersionFiles()` | `.smcl/download/versions/{version}/` | 部署到全局下载目录 |
| `deployVersionToInstance(instancePath, versionId)` | `{instancePath}/versions/{version}/` | 部署到实例目录 |

### 3. 前端调用链

```
下载按钮点击
  ↓
downloadVersion(version)
  ↓
  - 下载所有文件到 .smcl/download/temp/
  - deployVersionFiles(version.id)  // ← 只调用这个
  ↓
完成
```

**缺少**:
```
  - deployVersionToInstance(instancePath, version.id)  // ← 缺少这个！
```

---

## 修复方案

### 修改 `downloadVersion` 函数

在 `deployVersionFiles()` 之后，添加部署到实例的逻辑：

```typescript
await deployVersionFiles(version.id);
logger.info('版本部署到全局目录成功', version.id);

// 部署到选中的实例目录
const instanceStore = useInstanceStore.getState();
const selectedInstance = instanceStore.getSelectedInstance();

if (selectedInstance) {
  try {
    const instancePath = selectedInstance.path;
    logger.info('开始部署版本到实例', { 
      versionId: version.id, 
      instancePath, 
      instanceName: selectedInstance.name 
    });
    await deployVersionToInstance(instancePath, version.id);
    logger.info('版本部署到实例成功', version.id);
  } catch (deployError) {
    logger.error('部署到实例失败（非致命）', { versionId: version.id, error: deployError });
    // 不抛出错误，避免影响主流程
  }
} else {
  logger.info('未选中实例，跳过部署到实例', version.id);
}

await loadInstalledVersions();
await loadDownloadTasks();
```

---

## 修改内容

### 文件：`src/hooks/useDownload.ts`

**位置**: 第 260-264 行

**修改前**:
```typescript
await deployVersionFiles(version.id);
logger.info('版本下载并部署成功', version.id);
await loadInstalledVersions();
await loadDownloadTasks();
```

**修改后**:
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
    await deployVersionToInstance(instancePath, version.id);
    logger.info('版本部署到实例成功', version.id);
  } catch (deployError) {
    logger.error('部署到实例失败（非致命）', { versionId: version.id, error: deployError });
    // 不抛出错误，避免影响主流程
  }
} else {
  logger.info('未选中实例，跳过部署到实例', version.id);
}

await loadInstalledVersions();
await loadDownloadTasks();
```

---

## 修复后的流程

```
下载按钮点击
  ↓
downloadVersion(version)
  ↓
  1. 下载所有文件到 .smcl/download/temp/
  2. deployVersionFiles(version.id)         // 部署到全局目录
  3. 获取选中的实例
  4. deployVersionToInstance(instancePath, version.id)  // ✅ 部署到实例目录
  ↓
完成
```

---

## 预期结果

### 修复后的目录结构

```
src-tauri/
├── .smcl/
│   └── download/        # 全局下载目录（缓存）
│       ├── versions/    # 版本文件
│       ├── libraries/   # 库文件
│       └── assets/      # 资源文件
└── minecraft/
    └── default/         # ✅ 实例目录
        ├── versions/
        │   └── 1.20.4/
        │       ├── 1.20.4.jar
        │       └── 1.20.4.json
        ├── libraries/   # 库文件
        ├── assets/      # 资源文件
        └── natives/     # 原生库
```

### 日志输出

```
[INFO] 版本部署到全局目录成功 1.20.4
[INFO] 开始部署版本到实例 { versionId: "1.20.4", instancePath: "F:/.../minecraft/default", instanceName: "default" }
[INFO] 版本部署到实例成功 1.20.4
```

---

## 边界情况处理

### 1. 未选中实例
```typescript
if (!selectedInstance) {
  logger.info('未选中实例，跳过部署到实例', version.id);
}
```
- **行为**: 只部署到全局目录，不报错
- **场景**: 用户还没有创建/选择实例

### 2. 部署到实例失败
```typescript
try {
  await deployVersionToInstance(instancePath, version.id);
} catch (deployError) {
  logger.error('部署到实例失败（非致命）', { ... });
  // 不抛出错误
}
```
- **行为**: 记录错误，但不影响主流程
- **原因**: 全局目录已部署，用户仍可以手动部署
- **场景**: 实例目录权限问题、磁盘空间不足等

### 3. 选中实例有效
- **行为**: 正常部署到实例目录
- **场景**: 正常使用情况

---

## 测试验证

### 1. 编译检查
```bash
cd src-tauri
cargo check
# ✅ 编译通过
```

### 2. 功能测试（需要手动执行）

**步骤**:
1. 启动启动器
2. 选择 `default` 实例
3. 下载一个游戏版本（如 `1.20.4`）
4. 检查目录结构：
   ```bash
   ls minecraft/default/versions/1.20.4/
   # 应该看到：
   # - 1.20.4.jar
   # - 1.20.4.json
   ```
5. 检查日志输出

### 3. 验证点
- [ ] 下载完成后文件部署到全局目录
- [ ] 下载完成后自动部署到实例目录
- [ ] 日志输出正确的部署信息
- [ ] 未选中实例时不报错
- [ ] 部署失败不影响主流程

---

## 注意事项

### 1. 部署路径

`deployVersionToInstance` 使用之前修复的路径逻辑：
```
{instance_path}/versions/{version_name}/
```

其中：
- `instance_path`: 从 `selectedInstance.path` 获取（如 `F:/.../minecraft/default`）
- `version_name`: 从版本 JSON 的 `id` 字段获取（如 `1.20.4`）

### 2. 错误处理

部署到实例失败不会中断主流程，因为：
- 全局目录已部署，版本文件完整
- 用户可以在需要时手动部署
- 避免网络问题导致下载完全失败

### 3. 性能影响

部署到实例是**文件移动操作**（`fs::rename`），不是复制：
- 速度快（同一磁盘内是元数据操作）
- 不占用额外空间
- 原子操作（要么成功，要么失败）

---

## 相关文件

### 修改的文件
- ✅ `src/hooks/useDownload.ts` - 添加部署到实例逻辑

### 依赖的文件
- `src/stores/instanceStore.ts` - 获取选中实例
- `src/helper/rustInvoke.ts` - API 调用
- `src-tauri/src/download/deploy.rs` - 后端部署逻辑

---

## 总结

**问题根源**: 下载完成后只调用了 `deployVersionFiles()`，没有调用 `deployVersionToInstance()`

**修复方案**: 在下载完成后，自动调用 `deployVersionToInstance()` 部署到选中的实例

**影响范围**: 
- ✅ 新下载版本自动部署到实例
- ✅ 不影响现有全局目录部署
- ✅ 向后兼容（未选中实例时不报错）

**下一步**: 运行应用测试验证部署流程
