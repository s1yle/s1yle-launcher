import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

/**
 * Toggle Switch 开关组件
 * 
 * @example
 * ```tsx
 * <Toggle
 *   checked={enabled}
 *   onChange={setEnabled}
 *   disabled={loading}
 * />
 * ```
 */
const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  className,
  id,
  name,
}) => {
  return (
    <label className={cn(
      'relative inline-flex items-center cursor-pointer',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={cn(
          // 基础样式
          'w-11 h-6 bg-[var(--color-input)] rounded-full peer transition-colors',
          // 选中状态
          'peer-checked:bg-[var(--color-primary)]',
          // 聚焦状态
          'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)]',
          // 滑块伪元素
          'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
          'after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5',
          // 滑块动画
          'after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white'
        )}
      />
    </label>
  );
};

export default Toggle;