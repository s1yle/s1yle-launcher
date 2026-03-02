# 弹窗组件库

本项目扩展了基础的Popup组件，提供了一系列专门化的弹窗组件，包括确认弹窗、提示弹窗、加载弹窗等，并提供了方便的工具函数和预设配置。

## 组件列表

### 1. Popup (基础弹窗)
最灵活的弹窗组件，可以自定义所有内容。

**文件位置**: `src/components/Popup.tsx`

**主要功能**:
- 自定义标题、内容和底部
- 多种尺寸（sm, md, lg, xl, full）
- 多种动画效果（fade, slide, scale）
- ESC键关闭
- 点击遮罩层关闭
- 无障碍访问支持

### 2. ConfirmPopup (确认弹窗)
用于需要用户确认的操作，如删除、退出等。

**文件位置**: `src/components/ConfirmPopup.tsx`

**主要功能**:
- 显示确认消息
- 提供"确认"和"取消"按钮
- 支持多种按钮样式（primary, danger, success, warning）
- 支持图标显示（warning, error, info, success, question）
- 支持禁用按钮和加载状态

### 3. AlertPopup (提示弹窗)
用于显示成功、错误、警告等信息提示。

**文件位置**: `src/components/AlertPopup.tsx`

**主要功能**:
- 四种提示类型：success, warning, error, info
- 自动根据类型显示对应图标和标题
- 支持自动关闭
- 只有一个"确定"按钮

### 4. LoadingPopup (加载弹窗)
用于显示加载状态，支持进度条显示。

**文件位置**: `src/components/LoadingPopup.tsx`

**主要功能**:
- 显示加载动画
- 支持进度条显示
- 支持取消按钮
- 支持自动关闭
- 支持自定义加载图标

## 工具函数库

**文件位置**: `src/helper/popupUtils.ts`

### 配置生成器
```typescript
// 创建确认弹窗配置
createConfirmConfig(message: string, options?: Partial<ConfirmPopupConfig>)

// 创建危险操作确认弹窗配置
createDangerConfirmConfig(message: string, options?: Partial<ConfirmPopupConfig>)

// 创建成功提示弹窗配置
createSuccessAlertConfig(message: string, options?: Partial<AlertPopupConfig>)

// 创建错误提示弹窗配置
createErrorAlertConfig(message: string, options?: Partial<AlertPopupConfig>)

// 创建警告提示弹窗配置
createWarningAlertConfig(message: string, options?: Partial<AlertPopupConfig>)

// 创建信息提示弹窗配置
createInfoAlertConfig(message: string, options?: Partial<AlertPopupConfig>)

// 创建自动关闭提示弹窗配置
createAutoCloseAlertConfig(message: string, autoCloseMs?: number, options?: Partial<AlertPopupConfig>)

// 创建加载弹窗配置
createLoadingConfig(message?: string, options?: Partial<LoadingPopupConfig>)

// 创建进度加载弹窗配置
createProgressLoadingConfig(message?: string, progress?: number, options?: Partial<LoadingPopupConfig>)
```

### 预设配置
```typescript
// 确认弹窗预设
ConfirmPresets.delete(itemName?: string)  // 删除确认
ConfirmPresets.exit()                     // 退出确认
ConfirmPresets.save()                     // 保存确认

// 提示弹窗预设
AlertPresets.success(message?: string)    // 操作成功提示
AlertPresets.error(message?: string)      // 操作失败提示
AlertPresets.warning(message?: string)    // 警告提示
AlertPresets.info(message?: string)       // 信息提示
```

### 状态管理器
```typescript
// 创建状态管理器实例
const popupStateManager = new PopupStateManager();

// 使用方法
popupStateManager.showConfirm('deleteConfirm', config);
popupStateManager.hideConfirm('deleteConfirm');
popupStateManager.updateLoadingProgress('fileUpload', 50);
```

## 使用方法

### 基础用法
```typescript
import ConfirmPopup from './components/ConfirmPopup';
import { useState } from 'react';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ConfirmPopup
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={() => {
        console.log('用户确认');
        setIsOpen(false);
      }}
      onCancel={() => {
        console.log('用户取消');
        setIsOpen(false);
      }}
      message="确定要执行此操作吗？"
    />
  );
};
```

