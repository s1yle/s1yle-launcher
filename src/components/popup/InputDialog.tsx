import { useState, useRef, useEffect, type ReactNode } from 'react';
import Popup from '../Popup';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface InputDialogProps {
  isOpen: boolean;
  title: string;
  value?: string;
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  maxLength?: number;
  validate?: (value: string) => string | null;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputDialog = ({
  isOpen,
  title,
  value = '',
  placeholder = '',
  label,
  icon,
  loading = false,
  disabled = false,
  error: externalError,
  required = false,
  maxLength,
  validate,
  onConfirm,
  onCancel,
}: InputDialogProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(value);
      setInternalError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, value]);

  const handleChange = (val: string) => {
    setInputValue(val);
    if (validate) {
      setInternalError(validate(val));
    } else if (required && !val.trim()) {
      setInternalError('此项为必填');
    } else {
      setInternalError(null);
    }
  };

  const handleConfirm = () => {
    if (loading || disabled) return;
    const val = inputValue.trim();
    if (required && !val) {
      setInternalError('此项为必填');
      return;
    }
    if (validate) {
      const err = validate(val);
      if (err) {
        setInternalError(err);
        return;
      }
    }
    onConfirm(val);
  };

  const hasError = internalError || externalError;

  return (
    <Popup
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      position="center"
      animation="scale"
      showCloseButton
    >
      <div className="flex flex-col gap-4">
        {icon && (
          <div className="flex justify-center text-text-tertiary">
            {icon}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {label && (
            <label className="text-sm text-text-secondary">
              {label}
              {required && <span className="text-error ml-1">*</span>}
            </label>
          )}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !hasError) handleConfirm();
              if (e.key === 'Escape') onCancel();
            }}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled || loading}
            className={cn(
              'w-full px-3 py-2 rounded-lg bg-surface border text-text-primary text-sm',
              'placeholder:text-text-tertiary focus:outline-none focus:ring-2 transition-all',
              hasError
                ? 'border-error focus:ring-error'
                : 'border-border focus:ring-primary focus:border-primary',
            )}
          />
          {hasError && (
            <p className="text-xs text-error">{internalError || externalError}</p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm text-text-secondary bg-surface hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || disabled || !!hasError}
            className="px-4 py-2 rounded-lg text-sm text-text-primary bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : '确认'}
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default InputDialog;
