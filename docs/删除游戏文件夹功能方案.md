# 方案规划：添加删除游戏文件夹功能

## 1. 需求分析

在"实例列表 -> 游戏文件夹"页面中，添加**删除游戏文件夹**功能，允许用户从列表中移除已添加的游戏文件夹路径。

### 1.1 当前状态

| 功能      | 状态                            |
| ------- | ----------------------------- |
| 添加游戏文件夹 | ✅ 已实现 (`handleAddGameFolder`) |
| 删除游戏文件夹 | ❌ 未实现                         |
| 列出游戏文件夹 | ✅ 已实现 (`knownFolders`)        |

### 1.2 需要考虑的问题

1. **仅删除记录还是同时删除文件？**
   - 方案A：仅从列表中移除记录，不删除实际文件（推荐，更安全）
   - 方案B：移除记录并删除实际文件（危险，可能误删用户数据）
2. **是否可以删除默认文件夹？**
   - 建议：可以删除，但需要提示用户
3. **删除后如何处理选中的文件夹？**
   - 如果删除的是当前选中的文件夹，需要自动切换到其他可用文件夹

***

## 2. 实施方案

### 2.1 后端 (Rust)

**修改文件**: `src-tauri/src/instance/manager.rs`

添加新方法 `remove_known_path`:

```rust
pub fn remove_known_path(&self, id: &str) -> Result<(), String> {
    let mut existing = self.load_known_paths();
    let original_len = existing.len();
    existing.retain(|p| p.id != id);

    if existing.len() == original_len {
        return Err("文件夹不存在".to_string());
    }

    self.save_known_paths(&existing)
}
```

**修改文件**: `src-tauri/src/instance/commands.rs`

添加新命令 `remove_known_path`:

```rust
#[tauri::command]
pub fn remove_known_path(
    id: String,
    instance_manager: State<'_, InstanceManager>,
) -> Result<(), String> {
    instance_manager.remove_known_path(&id)
}
```

**修改文件**: `src-tauri/src/lib.rs`

注册新命令:

```rust
remove_known_path,
```

### 2.2 前端 (TypeScript)

**修改文件**: `src/helper/rustInvoke.ts`

添加前端调用函数:

```typescript
export const removeKnownPath = async (id: string): Promise<void> => {
    await invoke('remove_known_path', { id });
};
```

**修改文件**: `src/stores/instanceStore.ts`

添加 store 方法:

```typescript
removeKnownFolder: async (id: string) => {
    try {
        await removeKnownPath(id);
        set(prev => ({
            knownFolders: prev.knownFolders.filter(f => f.id !== id),
            selectedFolderId: prev.selectedFolderId === id
                ? prev.knownFolders.find(f => f.id !== id)?.id ?? null
                : prev.selectedFolderId
        }));
    } catch (e) {
        set({ error: e instanceof Error ? e.message : 'Failed to remove folder' });
        throw e;
    }
}
```

### 2.3 UI 实现

**修改文件**: `src/pages/Instance/Instance.tsx` 或新建组件

在游戏文件夹列表中添加删除按钮：

1. 现有组件中已有 `knownFolders` 数据
2. 在每个文件夹项添加删除图标按钮
3. 点击后显示确认对话框
4. 确认后调用 `removeKnownFolder`

***

## 3. 实施步骤

### 步骤 1: 后端 - 添加 remove\_known\_path 命令

- 在 `instance/manager.rs` 添加 `remove_known_path` 方法
- 在 `instance/commands.rs` 添加命令导出
- 在 `lib.rs` 注册命令

### 步骤 2: 前端 - 添加调用函数

- 在 `rustInvoke.ts` 添加 `removeKnownPath` 函数
- 在 `instanceStore.ts` 添加 `removeKnownFolder` store 方法

### 步骤 3: 前端 - 添加 UI

- 在实例列表页面添加删除按钮
- 添加确认对话框

### 步骤 4: 国际化

- 在 `translation.json` 添加相关翻译 key

***

## 4. 翻译 key 建议

```json
{
  "instances": {
    "removeGameFolder": "删除游戏文件夹",
    "confirmRemoveFolder": "确定要删除文件夹 "{{name}}" 吗？",
    "confirmRemoveFolderDesc": "此操作仅从列表中移除记录，不会删除实际文件。",
    "folderRemoved": "文件夹已移除",
    "removeFolderFailed": "删除失败"
  }
}
```

***

## 5. 风险评估

| 项目        | 风险 | 缓解措施                 |
| --------- | -- | -------------------- |
| 误删文件夹     | 低  | 采用方案A，仅删除记录不删除文件     |
| 删除当前选中文件夹 | 中  | 自动切换到其他可用文件夹         |
| 列表刷新      | 低  | 删除后自动刷新 knownFolders |

***

## 6. 推荐方案

采用**方案A（仅删除记录）**，理由：

1. 更安全，不会误删用户数据
2. 用户可以通过"添加游戏文件夹"重新添加
3. 符合最小权限原则

