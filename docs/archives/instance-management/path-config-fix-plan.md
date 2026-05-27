# 路径配置集成与实例列表渲染修复方案

> **状态**: 已完成 📝  
> **最后更新**: 未知

## 问题 1：路径配置分散，需要集成到 config 模块

### 现状分析

#### 1.1 当前路径配置位置

**后端路径配置**：

1. **`config/models.rs`** - 主要路径定义
   ```rust
   pub static BASE_PATH: Lazy<PathBuf> = Lazy::new(|| std::env::current_dir().unwrap_or(PathBuf::from("")));
   pub static DEAMON_BASE_PATH: Lazy<PathBuf> = Lazy::new(|| BASE_PATH.join("minecraft"));
   pub static DEFAULT_DEAMON_PATH: Lazy<PathBuf> = Lazy::new(|| BASE_PATH.join("minecraft").join("default"));
   pub static DOWNLOAD_BASE_PATH: Lazy<PathBuf> = Lazy::new(|| CONFIG_APPLICATION.join("download"));
   pub static INSTANCE_META_PATH: Lazy<PathBuf> = Lazy::new(|| DEAMON_BASE_PATH.join(INSTANCE_META_FILE_NAME));
   pub static CONFIG_APPLICATION: Lazy<PathBuf> = Lazy::new(|| { ... });
   pub static CONFIG_FILE_PATH: Lazy<PathBuf> = Lazy::new(|| { ... });
   ```

2. **`instance/manager.rs`** - 实例路径逻辑
   ```rust
   fn get_minecraft_dir(&self) -> PathBuf {
       self.base_path.clone()  // base_path 来自外部传入
   }
   
   fn get_versions_dir(&self, name: &str) -> PathBuf {
       self.get_minecraft_dir().join(name).join("versions")
   }
   ```

3. **`download/manager.rs`** - 下载路径逻辑
   ```rust
   // DownloadManager 中有 base_path 字段
   // 用于存储下载文件的临时路径
   ```

4. **`launch.rs`** - 启动路径（硬编码默认值）
   ```rust
   impl Default for LaunchConfig {
       fn default() -> Self {
           Self {
               game_dir: "./.minecraft".to_string(),
               assets_dir: "./.minecraft/assets".to_string(),
               // ...
           }
       }
   }
   ```

5. **`lib.rs`** - 初始化时使用路径
   ```rust
   let download_path = &*config::DOWNLOAD_BASE_PATH;
   let instance_manager = InstanceManager::new(download_path.clone());
   ```

**前端路径配置**：

1. **`helper/rustInvoke.ts`** - 默认配置
   ```typescript
   return {
     java_path: "java",
     memory_mb: 2048,
     version: "1.20.4",
     game_dir: "./.minecraft",  // ❌ 硬编码
     assets_dir: "./.minecraft/assets",  // ❌ 硬编码
     // ...
   };
   ```

2. **`stores/instanceStore.ts`** - 路径存储
   ```typescript
   const [instances, path, knownFolders] = await Promise.all([
     scanInstances(),
     getInstancesPath(),  // 从后端获取
     scanKnownMcPaths(),
   ]);
   ```

3. **`stores/downloadStore.ts`** - 下载路径存储
   ```typescript
   const path = await getDownloadBasePath();  // 从后端获取
   ```

#### 1.2 存在的问题

1. **路径定义分散**
   - 后端：`config/models.rs`、`instance/manager.rs`、`download/manager.rs`、`launch.rs`
   - 前端：`rustInvoke.ts` 默认配置

2. **硬编码路径**
   - `launch.rs` 中的 `"./.minecraft"`
   - `rustInvoke.ts` 中的 `"./.minecraft"`

3. **路径传递混乱**
   - `InstanceManager` 的 `base_path` 从外部传入
   - `DownloadManager` 的 `base_path` 也是外部传入
   - 但初始化时都使用 `DOWNLOAD_BASE_PATH`

