import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import BaseSidebarLayout from './layouts/BaseSidebarLayout';
import { BaseSidebarContent, type ContextMenuItemData } from '@/components/common';
import { useSmartSidebar } from '@/hooks/useSmartSidebar';
import { handleRemoveGameFolder } from '@/router/actionHandler';
import { Trash2 } from 'lucide-react';
import { DURATION, EASING } from '@/utils/animations';

/** 智能侧边栏组件 Props */
export interface SmartSidebarProps {
  onMenuClick?: (path: string) => void;
  showAllGroups?: boolean;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  /** 是否为页面自带侧边栏（显示当前菜单的子项），否则显示所有顶级菜单 */
  ownSidebar?: boolean;
}

/** 智能侧边栏组件，根据当前路由自动切换菜单项，支持动态文件夹和右键菜单 */
const SmartSidebar = ({ onMenuClick = () => {}, footer, header, ownSidebar = false }: SmartSidebarProps) => {
  const { t } = useTranslation();

  const {
    sidebarItems,
    currentMenuItem,
    parentMenuItem,
    isAccountPage,
    isActive,
    isParentActive,
    hasChildrenItems,
    handleItemClick,
    handleContextMenuAction,
    contextMenuFor,
    handleCustomContextAction,
  } = useSmartSidebar({ onMenuClick, ownSidebar });

  const sidebarVariants = {
    initial: { opacity: 0.8, x: -16 },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        x: { ...EASING.SPRING_SOFT, delay: DURATION.ROUTE_SLIDE },
        opacity: { duration: DURATION.FAST, ease: EASING.OUT_FLUENT, delay: DURATION.ROUTE_SLIDE },
      },
    },
    exit: {
      opacity: 0,
      x: 16,
      transition: {
        x: { duration: DURATION.FAST, ease: EASING.IN_FLUENT },
        opacity: { duration: DURATION.FAST, ease: EASING.IN_FLUENT },
      },
    },
  } satisfies Variants;

  return (
    <BaseSidebarLayout footer={footer} header={header}>
      <AnimatePresence mode="wait">
        <motion.div
          key={window.location.pathname}
          variants={sidebarVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col"
        >
          <BaseSidebarContent
            items={sidebarItems}
            onMenuClick={handleItemClick}
            isActive={isActive}
            isParentActive={isParentActive}
            hasChildrenItems={hasChildrenItems}
            groupTitle={currentMenuItem?.title || parentMenuItem?.title || ''}
            groupTitleI18nKey={currentMenuItem?.titleI18nKey || parentMenuItem?.titleI18nKey}
            onContextMenuAction={handleContextMenuAction}
            contextMenuFor={(id: string) => {
              if (id.startsWith('game-folder:')) {
                return [{ id: 'remove', label: t('games.removeGameFolder', '移除游戏文件夹'), icon: Trash2, danger: true } as ContextMenuItemData];
              }
              if (isAccountPage) return contextMenuFor(id);
              return undefined;
            }}
            onCustomContextAction={async (id: string, actionId: string) => {
              if (id.startsWith('game-folder:') && actionId === 'remove') {
                await handleRemoveGameFolder(id.slice('game-folder:'.length));
                return;
              }
              if (isAccountPage) await handleCustomContextAction(id, actionId);
            }}
          />
        </motion.div>
      </AnimatePresence>
    </BaseSidebarLayout>
  );
};

export default SmartSidebar;
