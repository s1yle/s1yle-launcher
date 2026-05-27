# 主题配色系统文档

> **状态**: 已实施 ✅  
> **最后更新**: 2026-05-04

本文档详细描述了 s1yle-launcher 项目的主题配色系统，包括暗色/亮色主题的所有 CSS 变量值、强调色系统、使用规范及代码示例。

---

## 目录

- [1. 主题架构](#1-主题架构)
- [2. 背景色系统](#2-背景色系统)
- [3. 文字色系统](#3-文字色系统)
- [4. 边框色系统](#4-边框色系统)
- [5. 语义色系统](#5-语义色系统)
- [6. 强调色系统](#6-强调色系统)
- [7. 组件级配色](#7-组件级配色)
- [8. 透明度变体使用规范](#8-透明度变体使用规范)
- [9. 背景纹理与渐变](#9-背景纹理与渐变)
- [10. 间距与圆角](#10-间距与圆角)
- [11. 阴影系统](#11-阴影系统)
- [12. 代码使用示例](#12-代码使用示例)
- [13. 主题切换机制](#13-主题切换机制)

---

## 1. 主题架构

### 1.1 文件结构

| 文件 | 路径 | 内容 |
|------|------|------|
| 暗色主题 | `src/styles/themes/dark.css` | 暗色模式所有 CSS 变量 |
| 亮色主题 | `src/styles/themes/light.css` | 亮色模式所有 CSS 变量 |
| 强调色 | `src/styles/themes/accents.css` | 7 种强调色定义（双主题） |
| 背景纹理 | `src/styles/themes/background.css` | SVG 噪点 + 径向渐变 |

### 1.2 主题类名切换

```tsx
// 暗色主题
document.documentElement.classList.add('theme-dark');

// 亮色主题
document.documentElement.classList.add('theme-light');
```

### 1.3 主题模式

| 模式 | 说明 |
|------|------|
| `dark` | 强制暗色 |
| `light` | 强制亮色 |
| `system` | 跟随操作系统（监听 `prefers-color-scheme`） |

---

## 2. 背景色系统

### 2.1 页面背景

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-bg-primary` | `#1a1a1a` | `#f5f5f5` | 页面主背景 |
| `--color-bg-secondary` | `#191919` | `#ffffff` | 次要背景区域 |
| `--color-bg-tertiary` | `#141414` | `#e5e5e5` | 三级背景（分隔区域） |

### 2.2 表面层（Surface）

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-surface` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.03)` | 卡片、列表项背景（半透明） |
| `--color-surface-solid` | `#1e1e1e` | `#ffffff` | 卡片、弹窗背景（纯色） |
| `--color-surface-hover` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.06)` | 鼠标悬停状态 |
| `--color-surface-active` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.08)` | 激活/选中/按下状态 |

### 2.3 背景色层级关系

```
暗色: bg-tertiary (#141414) < bg-secondary (#191919) < bg-primary (#1a1a1a) < surface (半透明白)
亮色: bg-primary (#f5f5f5) < bg-tertiary (#e5e5e5) < bg-secondary (#ffffff) < surface (半透明黑)
```

### 2.4 其他背景色

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-overlay` | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.4)` | 遮罩层（弹窗背景） |
| `--color-context-bg` | `rgba(30,30,30,0.95)` | `rgba(255,255,255,0.95)` | 右键菜单背景 |
| `--color-progress-track` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.1)` | 进度条轨道 |
| `--color-toggle-track` | `rgba(255,255,255,0.2)` | `rgba(0,0,0,0.2)` | 开关轨道 |

---

## 3. 文字色系统

| 变量 | 暗色 | 亮色 | 用途 | 示例场景 |
|------|------|------|------|---------|
| `--color-text-primary` | `#ffffff` | `#1a1a1a` | 主文字 | 标题、按钮文字 |
| `--color-text-secondary` | `rgba(255,255,255,0.7)` | `rgba(0,0,0,0.7)` | 次要文字 | 描述文字、副标题 |
| `--color-text-tertiary` | `rgba(255,255,255,0.4)` | `rgba(0,0,0,0.4)` | 三级文字 | 提示文字、占位符 |
| `--color-text-disabled` | `rgba(255,255,255,0.3)` | `rgba(0,0,0,0.3)` | 禁用文字 | 禁用状态文字 |

---

## 4. 边框色系统

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-border` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.1)` | 默认边框 |
| `--color-border-hover` | `rgba(255,255,255,0.2)` | `rgba(0,0,0,0.2)` | 悬停边框 |
| `--color-context-border` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.1)` | 右键菜单边框 |

---

## 5. 语义色系统

### 5.1 主色（Primary）

主色由强调色系统动态映射，默认使用 Indigo。详见 [强调色系统](#6-强调色系统)。

| 变量 | 暗色（Indigo） | 亮色（Indigo） | 用途 |
|------|---------------|---------------|------|
| `--color-primary` | `#6366f1` | `#6366f1` | 主要操作按钮 |
| `--color-primary-hover` | `#818cf8` | `#4f46e5` | 悬停状态 |
| `--color-primary-active` | `#4f46e5` | `#4338ca` | 按下/激活状态 |
| `--color-primary-bg` | `rgba(99,102,241,0.2)` | `rgba(99,102,241,0.1)` | 主色背景（淡色） |

### 5.2 成功色（Success）

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-success` | `#22c55e` | `#16a34a` | 成功状态、已安装标记 |
| `--color-success-bg` | `rgba(34,197,94,0.15)` | `rgba(22,163,74,0.1)` | 成功提示背景 |

### 5.3 警告色（Warning）

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-warning` | `#eab308` | `#ca8a04` | 警告提示 |
| `--color-warning-bg` | `rgba(234,179,8,0.15)` | `rgba(202,138,4,0.1)` | 警告提示背景 |

### 5.4 错误色（Error）

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-error` | `#ef4444` | `#dc2626` | 错误状态、危险操作 |
| `--color-error-bg` | `rgba(239,68,68,0.15)` | `rgba(220,38,38,0.1)` | 错误提示背景 |

### 5.5 信息色（Info）

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-info` | `#3b82f6` | `#2563eb` | 信息提示 |
| `--color-info-bg` | `rgba(59,130,246,0.15)` | `rgba(37,99,235,0.1)` | 信息提示背景 |

---

## 6. 强调色系统

### 6.1 7 种强调色

| 颜色 | 变量前缀 | 主色 | 悬停 | 按下 |
|------|---------|------|------|------|
| **靛蓝** (Indigo) | `--accent-indigo` | `#6366f1` | `#818cf8` (暗) / `#4f46e5` (亮) | `#4f46e5` (暗) / `#4338ca` (亮) |
| **蓝色** (Blue) | `--accent-blue` | `#3b82f6` | `#60a5fa` (暗) / `#2563eb` (亮) | `#2563eb` (暗) / `#1d4ed8` (亮) |
| **绿色** (Green) | `--accent-green` | `#22c55e` (暗) / `#16a34a` (亮) | `#4ade80` (暗) / `#15803d` (亮) | `#16a34a` (暗) / `#166534` (亮) |
| **紫色** (Purple) | `--accent-purple` | `#a855f7` | `#c084fc` (暗) / `#9333ea` (亮) | `#9333ea` (暗) / `#7e22ce` (亮) |
| **红色** (Red) | `--accent-red` | `#ef4444` (暗) / `#dc2626` (亮) | `#f87171` (暗) / `#b91c1c` (亮) | `#dc2626` (暗) / `#991b1b` (亮) |
| **橙色** (Orange) | `--accent-orange` | `#f97316` (暗) / `#ea580c` (亮) | `#fb923c` (暗) / `#c2410c` (亮) | `#ea580c` (暗) / `#9a3412` (亮) |
| **粉色** (Pink) | `--accent-pink` | `#ec4899` (暗) / `#db2777` (亮) | `#f472b6` (暗) / `#be185d` (亮) | `#db2777` (暗) / `#9d174d` (亮) |

### 6.2 强调色透明度变体

每种强调色都提供以下透明度变体：

| 变体 | 透明度 | 用途 |
|------|--------|------|
| `-5` | 5% | 极淡背景 |
| `-10` | 10% | 悬浮背景、列表项悬浮 |
| `-15` | 15% | 选中背景、列表项选中 |
| `-20` | 20% | 强调背景、阴影 |
| `-bg` | 10% (亮) / 20% (暗) | 主色背景（默认映射到 `--color-primary-bg`） |

### 6.3 暗色 vs 亮色强调色差异

| 差异点 | 暗色主题 | 亮色主题 |
|--------|---------|---------|
| 背景透明度 | 较高（0.2） | 较低（0.1） |
| Hover 方向 | 更亮（向白色偏移） | 更深（向黑色偏移） |
| Active 方向 | 更深（向黑色偏移） | 更深（向黑色偏移） |

---

## 7. 组件级配色

### 7.1 右键菜单

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-context-bg` | `rgba(30,30,30,0.95)` | `rgba(255,255,255,0.95)` | 菜单背景 |
| `--color-context-border` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.1)` | 菜单边框 |
| `--color-context-hover` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.05)` | 菜单项悬浮 |

### 7.2 开关（Toggle）

| 状态 | 变量/值 | 说明 |
|------|---------|------|
| 关闭轨道 | `--color-toggle-track` | `rgba(255,255,255,0.2)` (暗) / `rgba(0,0,0,0.2)` (亮) |
| 开启轨道 | `--color-primary` | 跟随强调色 |
| 滑块 | `white` | 白色圆形 |

### 7.3 弹窗与遮罩

| 变量 | 暗色 | 亮色 | 用途 |
|------|------|------|------|
| `--color-overlay` | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.4)` | 遮罩层 |
| `--color-backdrop-blur` | `8px` | `8px` | 毛玻璃模糊度 |

---

## 8. 透明度变体使用规范

### 8.1 列表交互

| 场景 | 推荐变量 | 示例 |
|------|---------|------|
| 列表项默认 | `--color-surface` | `bg-[var(--color-surface)]` |
| 列表项悬浮 | `--color-primary-10` | `hover:bg-[var(--color-primary-10)]` |
| 列表项选中 | `--color-primary-15` | `bg-[var(--color-primary-15)]` |

### 8.2 状态标记

| 场景 | 推荐变量 | 示例 |
|------|---------|------|
| 已安装状态 | `--color-success-8` | `bg-[var(--color-success-8)]` |
| 警告状态 | `--color-warning-10` | `bg-[var(--color-warning-10)]` |
| 错误状态 | `--color-error-10` | `bg-[var(--color-error-10)]` |

### 8.3 右键菜单

| 场景 | 推荐变量 | 示例 |
|------|---------|------|
| 普通项悬浮 | `--color-primary-10` | `hover:bg-[var(--color-primary-10)]` |
| 危险项悬浮 | `--color-error-10` | `hover:bg-[var(--color-error-10)]` |

---

## 9. 背景纹理与渐变

### 9.1 SVG 噪点纹理

```css
.noise-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.03;           /* 暗色主题 */
  pointer-events: none;
  background-image: url("data:image/svg+xml,...");  /* SVG feTurbulence */
  background-size: 256px 256px;
  background-repeat: repeat;
  z-index: 0;
}

.theme-light .noise-bg::before {
  opacity: 0.015;          /* 亮色主题透明度减半 */
}
```

### 9.2 径向渐变

```css
.gradient-bg::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: 
    radial-gradient(ellipse at 20% 50%, var(--color-primary-bg) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, var(--color-primary-bg) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 80%, var(--color-info-bg) 0%, transparent 45%);
  opacity: 0.5;
  z-index: 0;
}
```

### 9.3 使用方式

```tsx
<main className="flex-1 overflow-y-auto noise-bg gradient-bg">
  {/* 内容 */}
</main>
```

---

## 10. 间距与圆角

### 10.1 间距变量

| 变量 | 值 | 用途 |
|------|-----|------|
| `--spacing-xs` | `0.25rem` (4px) | 极小间距 |
| `--spacing-sm` | `0.5rem` (8px) | 小间距 |
| `--spacing-md` | `0.75rem` (12px) | 中等间距 |
| `--spacing-lg` | `1rem` (16px) | 大间距 |
| `--spacing-xl` | `1.25rem` (20px) | 超大间距 |

### 10.2 圆角变量

| 变量 | 值 | 用途 |
|------|-----|------|
| `--radius-sm` | `0.375rem` (6px) | 小圆角（按钮、标签） |
| `--radius-md` | `0.5rem` (8px) | 中等圆角（输入框） |
| `--radius-lg` | `0.75rem` (12px) | 大圆角（卡片） |
| `--radius-xl` | `1rem` (16px) | 超大圆角（弹窗） |
| `--radius-full` | `9999px` | 完全圆角（头像、开关） |

---

## 11. 阴影系统

### 11.1 暗色主题阴影

| 变量 | 值 | 用途 |
|------|-----|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | 小阴影 |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.3)` | 中等阴影 |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.3)` | 大阴影 |

### 11.2 强调阴影（选中状态）

```css
box-shadow: 0 10px 30px rgba(var(--color-primary-rgb), 0.25);
```

### 11.3 弹窗阴影

```css
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
```

---

## 12. 代码使用示例

### 12.1 背景色

```tsx
// 页面主背景
<div className="bg-[var(--color-bg-primary)]" />

// 卡片背景（半透明）
<div className="bg-[var(--color-surface)]" />

// 卡片背景（纯色）
<div className="bg-[var(--color-surface-solid)]" />

// 悬浮效果
<div className="hover:bg-[var(--color-surface-hover)]" />

// 激活效果
<div className="active:bg-[var(--color-surface-active)]" />
```

### 12.2 文字色

```tsx
// 标题
<h1 className="text-[var(--color-text-primary)]" />

// 描述
<p className="text-[var(--color-text-secondary)]" />

// 提示
<span className="text-[var(--color-text-tertiary)]" />

// 禁用
<span className="text-[var(--color-text-disabled)]" />
```

### 12.3 边框

```tsx
// 默认边框
<div className="border border-[var(--color-border)]" />

// 悬停边框变化
<div className="border border-[var(--color-border)] hover:border-[var(--color-border-hover)]" />
```

### 12.4 强调色按钮

```tsx
// 主按钮
<button className="
  bg-[var(--color-primary)]
  hover:bg-[var(--color-primary-hover)]
  active:bg-[var(--color-primary-active)]
  text-white
  rounded-[var(--radius-md)]
">
  主要操作
</button>

// 次要按钮（描边）
<button className="
  border border-[var(--color-primary)]
  text-[var(--color-primary)]
  hover:bg-[var(--color-primary-10)]
  rounded-[var(--radius-md)]
">
  次要操作
</button>
```

### 12.5 语义色提示

```tsx
// 成功提示
<div className="
  bg-[var(--color-success-bg)]
  text-[var(--color-success)]
  border border-[var(--color-success)]
  rounded-[var(--radius-md)]
  p-4
">
  操作成功！
</div>

// 警告提示
<div className="
  bg-[var(--color-warning-bg)]
  text-[var(--color-warning)]
  border border-[var(--color-warning)]
  rounded-[var(--radius-md)]
  p-4
">
  请注意！
</div>

// 错误提示
<div className="
  bg-[var(--color-error-bg)]
  text-[var(--color-error)]
  border border-[var(--color-error)]
  rounded-[var(--radius-md)]
  p-4
">
  出错了！
</div>
```

### 12.6 开关（Toggle Switch）

```tsx
<label className="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" className="sr-only peer" />
  <div className="
    w-11 h-6
    bg-[var(--color-toggle-track)]
    rounded-full
    peer
    peer-checked:bg-[var(--color-primary)]
    after:content-['']
    after:absolute after:top-[2px] after:left-[2px]
    after:bg-white after:border after:rounded-full
    after:h-5 after:w-5
    after:transition-all
    peer-checked:after:translate-x-full
  " />
</label>
```

### 12.7 进度条

```tsx
<div className="w-full bg-[var(--color-progress-track)] rounded-full h-2">
  <div
    className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
    style={{ width: `${progress}%` }}
  />
</div>
```

### 12.8 列表项（含悬浮/选中）

```tsx
<ListItem
  className="
    bg-[var(--color-surface)]
    hover:bg-[var(--color-primary-10)]
    data-[selected=true]:bg-[var(--color-primary-15)]
    border border-[var(--color-border)]
    rounded-[var(--radius-md)]
    transition-colors
  "
>
  列表项内容
</ListItem>
```

---

## 13. 主题切换机制

### 13.1 状态管理

主题状态由 `themeStore`（Zustand）管理：

```tsx
interface ThemeState {
  mode: 'dark' | 'light' | 'system';   // 用户选择的模式
  accentColor: AccentColor;             // 强调色（7 种）
  activeTheme: 'dark' | 'light';        // 实际生效的主题
}
```

### 13.2 切换方法

```tsx
import { useThemeStore, themePresets } from '@/stores/themeStore';

const { setMode, setAccentColor, applyPreset } = useThemeStore();

// 切换为暗色
setMode('dark');

// 切换为亮色
setMode('light');

// 跟随系统
setMode('system');

// 切换强调色
setAccentColor('blue');

// 应用预设（同时设置 mode + accentColor）
applyPreset(themePresets[0]);  // 暗夜预设
```

### 13.3 持久化

| 层级 | 机制 | 说明 |
|------|------|------|
| L1 | Zustand `persist` 中间件 | 自动保存到 `localStorage` |
| L2 | `configManager.setPreference()` | 异步备份到配置文件 |

### 13.4 系统主题监听

```tsx
// 当 mode === 'system' 时，监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const theme = e.matches ? 'dark' : 'light';
  set({ activeTheme: theme });
  applyToDom(theme, get().accentColor);
});
```

### 13.5 初始化流程

```
应用启动
    ↓
useThemeStore.init()
    ↓
1. 从 localStorage 读取用户上次选择（persist 自动完成）
2. 调用 applyToDom() 应用主题到 document.documentElement
3. 从配置文件同步（可选，用于多端同步）
4. 注册系统主题变化监听器
```

---

## 附录：完整 CSS 变量速查表

### 暗色主题（theme-dark）

| 变量 | 值 |
|------|-----|
| `--color-bg-primary` | `#1a1a1a` |
| `--color-bg-secondary` | `#191919` |
| `--color-bg-tertiary` | `#141414` |
| `--color-surface` | `rgba(255,255,255,0.05)` |
| `--color-surface-solid` | `#1e1e1e` |
| `--color-surface-hover` | `rgba(255,255,255,0.08)` |
| `--color-surface-active` | `rgba(255,255,255,0.1)` |
| `--color-border` | `rgba(255,255,255,0.1)` |
| `--color-border-hover` | `rgba(255,255,255,0.2)` |
| `--color-text-primary` | `#ffffff` |
| `--color-text-secondary` | `rgba(255,255,255,0.7)` |
| `--color-text-tertiary` | `rgba(255,255,255,0.4)` |
| `--color-text-disabled` | `rgba(255,255,255,0.3)` |
| `--color-success` | `#22c55e` |
| `--color-success-bg` | `rgba(34,197,94,0.15)` |
| `--color-warning` | `#eab308` |
| `--color-warning-bg` | `rgba(234,179,8,0.15)` |
| `--color-error` | `#ef4444` |
| `--color-error-bg` | `rgba(239,68,68,0.15)` |
| `--color-info` | `#3b82f6` |
| `--color-info-bg` | `rgba(59,130,246,0.15)` |
| `--color-overlay` | `rgba(0,0,0,0.6)` |
| `--color-context-bg` | `rgba(30,30,30,0.95)` |
| `--color-context-border` | `rgba(255,255,255,0.1)` |
| `--color-context-hover` | `rgba(255,255,255,0.08)` |
| `--color-progress-track` | `rgba(255,255,255,0.1)` |
| `--color-toggle-track` | `rgba(255,255,255,0.2)` |

### 亮色主题（theme-light）

| 变量 | 值 |
|------|-----|
| `--color-bg-primary` | `#f5f5f5` |
| `--color-bg-secondary` | `#ffffff` |
| `--color-bg-tertiary` | `#e5e5e5` |
| `--color-surface` | `rgba(0,0,0,0.03)` |
| `--color-surface-solid` | `#ffffff` |
| `--color-surface-hover` | `rgba(0,0,0,0.06)` |
| `--color-surface-active` | `rgba(0,0,0,0.08)` |
| `--color-border` | `rgba(0,0,0,0.1)` |
| `--color-border-hover` | `rgba(0,0,0,0.2)` |
| `--color-text-primary` | `#1a1a1a` |
| `--color-text-secondary` | `rgba(0,0,0,0.7)` |
| `--color-text-tertiary` | `rgba(0,0,0,0.4)` |
| `--color-text-disabled` | `rgba(0,0,0,0.3)` |
| `--color-success` | `#16a34a` |
| `--color-success-bg` | `rgba(22,163,74,0.1)` |
| `--color-warning` | `#ca8a04` |
| `--color-warning-bg` | `rgba(202,138,4,0.1)` |
| `--color-error` | `#dc2626` |
| `--color-error-bg` | `rgba(220,38,38,0.1)` |
| `--color-info` | `#2563eb` |
| `--color-info-bg` | `rgba(37,99,235,0.1)` |
| `--color-overlay` | `rgba(0,0,0,0.4)` |
| `--color-context-bg` | `rgba(255,255,255,0.95)` |
| `--color-context-border` | `rgba(0,0,0,0.1)` |
| `--color-context-hover` | `rgba(0,0,0,0.05)` |
| `--color-progress-track` | `rgba(0,0,0,0.1)` |
| `--color-toggle-track` | `rgba(0,0,0,0.2)` |