4. **缺少统一的路径管理接口**
   - 没有统一的路径获取 API
   - 各模块自行其是

### 解决方案

#### 2.1 设计目标

1. **统一管理**：所有路径配置集中在 `config` 模块
2. **单一数据源**：每个路径只有一个定义位置
3. **易于扩展**：新增路径时只需修改 `config` 模块
4. **前后端一致**：前端通过 API 获取路径，不硬编码
5. **支持配置**：用户可以通过配置文件修改路径

#### 2.2 架构设计

```
config/
├── models.rs          # 路径定义和类型
├── manager.rs         # 路径管理逻辑
├── commands.rs        # Tauri 命令（前端调用）
└── mod.rs            # 模块导出
```

#### 2.3 路径分类

**基础路径**（不可配置，程序启动时确定）：
- `BASE_PATH` - 应用根目录
- `CONFIG_APPLICATION` - 应用配置目录
- `CONFIG_FILE_PATH` - 配置文件路径

**实例路径**（可配置）：
- `DEAMON_BASE_PATH` - 实例根目录（默认：`{BASE_PATH}/minecraft`）
- `DEFAULT_DEAMON_PATH` - 默认实例（默认：`{DEAMON_BASE_PATH}/default`）
- `INSTANCE_META_PATH` - 实例元数据（默认：`{DEAMON_BASE_PATH}/instance_meta.json`）

**下载路径**（可配置）：
- `DOWNLOAD_BASE_PATH` - 下载根目录（默认：`{CONFIG_APPLICATION}/download`）

**启动路径**（动态生成）：
- `get_game_dir(instance_id)` - 游戏目录（基于实例路径）
- `get_assets_dir(instance_id)` - 资源目录（基于实例路径）
- `get_libraries_dir(instance_id)` - 库目录（基于实例路径）

#### 2.4 实现方案

**Phase 1: 后端路径配置重构**

1. **创建路径配置结构** (`config/models.rs`)
   ```rust
   #[derive(Serialize, Deserialize, Clone, Debug)]
   pub struct PathConfig {
       /// 实例根目录
       #[serde(default = "default_daemon_base_path")]
       pub daemon_base_path: PathBuf,
       
       /// 下载根目录
       #[serde(default = "default_download_base_path")]
       pub download_base_path: PathBuf,
       
       /// 实例元数据路径
       #[serde(skip)]  // 自动计算，不序列化
       pub instance_meta_path: PathBuf,
   }
   
   impl PathConfig {
       /// 获取实例目录
       pub fn get_instance_dir(&self, instance_name: &str) -> PathBuf {
           self.daemon_base_path.join(instance_name)
       }
       
       /// 获取实例的 versions 目录
       pub fn get_versions_dir(&self, instance_name: &str) -> PathBuf {
           self.get_instance_dir(instance_name).join("versions")
       }
       
       /// 获取实例的 libraries 目录
       pub fn get_libraries_dir(&self, instance_name: &str) -> PathBuf {
           self.get_instance_dir(instance_name).join("libraries")
       }
       
       // ... 其他辅助方法
   }
   ```

2. **更新 ConfigManager** (`config/manager.rs`)
   ```rust
   impl ConfigManager {
       /// 获取路径配置
       pub fn get_path_config(&self) -> &PathConfig {
           &self.config.path_config
       }
       
       /// 更新路径配置
       pub fn update_path_config(&mut self, config: PathConfig) -> Result<(), String> {
           self.config.path_config = config;
           self.save()
       }
   }
   ```

3. **创建路径管理命令** (`config/commands.rs`)
   ```rust
   #[tauri::command]
   pub fn get_path_config() -> PathConfig {
       // 从 ConfigManager 获取
   }
   
   #[tauri::command]
   pub fn update_path_config(config: PathConfig) -> Result<(), String> {
       // 更新并保存
   }
   
   #[tauri::command]
   pub fn get_instance_path(instance_name: String) -> PathBuf {
       // 计算实例路径
   }
   ```

