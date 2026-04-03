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
          <div className="flex justify-center text-white/40">
            {icon}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {label && (
            <label className="text-sm text-white/70">
              {label}
              {required && <span className="text-red-400 ml-1">*</span>}
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
              'w-full px-3 py-2 rounded-lg bg-white/5 border text-white text-sm',
              'placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all',
              hasError
                ? 'border-red-500/50 focus:ring-red-500/30'
                : 'border-white/10 focus:ring-indigo-500/30 focus:border-indigo-500/50',
            )}
          />
          {hasError && (
            <p className="text-xs text-red-400">{internalError || externalError}</p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm text-white/70 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || disabled || !!hasError}
            className="px-4 py-2 rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : '确认'}
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default InputDialog;
