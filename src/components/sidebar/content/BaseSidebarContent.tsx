import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { type SidebarMenuItem } from '../../../router/config';

export interface BaseSidebarContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (path: string, group: string, itemId: string, hasChildren: boolean) => void;
  isActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
  groupTitle?: string;
  groupTitleI18nKey?: string;
}

const BaseSidebarContent = ({
  items,
  onMenuClick,
  isActive,
  hasChildrenItems,
  groupTitle,
  groupTitleI18nKey,
}: BaseSidebarContentProps) => {
  const { t } = useTranslation();

  const defaultIsActive = (_path: string) => false;
  const defaultHasChildrenItems = (item: SidebarMenuItem) => !!(item.children && item.children.length > 0);

  const activeCheck = isActive || defaultIsActive;
  const childrenCheck = hasChildrenItems || defaultHasChildrenItems;

  const handleClick = (path: string, group: string, itemId: string, hasChildren: boolean) => {
    if (onMenuClick) {
      onMenuClick(path, group, itemId, hasChildren);
    }
  };

  const renderMenuItem = (item: SidebarMenuItem, level: number = 0, index: number = 0) => {
    const hasChildren = childrenCheck(item);
    const active = activeCheck(item.path);

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03, duration: 0.15 }}
        style={{ paddingLeft: level > 0 ? `${level * 0.75}rem` : undefined }}
      >
        <motion.button
          onClick={() => handleClick(item.path, item.group, item.id, hasChildren)}
          className={`
            w-full flex items-center gap-3 py-2.5 rounded-lg
            border-l-[3px] transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg-secondary)]
            ${active
              ? 'bg-[var(--color-surface-active)] text-[var(--color-text-primary)] font-semibold border-l-[var(--color-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] border-l-transparent'
            }
          `}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
        >
          <motion.span
            className="w-5 h-5 flex-shrink-0 flex items-center justify-center"
            whileHover={{ scale: 1.15 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {item.icon}
          </motion.span>
          <span className="text-sm text-left flex-1 truncate">
            {t(item.titleI18nKey, item.title)}
          </span>
          {hasChildren && (
            <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] flex-shrink-0" />
          )}
        </motion.button>
      </motion.div>
    );
  };

  return (
    <div>
      {groupTitle && (
        <div className="text-sm font-semibold text-[var(--color-text-tertiary)] mb-3 px-4 pb-2 border-b border-[var(--color-border)]">
          {groupTitleI18nKey ? t(groupTitleI18nKey, groupTitle) : groupTitle}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item, index) => renderMenuItem(item, 0, index))}
      </div>
    </div>
  );
};

export default BaseSidebarContent;
