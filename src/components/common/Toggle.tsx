
import { cn } from '@/utils/cn';

import { AnimatePresence, motion } from 'framer-motion';
import { EASING } from '@/utils/animations';




/** 开关组件 Props */
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  /** 描述文本（显示在 label 下方） */
  description?: string;
  disabled?: boolean;
  id?: string;
  hoverable?: boolean;
  bgHidden?: boolean;
  /** 样式变体：card=独立卡片样式（默认），item=设置面板条目内的内联样式 */
  variant?: 'card' | 'item';
  className?: string;
}

/**
 * # Toggle Switch 开关组件
 * 
 * ## 注意事项
 * - 非必要不要把 toggle 放进 SettingsItem 中 (很丑)
 * 
 * @example
 * ```tsx
 * <Toggle
 *   checked={enabled}
 *   onChange={setEnabled}
 *   disabled={loading}
 *   id={string};
 * />
 * ```
 */
const Toggle = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  hoverable = true,
  bgHidden = true,
  variant = 'card',
  className = "",
}: ToggleProps) => {

  const isInsideItem = variant === 'item';

  return (
    <AnimatePresence>
      {/* 条目 */}
      {/* isInsideItem 时，为了适配样式，将 border-radius 设置为 radius-full */}
      <motion.div
        className={cn(
          `${!isInsideItem && !bgHidden && 'bg-(--color-surface) '}`,
          `${isInsideItem && 'rounded-(--radius-full)'}`,
          'inline-flex items-center justify-between gap-2',
          `w-full ${isInsideItem ? 'px-2' : 'px-4'} py-2 ${hoverable && 'hover:bg-(--color-surface-hover)'} `,
          disabled && 'opacity-50 cursor-not-allowed',
          `${className}`
        )}
      >

        {/* L3 控件标签：nowrap 防止窄窗口被挤压成竖排 */}
        {(label || description) && (
          <div className="min-w-0 flex flex-col gap-0.5">
            {label && (
              <motion.span
                className='font-light text-sm min-w-0 whitespace-nowrap'
              >
                {label}
              </motion.span>
            )}
            {description && (
              <span className='text-xs font-light min-w-0 text-[var(--color-text-tertiary)]'>
                {description}
              </span>
            )}
          </div>
        )}

        {/* 按钮：轨道颜色用 CSS transition 平滑过渡，滑块用 spring 弹性位移 + 按压缩放 */}
        <motion.button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled}
          disabled={disabled}
          className='w-13 h-6 rounded-(--radius-full) relative cursor-pointer shrink-0 transition-colors duration-200'
          style={{ backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-info-bg)' }}
          id={id}
          onClick={() => onChange(!checked)}
        >
          <motion.span
            className='absolute top-0 left-0 w-6 h-6 bg-(--color-surface) rounded-(--radius-full) shadow-sm'
            animate={{ x: checked ? 28 : 0 }}
            whileTap={{ scale: 0.85 }}
            transition={EASING.SPRING}
          />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

export default Toggle;