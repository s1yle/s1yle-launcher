import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: LucideIcon;
  iconSize?: number;
  variant?: 'default' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  iconClassName?: string;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon: Icon,
  iconSize = 20,
  variant = 'default',
  size = 'md',
  label,
  iconClassName,
  className,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const variantStyles = {
    default: {
      button: 'hover:bg-surface-hover',
      icon: 'group-hover:text-text-primary',
    },
    danger: {
      button: 'hover:bg-red-500/20',
      icon: 'group-hover:text-red-400',
    },
    ghost: {
      button: 'hover:bg-surface-hover',
      icon: 'group-hover:text-text-primary',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <motion.button
      ref={ref}
      className={cn(
        'rounded-lg transition-all duration-200 flex items-center justify-center group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        sizeClasses[size],
        currentVariant.button,
        className
      )}
      title={label}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      {...props}
    >
      <Icon
        className={cn(
          'text-text-secondary transition-colors',
          currentVariant.icon,
          iconClassName
        )}
        size={iconSize}
        strokeWidth={2}
      />
    </motion.button>
  );
});

IconButton.displayName = 'IconButton';

export default IconButton;
