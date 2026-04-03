import React from 'react';
import { getVersionTypeLabel, getVersionTypeColor, getVersionTypeBgColor } from '../../utils/format';

export interface StatusBadgeProps {
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha' | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  label,
  size = 'md',
  showDot = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const displayLabel = label || getVersionTypeLabel(type);
  const colorClass = getVersionTypeColor(type);
  const bgClass = getVersionTypeBgColor(type);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${sizeClasses[size]} ${bgClass} ${colorClass} ${className}`}
    >
      {showDot && (
        <span className={`${dotSizeClasses[size]} rounded-full bg-current`} />
      )}
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
