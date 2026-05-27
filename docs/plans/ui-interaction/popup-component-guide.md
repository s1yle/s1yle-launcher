# 弹窗组件文档

> **状态**: 已实施 ✅  
> **最后更新**: 2026-05-06

## 概述

项目提供了一套统一的弹窗组件，位于 `src/components/popup/` 目录下。这些组件基于 `Popup` 基础组件构建，支持动画、键盘关闭、点击遮罩关闭等特性。

## 组件列表

| 组件 | 说明 | 使用场景 |
|------|------|----------|
| `ConfirmPopup` | 确认对话框 | 需要用户确认的操作（删除、提交等） |
| `AlertPopup` | 提示对话框 | 显示信息、警告、错误等提示 |
| `LoadingPopup` | 加载等待对话框 | 异步操作进行中显示 |
| `InputDialog` | 输入对话框 | 需要用户输入文本的场景 |
| `ProgressDialog` | 进度对话框 | 显示下载、安装等进度 |

## 通用 Props

所有弹窗组件都继承自 `Popup` 组件，支持以下通用属性：

```typescript
interface PopupProps {
  isOpen: boolean;           // 控制弹窗显示/隐藏
  onClose: () => void;      // 关闭弹窗的回调
  title?: string;            // 弹窗标题
  size?: 'sm' | 'md' | 'lg'; // 弹窗大小
  showCloseButton?: boolean; // 是否显示关闭按钮
  closeOnEsc?: boolean;      // 按 ESC 关闭
  closeOnOverlayClick?: boolean; // 点击遮罩关闭
}
```

---

## ConfirmPopup（确认对话框）

### 基本用法

```tsx
import { ConfirmPopup } from '@/components/common';

<ConfirmPopup
  isOpen={showConfirm}
  title="确认删除"
  message="确定要删除这个项目吗？此操作不可撤销。"
  confirmText="删除"
  cancelText="取消"
  confirmType="danger"
  showIcon
  iconType="warning"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `ReactNode` | - | 消息内容 |
| `confirmText` | `string` | `"确认"` | 确认按钮文字 |
| `cancelText` | `string` | `"取消"` | 取消按钮文字 |
| `confirmType` | `'primary' \| 'danger' \| 'success' \| 'warning'` | `"primary"` | 确认按钮类型 |
| `cancelType` | `'default' \| 'outline'` | `"default"` | 取消按钮类型 |
| `onConfirm` | `() => void \| Promise<void>` | - | 确认回调 |
| `onCancel` | `() => void` | - | 取消回调 |
| `showIcon` | `boolean` | `false` | 是否显示图标 |
| `iconType` | `'warning' \| 'error' \| 'info' \| 'success' \| 'question'` | `"warning"` | 图标类型 |
| `disableConfirm` | `boolean` | `false` | 禁用确认按钮 |
| `disableCancel` | `boolean` | `false` | 禁用取消按钮 |
| `loading` | `boolean` | `false` | 显示加载状态 |
| `confirmClassName` | `string` | - | 确认按钮自定义类名 |
| `cancelClassName` | `string` | - | 取消按钮自定义类名 |

---

## AlertPopup（提示对话框）

### 基本用法

```tsx
import { AlertPopup } from '@/components/popup';

<AlertPopup
  isOpen={showAlert}
  title="操作成功"
  message="文件已保存"
  type="success"
  autoClose={2000}
  onClose={handleClose}
/>
```

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `ReactNode` | - | 消息内容 |
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | `"info"` | 提示类型 |
| `autoClose` | `number` | - | 自动关闭时间（毫秒） |
| `showIcon` | `boolean` | `true` | 是否显示图标 |
| `confirmText` | `string` | `"确定"` | 确认按钮文字 |
| `onConfirm` | `() => void` | - | 确认回调 |

---

## LoadingPopup（加载对话框）

### 基本用法

```tsx
import { LoadingPopup } from '@/components/popup';

