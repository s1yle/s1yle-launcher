import { motion } from 'framer-motion';
import BlockIcon from './BlockIcon';
import { DURATION, EASING, fadeInUp, microInteractions } from '../../utils/animations';
import { BLOCK_ICONS } from '@/utils/iconFactory';
import { PageSection } from './Page';

/** 空状态占位组件 Props */
export interface EmptyStateProps {
  icon?: 'default' | 'download' | 'folder' | 'search' | 'error' | 'success';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const ICON_SRC: Record<NonNullable<EmptyStateProps['icon']>, string> = {
  default: BLOCK_ICONS.grassBlock,
  download: BLOCK_ICONS.goldBlock,
  folder: BLOCK_ICONS.furnace,
  search: BLOCK_ICONS.redstoneTorch,
  error: BLOCK_ICONS.commandBlock,
  success: BLOCK_ICONS.glowstone,
};

/** 空状态占位组件，显示方块图标、标题、描述和可选的按钮操作 */
const EmptyState = ({
  icon = 'default',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => {
  return (

    <motion.div
      className={`flex flex-col items-center justify-center px-4 text-center h-full ${className}`}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <PageSection>
        <div className="mb-4 opacity-80">
          <BlockIcon src={ICON_SRC[icon]} w={16} h={16} alt={icon} />
        </div>
      </PageSection>
      <motion.h3
        className="font-light text-(--color-text-secondary) mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: DURATION.FAST, duration: DURATION.ELEMENT_ENTER, ease: EASING.OUT_FLUENT }}
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          className="text-sm text-text-tertiary mb-4 max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: DURATION.MEDIUM, duration: DURATION.ELEMENT_ENTER, ease: EASING.OUT_FLUENT }}
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.button
          onClick={action.onClick}
          className="px-4 py-1.5 bg-(--color-bg-secondary) hover:bg-(--color-primary-hover)/69
            text-(--color-text-tertiary) text-sm font-light rounded-(--radius-sm) transition-colors"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: DURATION.SLOW, ...EASING.SPRING }}
          whileTap={microInteractions.buttonTap}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;