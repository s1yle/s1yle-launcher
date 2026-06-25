import React, { useMemo } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useLoading } from '@/hooks/useLoading';

/** 进度状态类型 */
export type ProgressStatus = 'idle' | 'active' | 'completed' | 'error';

/** 进度条组件 Props */
export interface ProgressBarProps {
  progress?: number;
  loadingKey?: string;
  label?: string;
  sublabel?: string;
  status?: ProgressStatus;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showIcon?: boolean;
  className?: string;
  barClassName?: string;
  formatValue?: (value: number) => string;
}

/** 进度条组件，支持受控进度 / loadingKey 绑定、多种状态颜色和尺寸 */
const ProgressBar = ({
  progress: progressProp,
  loadingKey,
  label,
  sublabel,
  status: statusProp = 'idle',
  showPercentage = true,
  size = 'md',
  variant,
  showIcon = false,
  className = '',
  barClassName = '',
  formatValue,
}: ProgressBarProps) => {
  const loadingEntry = loadingKey ? useLoading(loadingKey) : undefined;

  const entryStatus = loadingEntry?.status;
  const progress = loadingKey ? (loadingEntry?.progress ?? 0) : (progressProp ?? 0);
  const status = loadingKey
    ? entryStatus === 'loading' ? 'active'
      : entryStatus === 'success' ? 'completed'
      : entryStatus === 'error' ? 'error'
      : 'idle'
    : statusProp;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const statusVariant = useMemo(() => {
    if (variant) return variant;
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  }, [status, variant]);

  const sizeClasses = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };
  const iconSizeClasses = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };

  const renderIcon = () => {
    if (!showIcon) return null;
    switch (status) {
      case 'completed':
        return <Check className={`${iconSizeClasses[size]} text-green-500`} />;
      case 'error':
        return <X className={`${iconSizeClasses[size]} text-red-500`} />;
      case 'active':
        return <Loader2 className={`${iconSizeClasses[size]} text-blue-500 animate-spin`} />;
      default:
        return null;
    }
  };

  const displayValue = useMemo(() => {
    if (formatValue) return formatValue(clampedProgress);
    if (showPercentage) return `${Math.round(clampedProgress)}%`;
    return undefined;
  }, [clampedProgress, showPercentage, formatValue]);

  return (
    <div className={`w-full ${className}`}>
      {(label || displayValue) && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {showIcon && renderIcon()}
            {label && <span className="text-sm text-text-secondary">{label}</span>}
          </div>
          {displayValue && (
            <span className="text-sm text-text-tertiary font-medium">{displayValue}</span>
          )}
        </div>
      )}
      <div className={`w-full bg-progress-track rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${variantClasses[statusVariant]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out ${barClassName}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {sublabel && <div className="mt-1 text-xs text-text-disabled">{sublabel}</div>}
    </div>
  );
};

export default ProgressBar;
