import React from 'react';
import Popup, { PopupProps } from '../../Popup';
import { AlertTriangle, CircleX, Info, CheckCircle, CircleHelp, Loader2 } from 'lucide-react';

export interface ConfirmPopupProps extends Omit<PopupProps, 'children' | 'footer'> {
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'danger' | 'success' | 'warning';
  cancelType?: 'default' | 'outline';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showIcon?: boolean;
  iconType?: 'warning' | 'error' | 'info' | 'success' | 'question';
  disableConfirm?: boolean;
  disableCancel?: boolean;
  loading?: boolean;
  confirmClassName?: string;
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
      if (onConfirm) await onConfirm();
      if (onClose) onClose();
    } catch (error) {
      console.error('Confirm action failed:', error);
    }
  };

  const handleCancel = () => {
    if (disableCancel) return;
    if (onCancel) onCancel();
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  const confirmTypeClasses = {
    primary: 'text-white',
    danger: 'text-white',
    success: 'text-white',
    warning: 'text-white',
  };

  const confirmBgClasses = {
    primary: 'var(--color-primary)',
    danger: 'var(--color-error)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
  };

  const cancelTypeClasses = {
    default: 'text-text-secondary',
    outline: 'text-text-secondary',
  };

  const icons = {
    warning: <AlertTriangle className="w-10 h-10 text-yellow-400" />,
    error: <CircleX className="w-10 h-10 text-red-400" />,
    info: <Info className="w-10 h-10 text-blue-400" />,
    success: <CheckCircle className="w-10 h-10 text-green-400" />,
    question: <CircleHelp className="w-10 h-10 text-text-tertiary" />,
  };

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleCancel}
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
            className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${cancelTypeClasses[cancelType]} ${cancelClassName}`}
            style={{ 
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (!disableCancel) {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-active)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={disableConfirm || loading}
            className={`px-4 py-2 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer ${confirmTypeClasses[confirmType]} ${confirmClassName}`}
            style={{ 
              backgroundColor: confirmBgClasses[confirmType],
            }}
            onMouseEnter={(e) => {
              if (!disableConfirm && !loading) {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {showIcon && (
          <div className="flex justify-center mb-2">
            {icons[iconType]}
          </div>
        )}
        <div className="text-center" style={{ color: 'var(--color-text-primary)' }}>
          {typeof message === 'string' ? <p className="text-base">{message}</p> : message}
        </div>
      </div>
    </Popup>
  );
};

export default ConfirmPopup;
