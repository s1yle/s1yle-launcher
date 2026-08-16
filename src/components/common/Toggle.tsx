import { useContext } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence, motion } from 'framer-motion';
import { EASING } from '@/utils/animations';
import { SettingsPanelItemContext } from './SettingsPanel/models';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

/** 开关组件 Props */
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  hoverable?: boolean;
  bgHidden?: boolean;
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
  disabled = false,
  id,
  hoverable = true,
  bgHidden = true,
  className = "",
}: ToggleProps) => {

  // Settings Panel上下文
  const { isInsideItem } = useContext(SettingsPanelItemContext)

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
        {label && (
          <motion.span
            className='font-light text-sm min-w-0 whitespace-nowrap'
          >
            {label}
          </motion.span>
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