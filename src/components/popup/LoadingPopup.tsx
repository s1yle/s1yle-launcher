import React, { useEffect } from 'react';
import Popup, { PopupProps } from '../Popup';

export interface LoadingPopupProps extends Omit<PopupProps, 'children' | 'footer' | 'title' | 'showCloseButton'> {
  /** 加载提示文本 */
  message?: React.ReactNode;
  /** 加载文本，默认"加载中..." */
  loadingText?: string;
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 进度值（0-100），当showProgress为true时显示 */
  progress?: number;
  /** 进度条文本格式，支持 {progress} 和 {percent} 占位符 */
  progressText?: string;
  /** 是否显示取消按钮 */
  showCancelButton?: boolean;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 取消回调函数 */
  onCancel?: () => void;
  /** 自定义加载图标 */
  customIcon?: React.ReactNode;
  /** 加载图标大小 */
  iconSize?: 'sm' | 'md' | 'lg';
  /** 是否禁用取消按钮 */
  disableCancel?: boolean;
  /** 自动关闭时间（毫秒），0表示不自动关闭 */
  autoClose?: number;
  /** 自动关闭时的回调 */
  onAutoClose?: () => void;
  /** 是否显示子标题 */
  showSubtitle?: boolean;
  /** 子标题文本 */
  subtitle?: string;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({
  isOpen,
  message,
  loadingText = '加载中...',
  showProgress = false,
  progress = 0,
  progressText = '{percent}%',
  showCancelButton = false,
  cancelText = '取消',
  onCancel,
  customIcon,
  iconSize = 'md',
  disableCancel = false,
  autoClose = 0,
  onAutoClose,
  showSubtitle = false,
  subtitle,
  onClose,
  size = 'sm',
  closeOnEsc = false,
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

  // 图标大小映射
  const iconSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  // 格式化进度文本
  const formattedProgressText = progressText
    .replace('{progress}', progress.toFixed(1))
    .replace('{percent}', Math.round(progress).toString());

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title={message || loadingText}
      size={size}
      showCloseButton={false}
      closeOnEsc={closeOnEsc}
      closeOnOverlayClick={closeOnOverlayClick}
      {...popupProps}
      footer={
        showCancelButton ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCancel}
              disabled={disableCancel}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* 加载图标区域 */}
        <div className="flex justify-center">
          {customIcon ? (
            customIcon
          ) : (
            <div className="relative">
              <div className={`${iconSizeClasses[iconSize]} border-t-2 border-b-2 border-blue-500 rounded-full animate-spin`}></div>
              <div className={`${iconSizeClasses[iconSize]} absolute inset-0 border-t-2 border-b-2 border-blue-300 rounded-full animate-spin`} style={{ animationDirection: 'reverse' }}></div>
            </div>
          )}
        </div>

        {/* 进度条 */}
        {showProgress && (
          <div className="space-y-2">
            <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
            <div className="text-center text-gray-300 text-sm">
              {formattedProgressText}
            </div>
          </div>
        )}

        {/* 子标题 */}
        {showSubtitle && subtitle && (
          <div className="text-center text-gray-400 text-sm">
            {subtitle}
          </div>
        )}

        {/* 自动关闭倒计时 */}
        {autoClose > 0 && (
          <div className="text-gray-400 text-sm text-center">
            {Math.ceil(autoClose / 1000)}秒后自动关闭
          </div>
        )}
      </div>
    </Popup>
  );
};

export default LoadingPopup;