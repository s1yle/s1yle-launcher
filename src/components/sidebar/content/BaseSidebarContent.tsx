import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { type SidebarMenuItem } from '../../../router/config';

export interface BaseSidebarContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (path: string, group: string, itemId: string, hasChildren: boolean) => void;
  isActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
  groupTitle?: string;
  groupTitleI18nKey?: string;
  showChildren?: boolean;
}

const BaseSidebarContent = ({
  items,
  onMenuClick,
  isActive,
  hasChildrenItems,
  groupTitle,
  groupTitleI18nKey,
  showChildren = true,
}: BaseSidebarContentProps) => {
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(items.filter(item => item.children?.length).map(item => item.id))
  );

  const defaultIsActive = (_path: string) => false;
  const defaultHasChildrenItems = (item: SidebarMenuItem) => !!(item.children && item.children.length > 0);

  const activeCheck = isActive || defaultIsActive;
  const childrenCheck = hasChildrenItems || defaultHasChildrenItems;

  const handleClick = (path: string, group: string, itemId: string, hasChildren: boolean) => {
    if (hasChildren) {
      setExpandedItems(prev => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    }
    if (onMenuClick) {
      onMenuClick(path, group, itemId, hasChildren);
    }
  };


  const renderMenuItem = (item: SidebarMenuItem, level: number = 0, index: number = 0) => {
    const hasChildren = childrenCheck(item);
    const isExpanded = expandedItems.has(item.id);
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
          {hasChildren && showChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
            </motion.div>
          )}
        </motion.button>

        <AnimatePresence>
          {hasChildren && isExpanded && item.children && showChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 mt-0.5">
                {item.children.map((child, childIndex) => renderMenuItem(child, level + 1, index + childIndex + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