4. **重构 InstanceManager** (`instance/manager.rs`)
   ```rust
   pub struct InstanceManager {
       config_manager: Arc<Mutex<ConfigManager>>,  // 改为引用 ConfigManager
   }
   
   impl InstanceManager {
       pub fn new(config_manager: Arc<Mutex<ConfigManager>>) -> Self {
           Self { config_manager }
       }
       
       fn get_minecraft_dir(&self) -> PathBuf {
           self.config_manager.lock().unwrap()
               .get_path_config().daemon_base_path.clone()
       }
   }
   ```

5. **重构 DownloadManager** (`download/manager.rs`)
   ```rust
   pub struct DownloadManager {
       config_manager: Arc<Mutex<ConfigManager>>,
   }
   
   impl DownloadManager {
       pub fn new(config_manager: Arc<Mutex<ConfigManager>>) -> Self {
           Self { config_manager }
       }
       
       fn get_base_path(&self) -> PathBuf {
           self.config_manager.lock().unwrap()
               .get_path_config().download_base_path.clone()
       }
   }
   ```

6. **更新 lib.rs 初始化**
   ```rust
   // 1. 初始化配置管理器
   let config_manager = ConfigManager::load_or_create();
   let config_manager = Arc::new(Mutex::new(config_manager));
   
   // 2. 创建管理器（传入 config_manager）
   let instance_manager = InstanceManager::new(config_manager.clone());
   let download_manager = DownloadManager::new(config_manager.clone());
   
   // 3. 注册状态
   .manage(config_manager)
   .manage(instance_manager)
   .manage(download_manager)
   ```

7. **移除硬编码默认值** (`launch.rs`)
   ```rust
   impl Default for LaunchConfig {
       fn default() -> Self {
           Self {
               // 不再硬编码，由调用方传入实际路径
               game_dir: String::new(),
               assets_dir: String::new(),
               // ...
           }
       }
   }
   ```

**Phase 2: 前端路径配置集成**

1. **创建路径配置 API** (`helper/rustInvoke.ts`)
   ```typescript
   export interface PathConfig {
     daemon_base_path: string;
     download_base_path: string;
     instance_meta_path: string;
   }
   
   export const getPathConfig = async (): Promise<PathConfig> => {
     return await invokeRustFunction("get_path_config");
   };
   
   export const updatePathConfig = async (config: PathConfig): Promise<string> => {
     return await invokeRustFunction("update_path_config", { config });
   };
   
   export const getInstancePath = async (instanceName: string): Promise<string> => {
     return await invokeRustFunction("get_instance_path", { instanceName });
   };
   ```

2. **更新 Store** (`stores/instanceStore.ts`)
   ```typescript
   init: async () => {
     const pathConfig = await getPathConfig();
     const instances = await scanInstances();
     const knownFolders = await scanKnownMcPaths();
     
     set({
       instancesPath: pathConfig.daemon_base_path,
       // ...
     });
   }
   ```

3. **更新 Store** (`stores/downloadStore.ts`)
   ```typescript
   init: async () => {
     const pathConfig = await getPathConfig();
     const tasks = await getDownloadTasks();
     
     set({
       downloadPath: pathConfig.download_base_path,
       // ...
     });
   }
   ```

4. **移除硬编码默认值** (`rustInvoke.ts`)
   ```typescript
   export const getDefaultLaunchConfig = async (): Promise<LaunchConfig> => {
     const pathConfig = await getPathConfig();
     const instance = useInstanceStore.getState().getSelectedInstance();
     
     return {
       java_path: "java",
       memory_mb: 2048,
       version: "1.20.4",
       game_dir: instance?.path || "",  // 从实例获取
       assets_dir: instance ? `${instance.path}/assets` : "",
       // ...
     };
   };
   ```

**Phase 3: 配置文件格式更新**

