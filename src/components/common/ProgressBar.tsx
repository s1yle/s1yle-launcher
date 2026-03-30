import React, { useMemo } from 'react';

export type ProgressStatus = 'idle' | 'active' | 'completed' | 'error';

export interface ProgressBarProps {
  progress: number;
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

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  sublabel,
  status = 'idle',
  showPercentage = true,
  size = 'md',
  variant,
  showIcon = false,
  className = '',
  barClassName = '',
  formatValue,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const statusVariant = useMemo(() => {
    if (variant) return variant;
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'active':
        return 'default';
      default:
        return 'default';
    }
  }, [status, variant]);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const renderIcon = () => {
    if (!showIcon) return null;

    switch (status) {
      case 'completed':
        return (
          <svg className={`${iconSizeClasses[size]} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconSizeClasses[size]} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'active':
        return (
          <div className={`${iconSizeClasses[size]} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`} />
        );
      default:
        return null;
    }
  };

  const displayValue = useMemo(() => {
    if (formatValue) {
      return formatValue(clampedProgress);
    }
    if (showPercentage) {
      return `${Math.round(clampedProgress)}%`;
    }
    return undefined;
  }, [clampedProgress, showPercentage, formatValue]);

  return (
    <div className={`w-full ${className}`}>
      {(label || displayValue) && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {showIcon && renderIcon()}
            {label && (
              <span className="text-sm text-gray-300">{label}</span>
            )}
          </div>
          {displayValue && (
            <span className="text-sm text-gray-400 font-medium">
              {displayValue}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-700/50 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${variantClasses[statusVariant]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out ${barClassName}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {sublabel && (
        <div className="mt-1 text-xs text-gray-500">{sublabel}</div>
      )}
    </div>
  );
};

export default ProgressBar;
