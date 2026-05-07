import React from 'react';
import { useTranslation } from 'react-i18next';
import { IsolationMode } from '../../helper/rustInvoke';
import SettingItem from './SettingItem';

interface IsolationModeSelectorProps {
  value: IsolationMode;
  onChange: (mode: IsolationMode) => void;
  disabled?: boolean;
}

const IsolationModeSelector: React.FC<IsolationModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const modes = [
    { 
      value: IsolationMode.Global, 
      label: t('settings.isolation.global', '全局共享'),
      description: t('settings.isolation.globalDesc', '所有实例共享同一套配置')
    },
    { 
      value: IsolationMode.Version, 
      label: t('settings.isolation.version', '版本隔离'),
      description: t('settings.isolation.versionDesc', '同一版本共享配置，不同版本隔离')
    },
    { 
      value: IsolationMode.Instance, 
      label: t('settings.isolation.instance', '各实例独立'),
      description: t('settings.isolation.instanceDesc', '推荐：每个实例独立存储，互不干扰')
    },
  ];

  return (
    <div className="space-y-3">
      {modes.map((mode) => (
        <div
          key={mode.value}
          onClick={() => !disabled && onChange(mode.value)}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            value === mode.value
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-10)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                value === mode.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                  : 'border-[var(--color-text-tertiary)]'
              }`}
            >
              {value === mode.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {mode.label}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {mode.description}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default IsolationModeSelector;
