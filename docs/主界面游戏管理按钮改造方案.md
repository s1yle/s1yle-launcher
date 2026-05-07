# 主界面游戏管理按钮改造方案

## 一、需求分析

### 当前状态
```
主界面侧边栏：
┌─────────────────────────────┐
│ 📂 游戏管理                 │  ← 普通按钮，点击展开子菜单
│   ⚙️  游戏设置              │
│   ✨  自动安装              │
│   🧩  模组                  │
│   ...                       │
└─────────────────────────────┘
```

### 目标状态
```
主界面侧边栏：
┌─────────────────────────────┐
│ [🎮] 我的生存存档      ▼   │  ← InstanceInfoHeader 组件
│    1.20.1 · Forge 47.1.0    │
└─────────────────────────────┘

点击行为：
- 点击图标/名称区域 → 跳转到 /instance-manage 页面
- 点击展开箭头 ▼ → 展开实例选择下拉菜单
```

## 二、核心设计思路

### 2.1 组件定位
将 `InstanceInfoHeader` 从**页面级组件**改为**菜单项级组件**：
- 不再作为独立组件渲染
- 而是作为"游戏管理"菜单项的**自定义渲染内容**

### 2.2 交互设计
| 点击区域 | 行为 |
|---------|------|
| 图标区域 | 跳转到 `/instance-manage` 页面 |
| 名称区域 | 跳转到 `/instance-manage` 页面 |
| 展开箭头 | 展开/收起实例选择下拉菜单 |
| 下拉菜单中的实例 | 切换选中实例 |

### 2.3 状态管理
```typescript
// 需要的状态
- selectedInstanceId: 当前选中的实例 ID
- isExpanded: 下拉菜单是否展开
- instances: 所有可用实例列表
```

## 三、实施方案

### 方案 A：自定义菜单项渲染（推荐）

#### 3.1.1 修改 `SidebarMenuItem` 接口
```typescript
export interface SidebarMenuItem {
  id: string;
  type: SidebarItemType;
  title: string;
  titleI18nKey: string;
  icon?: ReactNode;
  path?: string;
  // ... 其他字段
  
  // 新增：自定义渲染组件
  customRender?: React.ComponentType<{
    item: SidebarMenuItem;
    isActive: boolean;
    onClick: (e: React.MouseEvent) => void;
  }>;
}
```

#### 3.1.2 创建 `InstanceManageMenuItem` 组件
```typescript
// src/components/sidebar/InstanceManageMenuItem.tsx
interface InstanceManageMenuItemProps {
  item: SidebarMenuItem;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const InstanceManageMenuItem = ({ item, isActive, onClick }: Props) => {
  const instance = useInstanceStore(s => s.getSelectedInstance());
  const instances = useInstanceStore(s => s.instances);
  const setSelectedInstance = useInstanceStore(s => s.setSelectedInstance);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleMainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/instance-manage');
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleInstanceSelect = (instanceId: string) => {
    setSelectedInstance(instanceId);
    setShowDropdown(false);
  };

  return (
    <div className="instance-manage-menu-item">
      {/* 主体点击区域（跳转） */}
      <div onClick={handleMainClick}>
        {/* 实例图标 */}
        {/* 实例名称 */}
        {/* 版本号 */}
      </div>
      
      {/* 展开箭头 */}
      <button onClick={handleToggleExpand}>▼</button>
      
      {/* 下拉菜单 */}
      {showDropdown && (
        <div className="instance-dropdown">
          {instances.map(inst => (
            <div onClick={() => handleInstanceSelect(inst.id)}>
              {inst.name} - {inst.version}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### 3.1.3 修改 `BaseSidebarContent` 渲染逻辑
```typescript
const renderItem = (item: SidebarMenuItem) => {
  // 如果有自定义渲染，使用自定义渲染
  if (item.customRender) {
    const CustomComponent = item.customRender;
    return <CustomComponent item={item} isActive={active} onClick={handleClick} />;
  }
  
  // 否则使用默认渲染
  return (
    <button onClick={handleClick}>
      {item.icon}
      {item.title}
    </button>
  );
};
```

#### 3.1.4 配置菜单项
```typescript
// src/router/config.tsx
import InstanceManageMenuItem from '../components/sidebar/InstanceManageMenuItem';