更新 `config.json` 格式：
```json
{
  "version": 1,
  "path_config": {
    "daemon_base_path": "C:\\Games\\minecraft",
    "download_base_path": "C:\\Downloads"
  },
  "window_position": { ... },
  "preferences": { ... },
  "instance_configs": { ... }
}
```

#### 2.5 迁移策略

1. **向后兼容**
   - 首次加载时，如果配置文件没有 `path_config`，使用默认值
   - 保留旧的静态常量作为回退

2. **数据迁移**
   - 提供迁移脚本（可选）
   - 用户手动修改配置文件

3. **测试验证**
   - 单元测试：路径计算逻辑
   - 集成测试：配置读写
   - E2E 测试：创建实例、下载文件

---

## 问题 2：实例列表渲染逻辑问题

### 现状分析

#### 1.1 渲染流程

```
InstanceList.tsx
  ├── useEffect([init]) → 调用 init()
  │     ├── scanInstances()      ← 从后端扫描实例
  │     ├── getInstancesPath()   ← 获取实例路径
  │     └── scanKnownMcPaths()   ← 扫描已知文件夹
  │
  ├── getFilteredInstances()     ← 过滤实例
  │     ├── 根据 selectedFolderId 过滤
  │     └── 根据 searchQuery 过滤
  │
  └── renderContent()
        ├── loading && instances.length === 0 → 显示加载动画
        └── filteredInstances.length === 0    → 显示"暂无实例"
              ├── searchQuery 有值 → "未找到匹配的实例"
              └── searchQuery 为空 → "暂无实例"
```

#### 1.2 问题定位

**可能原因**：

1. **后端扫描失败**
   - `instance_manager.scan_instances()` 返回空数组
   - 目录结构不正确（刚重构过）
   - 路径配置错误

2. **过滤逻辑问题**
   - `selectedFolderId` 不正确
   - `knownFolders` 为空
   - 过滤条件过严

3. **数据流问题**
   - `init()` 未完成，`instances` 还是空数组
   - `getFilteredInstances()` 计算时机不对
   - 状态更新不同步

4. **路径配置问题**
   - `DEAMON_BASE_PATH` 指向错误目录
   - 实例目录结构不符合预期
   - 扫描逻辑与实际目录不匹配

#### 1.3 调试信息

从代码中的 `console.log` 可以看到：
```typescript
console.log("[filteredInstances] 扫描并过滤后的实力列表：", filteredInstances);
```

需要检查：
1. 这个日志输出了什么？
2. `instances` 数组是否为空？
3. `knownFolders` 是否包含默认文件夹？
4. `selectedFolderId` 的值是什么？

### 解决方案

#### 2.1 调试步骤

1. **检查后端扫描**
   ```rust
   // instance/manager.rs
   pub fn scan_instances(&self) -> Vec<GameInstance> {
       let daemon_dir = self.get_minecraft_dir();
       println!("扫描目录：{:?}", daemon_dir);  // ← 添加日志
       
       // ... 扫描逻辑
   }
   ```

2. **检查过滤逻辑**
   ```typescript
   // instanceStore.ts
   getFilteredInstances: () => {
     const { instances, searchQuery, selectedFolderId, knownFolders } = get();
     console.log("过滤前:", { instances, selectedFolderId, knownFolders });
     
     let filtered = instances;
     
     if (selectedFolderId) {
       const folder = knownFolders.find(f => f.id === selectedFolderId);
       console.log("选中的文件夹:", folder);
       if (folder) {
         filtered = instances.filter(i => i.path.startsWith(folder.path));
       }
     }
     
     console.log("过滤后:", filtered);
     return filtered;
   }
   ```

3. **检查初始化流程**
   ```typescript
   // instanceStore.ts
   init: async () => {
     set({ loading: true, error: null });
     try {
       const [instances, path, knownFolders] = await Promise.all([
         scanInstances(),
         getInstancesPath(),
         scanKnownMcPaths(),
       ]);
       
       console.log("初始化数据:", { instances, path, knownFolders });
       
       // ... 其余逻辑
     } catch (e) {
       console.error("初始化失败:", e);
       set({ error: e instanceof Error ? e.message : 'Failed to load instances' });
     } finally {
       set({ loading: false });
     }
   }
   ```

