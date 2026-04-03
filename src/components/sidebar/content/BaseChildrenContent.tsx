import { openUrl } from '../../../helper/rustInvoke';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { type SidebarMenuItem } from '../../../router/config';

export interface BaseChildrenContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (item: SidebarMenuItem) => void;
  isActive?: (path: string) => boolean;
  isParentActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
  groupTitle?: string;
  groupTitleI18nKey?: string;
}

const BaseChildrenContent = ({
  items,
  onMenuClick,
  isActive,
  isParentActive,
  hasChildrenItems,
  groupTitle,
  groupTitleI18nKey,
}: BaseChildrenContentProps) => {
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(items.filter(item => item.children?.length).map(item => item.id))
  );

  const defaultIsActive = (_path: string) => false;
  const defaultIsParentActive = (_path: string) => false;
  const defaultHasChildrenItems = (item: SidebarMenuItem) => !!(item.children && item.children.length > 0);

  const activeCheck = isActive || defaultIsActive;
  const parentActiveCheck = isParentActive || defaultIsParentActive;
  const childrenCheck = hasChildrenItems || defaultHasChildrenItems;

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.type === 'route' && item.path) {
      if (onMenuClick) onMenuClick(item);
    } else if (item.type === 'action' && item.action) {
      item.action();
    } else if (item.type === 'external' && item.url) {
      openUrl(item.url);
    }
  };

  const renderItem = (item: SidebarMenuItem, level: number = 0, index: number = 0) => {
    if (item.type === 'divider') {
      return <div key={item.id} className="my-2 border-t border-[var(--color-border)]" />;
    }

    if (item.type === 'header') {
      return (
        <div key={item.id} className="text-sm font-semibold text-[var(--color-text-tertiary)] mb-3 px-4 pb-2 border-b border-[var(--color-border)]">
          {t(item.titleI18nKey, item.title)}
        </div>
      );
    }

    const hasChildren = childrenCheck(item);
    const isExpanded = expandedItems.has(item.id);
    const active = item.type === 'route' && item.path ? activeCheck(item.path) : false;
    const parentActive = !active && item.type === 'route' && item.path ? parentActiveCheck(item.path) : false;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03, duration: 0.15 }}
        style={{ paddingLeft: level > 0 ? `${level * 0.75}rem` : undefined }}
      >
        <motion.button
          onClick={() => {
            if (hasChildren) toggleExpand(item.id);
            handleItemClick(item);
          }}
          className={`
            w-full flex items-center gap-3 py-2.5 rounded-lg
            border-l-[3px] transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg-secondary)]
            ${active
              ? 'bg-[var(--color-surface-active)] text-[var(--color-text-primary)] font-semibold border-l-[var(--color-primary)]'
              : parentActive
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-l-[var(--color-primary)] border-l-opacity-50'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] border-l-transparent'
            }
          `}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
        >
          {item.icon && (
            <motion.span
              className="w-5 h-5 flex-shrink-0 flex items-center justify-center"
              whileHover={{ scale: 1.15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {item.icon}
            </motion.span>
          )}
          <span className="text-sm text-left flex-1 truncate">
            {t(item.titleI18nKey, item.title)}
          </span>
          {hasChildren && (
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
          {hasChildren && isExpanded && item.children && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 mt-0.5">
                {item.children.map((child, i) => renderItem(child, level + 1, index + i + 1))}
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
        {items.map((item, index) => renderItem(item, 0, index))}
      </div>
    </div>
  );
};

export default BaseChildrenContent;
