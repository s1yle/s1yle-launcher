import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Portal } from '@/components/common/Portal';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Z_INDEX } from '@/utils/zIndex';
import { dropdown, transitions } from '../../utils/animations';
import { renderIcon } from '../../utils/iconRenderer';

/** 右键菜单项数据 */
export interface ContextMenuItemData {
  id: string;
  label: string;
  icon?: LucideIcon | React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

/** 右键菜单组件 Props */
export interface ContextMenuProps {
  items: ContextMenuItemData[];
  position: { x: number; y: number };
  visible: boolean;
  onClose: () => void;
  onItemClick: (id: string) => void;
  className?: string;
}

/** 右键菜单组件，基于 Portal 浮动定位，支持动画和点击外部关闭 */
const ContextMenu = ({
  items,
  position,
  visible,
  onClose,
  onItemClick,
  className = '',
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(() => onClose(), visible, [menuRef]);

  const handleItemClick = useCallback((id: string, disabled?: boolean) => {
    if (disabled) return;
    onItemClick(id);
    onClose();
  }, [onItemClick, onClose]);

  if (!visible) return null;

  return (
    <Portal
      originX={position.x}
      originY={position.y}
      collisionBoundary={{ bottom: 10, right: 10 }}
      zIndex={Z_INDEX.DROPDOWN}
    >
      <AnimatePresence>
        <motion.div
          ref={menuRef}
          key="context-menu"
          variants={dropdown}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`py-1 min-w-[140px] ${className}`}
          style={{
            backgroundColor: 'var(--color-surface-solid)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />;
            }

            return (
              <motion.button
                key={item.id}
                onClick={() => handleItemClick(item.id, item.disabled)}
                disabled={item.disabled}
                className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 transition-colors ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                style={{
                  color: item.danger ? 'var(--color-error)' : 'var(--color-text-secondary)',
                }}
                whileHover={{ x: 2 }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor = item.danger
                      ? 'var(--color-error-10)'
                      : 'var(--color-primary-10)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                transition={transitions.fast}
              >
                {item.icon && renderIcon(item.icon)}
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
};

/**
 * 右键菜单 Hook。
 * 提供 showContextMenu / hideContextMenu 方法及 contextMenuState 状态，
 * 用于在任意元素上触发右键菜单。
 */
export const useContextMenu = () => {
  const [contextMenuState, setContextMenuState] = useState<{
    visible: boolean;
    position: { x: number; y: number };
  }>({
    visible: false,
    position: { x: 0, y: 0 },
  });

  const showContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuState({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenuState((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    contextMenuState,
    showContextMenu,
    hideContextMenu,
  };
};

export default ContextMenu;
