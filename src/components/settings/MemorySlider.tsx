import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemMemory } from '../../helper/rustInvoke';
import SettingItem from './SettingItem';

interface MemorySliderProps {
  minMemory: number;
  maxMemory: number;
  autoMemory: boolean;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onAutoChange: (value: boolean) => void;
  disabled?: boolean;
}

const MemorySlider: React.FC<MemorySliderProps> = ({
  minMemory,
  maxMemory,
  autoMemory,
  onMinChange,
  onMaxChange,
  onAutoChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [systemMemory, setSystemMemory] = useState<number>(0);

  useEffect(() => {
    getSystemMemory().then(setSystemMemory).catch(console.error);
  }, []);

  const handleAutoMemoryChange = (checked: boolean) => {
    if (checked && systemMemory > 0) {
      // 自动计算最优内存（系统内存的 50%）
      const optimal = Math.floor(systemMemory * 0.5);
      onMinChange(optimal);
      onMaxChange(Math.min(optimal * 2, systemMemory));
    }
    onAutoChange(checked);
  };

  const formatMemory = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  return (
    <div className="space-y-4">
      <SettingItem
        label={t('settings.memory.auto', '自动分配内存')}
        description={t('settings.memory.autoDesc', '根据系统内存自动分配最优值')}
      >
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoMemory}
            onChange={(e) => handleAutoMemoryChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[var(--color-input)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
        </label>
      </SettingItem>

      {!autoMemory && (
        <>
          <SettingItem
            label={t('settings.memory.min', '最小内存')}
            description={t('settings.memory.minDesc', 'JVM 启动时分配的最小内存 (-Xms)')}
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="512"
                max={systemMemory || 16384}
                step="256"
                value={minMemory}
                onChange={(e) => onMinChange(Number(e.target.value))}
                disabled={disabled}
                className="w-48 h-2 bg-[var(--color-input)] rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-[var(--color-text-secondary)] min-w-[80px] text-right">
                {formatMemory(minMemory)}
              </span>
            </div>
          </SettingItem>

          <SettingItem
            label={t('settings.memory.max', '最大内存')}
            description={t('settings.memory.maxDesc', 'JVM 运行时允许使用的最大内存 (-Xmx)')}
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={minMemory}
                max={systemMemory || 16384}
                step="256"
                value={maxMemory}
                onChange={(e) => onMaxChange(Number(e.target.value))}
                disabled={disabled}
                className="w-48 h-2 bg-[var(--color-input)] rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-[var(--color-text-secondary)] min-w-[80px] text-right">
                {formatMemory(maxMemory)}
              </span>
            </div>
          </SettingItem>

          {systemMemory > 0 && (
            <div className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-surface)] p-3 rounded border border-[var(--color-border)]">
              {t('settings.memory.tip', '系统总内存：{total} | 已分配：最小 {min} / 最大 {max}', {
                total: formatMemory(systemMemory),
                min: formatMemory(minMemory),
                max: formatMemory(maxMemory),
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MemorySlider;
