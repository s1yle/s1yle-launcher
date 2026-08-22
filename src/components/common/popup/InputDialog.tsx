import React, { useEffect, useRef, useState } from 'react';
import Popup, { PopupProps } from '../../Popup';

/** 输入弹窗组件 Props */
export interface InputDialogProps extends Omit<PopupProps, 'children' | 'footer' | 'onClose'> {
  message?: React.ReactNode;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'danger' | 'success' | 'warning';
  cancelType?: 'default' | 'outline';
  confirmClassName?: string;
  cancelClassName?: string;
  /** 校验函数：返回错误文案表示不通过，返回 null 表示通过 */
  validate?: (value: string) => string | null;
  onConfirm?: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  message,
  initialValue = '',
  confirmText = '确认',
  cancelText = '取消',
  confirmType = 'primary',
  cancelType = 'default',
  onConfirm,
  onCancel,
  title = '输入',
  size = 'sm',
  showCloseButton = true,
  closeOnEsc = true,
  closeOnOverlayClick = true,
  ...popupProps
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 每次打开时重置内容并聚焦
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialValue]);

  const runValidate = (v: string): string | null => {
    if (popupProps.validate) return popupProps.validate(v);
    return null;
  };

  const handleConfirm = async () => {
    const trimmed = value.trim();
    const err = runValidate(trimmed);
    if (err) {
      setError(err);
      return;
    }
    try {
      if (onConfirm) await onConfirm(trimmed);
    } catch (e) {
      console.error('InputDialog confirm failed:', e);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const handleChange = (v: string) => {
    setValue(v);
    if (error) setError(runValidate(v.trim()));
  };

  const confirmBgClasses = {
    primary: 'var(--color-primary)',
    danger: 'var(--color-error)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
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
            className="px-4 py-2 rounded-md transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-active)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!value.trim() || !!error}
            className="px-4 py-2 rounded-md text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: confirmBgClasses[confirmType] }}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {message && (
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        )}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim() && !error) handleConfirm();
          }}
          className="w-full px-3 py-2 rounded-md outline-none border text-sm"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
          }}
          placeholder=""
        />
        {error && (
          <p className="text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>
        )}
      </div>
    </Popup>
  );
};

export default InputDialog;
