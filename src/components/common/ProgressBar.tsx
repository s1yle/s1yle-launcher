import React, { useMemo } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

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
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  }, [status, variant]);

  const sizeClasses = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
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
            {label && <span className="text-sm text-white/70">{label}</span>}
          </div>
          {displayValue && (
            <span className="text-sm text-white/40 font-medium">{displayValue}</span>
          )}
        </div>
      )}
      <div className={`w-full bg-white/10 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${variantClasses[statusVariant]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out ${barClassName}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {sublabel && <div className="mt-1 text-xs text-white/30">{sublabel}</div>}
    </div>
  );
};

export default ProgressBar;