{
  id: 'instance-manage',
  type: 'route',
  title: '游戏管理',
  titleI18nKey: 'sidebar.instanceManage',
  icon: <FolderOpen className="w-4 h-4" />,
  path: '/instance-manage',
  group: SidebarGroup.GAME,
  customRender: InstanceManageMenuItem, // 自定义渲染
  children: [...]
}
```

---

### 方案 B：特殊处理"游戏管理"菜单项（备选）

#### 3.2.1 在 `GameSidebarContent` 中特殊处理
```typescript
const GameSidebarContent = (props) => {
  const instance = useInstanceStore(s => s.getSelectedInstance());
  
  // 判断是否是主界面侧边栏（没有父级标题）
  const isMainSidebar = !props.groupTitle;
  
  if (isMainSidebar && instance) {
    // 渲染 InstanceInfoHeader 替代"游戏管理"按钮
    return <InstanceInfoHeader />;
  }
  
  return <BaseSidebarContent {...props} />;
};
```

#### 3.2.2 修改 `InstanceInfoHeader` 支持导航
```typescript
interface InstanceInfoHeaderProps {
  onInstanceClick?: () => void; // 点击实例区域的行为
  onExpandClick?: () => void;   // 点击展开的行为
  navigateTo?: string;          // 跳转路径
}

const InstanceInfoHeader = ({ 
  onInstanceClick,
  onExpandClick,
  navigateTo = '/instance-manage'
}: Props) => {
  const navigate = useNavigate();
  
  const handleMainClick = () => {
    if (onInstanceClick) {
      onInstanceClick();
    } else {
      navigate(navigateTo);
    }
  };
  
  // ... 渲染逻辑
};
```

---

## 四、推荐方案（方案 A 改进版）

### 4.1 为什么选择方案 A
1. **解耦性好**：自定义渲染组件独立，不影响其他菜单项
2. **可扩展性强**：其他菜单项也可以使用 `customRender`
3. **代码清晰**：逻辑集中在一个组件中，易于维护

### 4.2 改进点
1. **不需要修改 `SidebarMenuItem` 接口**
   - 直接在 `GameSidebarContent` 中判断并替换渲染
   - 使用条件渲染而非配置化

2. **简化交互逻辑**
   - 点击整个区域 → 跳转页面
   - 点击箭头 → 展开下拉菜单
   - 不需要分离图标和名称的点击事件

### 4.3 最终实现方案

#### 步骤 1：创建 `InstanceManageButton` 组件
```typescript
// src/components/sidebar/InstanceManageButton.tsx
interface InstanceManageButtonProps {
  isActive: boolean;
  onNavigate: () => void;
}

