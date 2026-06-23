import { openUrl } from '../../../../helper/rustInvoke';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown, Trash2, FolderOpen } from 'lucide-react';
import { type SidebarMenuItem } from '../../../../router/config';
import { useInstanceStore } from '../../../../stores/instanceStore';
import ContextMenu, { ContextMenuItemData, useContextMenu } from '../../ContextMenu';
import clsx from 'clsx';
import { DURATION, EASING, microInteractions, transitions } from '../../../../utils/animations';
import { Animated } from '../../Animated';
import { renderIcon } from '../../../../utils/iconRenderer';

export interface BaseSidebarContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (item: SidebarMenuItem) => void;
  isActive?: (path: string) => boolean;
  isParentActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;

  isItemActive?: (id: string) => boolean;
  groupTitle?: string;
  groupTitleI18nKey?: string;
  onItemDelete?: (id: string) => void;
  onItemOpenFolder?: (id: string) => void;
  deletableItemIds?: Set<string>;
  onContextMenuAction?: (parentId: string, actionId: string) => void;
  enableClickToExpand?: boolean;
}

const BaseSidebarContent = ({
  items,
  onMenuClick,
  isActive,
  isParentActive,
  hasChildrenItems,
  isItemActive,
  groupTitle = "未知",
  groupTitleI18nKey,
  onItemDelete,
  onItemOpenFolder,
  deletableItemIds,
  onContextMenuAction,
  enableClickToExpand = false,
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

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<string | null>(null);
  const { contextMenuState, showContextMenu, hideContextMenu } = useContextMenu();

  const toggleExpand = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleActionWithContext = (e: React.MouseEvent, item: SidebarMenuItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.type === 'action' && item.children && item.children.length > 0) {
      setContextMenuTarget(item.id);
      showContextMenu(e);
    } else {
      handleItemClick(item);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItemId(itemId);
    showContextMenu(e);
  };

  const handleContextMenuAction = (id: string) => {
    if (contextMenuTarget && onContextMenuAction) {
      onContextMenuAction(contextMenuTarget, id);
      hideContextMenu();
      setContextMenuTarget(null);
      return;
    }

    if (!selectedItemId) return;

    switch (id) {
      case 'delete':
        onItemDelete?.(selectedItemId);
        break;
      case 'openFolder':
        onItemOpenFolder?.(selectedItemId);
        break;
    }
  };

  const getContextMenuItems = (): ContextMenuItemData[] => {
    if (contextMenuTarget) {
      const parentItem = items.find(i => i.id === contextMenuTarget);
      if (parentItem?.children) {
        return parentItem.children.map((child: SidebarMenuItem) => ({
          id: child.id,
          label: t(child.titleI18nKey, child.title) as string,
          icon: child.icon,
          danger: child.danger,
        }));
      }
    }
    return [
      { id: 'delete', label: t('contextMenu.deleteFolder', '删除游戏文件夹') as string, icon: Trash2, danger: true },
      { id: 'divider1', label: '', divider: true },
      { id: 'openFolder', label: t('contextMenu.openFolder', '打开所在文件夹') as string, icon: FolderOpen },
    ];
  };

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
        // 传递完整的 item 对象，而不是 item.path
        onMenuClick(item);
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
      if (item.action) item.action();
    } else if (item.type === 'external' && item.url) {
      openUrl(item.url);
    }
  };

  const isDeletable = (itemId: string) => deletableItemIds?.has(itemId) ?? false;

  const renderItem = (item: SidebarMenuItem, level: number = 0, index: number = 0) => {

    const isActionWithContext = item.type === 'action' && item.children && item.children.length > 0;
    const canDelete = isDeletable(item.id);

    const hasChildren = childrenCheck(item);
    const isExpanded = expandedGroups.has(item.id);
    const active = item.type === 'route' && item.path ? activeCheck(item.path) : false;
    const itemActive = isItemActive ? isItemActive(item.id) : false;
    const parentActive = !active && item.type === 'route' && item.path ? parentActiveCheck(item.path) : false;

    // 渲染分隔符
    if (item.type === 'divider') {
      return (
        <div key={item.id} className="my-2 border-t border-[var(--color-border)]" />
      );
    }

    if (item.type === 'header') {
      const isExpanded = expandedGroups.has(item.id);

      return (
        <Animated
          fade
          delay={index * 0.03}
          duration={DURATION.SLOW}
        >
          <button
            onClick={() => item.children?.length && toggleGroup(item.id)}
            className="w-full flex items-center 
              justify-between py-2 px-4 mb-1 
              text-sm text-[var(--color-text-tertiary)] 
              hover:text-[var(--color-text-secondary)] 
              transition-colors"
          >
            <span>{t(item.titleI18nKey, item.title)}</span>
            {item.children?.length && (
              <motion.div
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: DURATION.MEDIUM }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            )}
            </button>
          <Animated accordion={isExpanded && !!item.children} className="space-y-0.5">
            {item.children?.map((child, i) => renderItem(child, level + 1, index + i + 1))}
          </Animated>
        </Animated>
      );
    }

    // 如果有 customRender，使用自定义渲染
    if (item.customRender) {
      const CustomComponent = item.customRender;
      return (
        <Animated
          fade
          slide="left"
          delay={index * 0.03}
          duration={DURATION.SLOW}
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
          <Animated accordion={hasChildren && isExpanded && !!item.children} className="space-y-0.5 mt-0.5">
            {item.children?.map((child, i) => renderItem(child, level + 1, index + i + 1))}
          </Animated>
        </Animated>
      );
    }

    return (
      <Animated
        fade
        slide="left"
        delay={index * 0.03}
        duration={DURATION.SLOW}
        className='BaseSidebarContent'
      >
        <motion.button
          onClick={(e) => {
            if (isActionWithContext) {
              handleActionWithContext(e, item);
            } else {
              if (enableClickToExpand && hasChildren) toggleExpand(item.id);
              handleItemClick(item);
            }
          }}
          onContextMenu={canDelete ? (e) => handleContextMenu(e, item.id) : undefined}
          className={clsx(
            'relative w-full flex items-center gap-3 py-2.5 pl-[3px] cursor-pointer',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg-secondary)]',
            {
              'text-[var(--color-error)] hover:bg-[var(--color-error-10)]': item.danger && !active && !itemActive,
              'bg-[var(--color-surface-active)] text-[var(--color-text-primary)] font-semibold': active || itemActive,
              'bg-[var(--color-surface)] text-[var(--color-text-primary)]': !active && !itemActive && parentActive,
              'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]': !active && !itemActive && !parentActive && !item.danger,
            }
          )}
          whileTap={microInteractions.itemTap}
          transition={transitions.slow}
        >

          {/* 按钮图标 */}
          {item.icon && (
            <motion.span
              className="w-5 h-5 flex-shrink-0 flex items-center justify-center pl-2 "
              whileHover={microInteractions.iconHover}
              transition={EASING.SPRING_STIFF}
            >
              {item.id === 'refresh-instances' && spinningItems.has(item.id) ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                >
                  {renderIcon(item.icon, '', 'lg')}
                </motion.span>
              ) : (
                item.icon
              )}
            </motion.span>
          )}

          {/* 显示该按钮的title, 比如 /settings 就显示为其 title "设置" */}
          <span className="text-sm text-left flex-1 truncate">
            {t(item.titleI18nKey, item.title)}
          </span>

          {hasChildren && !isActionWithContext && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: DURATION.MEDIUM }}
              className="flex-shrink-0"
            >
            </motion.div>
          )}

          {isActionWithContext && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: DURATION.MEDIUM }}
              className="flex-shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
            </motion.div>
          )}

          {canDelete && (
            <motion.div
              onClick={(e) => { e.stopPropagation(); onItemDelete?.(item.id); }}
              className="opacity-0 group-hover/item:opacity-100 p-1 text-[var(--color-text-tertiary)] hover:text-error rounded transition-all duration-150 flex-shrink-0 cursor-pointer"
              whileHover={microInteractions.deleteIconHover}
              whileTap={microInteractions.deleteIconTap}
              title={t('instances.removeGameFolder', '删除游戏目录')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.div>
          )}

          {(active || itemActive) && (
            <motion.div
              layoutId="sidebarActiveIndicator"
              className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-full bg-[var(--color-primary)]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </motion.button>

        <Animated accordion={hasChildren && !isActionWithContext && isExpanded && !!item.children} className="space-y-0.5 mt-0.5">
          {item.children?.map((child, i) => renderItem(child, level + 1, index + i + 1))}
        </Animated>
      </Animated>
    );
  };

  return (
    <div>
      {groupTitle && (
        <div className="text-sm text-[var(--color-text-tertiary)] 
            mb-3 px-4 pb-2 border-b 
            border-[var(--color-border)]"
        >
          {groupTitleI18nKey ? t(groupTitleI18nKey, groupTitle) : groupTitle}
        </div>
      )}

      <div className="space-y-0.5">
        {items.map((item, index) => renderItem(item, 0, index))}
      </div>

      <ContextMenu
        items={getContextMenuItems()}
        position={contextMenuState.position}
        visible={contextMenuState.visible}
        onClose={() => {
          hideContextMenu();
          setContextMenuTarget(null);
        }}
        onItemClick={handleContextMenuAction}
      />
    </div>
  );
};

export default BaseSidebarContent;
