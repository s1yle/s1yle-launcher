import React, { useEffect } from 'react';
import Popup, { PopupProps } from '../Popup';

export interface AlertPopupProps extends Omit<PopupProps, 'children' | 'footer' | 'title'> {
  /** 提示消息内容 */
  message: React.ReactNode;
  /** 确认按钮文本，默认"确定" */
  confirmText?: string;
  /** 确认按钮样式类型 */
  confirmType?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** 确认回调函数 */
  onConfirm?: () => void | Promise<void>;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 图标类型，根据不同类型显示不同图标 */
  type?: 'success' | 'warning' | 'error' | 'info';
  /** 是否禁用确认按钮 */
  disableConfirm?: boolean;
  /** 是否显示加载状态（确认按钮） */
  loading?: boolean;
  /** 自动关闭时间（毫秒），0表示不自动关闭 */
  autoClose?: number;
  /** 自动关闭时的回调 */
  onAutoClose?: () => void;
  /** 自定义确认按钮样式类 */
  confirmClassName?: string;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 是否在点击确认后自动关闭，默认true */
  closeOnConfirm?: boolean;
  /** 弹窗标题（可选，如果为空则根据type自动设置） */
  title?: string;
}

const AlertPopup: React.FC<AlertPopupProps> = ({
  isOpen,
  message,
  confirmText = '确定',
  confirmType = 'primary',
  onConfirm,
  showIcon = true,
  type = 'info',
  disableConfirm = false,
  loading = false,
  autoClose = 0,
  onAutoClose,
  confirmClassName = '',
  showCloseButton = false,
  closeOnConfirm = true,
  onClose,
  title: titleProp,
  size = 'sm',
  closeOnEsc = true,
  closeOnOverlayClick = false,
  ...popupProps
}) => {
  // 自动关闭处理
  useEffect(() => {
    if (!isOpen || autoClose <= 0) return;

    const timer = setTimeout(() => {
      if (onAutoClose) {
        onAutoClose();
      }
      if (onClose) {
        onClose();
      }
    }, autoClose);

    return () => clearTimeout(timer);
  }, [isOpen, autoClose, onAutoClose, onClose]);

  const handleConfirm = async () => {
    if (disableConfirm || loading) return;
    
    try {
      if (onConfirm) {
        await onConfirm();
      }
      if (closeOnConfirm && onClose) {
        onClose();
      }
    } catch (error) {
      // 错误由调用者处理
      console.error('Alert action failed:', error);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // 根据类型确定标题和图标
  const getTypeConfig = (): {
    title: string;
    icon: string;
    iconColor: string;
    confirmType: 'primary' | 'success' | 'warning' | 'error' | 'info';
  } => {
    switch (type) {
      case 'success':
        return {
          title: titleProp || '成功',
          icon: '✅',
          iconColor: 'text-green-400',
          confirmType: confirmType === 'primary' ? 'success' : confirmType,
        };
      case 'warning':
        return {
          title: titleProp || '警告',
          icon: '⚠️',
          iconColor: 'text-yellow-400',
          confirmType: confirmType === 'primary' ? 'warning' : confirmType,
        };
      case 'error':
        return {
          title: titleProp || '错误',
          icon: '❌',
          iconColor: 'text-red-400',
          confirmType: confirmType === 'primary' ? 'error' : confirmType,
        };
      case 'info':
      default:
        return {
          title: titleProp || '提示',
          icon: 'ℹ️',
          iconColor: 'text-blue-400',
          confirmType: confirmType === 'primary' ? 'primary' : confirmType,
        };
    }
  };

  const typeConfig = getTypeConfig();

  // 确认按钮样式映射
  const confirmTypeClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    error: 'bg-red-600 hover:bg-red-700 text-white',
    info: 'bg-gray-600 hover:bg-gray-700 text-white',
  };

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title={typeConfig.title}
      size={size}
      showCloseButton={showCloseButton}
      closeOnEsc={closeOnEsc}
      closeOnOverlayClick={closeOnOverlayClick}
      {...popupProps}
      footer={
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={disableConfirm || loading}
            className={`px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${confirmTypeClasses[typeConfig.confirmType]} ${confirmClassName}`}
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
            <div className={`text-5xl ${typeConfig.iconColor}`}>
              {typeConfig.icon}
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
        {autoClose > 0 && (
          <div className="text-gray-400 text-sm text-center">
            {Math.ceil(autoClose / 1000)}秒后自动关闭
          </div>
        )}
      </div>
    </Popup>
  );
};

export default AlertPopup;