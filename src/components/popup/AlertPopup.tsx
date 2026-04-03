import React, { useEffect } from 'react';
import Popup, { PopupProps } from '../Popup';
import { CheckCircle, AlertTriangle, CircleX, Info, Loader2 } from 'lucide-react';

export interface AlertPopupProps extends Omit<PopupProps, 'children' | 'footer' | 'title'> {
  message: React.ReactNode;
  confirmText?: string;
  confirmType?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  onConfirm?: () => void | Promise<void>;
  showIcon?: boolean;
  type?: 'success' | 'warning' | 'error' | 'info';
  disableConfirm?: boolean;
  loading?: boolean;
  autoClose?: number;
  onAutoClose?: () => void;
  confirmClassName?: string;
  showCloseButton?: boolean;
  closeOnConfirm?: boolean;
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
  useEffect(() => {
    if (!isOpen || autoClose <= 0) return;
    const timer = setTimeout(() => {
      if (onAutoClose) onAutoClose();
      if (onClose) onClose();
    }, autoClose);
    return () => clearTimeout(timer);
  }, [isOpen, autoClose, onAutoClose, onClose]);

  const handleConfirm = async () => {
    if (disableConfirm || loading) return;
    try {
      if (onConfirm) await onConfirm();
      if (closeOnConfirm && onClose) onClose();
    } catch (error) {
      console.error('Alert action failed:', error);
    }
  };

  const getTypeConfig = () => {
    const icons = {
      success: <CheckCircle className="w-12 h-12 text-green-400" />,
      warning: <AlertTriangle className="w-12 h-12 text-yellow-400" />,
      error: <CircleX className="w-12 h-12 text-red-400" />,
      info: <Info className="w-12 h-12 text-blue-400" />,
    };
    const titles = {
      success: titleProp || '成功',
      warning: titleProp || '警告',
      error: titleProp || '错误',
      info: titleProp || '提示',
    };
    const confirmTypes = {
      success: 'success' as const,
      warning: 'warning' as const,
      error: 'error' as const,
      info: 'primary' as const,
    };
    return {
      title: titles[type],
      icon: icons[type],
      confirmType: confirmType === 'primary' ? confirmTypes[type] : confirmType,
    };
  };

  const typeConfig = getTypeConfig();

  const confirmTypeClasses = {
    primary: 'bg-info hover:bg-info text-text-primary',
    success: 'bg-success hover:bg-success text-text-primary',
    warning: 'bg-warning hover:bg-warning text-text-primary',
    error: 'bg-error hover:bg-error text-text-primary',
    info: 'bg-info hover:bg-info text-text-primary',
  };

  return (
    <Popup
      isOpen={isOpen}
      onClose={() => onClose?.()}
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
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {showIcon && (
          <div className="flex justify-center mb-2">
            {typeConfig.icon}
          </div>
        )}
        <div className="text-text-primary text-center">
          {typeof message === 'string' ? <p className="text-lg">{message}</p> : message}
        </div>
        {autoClose > 0 && (
          <div className="text-text-tertiary text-sm text-center">
            {Math.ceil(autoClose / 1000)}秒后自动关闭
          </div>
        )}
      </div>
    </Popup>
  );
};

export default AlertPopup;
