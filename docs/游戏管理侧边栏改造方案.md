# 游戏管理侧边栏改造方案

## 一、需求分析

### 当前状态
- 游戏管理侧边栏显示的是：游戏设置、自动安装、模组、材质包、世界、浏览、管理等菜单项
- 顶部显示"游戏管理"标题
- 没有显示当前选中的游戏实例信息

### 目标
改造为类似 以下 的设计：
- **左侧显示当前选中的游戏实例信息**
  - 游戏版本图标（可自定义）
  - 游戏名称
  - 游戏版本号
- **右侧/下方显示功能菜单**（游戏设置、模组、材质包等）

## 二、数据结构

### 已有数据（来自 `GameInstance` 接口）
```typescript
export interface GameInstance {
  id: string;                    // 实例唯一标识
  name: string;                  // 实例名称（用户自定义）
  version: string;               // 游戏版本（如 "1.20.1"）
  loader_type: ModLoaderType;    // 加载器类型（Vanilla/Forge/Fabric/Quilt）
  loader_version: string | null; // 加载器版本（如 "47.1.0"）
  path: string;                  // 实例路径
  icon_path: string | null;      // 自定义图标路径
  last_played: number | null;    // 最后游玩时间戳
  created_at: number;            // 创建时间戳
  enabled: boolean;              // 是否启用
}
```

### 需要展示的信息
- **图标**：`icon_path`（如有）或根据 `loader_type` 显示默认图标
- **名称**：`name`
- **版本**：`version` + `loader_type` + `loader_version`（如 "1.20.1 - Forge 47.1.0"）

## 三、UI 设计方案

### 方案 A：顶部实例信息 + 下方菜单列表（推荐）

```
┌─────────────────────────────┐
│  [图标] 游戏名称             │
│         v1.20.1 - Forge     │
├─────────────────────────────┤
│  ⚙️  游戏设置               │
│  ✨  自动安装               │
│  🧩  模组                   │
│  📦  材质包                 │
│  🗺️  世界                   │
│  🔍  浏览 ▼                 │
│  ⚙️  管理 ▼                 │
└─────────────────────────────┘
```

**优点**：
- 信息层次清晰，实例信息突出
- 符合用户阅读习惯（从上到下）

**实现复杂度**：中等

### 方案 B：左侧实例信息 + 右侧菜单（需要修改布局）

```
┌────────────┬────────────────┐
│ [图标]     │ ⚙️ 游戏设置    │
│ 游戏名称   │ ✨ 自动安装    │
│ v1.20.1    │ 🧩 模组        │
│            │ 📦 材质包      │
│            │ 🗺️ 世界        │
│            │ 🔍 浏览 ▼      │
│            │ ⚙️ 管理 ▼      │
└────────────┴────────────────┘
```

**优点**：
- 实例信息更加醒目
- 充分利用横向空间

**缺点**：
- 需要修改现有布局结构
- 可能影响响应式设计

**实现复杂度**：较高

### 方案 C：可折叠实例信息面板

```
┌─────────────────────────────┐
│ ▼ 游戏名称 v1.20.1      [⚙️]│
├─────────────────────────────┤
│  [大图标]                   │
│  名称：我的生存存档         │
│  版本：1.20.1               │
│  加载器：Forge 47.1.0       │
│  最后游玩：2024-01-15       │
├─────────────────────────────┤
│  ⚙️  游戏设置               │
│  ✨  自动安装               │
│  ...                        │
└─────────────────────────────┘
```

**优点**：
- 信息展示完整
- 可折叠节省空间

**缺点**：
- 占用空间较大
- 实现复杂度高

**实现复杂度**：高

## 四、推荐实施方案（方案 A）

### 4.1 组件结构设计

#### 新建组件：`InstanceInfoHeader.tsx`
位置：`src/components/sidebar/InstanceInfoHeader.tsx`

```typescript
interface InstanceInfoHeaderProps {
  instance: GameInstance | null;
  onInstanceClick?: () => void;
  onIconClick?: () => void;
}

// 功能：
// - 显示实例图标（自定义图标或加载器类型图标）
// - 显示实例名称（截断过长文本）
// - 显示版本信息（格式化显示）
// - 点击图标可更换图标
// - 点击整个区域可打开实例选择器
```

#### 修改组件：`GameSidebarContent.tsx`
位置：`src/components/sidebar/content/GameSidebarContent.tsx`

```typescript
// 添加 InstanceInfoHeader 到顶部
const GameSidebarContent = (props) => {
  const instance = useInstanceStore(s => s.getSelectedInstance());
  
  return (
    <>
      <InstanceInfoHeader instance={instance} />
      <BaseSidebarContent {...props} />
    </>
  );
};
```

### 4.2 图标系统设计

#### 加载器类型图标映射
```typescript
const LOADER_ICONS = {
  [ModLoaderType.Vanilla]: Gamepad2,      // 原版
  [ModLoaderType.Forge]: Hammer,          // 锤子图标
  [ModLoaderType.Fabric]: Zap,            // 闪电图标
  [ModLoaderType.Quilt]: Package,         // 包裹图标
};
```

