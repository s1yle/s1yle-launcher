import { openUrl } from '../../../helper/rustInvoke';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { type SidebarMenuItem } from '../../../router/config';
import { useInstanceStore } from '../../../stores/instanceStore';

export interface BaseSidebarContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (item: SidebarMenuItem) => void;
  isActive?: (path: string) => boolean;
  isParentActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
}

const BaseSidebarContent = ({
  items,
  onMenuClick,
  isActive,
  isParentActive,
  hasChildrenItems,
}: BaseSidebarContentProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const instance = useInstanceStore(s => s.getSelectedInstance());
  
  // 初始化展开状态
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    let hasMatchedPath = false;
    
    items.forEach(item => {
      if (item.children?.length) {
        if (item.path && location.pathname.startsWith(item.path + '/')) {
          expanded.add(item.id);
          hasMatchedPath = true;
        }
      }
    });
    
    // 如果没有匹配的路径（如在主页），展开所有顶级菜单项
    if (!hasMatchedPath) {
      items.forEach(item => {
        if (item.children?.length) {
          expanded.add(item.id);
        }
      });
    }
    
    return expanded;
  });
  const [spinningItems, setSpinningItems] = useState<Set<string>>(new Set());

  // 监听路由变化，自动展开对应的菜单项
  useEffect(() => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      items.forEach(item => {
        if (item.children?.length) {
          if (item.path && location.pathname.startsWith(item.path + '/')) {
            next.add(item.id);
          }
        }
      });
      return next;
    });
  }, [location, items]);

  const defaultIsActive = (_path: string) => false;
  const defaultIsParentActive = (_path: string) => false;
  const defaultHasChildrenItems = (item: SidebarMenuItem) => !!(item.children && item.children.length > 0);

  const activeCheck = isActive || defaultIsActive;
  const parentActiveCheck = isParentActive || defaultIsParentActive;
  const childrenCheck = hasChildrenItems || defaultHasChildrenItems;

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.type === 'route' && item.path) {
      if (onMenuClick) {
        // 不要提前替换 :instanceId，让 React Router 自己处理
        onMenuClick(item.path);
      }
    } else if (item.type === 'action' && item.action) {
      if (item.id === 'refresh-instances') {
        setSpinningItems(prev => new Set(prev).add(item.id));
        setTimeout(() => {
          setSpinningItems(prev => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        }, 1000);
      }
      item.action();
    } else if (item.type === 'external' && item.url) {
      openUrl(item.url);
    }
  };

  const renderItem = (item: SidebarMenuItem, level: number = 0, index: number = 0) => {
    if (item.type === 'divider') {
      return (
        <div key={item.id} className="my-2 border-t border-[var(--color-border)]" />
      );
    }

    if (item.type === 'header') {
      const isExpanded = expandedGroups.has(item.id);
      return (
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.03, duration: 0.15 }}
        >
          <button
            onClick={() => item.children?.length && toggleGroup(item.id)}
            className="w-full flex items-center justify-between py-2 px-4 mb-1 text-sm font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <span>{t(item.titleI18nKey, item.title)}</span>
            {item.children?.length && (
              <motion.div animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            )}
          </button>
          <AnimatePresence>
            {isExpanded && item.children && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5">
                  {item.children.map((child, i) => renderItem(child, level + 1, index + i + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }

    const hasChildren = childrenCheck(item);
    const isExpanded = expandedGroups.has(item.id);
    const active = item.type === 'route' && item.path ? activeCheck(item.path) : false;
    const parentActive = !active && item.type === 'route' && item.path ? parentActiveCheck(item.path) : false;

    // 如果有 customRender，使用自定义渲染
    if (item.customRender) {
      const CustomComponent = item.customRender;
      return (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03, duration: 0.15 }}
          style={{
             padding: level > 0 ? `${level * 0.75}rem` : `0.75rem`,
          }}
        >
          <CustomComponent
            item={item}
            isActive={active}
            isExpanded={isExpanded}
            onToggle={hasChildren ? () => toggleGroup(item.id) : undefined}
            onNavigate={(path) => {
              if (onMenuClick) {
                let finalPath = path;
                if (instance && path.includes(':instanceId')) {
                  finalPath = path.replace(':instanceId', instance.id);
                }
                const menuItem = { ...item, path: finalPath } as SidebarMenuItem;
                onMenuClick(menuItem);
              }
            }}
          />
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
    }

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03, duration: 0.15 }}
      >
        <motion.button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center gap-3 py-2.5 rounded-lg cursor-pointer
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
              {item.id === 'refresh-instances' && spinningItems.has(item.id) ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                >
                  {item.icon}
                </motion.span>
              ) : (
                item.icon
              )}
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
    <div className="space-y-0.5">
      {items.map((item, index) => renderItem(item, 0, index))}
    </div>
  );
};

export default BaseSidebarContent;
