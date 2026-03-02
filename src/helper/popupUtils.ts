import { ConfirmPopupProps } from '../components/popup/ConfirmPopup';
import { AlertPopupProps } from '../components/popup/AlertPopup';
import { LoadingPopupProps } from '../components/popup/LoadingPopup';

// ======================== 弹窗配置类型 ========================

/**
 * 确认弹窗配置
 */
export interface ConfirmPopupConfig extends Omit<ConfirmPopupProps, 'isOpen' | 'onClose' | 'onConfirm' | 'onCancel'> {
  /** 是否显示弹窗，默认true */
  isOpen?: boolean;
}

/**
 * 提示弹窗配置
 */
export interface AlertPopupConfig extends Omit<AlertPopupProps, 'isOpen' | 'onClose' | 'onConfirm'> {
  /** 是否显示弹窗，默认true */
  isOpen?: boolean;
}

/**
 * 加载弹窗配置
 */
export interface LoadingPopupConfig extends Omit<LoadingPopupProps, 'isOpen' | 'onClose' | 'onCancel'> {
  /** 是否显示弹窗，默认true */
  isOpen?: boolean;
}

// ======================== 弹窗配置生成器 ========================

/**
 * 创建确认弹窗配置
 * @param message 确认消息
 * @param options 配置选项
 * @returns 确认弹窗配置
 */
export function createConfirmConfig(
  message: string,
  options?: Partial<ConfirmPopupConfig>
): ConfirmPopupConfig {
  const defaultOptions: ConfirmPopupConfig = {
    isOpen: true,
    message,
    title: '确认',
    confirmText: '确认',
    cancelText: '取消',
    confirmType: 'primary',
    cancelType: 'default',
    showIcon: true,
    iconType: 'question',
    size: 'sm',
    showCloseButton: true,
    closeOnEsc: true,
    closeOnOverlayClick: true,
    disableConfirm: false,
    disableCancel: false,
    loading: false,
  };

  return { ...defaultOptions, ...options };
}

/**
 * 创建危险操作确认弹窗配置
 * @param message 确认消息
 * @param options 配置选项
 * @returns 确认弹窗配置
 */
export function createDangerConfirmConfig(
  message: string,
  options?: Partial<ConfirmPopupConfig>
): ConfirmPopupConfig {
  return createConfirmConfig(message, {
    confirmType: 'danger',
    iconType: 'warning',
    title: '危险操作确认',
    ...options,
  });
}

/**
 * 创建成功提示弹窗配置
 * @param message 提示消息
 * @param options 配置选项
 * @returns 提示弹窗配置
 */
export function createSuccessAlertConfig(
  message: string,
  options?: Partial<AlertPopupConfig>
): AlertPopupConfig {
  const defaultOptions: AlertPopupConfig = {
    isOpen: true,
    message,
    type: 'success',
    title: '成功',
    confirmText: '确定',
    confirmType: 'success',
    showIcon: true,
    size: 'sm',
    showCloseButton: false,
    closeOnEsc: true,
    closeOnOverlayClick: false,
    disableConfirm: false,
    loading: false,
    closeOnConfirm: true,
  };

  return { ...defaultOptions, ...options };
}

/**
 * 创建错误提示弹窗配置
 * @param message 错误消息
 * @param options 配置选项
 * @returns 提示弹窗配置
 */
export function createErrorAlertConfig(
  message: string,
  options?: Partial<AlertPopupConfig>
): AlertPopupConfig {
  return createSuccessAlertConfig(message, {
    type: 'error',
    title: '错误',
    confirmType: 'error',
    ...options,
  });
}

/**
 * 创建警告提示弹窗配置
 * @param message 警告消息
 * @param options 配置选项
 * @returns 提示弹窗配置
 */
export function createWarningAlertConfig(
  message: string,
  options?: Partial<AlertPopupConfig>
): AlertPopupConfig {
  return createSuccessAlertConfig(message, {
    type: 'warning',
    title: '警告',
    confirmType: 'warning',
    ...options,
  });
}

/**
 * 创建信息提示弹窗配置
 * @param message 信息消息
 * @param options 配置选项
 * @returns 提示弹窗配置
 */