#### 图标优先级
1. 自定义图标（`instance.icon_path`）
2. 加载器类型图标
3. 默认图标（Gamepad2）

### 4.3 版本信息格式化

```typescript
const formatVersionInfo = (instance: GameInstance): string => {
  const parts = [instance.version];
  
  if (instance.loader_type !== ModLoaderType.Vanilla) {
    parts.push(instance.loader_type);
    if (instance.loader_version) {
      parts.push(instance.loader_version);
    }
  }
  
  return parts.join(' · ');
  // 示例输出：
  // "1.20.1"
  // "1.20.1 · Forge 47.1.0"
  // "1.20.1 · Fabric 0.14.21"
};
```

### 4.4 交互设计

#### 点击实例信息
- **点击整个区域**：打开实例选择器（下拉菜单或模态框）
- **点击图标**：打开图标选择器（可选）

#### 实例选择器设计
```typescript
// 方案 1：下拉菜单（轻量）
- 显示所有可用实例列表
- 点击切换

// 方案 2：模态框（完整）
- 显示实例卡片（图标 + 名称 + 版本）
- 支持搜索
- 支持快速创建新实例
```

**推荐**：方案 1（下拉菜单），因为：
- 实现简单
- 交互轻量
- 不破坏现有布局

### 4.5 动画效果

```typescript
// 实例切换动画
<motion.div
  key={instance?.id}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.2 }}
>
  {/* 实例信息 */}
</motion.div>

// 图标悬停效果
<motion.span
  whileHover={{ scale: 1.1, rotate: 5 }}
  transition={{ type: 'spring', stiffness: 400 }}
>
  {icon}
</motion.span>
```

### 4.6 样式设计

```css
/* 实例信息容器 */
.instance-info-header {
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

/* 图标容器 */
.instance-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--color-primary-10);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 文本信息 */
.instance-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.instance-version {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-top: 0.25rem;
}
```

## 五、实现步骤

### 第一阶段：基础实现
1. ✅ 创建 `InstanceInfoHeader.tsx` 组件
2. ✅ 实现图标映射逻辑
3. ✅ 实现版本信息格式化
4. ✅ 集成到 `GameSidebarContent`
5. ✅ 添加基础样式

### 第二阶段：交互增强
1. ✅ 实现实例选择器（下拉菜单）
2. ✅ 添加点击切换实例功能
3. ✅ 添加图标更换功能（可选）
4. ✅ 添加动画效果

### 第三阶段：优化完善
1. ✅ 响应式设计适配
2. ✅ 主题色适配
3. ✅ 国际化支持
4. ✅ 性能优化（懒加载）

## 六、技术要点

### 6.1 状态管理
```typescript
// 使用现有的 useInstanceStore
const instance = useInstanceStore(s => s.getSelectedInstance());
const setInstance = useInstanceStore(s => s.setSelectedInstance);
```

### 6.2 图标渲染
```typescript
// 自定义图标（图片）
{instance.icon_path ? (
  <img src={instance.icon_path} alt={instance.name} className="w-12 h-12" />
) : (
  // 加载器类型图标
  <LoaderIcon className="w-6 h-6" />
)}
```

### 6.3 国际化
```typescript
// i18n key 设计
{
  "instanceInfo.version": "版本 {{version}}",
  "instanceInfo.loader": "{{loader}} {{loaderVersion}}",
  "instanceInfo.selectInstance": "选择实例",
  "instanceInfo.changeIcon": "更换图标"
}
```

## 七、预期效果

### 视觉层面
- ✅ 实例信息清晰可见
- ✅ 图标、名称、版本层次分明
- ✅ 与现有设计风格统一

### 交互层面
- ✅ 一键切换实例
- ✅ 悬停/点击反馈流畅
- ✅ 动画过渡自然

### 功能层面
- ✅ 显示完整实例信息
- ✅ 支持自定义图标
- ✅ 支持快速切换

## 八、风险评估

### 低风险
- 组件结构修改（影响范围可控）
- 样式调整（可逐步优化）

### 中风险
- 实例选择器交互（需要设计合理的 UI）
- 图标更换功能（需要文件选择器支持）

### 高风险
- 无

## 九、验收标准

### 功能验收
- [ ] 正确显示实例图标、名称、版本
- [ ] 点击可切换实例
- [ ] 不同加载器类型显示对应图标
- [ ] 自定义图标优先显示

### 视觉验收
- [ ] 与设计稿一致
- [ ] 响应式布局正常
- [ ] 主题切换正常

### 交互验收
- [ ] 动画流畅（60fps）
- [ ] 悬停/点击反馈及时
- [ ] 键盘导航支持

## 十、后续扩展

### 可能的增强功能
1. **实例快捷操作**
   - 右键菜单：启动游戏、打开文件夹、删除实例
   - 快捷按钮：启动、设置、复制

2. **实例状态显示**
   - 运行中状态指示器
   - 最后游玩时间
   - 游戏时长统计

3. **多实例管理**
   - 批量操作
   - 实例分组
   - 快速搜索

---

**文档版本**：1.0  
**创建时间**：2026-05-06  
**最后更新**：2026-05-06
