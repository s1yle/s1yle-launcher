import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { dropdown, transitions } from '../../utils/animations';
import { renderIcon } from '../../utils/iconRenderer';

export interface ContextMenuItemData {
  id: string;
  label: string;
  icon?: LucideIcon | React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItemData[];
  position: { x: number; y: number };
  visible: boolean;
  onClose: () => void;
  onItemClick: (id: string) => void;
  className?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  visible,
  onClose,
  onItemClick,
  className = '',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (visible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      if (x + rect.width > windowWidth) {
        x = windowWidth - rect.width - 10;
      }

      if (y + rect.height > windowHeight) {
        y = windowHeight - rect.height - 10;
      }

      setAdjustedPosition({ x, y });
    }
  }, [visible, position]);

  const handleItemClick = useCallback((id: string, disabled?: boolean) => {
    if (disabled) return;
    onItemClick(id);
    onClose();
  }, [onItemClick, onClose]);

  if (!visible) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={menuRef}
          variants={dropdown}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`fixed z-[9999] backdrop-blur-md py-1 min-w-[140px] ${className}`}
          style={{ 
            left: adjustedPosition.x, 
            top: adjustedPosition.y,
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
      )}
    </AnimatePresence>,
    document.body
  );
};

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
