import { cn } from '@/utils/cn';

import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { EASING } from '@/utils/animations';



/** 带勾选标记的开关按钮组件 Props */
export interface CheckSwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * # CheckSwitch 勾选开关按钮
 *
 * 选中时显示主色填充方块 + 白色 ✔ 勾号（带动画），未选中显示描边空方块。
 * 样式与 Toggle 同源（使用 --color-primary / --color-surface-active / --color-border）。
 *
 * @example
 * ```tsx
 * <CheckSwitch
 *   checked={enabled}
 *   onChange={setEnabled}
 *   label="自动分配内存"
 *   disabled={loading}
 * />
 * ```
 */
const CheckSwitch = ({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: CheckSwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'inline-flex items-center gap-1 cursor-pointer select-none transition-opacity',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:opacity-80',
        className
      )}
    >
      <span
        className={cn(
          'w-3 h-3 flex items-center justify-center shrink-0 transition-colors',
          checked
            ? 'bg-(--color-primary)'
            : 'bg-(--color-surface-active) border border-(--color-border)'
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={EASING.SPRING_GENTLE}
              className="flex items-center justify-center text-(--color-text-primary)"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {/* L3 控件标签：text-sm font-light（与 Toggle 标签同级），nowrap 防挤压成竖排 */}
      {label && (
        <span className="text-sm font-light text-(--color-text-primary) min-w-0 whitespace-nowrap">
          {label}
        </span>
      )}
    </button>
  );
};

export default CheckSwitch;