### 使用工具函数
```typescript
import ConfirmPopup from './components/ConfirmPopup';
import { createConfirmConfig } from './helper/popupUtils';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const confirmConfig = createConfirmConfig('确定要删除吗？', {
    confirmType: 'danger',
    iconType: 'warning',
    title: '删除确认',
  });

  return (
    <ConfirmPopup
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={() => setIsOpen(false)}
      onCancel={() => setIsOpen(false)}
      {...confirmConfig}
    />
  );
};
```

### 使用预设配置
```typescript
import ConfirmPopup from './components/ConfirmPopup';
import AlertPopup from './components/AlertPopup';
import { ConfirmPresets, AlertPresets } from './helper/popupUtils';

const MyComponent = () => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  return (
    <>
      <ConfirmPopup
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          console.log('执行删除操作');
          setDeleteOpen(false);
        }}
        {...ConfirmPresets.delete('示例项目')}
      />

      <AlertPopup
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        onConfirm={() => setSuccessOpen(false)}
        {...AlertPresets.success('操作成功完成！')}
      />
    </>
  );
};
```

### 使用状态管理器
```typescript
import { useState } from 'react';
import ConfirmPopup from './components/ConfirmPopup';
import { popupStateManager } from './helper/popupUtils';

const MyComponent = () => {
  const [confirmStates, setConfirmStates] = useState({});

  // 显示弹窗
  const showDeleteConfirm = () => {
    popupStateManager.showConfirm('deleteConfirm', {
      message: '确定要删除吗？',
      title: '删除确认',
    });
    // 更新组件状态以触发重新渲染
    setConfirmStates({ ...popupStateManager.getAllStates() });
  };

  // 从状态管理器获取配置
  const deleteConfirmConfig = popupStateManager.getConfirmConfig('deleteConfirm');

  return (
    <>
      <button onClick={showDeleteConfirm}>删除</button>
      {deleteConfirmConfig && (
        <ConfirmPopup
          {...deleteConfirmConfig}
          onClose={() => {
            popupStateManager.hideConfirm('deleteConfirm');
            setConfirmStates({ ...popupStateManager.getAllStates() });
          }}
          onConfirm={() => {
            console.log('执行删除');
            popupStateManager.hideConfirm('deleteConfirm');
            setConfirmStates({ ...popupStateManager.getAllStates() });
          }}
        />
      )}
    </>
  );
};
```

## 示例页面

我们提供了一个完整的示例页面，展示了所有弹窗组件的使用方法：

**文件位置**: `src/components/PopupExamples.tsx`

**访问方式**: 可以在项目中导入并使用`PopupExamples`组件，或者参考其中的代码实现。

## 类型定义

所有组件都提供了完整的TypeScript类型定义，包括：

- `PopupProps` - 基础弹窗属性
- `ConfirmPopupProps` - 确认弹窗属性
- `AlertPopupProps` - 提示弹窗属性
- `LoadingPopupProps` - 加载弹窗属性
- `ConfirmPopupConfig`, `AlertPopupConfig`, `LoadingPopupConfig` - 工具函数配置类型

## 样式定制

所有组件都支持通过className属性进行样式定制：

```typescript
<ConfirmPopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  className="custom-popup"           // 弹窗容器样式
  overlayClassName="custom-overlay"  // 遮罩层样式
  contentClassName="custom-content"  // 内容区域样式
  confirmClassName="custom-confirm"  // 确认按钮样式
  cancelClassName="custom-cancel"    // 取消按钮样式
/>
```

## 最佳实践

1. **组件导入**: 只导入需要的组件，避免导入整个组件库
2. **状态管理**: 使用React的useState管理弹窗显示状态
3. **配置重用**: 对于常用配置，使用工具函数或预设配置
4. **无障碍访问**: 所有组件都支持无障碍访问属性
5. **性能优化**: 使用React.memo包装不经常变化的弹窗组件
6. **错误处理**: 在异步操作中使用try-catch处理错误

## 扩展指南

如果需要创建新的弹窗类型：

1. 创建新的组件文件，继承基础Popup组件
2. 定义新的Props接口
3. 在组件中实现特定功能
4. 在popupUtils.ts中添加对应的配置生成器
5. 更新示例页面展示新组件

## 注意事项

1. 所有弹窗都需要通过`isOpen`属性控制显示/隐藏
2. 必须提供`onClose`回调函数
3. 组件使用了Tailwind CSS类，确保项目已配置Tailwind
4. 异步操作建议使用loading状态提示用户
5. 对于重要操作，建议使用ConfirmPopup并要求用户确认