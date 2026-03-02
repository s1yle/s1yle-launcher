import React from 'react';
import Popup, { PopupProps } from '../Popup';

export interface ConfirmPopupProps extends Omit<PopupProps, 'children' | 'footer'> {
  /** 确认弹窗的消息内容 */
  message: React.ReactNode;
  /** 确认按钮文本，默认"确认" */
  confirmText?: string;
  /** 取消按钮文本，默认"取消" */
  cancelText?: string;
  /** 确认按钮样式类型 */
  confirmType?: 'primary' | 'danger' | 'success' | 'warning';
  /** 取消按钮样式类型 */
  cancelType?: 'default' | 'outline';
  /** 确认回调函数，返回true表示用户点击了确认 */
  onConfirm?: () => void | Promise<void>;
  /** 取消回调函数 */
  onCancel?: () => void;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 图标类型 */
  iconType?: 'warning' | 'error' | 'info' | 'success' | 'question';
  /** 是否禁用确认按钮 */
  disableConfirm?: boolean;
  /** 是否禁用取消按钮 */
  disableCancel?: boolean;
  /** 是否显示加载状态（确认按钮） */
  loading?: boolean;
  /** 自定义确认按钮样式类 */
  confirmClassName?: string;
  /** 自定义取消按钮样式类 */
  cancelClassName?: string;
}

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
  isOpen,
  message,
  confirmText = '确认',
  cancelText = '取消',
  confirmType = 'primary',
  cancelType = 'default',
  onConfirm,
  onCancel,
  showIcon = false,
  iconType = 'warning',
  disableConfirm = false,
  disableCancel = false,
  loading = false,
  confirmClassName = '',
  cancelClassName = '',
  onClose,
  title = '确认',
  size = 'sm',
  showCloseButton = true,
  closeOnEsc = true,
  closeOnOverlayClick = true,
  ...popupProps
}) => {
  const handleConfirm = async () => {
    if (disableConfirm || loading) return;
    
    try {
      if (onConfirm) {
        await onConfirm();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      // 错误由调用者处理
      console.error('Confirm action failed:', error);
    }
  };

  const handleCancel = () => {
    if (disableCancel) return;
    
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    // 如果没有明确传递onClose但传递了onCancel，调用onCancel
    else if (onCancel) {
      onCancel();
    }
  };

  // 确认按钮样式映射
  const confirmTypeClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  };

  // 取消按钮样式映射
  const cancelTypeClasses = {
    default: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700/50',
  };

  // 图标映射
  const iconMap = {
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
    success: '✅',
    question: '❓',
  };

  // 根据图标类型设置颜色
  const iconColorClasses = {
    warning: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    success: 'text-green-400',
    question: 'text-gray-400',
  };

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size={size}
      showCloseButton={showCloseButton}
      closeOnEsc={closeOnEsc}
      closeOnOverlayClick={closeOnOverlayClick}
      {...popupProps}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={disableCancel}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cancelTypeClasses[cancelType]} ${cancelClassName}`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={disableConfirm || loading}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${confirmTypeClasses[confirmType]} ${confirmClassName}`}
          >
            {loading && (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
            )}
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {showIcon && (
          <div className="flex justify-center mb-2">
            <div className={`text-4xl ${iconColorClasses[iconType]}`}>
              {iconMap[iconType]}
            </div>
          </div>
        )}
        <div className="text-white text-center">
          {typeof message === 'string' ? (
            <p className="text-lg">{message}</p>
          ) : (
            message
          )}
        </div>
      </div>
    </Popup>
  );
};

export default ConfirmPopup;