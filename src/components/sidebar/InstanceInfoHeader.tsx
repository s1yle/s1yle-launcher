import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Gamepad2, Hammer, Zap, Package, ChevronDown, Image } from 'lucide-react';
import { useInstanceStore } from '../../stores/instanceStore';
import { ModLoaderType, type GameInstance } from '../../helper/rustInvoke';

interface InstanceInfoHeaderProps {
  onInstanceClick?: () => void;
  onIconClick?: () => void;
}

const LOADER_ICONS: Record<ModLoaderType, React.ComponentType<{ className?: string }>> = {
  [ModLoaderType.Vanilla]: Gamepad2,
  [ModLoaderType.Forge]: Hammer,
  [ModLoaderType.Fabric]: Zap,
  [ModLoaderType.Quilt]: Package,
};

const InstanceInfoHeader: React.FC<InstanceInfoHeaderProps> = ({ 
  onInstanceClick,
  onIconClick 
}) => {
  const { t } = useTranslation();
  const instance = useInstanceStore(s => s.getSelectedInstance());
  const instances = useInstanceStore(s => s.instances);
  const setSelectedInstance = useInstanceStore(s => s.setSelectedInstance);
  const [showDropdown, setShowDropdown] = useState(false);

  const formatVersionInfo = (inst: GameInstance): string => {
    const parts: string[] = [inst.version];
    
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
    return <IconComponent className="w-6 h-6" />;
  };

  const handleInstanceSelect = (instanceId: string) => {
    setSelectedInstance(instanceId);
    setShowDropdown(false);
    onInstanceClick?.();
  };

  if (!instance) {
    return (
      <div className="px-4 py-3 mb-2 text-center text-sm text-text-tertiary">
        {t('instanceInfo.noInstance', '暂无实例')}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 mb-2">
      <div 
        className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="flex items-center gap-3">
          {/* 图标 */}
          <motion.div
            className="w-12 h-12 rounded-lg bg-[var(--color-primary-10)] flex items-center justify-center flex-shrink-0 overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onClick={(e) => {
              e.stopPropagation();
              onIconClick?.();
            }}
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

          {/* 文本信息 */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {instance.name}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">
              {formatVersionInfo(instance)}
            </div>
          </div>

          {/* 下拉箭头 */}
          <motion.div
            animate={{ rotate: showDropdown ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </motion.div>
        </div>
      </div>

      {/* 实例选择下拉菜单 */}
      {showDropdown && instances.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative"
        >
          <div 
            className="absolute top-1 left-0 right-0 z-50 mt-1 py-1 bg-[var(--color-surface-solid)] border border-[var(--color-border)] rounded-lg shadow-lg backdrop-blur-md max-h-64 overflow-y-auto"
            style={{ 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
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
          </div>
          
          {/* 遮罩层，点击关闭下拉菜单 */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
        </motion.div>
      )}
    </div>
  );
};

export default InstanceInfoHeader;
