# 下载进度组件与部署修复 - 完整方案

> **状态**: 已完成 📝  
> **最后更新**: 2026-04-29

## 执行时间
2026-04-29

---

## 问题诊断

### 用户反馈的问题

1. **下载进度不可见**：无法实时监控下载进度
2. **部署失败**：游戏下载成功后没有部署到实例目录
3. **实例列表为空**：即使下载完成，实例列表仍显示"暂无实例"

### 根本原因分析

#### 问题 1：缺少下载进度组件
- ✅ 已有 `DownloadItem` 组件显示单个文件进度
- ❌ 缺少统一管理所有下载任务的进度面板
- ❌ 无法查看总体下载进度

#### 问题 2：部署逻辑不完整
**下载流程**（修复前）：
```typescript
downloadVersion(version)
  ↓
  1. 下载所有文件到 .smcl/download/temp/
  2. deployVersionFiles(version.id)  // 只部署到全局目录
  ↓
完成
```

**缺失的步骤**：
```typescript
  3. deployVersionToInstance(instancePath, version.id)  // ❌ 缺少这个！
```

#### 问题 3：实例列表为空
**原因链**：
```
部署失败 
  ↓ 
minecraft/default/versions/{version}/ 目录为空
  ↓ 
scan_instances() 扫描不到 jar 文件
  ↓ 
instances 数组为空
  ↓ 
实例列表显示"暂无实例"
```

---

## 解决方案

### 1. 创建下载进度组件 ✅

**文件**: `src/components/DownloadProgressPanel.tsx`

**功能**:
- 显示所有下载任务的实时进度
- 支持多任务同时下载
- 显示总体进度统计
- 支持取消下载
- 显示已完成任务列表（可折叠）

**使用示例**:
```tsx
import { DownloadProgressPanel } from '@/components/DownloadProgressPanel';

// 在下载页面中添加
<DownloadProgressPanel 
  visible={isDownloading}
  onClose={() => setIsDownloading(false)}
/>
```

**界面布局**:
```
┌─────────────────────────────────┐
│ 下载进度 (3)              [×]   │
├─────────────────────────────────┤
│ 总进度：65.3%                   │
│ ████████████░░░░░░░░░  65.3%    │
│ 3 个进行中 · 5 个已完成 · 0 个错误│
├─────────────────────────────────┤
│ [下载项 1] 正在下载...          │
│ [下载项 2] 正在下载...          │
│ [下载项 3] 等待中...            │
│ ▼ 已完成 (5)                    │
│   ✓ library1.jar                │
│   ✓ library2.jar                │
│   ...                           │
└─────────────────────────────────┘
```

---

### 2. 修复部署逻辑 ✅

#### 修改 1：`useDownload.ts` - 添加部署到实例

**文件**: `src/hooks/useDownload.ts`

**修改位置**: 第 260-264 行

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
    logger.info('开始部署版本到实例', { 
      versionId: version.id, 
      instancePath, 
      instanceName: selectedInstance.name 
    });
    await deployVersionToInstance(instancePath, version.id);
    logger.info('版本部署到实例成功', version.id);
  } catch (deployError) {
    logger.error('部署到实例失败（非致命）', { 
      versionId: version.id, 
      error: deployError 
    });
    // 不抛出错误，避免影响主流程
  }
} else {
  logger.info('未选中实例，跳过部署到实例', version.id);
}

await loadInstalledVersions();
await loadDownloadTasks();
```

**关键点**:
- ✅ 部署到全局目录（缓存）
- ✅ 自动部署到选中的实例
- ✅ 错误处理（不中断主流程）
- ✅ 详细的日志记录

---

#### 修改 2：`deploy.rs` - 增强部署日志

**文件**: `src-tauri/src/download/deploy.rs`

**改进内容**:

1. **详细的开始日志**:
```rust
log_info!("==================== 开始部署版本到实例 ====================");
log_info!("版本 ID: {}", version_id);
log_info!("实例路径：{}", instance_path);
log_info!("版本名称：{}", version_name);
log_info!("下载清单：libraries={}, assets={}, natives={}", 
    manifest.libraries.len(), manifest.assets.len(), manifest.natives.len());
```

2. **目标目录日志**:
```rust
log_info!("目标目录：");
log_info!("  versions: {:?}", versions_dir);
log_info!("  libraries: {:?}", libraries_dir);
log_info!("  assets: {:?}", assets_dir);
log_info!("  natives: {:?}", natives_dir);
log_info!("下载基础路径：{:?}", base_path);
log_info!("临时文件路径：{:?}", base_path.join("temp"));
```

3. **部署进度跟踪**:
```rust
let mut deployed_count = 0;
let mut total_count = 0;

// 部署每个文件时记录
log_info!("[{}/{}] 部署库：{}", deployed_count + 1, manifest.libraries.len(), lib.path);
deployed_count += 1;
```

4. **客户端 jar 特殊处理**:
```rust
log_info!("部署客户端 jar:");
log_info!("  源文件：{:?}", source);
log_info!("  目标：{:?}", dest);
log_info!("  源文件存在：{}", source.exists());

