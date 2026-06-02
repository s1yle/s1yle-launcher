import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Gamepad2, Hammer, Zap, Package, Image } from 'lucide-react';
import { useInstanceStore } from '../../../../stores/instanceStore';
import { ModLoaderType, type GameInstance } from '../../../../helper/rustInvoke';
import { SidebarMenuItem } from '@/router/models';
import { Portal } from '@/components/common/Portal';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Z_INDEX } from '@/utils/zIndex';

interface InstanceManageButtonProps {
  item: SidebarMenuItem;
  isActive: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onNavigate?: (path: string) => void;
}

const LOADER_ICONS: Record<ModLoaderType, React.ComponentType<{ className?: string }>> = {
  [ModLoaderType.Vanilla]: Gamepad2,
  [ModLoaderType.Forge]: Hammer,
  [ModLoaderType.NeoForge]: Image,
  [ModLoaderType.Fabric]: Zap,
  [ModLoaderType.Quilt]: Package,
};

const InstanceManageButton: React.FC<InstanceManageButtonProps> = ({
  item,
  isActive,
  isExpanded = false,
  onToggle,
  onNavigate
}) => {
  const { t } = useTranslation();
  const instance = useInstanceStore(s => s.getSelectedInstance());
  const instances = useInstanceStore(s => s.instances);
  const setSelectedInstance = useInstanceStore(s => s.setSelectedInstance);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useClickOutside<HTMLDivElement>(
    () => setShowDropdown(false),
    showDropdown,
    [dropdownRef],
  );

  const formatVersionInfo = (inst: GameInstance): string => {
    const parts: string[] = [inst.version_id];

    if (inst.loader_type !== ModLoaderType.Vanilla) {
      if (inst.loader_version) {
        parts.push(`${inst.loader_type} ${inst.loader_version}`);
      } else {
        parts.push(inst.loader_type);
      }
    }

    return parts.join(' · ');
  };

  const getLoaderIcon = (inst: GameInstance) => {
    const IconComponent = LOADER_ICONS[inst.loader_type] || Gamepad2;
    return <IconComponent className="w-5 h-5" />;
  };

  const handleMainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!instance) return;
    
    // 如果有子项，自动导航到第一个子项
    if (item.children && item.children.length > 0 && onNavigate) {
      const firstChild = item.children[0];
      if (firstChild.path) {
        // 不要提前替换 :instanceId，让 React Router 自己处理
        onNavigate(firstChild.path);
      }
    } else if (item.path && onNavigate) {
      // 没有子项，直接导航到 path
      onNavigate(item.path);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleInstanceSelect = (instanceId: string) => {
    setSelectedInstance(instanceId);
    setShowDropdown(false);
  };

  // 无实例时的显示
  if (!instance) {
    return (
      <div
        className={`w-full p-3 rounded-lg border transition-all duration-200 cursor-default ${
          isActive
            ? 'bg-[var(--color-surface-active)] border-l-[3px] border-l-[var(--color-primary)] border-[var(--color-border)]'
            : 'bg-[var(--color-surface)] border-[var(--color-border)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-10)] flex items-center justify-center">
            <span className="text-[var(--color-primary)]">
              <Gamepad2 className="w-5 h-5" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--color-text-tertiary)]">
              {t('instanceInfo.noInstance', '暂无实例')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative" ref={buttonRef}>
      {/* 主体按钮 */}
      <motion.button
        className={`w-full p-3 rounded-lg border transition-all duration-200 text-left flex items-center justify-between gap-2 ${
          isActive
            ? 'bg-[var(--color-surface-active)] border-l-[3px] border-l-[var(--color-primary)] border-[var(--color-border)]'
            : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
        }`}
        onClick={handleMainClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 左侧：图标 + 信息 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* 实例图标 */}
          <motion.div
            className="w-8 h-8 rounded-lg bg-[var(--color-primary-10)] flex items-center justify-center flex-shrink-0 overflow-hidden"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {instance.icon_path ? (
              <img
                src={instance.icon_path}
                alt={instance.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[var(--color-primary)]">
                {getLoaderIcon(instance)}
              </span>
            )}
          </motion.div>

          {/* 实例信息 */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {instance.name}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">
              {formatVersionInfo(instance)}
            </div>
          </div>
        </div>

        {/* 右侧：展开箭头 */}
        <motion.div
          className="flex-shrink-0 cursor-pointer p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          onClick={handleToggleExpand}
          animate={{ rotate: showDropdown ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* 下拉菜单 */}
      {showDropdown && instances.length > 0 && (
        <Portal anchorTo={buttonRef} placement="bottom-start" zIndex={Z_INDEX.DROPDOWN}>
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              key="instance-dropdown"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="py-1 bg-[var(--color-surface-solid)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-64 overflow-y-auto"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}
            >
              {instances.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => handleInstanceSelect(inst.id)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                    inst.id === instance.id
                      ? 'bg-[var(--color-primary-10)] text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-[var(--color-primary-10)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {inst.icon_path ? (
                      <img
                        src={inst.icon_path}
                        alt={inst.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[var(--color-primary)]">
                        {React.createElement(
                          LOADER_ICONS[inst.loader_type] || Gamepad2,
                          { className: 'w-4 h-4' }
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{inst.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)] truncate">
                      {formatVersionInfo(inst)}
                    </div>
                  </div>

                  {inst.id === instance.id && (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                  )}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </Portal>
      )}
    </div>
  );
};

export default InstanceManageButton;