export function createInfoAlertConfig(
  message: string,
  options?: Partial<AlertPopupConfig>
): AlertPopupConfig {
  return createSuccessAlertConfig(message, {
    type: 'info',
    title: '提示',
    confirmType: 'primary',
    ...options,
  });
}

/**
 * 创建自动关闭提示弹窗配置
 * @param message 提示消息
 * @param autoCloseMs 自动关闭时间（毫秒）
 * @param options 配置选项
 * @returns 提示弹窗配置
 */
export function createAutoCloseAlertConfig(
  message: string,
  autoCloseMs: number = 3000,
  options?: Partial<AlertPopupConfig>
): AlertPopupConfig {
  return createSuccessAlertConfig(message, {
    type: 'info',
    autoClose: autoCloseMs,
    showCloseButton: false,
    closeOnOverlayClick: false,
    ...options,
  });
}

/**
 * 创建加载弹窗配置
 * @param message 加载消息
 * @param options 配置选项
 * @returns 加载弹窗配置
 */
export function createLoadingConfig(
  message: string = '加载中...',
  options?: Partial<LoadingPopupConfig>
): LoadingPopupConfig {
  const defaultOptions: LoadingPopupConfig = {
    isOpen: true,
    message,
    loadingText: '加载中...',
    showProgress: false,
    progress: 0,
    progressText: '{percent}%',
    showCancelButton: false,
    cancelText: '取消',
    iconSize: 'md',
    disableCancel: false,
    autoClose: 0,
    showSubtitle: false,
    size: 'sm',
    closeOnEsc: false,
    closeOnOverlayClick: false,
  };

  return { ...defaultOptions, ...options };
}

/**
 * 创建进度加载弹窗配置
 * @param message 加载消息
 * @param progress 进度值（0-100）
 * @param options 配置选项
 * @returns 加载弹窗配置
 */
export function createProgressLoadingConfig(
  message: string = '加载中...',
  progress: number = 0,
  options?: Partial<LoadingPopupConfig>
): LoadingPopupConfig {
  return createLoadingConfig(message, {
    showProgress: true,
    progress,
    ...options,
  });
}

// ======================== 弹窗工具函数 ========================

/**
 * 确认弹窗工具函数（返回Promise）
 * 注意：这个函数需要在React组件中使用，返回的Promise在用户操作后resolve
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const [confirmState, setConfirmState] = useState({ isOpen: false });
 *   
 *   const handleDelete = async () => {
 *     setConfirmState({ isOpen: true, message: '确定要删除吗？' });
 *     const result = await showConfirm('确定要删除吗？');
 *     if (result) {
 *       // 用户点击了确认
 *     }
 *   };
 *   
 *   return (
 *     <>
 *       <button onClick={handleDelete}>删除</button>
 *       <ConfirmPopup 
 *         {...confirmState}
 *         onConfirm={() => {/* 处理确认 *\/}
 *         onCancel={() => {/* 处理取消 *\/}
 *       />
 *     </>
 *   );
 * };
 * ```
 */
export async function showConfirm(
  message: string,
  options?: Partial<ConfirmPopupConfig>
): Promise<boolean> {
  // 这个函数需要在实际的React组件中使用，这里只是提供类型定义
  // 实际实现需要配合React状态管理
  console.warn('showConfirm需要在React组件中使用，请参考示例代码');
  return new Promise<boolean>((resolve) => {
    // 这里只是占位符实现
    console.log(`显示确认弹窗: ${message}`, options);
    resolve(false);
  });
}

/**
 * 提示弹窗工具函数（返回Promise）
 * 注意：这个函数需要在React组件中使用，返回的Promise在用户确认后resolve
 */
export async function showAlert(
  message: string,
  type: 'success' | 'warning' | 'error' | 'info' = 'info',
  options?: Partial<AlertPopupConfig>
): Promise<void> {
  console.warn('showAlert需要在React组件中使用，请参考示例代码');
  return new Promise<void>((resolve) => {
    console.log(`显示${type}提示弹窗: ${message}`, options);
    resolve();
  });
}

