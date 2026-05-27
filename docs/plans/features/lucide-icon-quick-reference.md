# Lucide 图标使用快速参考

> **状态**: 已实施 ✅  
> **最后更新**: 2026-05-07

## 一句话总结

**所有图标渲染都使用 `renderIcon(icon, className, size)` 函数**

## 快速上手

```typescript
import { renderIcon } from '@/utils/iconRenderer';
import { Settings, Trash2 } from 'lucide-react';

// ✅ 最简单的方式
{renderIcon(Settings)}

// ✅ 添加样式
{renderIcon(Settings, 'text-primary', 'md')}

// ✅ 在数组中使用
items.map(item => (
  <div key={item.id}>
    {renderIcon(item.icon)}
    <span>{item.label}</span>
  </div>
))
```

## 常见场景

### 1. 组件 Props

```typescript
interface ButtonProps {
  icon?: LucideIcon;
}

const Button: React.FC<ButtonProps> = ({ icon }) => (
  <button>
    {renderIcon(icon, '', 'sm')}
    点击
  </button>
);
```

### 2. ContextMenu

```typescript
const items: ContextMenuItemData[] = [
  { id: '1', label: '设置', icon: Settings },
  { id: '2', label: '删除', icon: Trash2, danger: true },
];

// ContextMenu 内部会自动使用 renderIcon
<ContextMenu items={items} ... />
```

### 3. 列表项

```typescript
{items.map(item => (
  <div key={item.id}>
    {renderIcon(item.icon, 'mr-2', 'md')}
    <span>{item.label}</span>
  </div>
))}
```

### 4. 条件渲染

```typescript
// ✅ 正确
{icon && renderIcon(icon)}

// ❌ 错误
{icon && <icon />}  // icon 可能是 undefined
{icon}  // 会报错
```

## 大小规范

| Size | Class | 使用场景 |
|------|-------|---------|
| `sm` | `w-3.5 h-3.5` | 小标签、徽章内 |
| `md` | `w-4 h-4` | 常规图标（默认） |
| `lg` | `w-5 h-5` | 侧边栏、大按钮 |

## 常用样式组合

```typescript
// 主色图标
renderIcon(Settings, 'text-primary', 'md')

// 错误/危险图标
renderIcon(Trash2, 'text-error', 'md')

// 带间距
renderIcon(Folder, 'mr-2', 'md')

// 组合使用
renderIcon(Settings, 'text-primary mr-2', 'md')
```

## 常见错误

| 错误代码 | 问题 | 正确写法 |
|---------|------|---------|
| `{icon}` | 直接渲染对象 | `{renderIcon(icon)}` |
| `icon={Settings()}` | 立即执行函数 | `icon={Settings}` |
| `React.isValidElement(icon)` | 对函数返回 false | `typeof icon === 'function'` |
| `<icon />` | icon 可能是 undefined | `{renderIcon(icon)}` |

## 类型定义

```typescript
import { type LucideIcon } from 'lucide-react';

interface Props {
  // ✅ 推荐：明确的类型
  icon?: LucideIcon;
  
  // ✅ 也可以：更宽泛的类型
  icon?: LucideIcon | React.ReactNode;
}
```

## 检查清单

在提交代码前检查：

- [ ] 是否使用了 `renderIcon` 函数
- [ ] 图标类型是否正确（`LucideIcon`）
- [ ] 是否有条件渲染（`icon && renderIcon(icon)`）
- [ ] className 是否合理
- [ ] size 是否合适

## 相关文件

- **工具函数**: `src/utils/iconRenderer.ts`
- **最佳实践**: `docs/Lucide 图标使用最佳实践.md`
- **修复总结**: `docs/Lucide 图标渲染问题修复总结.md`
- **项目规范**: `AGENTS.md` 第 3.6 节

## 速查表

```
✅ DO                          ❌ DON'T
----------------------------    ----------------------------
{renderIcon(icon)}              {icon}
icon={Settings}                 icon={Settings()}
typeof icon === 'function'      React.isValidElement(icon)
<Settings className="..." />    <Settings /> (无 className)
```

---

**最后更新**: 2026-05-07  
**维护者**: WeCraft! Launcher Team
