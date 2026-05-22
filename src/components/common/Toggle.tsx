import { useContext } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsPanelItemContext } from './SettingsPanel/models';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
  hoverable?: boolean;
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
const Toggle= ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  hoverable = true,
}: ToggleProps) => {

  // Settings Panel上下文
  const { isInsideItem } = useContext(SettingsPanelItemContext)

  return (
    <AnimatePresence>
      {/* 条目 */}
      {/* isInsideItem 时，为了适配样式，将 border-radius 设置为 radius-full */}
      <motion.div
        className={cn(
          `${!isInsideItem && 'bg-(--color-surface) '}`,
          `${isInsideItem && 'rounded-(--radius-full)'}`,
          'inline-flex items-center justify-between',
          `w-full px-3 py-2 ${hoverable && 'hover:bg-(--color-surface-hover)'} `,
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >

        <motion.span
          className='font-light text-sm'
        >
          {label || '未知标签'}
        </motion.span>

        {/* 按钮 */}
        <motion.div
          className='rounded-(--radius-2xl) bg-(--color-surface)
                w-13 h-6 cursor-pointer relative'
          style={{ backgroundColor: checked ? 'var(--color-surface-active)' : 'var(--color-info-bg)' }}
          id={id}
          onClick={() => onChange(!checked)}
          aria-disabled={disabled}
        >

          <motion.div
            className='w-6 h-6
                bg-(--color-info) rounded-(--radius-full)
                right-0'
            animate={{ position: checked ? 'absolute' : '' }}
            transition={{ type: 'spring' }}
          >

          </motion.div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Toggle;