// ======================== 弹窗配置预设 ========================

/**
 * 预设的确认弹窗配置
 */
export const ConfirmPresets = {
  /** 删除确认弹窗 */
  delete: (itemName: string = '此项'): ConfirmPopupConfig => 
    createDangerConfirmConfig(`确定要删除${itemName}吗？此操作不可撤销。`, {
      confirmText: '删除',
      cancelText: '取消',
    }),

  /** 退出确认弹窗 */
  exit: (): ConfirmPopupConfig =>
    createConfirmConfig('确定要退出吗？未保存的更改可能会丢失。', {
      confirmText: '退出',
      cancelText: '取消',
      iconType: 'warning',
    }),

  /** 保存确认弹窗 */
  save: (): ConfirmPopupConfig =>
    createConfirmConfig('确定要保存更改吗？', {
      confirmText: '保存',
      cancelText: '取消',
      iconType: 'info',
    }),
};

/**
 * 预设的提示弹窗配置
 */
export const AlertPresets = {
  /** 操作成功提示 */
  success: (message: string = '操作成功！'): AlertPopupConfig =>
    createSuccessAlertConfig(message, {
      autoClose: 2000,
    }),

  /** 操作失败提示 */
  error: (message: string = '操作失败，请重试。'): AlertPopupConfig =>
    createErrorAlertConfig(message, {
      autoClose: 3000,
    }),

  /** 警告提示 */
  warning: (message: string = '请注意！'): AlertPopupConfig =>
    createWarningAlertConfig(message, {
      autoClose: 3000,
    }),

  /** 信息提示 */
  info: (message: string = '提示信息。'): AlertPopupConfig =>
    createInfoAlertConfig(message, {
      autoClose: 2000,
    }),
};

// ======================== 弹窗状态管理工具 ========================

/**
 * 弹窗状态管理器
 * 用于管理多个弹窗的状态
 */
export class PopupStateManager {
  private confirmStates: Map<string, ConfirmPopupConfig> = new Map();
  private alertStates: Map<string, AlertPopupConfig> = new Map();
  private loadingStates: Map<string, LoadingPopupConfig> = new Map();

  /**
   * 显示确认弹窗
   */
  showConfirm(id: string, config: ConfirmPopupConfig): void {
    this.confirmStates.set(id, { ...config, isOpen: true });
  }

  /**
   * 隐藏确认弹窗
   */
  hideConfirm(id: string): void {
    const config = this.confirmStates.get(id);
    if (config) {
      this.confirmStates.set(id, { ...config, isOpen: false });
    }
  }

  /**
   * 获取确认弹窗配置
   */
  getConfirmConfig(id: string): ConfirmPopupConfig | undefined {
    return this.confirmStates.get(id);
  }

  /**
   * 显示提示弹窗
   */
  showAlert(id: string, config: AlertPopupConfig): void {
    this.alertStates.set(id, { ...config, isOpen: true });
  }

  /**
   * 隐藏提示弹窗
   */
  hideAlert(id: string): void {
    const config = this.alertStates.get(id);
    if (config) {
      this.alertStates.set(id, { ...config, isOpen: false });
    }
  }

  /**
   * 显示加载弹窗
   */
  showLoading(id: string, config: LoadingPopupConfig): void {
    this.loadingStates.set(id, { ...config, isOpen: true });
  }

  /**
   * 更新加载进度
   */
  updateLoadingProgress(id: string, progress: number): void {
    const config = this.loadingStates.get(id);
    if (config) {
      this.loadingStates.set(id, { ...config, progress });
    }
  }

  /**
   * 隐藏加载弹窗
   */
  hideLoading(id: string): void {
    const config = this.loadingStates.get(id);
    if (config) {
      this.loadingStates.set(id, { ...config, isOpen: false });
    }
  }

  /**
   * 获取所有弹窗状态
   */
  getAllStates() {
    return {
      confirms: Array.from(this.confirmStates.entries()),
      alerts: Array.from(this.alertStates.entries()),
      loadings: Array.from(this.loadingStates.entries()),
    };
  }
}

// 创建默认的状态管理器实例
export const popupStateManager = new PopupStateManager();