<LoadingPopup
  isOpen={loading}
  message="正在加载..."
  progress={50}
  showProgress
  onCancel={handleCancel}
/>
```

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `string` | - | 显示消息 |
| `progress` | `number` | - | 进度值（0-100） |
| `showProgress` | `boolean` | `false` | 是否显示进度条 |
| `showCancel` | `boolean` | `false` | 是否显示取消按钮 |
| `onCancel` | `() => void` | - | 取消回调 |

---

## InputDialog（输入对话框）

### 基本用法

```tsx
import { InputDialog } from '@/components/popup';

<InputDialog
  isOpen={showInput}
  title="重命名"
  label="新名称"
  defaultValue="当前名称"
  placeholder="请输入新名称"
  confirmText="确定"
  cancelText="取消"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | - | 输入框标签 |
| `defaultValue` | `string` | - | 输入框默认值 |
| `placeholder` | `string` | - | 输入框占位符 |
| `inputType` | `'text' \| 'password' \| 'number'` | `"text"` | 输入框类型 |
| `confirmText` | `string` | `"确定"` | 确认按钮文字 |
| `cancelText` | `string` | `"取消"` | 取消按钮文字 |
| `onConfirm` | `(value: string) => void` | - | 确认回调，参数为输入值 |
| `onCancel` | `() => void` | - | 取消回调 |
| `validate` | `(value: string) => string \| null` | - | 验证函数，返回错误信息 |

---

## ProgressDialog（进度对话框）

### 基本用法

```tsx
import { ProgressDialog } from '@/components/popup';

<ProgressDialog
  isOpen={downloading}
  title="下载中"
  filename="minecraft.jar"
  progress={75}
  downloaded={1024000}
  total={4096000}
  status="downloading"
  showCancel
  onCancel={handleCancel}
/>
```

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `filename` | `string` | - | 文件名 |
| `progress` | `number` | - | 进度百分比（0-100） |
| `downloaded` | `number` | - | 已下载字节数 |
| `total` | `number` | - | 总字节数 |
| `status` | `'downloading' \| 'paused' \| 'error' \| 'completed'` | - | 下载状态 |
| `showCancel` | `boolean` | `false` | 显示取消按钮 |
| `onCancel` | `() => void` | - | 取消回调 |

---

## 使用示例

### 1. 删除确认

```tsx
const [showConfirm, setShowConfirm] = useState(false);

const handleDelete = async () => {
  await deleteItem(id);
  success('删除成功');
};

return (
  <button onClick={() => setShowConfirm(true)}>删除</button>
  
  <ConfirmPopup
    isOpen={showConfirm}
    title="确认删除"
    message="确定要删除这个项目吗？"
    confirmText="删除"
    confirmType="danger"
    showIcon
    iconType="warning"
    onConfirm={handleDelete}
    onClose={() => setShowConfirm(false)}
  />
);
```

### 2. 表单输入

```tsx
const [showInput, setShowInput] = useState(false);

const handleConfirm = (value: string) => {
  renameItem(value);
};

return (
  <InputDialog
    isOpen={showInput}
    title="重命名"
    label="新名称"
    defaultValue={currentName}
    onConfirm={handleConfirm}
    onClose={() => setShowInput(false)}
  />
);
```

### 3. 进度显示

```tsx
<ProgressDialog
  isOpen={downloading}
  title="下载中"
  filename="game.jar"
  progress={progress}
  downloaded={downloaded}
  total={total}
  status="downloading"
  onCancel={cancelDownload}
/>
```

---

## 导出方式

所有弹窗组件可通过以下方式导入：

```tsx
// 从 common 组件导入
import { ConfirmPopup, AlertPopup } from '@/components/common';

// 从 popup 目录直接导入
import ConfirmPopup from '@/components/popup/ConfirmPopup';
import AlertPopup from '@/components/popup/AlertPopup';
import LoadingPopup from '@/components/popup/LoadingPopup';
import InputDialog from '@/components/popup/InputDialog';
import ProgressDialog from '@/components/popup/ProgressDialog';
```
