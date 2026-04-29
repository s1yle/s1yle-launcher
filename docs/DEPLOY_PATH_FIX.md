# 部署路径优化修复总结

## 问题分析

### 目标路径
```
/minecraft/{当前选择的 daemon_name}/versions/{下载的游戏版本取名}/...
```

### 原始问题

1. **deploy_version_to_instance 函数路径错误**
   - 客户端 jar 部署位置：`versions/{version_id}.jar` ❌
   - 应该是：`versions/{version_name}/{version_name}.jar` ✅

2. **未使用版本名称**
   - Minecraft 允许在 version JSON 中定义自定义 `id` 字段作为显示名称
   - 如果没有自定义名称，应使用 version_id 作为默认名称

3. **前端部署逻辑不完整**
   - `deployVersion` 只调用 `deployVersionFiles` 部署到全局目录
   - 未调用 `deployVersionToInstance` 部署到选中的实例

## 修复内容

### 1. 后端修复 (src-tauri/src/download/deploy.rs)

**修改 `deploy_version_to_instance` 函数**:

```rust
#[tauri::command]
pub async fn deploy_version_to_instance(
    instance_path: String,
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    // 获取版本详情，读取版本名称
    let version_json = get_version_detail(version_id.clone()).await?;
    
    let version_name = version_json["id"]
        .as_str()
        .unwrap_or(&version_id)
        .to_string();
    
    log_info!("使用版本名称：{}", version_name);

    let manifest = parse_version_downloads(&version_json).await?;

    let instance_dir = PathBuf::from(&instance_path);
    let versions_dir = instance_dir.join("versions").join(&version_name); // ✅ 使用 version_name
    let libraries_dir = instance_dir.join("libraries");
    let assets_dir = instance_dir.join("assets");
    let natives_dir = instance_dir.join("natives").join(&version_name); // ✅ 使用 version_name

    // ... 部署逻辑 ...

    // 客户端 jar 部署
    if let Some(ref client) = manifest.client_jar {
        let source = base_path.join("temp").join(&client.path);
        let dest = versions_dir.join(format!("{}.jar", &version_name)); // ✅ 使用 version_name
        // ...
    }

    // 资源索引部署
    if let Some(ref index) = manifest.asset_index {
        let dest = instance_dir
            .join("assets")
            .join("indexes")
            .join(format!("{}.json", &version_name)); // ✅ 使用 version_name
        // ...
    }
}
```

**修改 `version.rs`**:
- 将 `parse_version_downloads` 函数改为 `pub` 可见，供 `deploy.rs` 调用

### 2. 前端修复 (src/hooks/useDownload.ts)

**修改 `deployVersion` 函数**:

```typescript
const deployVersion = useCallback(async (versionId: string) => {
  try {
    const instanceStore = useInstanceStore.getState();
    const selectedInstance = instanceStore.getSelectedInstance();
    
    if (!selectedInstance) {
      throw new Error('未选择实例');
    }

    const instancePath = selectedInstance.path;
    logger.info('部署版本到实例', { versionId, instancePath, instanceName: selectedInstance.name });
    
    // ✅ 调用 deployVersionToInstance 部署到选中的实例
    await deployVersionToInstance(instancePath, versionId);
    logger.info('版本部署成功', versionId);
    await loadInstalledVersions();
  } catch (e) {
    logger.error('版本部署失败', e);
    throw e;
  }
}, [loadInstalledVersions]);
```

**新增导入**:
- `deployVersionToInstance` from `../helper/rustInvoke`
- `useInstanceStore` from `../stores/instanceStore`

## 修复后的目录结构

```
{base}/daemon/{instance_name}/
└── .minecraft/
    ├── versions/
    │   └── {version_name}/          # ✅ 使用版本名称
    │       ├── {version_name}.jar   # ✅ 客户端 jar
    │       └── {version_name}.json  # ✅ 版本 JSON
    ├── libraries/
    │   └── {path}
    ├── assets/
    │   ├── indexes/
    │   │   └── {version_name}.json  # ✅ 使用版本名称
    │   └── objects/
    └── natives/
        └── {version_name}/          # ✅ 使用版本名称
```

## 测试验证

需要验证的场景：

1. **标准版本**（如 `1.20.4`）
   - 部署到：`{instance}/versions/1.20.4/1.20.4.jar`

2. **自定义名称版本**（如 `1.20.4-OptiFine`）
   - 部署到：`{instance}/versions/1.20.4-OptiFine/1.20.4-OptiFine.jar`

3. **快照版本**（如 `24w04a`）
   - 部署到：`{instance}/versions/24w04a/24w04a.jar`

## 影响范围

### 修改的文件
- `src-tauri/src/download/deploy.rs` - 部署逻辑优化
- `src-tauri/src/download/version.rs` - 导出 `parse_version_downloads` 函数
- `src/hooks/useDownload.ts` - 前端部署逻辑优化

### 受影响的流程
- 下载页面 -> 部署按钮点击
- VersionInstall 页面 -> 安装完成后的部署

### 向后兼容性
- ✅ 保持 `deploy_version_files` 函数不变（部署到全局目录）
- ✅ `deploy_version_to_instance` 函数签名不变
- ✅ 前端 API 调用方式不变

## 注意事项

1. **版本名称来源**
   - 从 Mojang API 获取的 version JSON 中的 `id` 字段
   - 如果 `id` 字段不存在，回退到使用 `version_id`

2. **实例路径**
   - 使用 `instanceStore.getSelectedInstance().path` 获取
   - 该路径已经是 `.minecraft/` 目录

3. **错误处理**
   - 如果未选择实例，抛出明确的错误提示
   - 部署失败时保留原有错误处理逻辑

## 下一步

- [ ] 测试部署流程
- [ ] 验证不同版本类型的部署路径
- [ ] 检查日志输出是否正确
- [ ] 确认与实例创建的集成
