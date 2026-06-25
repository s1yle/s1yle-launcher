import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemMemory } from '../../../helper/rustInvoke';

/** 内存滑块组件 Props */
export interface MemorySliderProps {
  minMemory?: number;
  maxMemory?: number;
  autoMemory: boolean;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onAutoChange: (value: boolean) => void;
  disabled?: boolean;
}

/** 内存滑块组件，显示系统内存信息，支持自动/手动分配 */
const MemorySlider = ({
  minMemory = 4096,
  maxMemory = 4096,
  autoMemory,
  onMinChange,
  onMaxChange,
  onAutoChange,
  disabled = false,
}: MemorySliderProps) => {
  const { t } = useTranslation();
  const [systemMemory, setSystemMemory] = useState<number>(0);
  const [usedMemory, setUsedMemory] = useState<number>(0);

  useEffect(() => {
    getSystemMemory().then((total) => {
      setSystemMemory(total);
      // 模拟已使用内存（实际应该从系统获取）
      setUsedMemory(Math.floor(total * 0.85));
    }).catch(console.error);
  }, []);

  const handleAutoMemoryChange = (checked: boolean) => {
    if (checked && systemMemory > 0) {
      // 自动分配：设置为系统内存的 50%
      const optimal = Math.floor(systemMemory * 0.5);
      onMinChange(optimal);
      onMaxChange(optimal);
    }
    onAutoChange(checked);
  };

  const formatMemory = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GiB`;
    }
    return `${mb} MiB`;
  };

  const availableMemory = systemMemory - usedMemory;
  const minMemoryGB = (minMemory / 1024).toFixed(1);
  const maxMemoryGB = (maxMemory / 1024).toFixed(1);
  const availableGB = (availableMemory / 1024).toFixed(1);

  return (
    <div className="space-y-4">
      {/* 自动分配复选框 */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={autoMemory}
          onChange={(e) => handleAutoMemoryChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded bg-[var(--color-input)] border-[var(--color-border)] text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <span className="text-sm text-[var(--color-text-primary)]">
          {t('settings.memory.auto', '自动分配内存')}
        </span>
      </div>

      {!autoMemory && (
        <>
          {/* 内存滑块 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('settings.memory.min', '最低内存分配')}
              </span>
              <span className="px-3 py-1 bg-[var(--color-surface-active)] rounded text-sm text-[var(--color-text-primary)]">
                {formatMemory(minMemory)}
              </span>
            </div>
            
            <input
              type="range"
              min="512"
              max={systemMemory || 16384}
              step="256"
              value={minMemory}
              onChange={(e) => {
                const value = Number(e.target.value);
                onMinChange(value);
                onMaxChange(Math.max(value, maxMemory));
              }}
              disabled={disabled}
              className="w-full h-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)] rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((minMemory - 512) / (systemMemory - 512)) * 100}%, var(--color-input) ${((minMemory - 512) / (systemMemory - 512)) * 100}%, var(--color-input) 100%)`
              }}
            />
          </div>

          {/* 内存信息条 */}
          <div className="w-full h-2 bg-[var(--color-input)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] transition-all duration-300"
              style={{ width: `${(maxMemory / systemMemory) * 100}%` }}
            />
          </div>

          {/* 内存状态信息 */}
          <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
            <span>
              {t('settings.memory.used', '已使用')} {formatMemory(usedMemory)} / {t('settings.memory.total', '总内存')} {formatMemory(systemMemory)}
            </span>
            <span>
              {t('settings.memory.minAlloc', '最低分配')} {minMemoryGB} GiB / {t('settings.memory.actualAlloc', '实际分配')} {maxMemoryGB} GiB ({availableGB} GiB {t('settings.memory.available', '可用')})
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default MemorySlider;