#### 2.2 修复方案

**场景 1：后端扫描失败**

如果 `scan_instances()` 返回空数组：

1. **检查目录结构**
   ```bash
   # 确认目录存在
   ls {base}/minecraft/
   
   # 应该有实例目录
   {base}/minecraft/
     └── {instance_name}/
         └── versions/
             └── {version_name}/
                 └── {version_name}.jar
   ```

2. **修复扫描逻辑** (`instance/manager.rs`)
   ```rust
   pub fn scan_instances(&self) -> Vec<GameInstance> {
       let daemon_dir = self.get_minecraft_dir();
       
       // 检查目录是否存在
       if !daemon_dir.exists() {
           log_info!("实例目录不存在：{:?}", daemon_dir);
           return Vec::new();
       }
       
       // ... 扫描逻辑
   }
   ```

**场景 2：过滤逻辑问题**

如果 `instances` 有数据但 `filteredInstances` 为空：

1. **修复 `selectedFolderId` 逻辑**
   ```typescript
   // instanceStore.ts
   init: async () => {
     // ...
     
     const savedFolderId = getSavedFolderId();
     const defaultFolderId = savedFolderId && knownFolders.find(f => f.id === savedFolderId)
       ? savedFolderId
       : knownFolders.find(f => f.is_default)?.id ?? knownFolders[0]?.id ?? null;
     
     console.log("文件夹选择:", { savedFolderId, defaultFolderId });
     
     set({
       selectedFolderId: defaultFolderId,
       // ...
     });
   }
   ```

2. **优化 `getFilteredInstances`**
   ```typescript
   getFilteredInstances: () => {
     const { instances, searchQuery, selectedFolderId, knownFolders } = get();
     
     // 如果没有选中文件夹，返回所有实例
     if (!selectedFolderId) {
       console.log("未选中文件夹，返回所有实例");
       return instances;
     }
     
     const folder = knownFolders.find(f => f.id === selectedFolderId);
     
     // 如果找不到文件夹，返回所有实例
     if (!folder) {
       console.warn("找不到选中的文件夹:", selectedFolderId);
       return instances;
     }
     
     // 过滤实例
     const filtered = instances.filter(i => i.path.startsWith(folder.path));
     console.log("文件夹过滤:", { folder: folder.name, before: instances.length, after: filtered.length });
     
     // 搜索过滤
     if (searchQuery) {
       const q = searchQuery.toLowerCase();
       const searched = filtered.filter(
         (i) => i.name.toLowerCase().includes(q) || i.version.toLowerCase().includes(q)
       );
       console.log("搜索过滤:", { query: searchQuery, before: filtered.length, after: searched.length });
       return searched;
     }
     
     return filtered;
   }
   ```

**场景 3：数据流问题**

如果 `init()` 未完成就渲染：

1. **优化加载状态**
   ```typescript
   // InstanceList.tsx
   const renderContent = () => {
     // 优先检查 loading 状态
     if (loading) {
       return (
         <div className="flex flex-col items-center justify-center py-20">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
           <span className="mt-3 text-text-tertiary">{t('instances.scanning', '正在扫描实例...')}</span>
         </div>
       );
     }
     
     // 检查错误
     if (error) {
       return (
         <div className="p-4 bg-error-bg border border-error rounded-lg">
           <p className="text-error text-sm">{error}</p>
         </div>
       );
     }
     
     // 没有实例
     if (filteredInstances.length === 0) {
       return (
         <EmptyState
           icon="folder"
           title={searchQuery ? t('instances.noMatch', '未找到匹配的实例') : t('instances.noInstances', '暂无实例')}
           description={searchQuery ? t('instances.adjustSearch', '尝试调整搜索关键词') : t('instances.noInstancesDesc', '下载或创建新实例来开始游戏')}
         />
       );
     }
     
     // 渲染实例列表
     return (
       <div className="h-full overflow-y-auto">
         {filteredInstances.map((instance) => (
           <InstanceListItem key={instance.id} ... />
         ))}
       </div>
     );
   };
   ```

