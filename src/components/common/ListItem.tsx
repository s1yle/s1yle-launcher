import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronRight } from 'lucide-react';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  tag?: string;
  tagVariant?: 'default' | 'warning' | 'success' | 'error';
  showChevron?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ListItem = ({
  title,
  subtitle,
  icon,
  right,
  selected = false,
  disabled = false,
  onClick,
  onContextMenu,
  tag,
  tagVariant = 'default',
  showChevron = false,
  size = 'md',
  className,
}: ListItemProps) => {
  const sizeClasses = {
    sm: 'px-3 py-2 gap-3',
    md: 'px-4 py-3 gap-3',
    lg: 'px-5 py-4 gap-4',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const tagColors = {
    default: 'bg-surface-active text-text-secondary',
    warning: 'bg-warning-bg text-warning',
    success: 'bg-success-bg text-success',
    error: 'bg-error-bg text-error',
  };

  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        'flex items-center rounded-lg cursor-pointer transition-all duration-200',
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        selected
          ? 'bg-surface-active text-text-primary'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        className,
      )}
      onClick={disabled ? undefined : onClick}
      onContextMenu={onContextMenu}
    >
      {icon && (
        <span className={cn('flex-shrink-0 text-text-secondary', iconSizeClasses[size])}>
          {icon}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{title}</span>
          {tag && (
            <span className={cn('px-2 py-0.5 rounded-full text-xs', tagColors[tagVariant])}>
              {tag}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-text-tertiary mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {right && (
        <div className="flex-shrink-0">{right}</div>
      )}

      {showChevron && (
        <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
      )}
    </motion.div>
  );
};

export default ListItem;