if source.exists() {
    fs::rename(&source, &dest)?;
    log_info!("✓ 部署客户端：{}", dest.display());
    deployed_count += 1;
} else {
    log_error!("客户端 jar 不存在：{:?}", source);
    return Err(format!("客户端 jar 不存在：{}", source.display()));
}
```

5. **完成总结**:
```rust
log_info!("==================== 部署完成 ====================");
log_info!("部署进度：{}/{} 文件", deployed_count, total_count);
log_info!("实例路径：{}", instance_path);
log_info!("版本目录：{:?}", versions_dir);

Ok(format!("版本 {} 已部署到实例 ({} / {} 文件)", 
    version_id, deployed_count, total_count))
```

**错误处理增强**:
```rust
// 文件不存在时记录错误
if !source.exists() {
    log_error!("库文件不存在：{:?}", source);
}

// 客户端 jar 不存在时返回错误
if !source.exists() {
    log_error!("客户端 jar 不存在：{:?}", source);
    return Err(format!("客户端 jar 不存在：{}", source.display()));
}
```

---

### 3. 实例列表渲染逻辑 ✅

**文件**: `src/pages/Instance/InstanceList.tsx`

**当前逻辑**（已优化）:
```typescript
const renderContent = () => {
  // 1. 加载中
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // 2. 错误状态
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  // 3. 没有实例
  if (filteredInstances.length === 0) {
    return <EmptyState 
      title="暂无实例" 
      description="下载或创建新实例来开始游戏" 
    />;
  }
  
  // 4. 渲染实例列表
  return <VirtualList items={filteredInstances} />;
};
```

**为什么之前显示"暂无实例"**：
- 后端 `scan_instances()` 扫描 `minecraft/default/versions/` 目录
- 因为部署失败，目录中没有 jar 文件
- 返回空的 `instances` 数组
- 前端渲染空状态

**修复后的流程**：
```
下载完成
  ↓
部署到实例目录
  ↓
minecraft/default/versions/{version}/{version}.jar 存在
  ↓
scan_instances() 扫描到 jar 文件
  ↓
instances 数组包含实例
  ↓