const InstanceManageButton = ({ isActive, onNavigate }: Props) => {
  const instance = useInstanceStore(s => s.getSelectedInstance());
  const instances = useInstanceStore(s => s.instances);
  const setSelectedInstance = useInstanceStore(s => s.setSelectedInstance);
  const [showDropdown, setShowDropdown] = useState(false);

  // 格式化版本信息
  const formatVersionInfo = (inst: GameInstance): string => {
    const parts = [inst.version];
    if (inst.loader_type !== ModLoaderType.Vanilla) {
      if (inst.loader_version) {
        parts.push(`${inst.loader_type} ${inst.loader_version}`);
      } else {
        parts.push(inst.loader_type);
      }
    }
    return parts.join(' · ');
  };

  // 获取加载器图标
  const getLoaderIcon = (inst: GameInstance) => {
    const icons = {
      [ModLoaderType.Vanilla]: Gamepad2,
      [ModLoaderType.Forge]: Hammer,
      [ModLoaderType.Fabric]: Zap,
      [ModLoaderType.Quilt]: Package,
    };
    const Icon = icons[inst.loader_type] || Gamepad2;
    return <Icon className="w-5 h-5" />;
  };

  if (!instance) {
    return (
      <div className="instance-manage-button no-instance">
        <span>暂无实例</span>
      </div>
    );
  }

  return (
    <div className="instance-manage-button-wrapper">
      {/* 主体按钮 */}
      <motion.button
        className={`instance-manage-button ${isActive ? 'active' : ''}`}
        onClick={onNavigate}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 左侧：图标 + 信息 */}
        <div className="instance-info">
          {/* 实例图标 */}
          <div className="instance-icon">
            {instance.icon_path ? (
              <img src={instance.icon_path} alt={instance.name} />
            ) : (
              getLoaderIcon(instance)
            )}
          </div>
          
          {/* 实例信息 */}
          <div className="instance-details">
            <div className="instance-name">{instance.name}</div>
            <div className="instance-version">{formatVersionInfo(instance)}</div>
          </div>
        </div>
        
        {/* 右侧：展开箭头 */}
        <motion.div
          className="expand-arrow"
          animate={{ rotate: showDropdown ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>
      
      {/* 下拉菜单 */}
      {showDropdown && (
        <InstanceDropdown
          instances={instances}
          selectedId={instance.id}
          onSelect={(id) => {
            setSelectedInstance(id);
            setShowDropdown(false);
          }}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};
```

#### 步骤 2：修改 `GameSidebarContent`
```typescript
// src/components/sidebar/content/GameSidebarContent.tsx
interface GameSidebarContentProps extends Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'> {
  isMainSidebar?: boolean; // 是否是主界面侧边栏
}

const GameSidebarContent = ({ 
  isMainSidebar = false,
  items,
  ...props 
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 判断当前是否在游戏管理页面
  const isInInstanceManage = location.pathname.startsWith('/instance-manage');
  
  if (isMainSidebar) {
    // 主界面侧边栏：渲染 InstanceManageButton
    return (
      <div className="game-sidebar-main">
        <InstanceManageButton 
          isActive={isInInstanceManage}
          onNavigate={() => navigate('/instance-manage')}
        />
      </div>
    );
  }
  
  // 游戏管理页面侧边栏：使用 InstanceInfoHeader + BaseSidebarContent
  return (
    <>
      <InstanceInfoHeader />
      <BaseSidebarContent items={items} {...props} />
    </>
  );
};
```

#### 步骤 3：修改 `SmartSidebar` 传递 `isMainSidebar` 标志
```typescript
// src/components/sidebar/SmartSidebar.tsx

// 判断是否是主界面
const isHome = location.pathname === '/';

// 渲染游戏侧边栏
{currentGroup === 'game' && (
  <motion.div key="sidebar-game">
    <GameSidebarContent
      isMainSidebar={isHome} // 主界面传入 true
      items={groups.game}
      onMenuClick={handleItemClick}
      // ... 其他 props
    />
  </motion.div>
)}
```

#### 步骤 4：样式设计
```css
/* InstanceManageButton 样式 */
.instance-manage-button-wrapper {
  position: relative;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.instance-manage-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.instance-manage-button:hover {
  background: var(--color-surface-hover);
}

.instance-manage-button.active {
  background: var(--color-surface-active);
  border-left: 3px solid var(--color-primary);
}

.instance-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.instance-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--color-primary-10);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.instance-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.instance-details {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.instance-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.instance-version {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  margin-top: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-arrow {
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
}

/* 下拉菜单样式 */
.instance-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin-top: 0.25rem;
  padding: 0.25rem;
  background: var(--color-surface-solid);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  max-height: 300px;
  overflow-y: auto;
}

.instance-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.instance-dropdown-item:hover {
  background: var(--color-surface-hover);
}

.instance-dropdown-item.selected {
  background: var(--color-primary-10);
}
```

## 五、技术要点

### 5.1 状态同步
```typescript
// 确保实例切换后，按钮显示立即更新
const instance = useInstanceStore(s => s.getSelectedInstance());
// InstanceManageButton 会自动响应 instance 变化
```

### 5.2 点击事件处理
```typescript
// 阻止事件冒泡，防止触发父级菜单的展开
e.stopPropagation();

// 使用 navigate 而非 onMenuClick，避免重复触发
navigate('/instance-manage');
```

### 5.3 下拉菜单定位
```typescript
// 使用 absolute 定位，相对于 wrapper
position: absolute;
top: 100%; // 在按钮下方
left: 0;
right: 0;

// 添加遮罩层，点击外部关闭
{showDropdown && (
  <div 
    className="fixed inset-0 z-40" 
    onClick={() => setShowDropdown(false)}
  />
)}
```

## 六、预期效果

### 主界面侧边栏
```
┌─────────────────────────────┐
│ [🎮] 我的生存存档      ▼   │  ← 点击跳转
│    1.20.1 · Forge 47.1.0    │
├─────────────────────────────┤
│ 📂 游戏列表                 │
│ 📥 下载                     │
└─────────────────────────────┘

点击 ▼ 后：
┌─────────────────────────────┐
│ [🎮] 我的生存存档      ▼   │
│    1.20.1 · Forge 47.1.0    │
├─────────────────────────────┤
│ ○ 我的生存存档              │
│   1.20.1 · Forge 47.1.0     │
│ ○ 新建实例                  │
│   1.20.1 · 原版             │
│ ○ 服务器专用                │
│   1.19.2 · Fabric 0.14      │
└─────────────────────────────┘
```

### 游戏管理页面侧边栏（保持不变）
```
┌─────────────────────────────┐
│ [🎮] 我的生存存档      ▼   │
│    1.20.1 · Forge 47.1.0    │
├─────────────────────────────┤
│ ⚙️  游戏设置                │
│ ✨  自动安装                │
│ 🧩  模组                    │
│ 📦  材质包                  │
│ 🗺️  世界                    │
│ 🔍  浏览 ▼                  │
│ ⚙️  管理 ▼                  │
└─────────────────────────────┘
```

## 七、实施步骤

### 第一阶段：基础组件
1. ✅ 创建 `InstanceManageButton.tsx`
2. ✅ 实现实例信息显示
3. ✅ 实现展开/收起逻辑
4. ✅ 实现实例选择下拉菜单

### 第二阶段：集成到侧边栏
1. ✅ 修改 `GameSidebarContent` 支持 `isMainSidebar` 标志
2. ✅ 修改 `SmartSidebar` 传递标志
3. ✅ 测试主界面和游戏管理页面的不同表现

### 第三阶段：优化完善
1. ✅ 添加动画效果
2. ✅ 优化样式细节
3. ✅ 添加国际化支持
4. ✅ 测试边界情况（无实例、多实例等）

## 八、风险评估

### 低风险
- 组件结构修改（影响范围可控）
- 样式调整（可逐步优化）

### 中风险
- 点击事件冲突（需要仔细处理事件冒泡）
- 下拉菜单定位（需要测试不同屏幕尺寸）

### 高风险
- 无

## 九、验收标准

### 功能验收
- [ ] 主界面显示实例信息按钮
- [ ] 点击按钮跳转到游戏管理页面
- [ ] 点击箭头展开实例选择菜单
- [ ] 切换实例后按钮立即更新
- [ ] 游戏管理页面侧边栏保持不变

### 视觉验收
- [ ] 按钮样式与设计一致
- [ ] 实例信息完整显示（名称 + 版本）
- [ ] 下拉菜单样式美观
- [ ] 动画流畅自然

### 交互验收
- [ ] 点击响应及时
- [ ] 下拉菜单开闭流畅
- [ ] 键盘导航支持
- [ ] 移动端适配良好

## 十、后续扩展

### 可能的增强功能
1. **快捷操作**
   - 右键菜单：启动游戏、打开文件夹
   - 双击直接启动

2. **实例状态显示**
   - 运行中指示器
   - 最后游玩时间

3. **快速创建实例**
   - 下拉菜单底部添加"创建新实例"按钮

---

**文档版本**：1.0  
**创建时间**：2026-05-06  
**最后更新**：2026-05-06