#### 2.3 完整修复流程

1. **添加调试日志**（临时）
   - 后端：扫描目录、扫描结果
   - 前端：初始化数据、过滤逻辑

2. **运行并观察**
   - 打开开发者工具控制台
   - 查看日志输出
   - 确定问题所在

3. **根据日志修复**
   - 如果后端扫描为空 → 检查目录结构
   - 如果过滤后为空 → 检查文件夹选择
   - 如果状态不同步 → 优化加载逻辑

4. **移除调试日志**
   - 清理 `console.log`
   - 保留关键错误日志

---

## 实施计划

### Phase 1: 路径配置集成（预计 2 天）

**Day 1: 后端重构**
- [ ] 创建 `PathConfig` 结构
- [ ] 更新 `ConfigManager` 支持路径配置
- [ ] 创建路径管理 Tauri 命令
- [ ] 重构 `InstanceManager` 使用配置管理器
- [ ] 重构 `DownloadManager` 使用配置管理器
- [ ] 更新 `lib.rs` 初始化逻辑
- [ ] 移除硬编码路径

**Day 2: 前端集成**
- [ ] 创建路径配置 TypeScript 类型
- [ ] 封装路径配置 API
- [ ] 更新 `instanceStore` 使用新 API
- [ ] 更新 `downloadStore` 使用新 API
- [ ] 移除前端硬编码路径
- [ ] 更新启动配置获取逻辑

### Phase 2: 实例列表渲染修复（预计 1 天）

**Day 3: 调试与修复**
- [ ] 添加调试日志
- [ ] 运行并收集日志
- [ ] 分析问题原因
- [ ] 实施对应修复
- [ ] 清理调试代码
- [ ] 测试验证

### Phase 3: 测试与验证（预计 1 天）

**Day 4: 全面测试**
- [ ] 路径配置读写测试
- [ ] 实例创建/删除测试
- [ ] 文件下载测试
- [ ] 实例列表渲染测试
- [ ] 配置迁移测试
- [ ] 边界情况测试

---

## 风险评估

### 高风险

1. **路径配置错误导致数据丢失**
   - 缓解：提供默认值，保留回退机制
   - 缓解：配置文件版本控制

2. **实例列表完全不显示**
   - 缓解：保留旧逻辑作为回退
   - 缓解：添加详细错误提示

### 中风险

1. **前后端路径不一致**
   - 缓解：统一从后端获取
   - 缓解：添加路径验证

2. **配置文件格式变更导致兼容性问题**
   - 缓解：实现配置迁移逻辑
   - 缓解：提供迁移文档

### 低风险

1. **性能问题**（路径计算频繁）
   - 缓解：缓存路径结果
   - 缓解：懒加载路径配置

---

## 成功标准

### 路径配置集成

- ✅ 所有路径定义集中在 `config/models.rs`
- ✅ 无硬编码路径（除默认值外）
- ✅ 前端通过 API 获取路径
- ✅ 配置文件支持路径配置
- ✅ 单元测试覆盖率 > 80%

### 实例列表渲染

- ✅ 正确显示实例列表
- ✅ 过滤逻辑正常工作
- ✅ 加载状态正确显示
- ✅ 错误提示清晰明确
- ✅ 无控制台错误

---

## 备注

1. **优先级**：先修复实例列表渲染问题（影响用户体验），再进行路径配置集成（架构优化）

2. **依赖关系**：路径配置集成需要实例列表正常工作，以便验证

3. **文档更新**：完成后需要更新：
   - `AGENTS.md` - 路径配置说明
   - `docs/INSTANCE_DIR_REFACTOR.md` - 补充路径配置集成内容
   - 用户文档 - 配置文件格式说明