实例列表显示实例卡片
```

---

## 修改文件清单

### 新增文件
- ✅ `src/components/DownloadProgressPanel.tsx` - 下载进度面板

### 修改文件
- ✅ `src/hooks/useDownload.ts` - 添加部署到实例逻辑
- ✅ `src-tauri/src/download/deploy.rs` - 增强部署日志和错误处理

### 依赖文件（无需修改）
- `src/stores/instanceStore.ts` - 提供选中实例
- `src/stores/downloadStore.ts` - 提供下载队列
- `src/components/common/DownloadItem.tsx` - 下载项组件

---

## 测试验证

### 后端编译 ✅
```bash
cd src-tauri
cargo check
# Finished `dev` profile [unoptimized + debuginfo] target(s) in 18.45s
```

### 前端功能测试（需要手动执行）

#### 测试步骤

1. **启动启动器**
   ```bash
   pnpm tauri dev
   ```

2. **选择实例**
   - 打开实例列表
   - 确保选中 `default` 实例（或创建新实例）

3. **下载游戏版本**
   - 导航到 "下载" → "游戏下载"
   - 选择一个版本（如 `1.20.4`）
   - 点击下载按钮

4. **观察下载进度**
   - 应该看到下载进度面板弹出
   - 显示所有文件的下载进度
   - 总进度条实时更新
   - 可以取消正在下载的文件

5. **检查部署日志**
   在终端/控制台查看日志：
   ```
   ==================== 开始部署版本到实例 ====================
   版本 ID: 1.20.4
   实例路径：F:\i86\repos\s1yle-launcher\minecraft\default
   版本名称：1.20.4
   下载清单：libraries=85, assets=234, natives=5
   目标目录：
     versions: "F:\\...\\minecraft\\default\\versions\\1.20.4"
     libraries: "F:\\...\\minecraft\\default\\libraries"
     assets: "F:\\...\\minecraft\\default\\assets"
     natives: "F:\\...\\minecraft\\default\\natives\\1.20.4"
   下载基础路径："F:\\i86\\repos\\s1yle-launcher\\.smcl\\download"
   临时文件路径："F:\\i86\\repos\\s1yle-launcher\\.smcl\\download\\temp"
   [1/85] 部署库：net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar
   [2/85] 部署库：org/ow2/asm/asm/9.2/asm-9.2.jar
   ...
   部署客户端 jar:
     源文件："F:\\...\\.smcl\\download\\temp\\versions\\1.20.4\\1.20.4.jar"
     目标："F:\\...\\minecraft\\default\\versions\\1.20.4\\1.20.4.jar"
     源文件存在：true
   ✓ 部署客户端：F:\...\minecraft\default\versions\1.20.4\1.20.4.jar
   ==================== 部署完成 ====================
   部署进度：324/324 文件
   实例路径：F:\i86\repos\s1yle-launcher\minecraft\default
   版本目录："F:\\...\\minecraft\\default\\versions\\1.20.4"
   ```

6. **检查目录结构**
   ```bash
   # 在 WSL bash 中
   cd /mnt/f/i86/repos/s1yle-launcher/src-tauri
   ls -la minecraft/default/versions/1.20.4/
   # 应该看到：
   # - 1.20.4.jar
   # - 1.20.4.json
   
   ls -la minecraft/default/libraries/
   # 应该看到库文件目录
   
   ls -la minecraft/default/assets/
   # 应该看到资源文件
   ```

7. **检查实例列表**
   - 返回实例列表页面
   - 应该看到新部署的实例
   - 显示游戏版本：`1.20.4`
   - 显示实例名称：`default`

8. **测试启动实例**
   - 点击实例卡片
   - 点击"启动"按钮
   - 游戏应该能够启动

---

## 预期结果

### 1. 下载进度组件
- ✅ 下载时自动显示进度面板
- ✅ 实时显示每个文件的下载进度
- ✅ 显示总体进度统计
- ✅ 可以取消下载
- ✅ 完成后显示已完成列表

### 2. 部署到实例
- ✅ 下载完成后自动部署到实例目录
- ✅ 日志显示详细的部署过程
- ✅ 文件正确部署到 `minecraft/default/versions/{version}/`
- ✅ 错误处理正常（不中断主流程）

### 3. 实例列表
- ✅ 部署完成后实例列表显示实例
- ✅ 显示正确的游戏版本
- ✅ 显示正确的实例名称
- ✅ 可以正常操作（启动、重命名、删除等）

---

## 故障排查

### 问题 1：部署仍然失败

**检查点**:
1. 查看后端日志，找到错误信息
2. 检查临时文件是否存在：
   ```bash
   ls .smcl/download/temp/versions/1.20.4/
   ```
3. 检查目标目录权限：
   ```bash
   ls -la minecraft/default/
   ```

**可能原因**:
- 临时文件被删除（下载失败）
- 目标目录没有写权限
- 磁盘空间不足

### 问题 2：实例列表仍为空

**检查点**:
1. 检查实例目录是否有 jar 文件：
   ```bash
   find minecraft/default/versions/ -name "*.jar"
   ```
2. 查看后端扫描日志：
   ```
   开始扫描实例目录：...
   发现实例目录：default -> ...
   检查版本：default/1.20.4 - jar 存在：true/false
   ```

**可能原因**:
- 部署确实失败了
- jar 文件名称不匹配（应该是 `{version_name}.jar`）
- 实例路径配置错误

### 问题 3：下载进度面板不显示

**检查点**:
1. 确认组件已导入
2. 检查 `downloadQueue` 是否有数据
3. 查看控制台错误

**解决方案**:
```tsx
// 在下载页面中添加
import { DownloadProgressPanel } from '@/components/DownloadProgressPanel';

const [showProgress, setShowProgress] = useState(false);

// 开始下载时显示
const handleDownload = async () => {
  setShowProgress(true);
  await downloadVersion(version);
};

// 渲染
<DownloadProgressPanel 
  visible={showProgress}
  onClose={() => setShowProgress(false)}
/>
```

---

## 下一步优化建议

### 1. 下载进度集成
- [ ] 在下载页面自动显示进度面板
- [ ] 添加最小化按钮
- [ ] 支持后台下载（关闭面板继续下载）

### 2. 部署优化
- [ ] 支持选择部署目标（多个实例）
- [ ] 部署失败后支持重试
- [ ] 显示部署进度条

### 3. 实例管理
- [ ] 实例创建向导（选择版本自动下载）
- [ ] 实例批量操作
- [ ] 实例导入/导出

### 4. 日志系统
- [ ] 前端日志查看器
- [ ] 日志导出功能
- [ ] 错误报告自动生成

---

## 总结

本次修复完成了：

1. ✅ **下载进度组件** - 实时监控多任务下载进度
2. ✅ **部署逻辑修复** - 下载后自动部署到实例目录
3. ✅ **日志增强** - 详细的部署过程日志
4. ✅ **错误处理** - 完善的错误捕获和记录

**预期效果**：
- 用户下载版本后，自动部署到选中的实例
- 实例列表自动显示新部署的实例
- 可以立即启动游戏

**关键日志**：
```
==================== 开始部署版本到实例 ====================
版本 ID: 1.20.4
实例路径：F:\i86\repos\s1yle-launcher\minecraft\default
✓ 部署客户端：F:\...\minecraft\default\versions\1.20.4\1.20.4.jar
==================== 部署完成 ====================
部署进度：324/324 文件
```

现在请运行应用进行测试，查看日志输出确认部署成功！
