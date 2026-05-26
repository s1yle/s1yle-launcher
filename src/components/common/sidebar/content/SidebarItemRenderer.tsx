import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Trash2, FolderOpen } from 'lucide-react';
import { type SidebarMenuItem } from '../../../../router/config';
import { renderIcon } from '../../../../utils/iconRenderer';

export interface SidebarItemRendererProps {
  item: SidebarMenuItem;
  level: number;
  index: number;
  isExpanded: boolean;
  isActive: boolean;
  isItemActive?: boolean;
  isParentActive: boolean;
  hasChildren: boolean;
  isActionWithContext: boolean;
  canDelete?: boolean;
  spinning?: boolean;
  customRender?: React.ComponentType<any>;
  onToggle?: () => void;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  onNavigate?: (path: string) => void;
}

export const SidebarItemRenderer: React.FC<SidebarItemRendererProps> = ({
  item,
  level,
  index,
  isExpanded,
  isActive,
  isItemActive = false,
  isParentActive,
  hasChildren,
  isActionWithContext,
  canDelete = false,
  spinning = false,
  customRender,
  onToggle,
  onClick,
  onContextMenu,
  onDelete,
  onNavigate,
}) => {
  const { t } = useTranslation();

  // 分隔线
  if (item.type === 'divider') {
    return <div key={item.id} className="my-2 border-t border-[var(--color-border)]" />;
  }

  // 标题头
  if (item.type === 'header') {
    return (
      <div key={item.id} className="text-sm font-semibold text-[var(--color-text-tertiary)] mb-3 px-4 pb-2 border-b border-[var(--color-border)]">
        {t(item.titleI18nKey, item.title)}
      </div>
    );
  }

  // 自定义渲染
  if (customRender) {
    const CustomComponent = customRender;
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03, duration: 0.15 }}
        style={{ padding: level > 0 ? `${level * 0.75}rem` : `0.75rem` }}
      >
        <CustomComponent
          item={item}
          isActive={isActive}
          isExpanded={isExpanded}
          onToggle={hasChildren ? onToggle : undefined}
          onNavigate={onNavigate}
        />
        {hasChildren && isExpanded && item.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 mt-0.5">
              {item.children.map((child, i) => (
                <React.Fragment key={child.id}>
                  {/* 递归渲染子项 */}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // 默认渲染
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.15 }}
      className={canDelete ? "group/item" : ""}
    >
      <motion.button
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`
          w-full flex items-center gap-3 py-2.5 rounded-lg cursor-pointer
          border-l-[3px] transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg-secondary)]
          ${item.danger && !isActive && !isItemActive
            ? 'text-[var(--color-error)] hover:bg-[var(--color-error-10)] border-l-transparent'
            : isActive || isItemActive
              ? 'bg-[var(--color-surface-active)] text-[var(--color-text-primary)] font-semibold border-l-[var(--color-primary)]'
              : isParentActive
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
            {spinning ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, ease: 'linear', repeat: Infinity }}>
                {item.icon}
              </motion.span>
            ) : (
              renderIcon(item.icon, '', 'lg')
            )}
          </motion.span>
        )}
        <span className="text-sm text-left flex-1 truncate">
          {t(item.titleI18nKey, item.title)}
        </span>
        {hasChildren && !isActionWithContext && (
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
          </motion.div>
        )}
        {isActionWithContext && (
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
          </motion.div>
        )}
        {canDelete && (
          <motion.div
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="opacity-0 group-hover/item:opacity-100 p-1 text-[var(--color-text-tertiary)] hover:text-error rounded transition-all duration-150 flex-shrink-0 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="删除游戏文件夹"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.div>
        )}
      </motion.button>

      {hasChildren && !isActionWithContext && isExpanded && item.children && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 mt-0.5">
              {item.children.map((child, i) => (
                <React.Fragment key={child.id}>
                  {/* 递归渲染子项 */}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};