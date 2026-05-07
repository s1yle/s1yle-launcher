import React from 'react';
import { useTranslation } from 'react-i18next';

interface AdvancedSettingsProps {
  launcherVisible?: boolean;
  playerName?: string;
  serverAddress?: string;
  serverPort?: number;
  onLauncherVisibleChange: (value: boolean) => void;
  onPlayerNameChange: (value: string) => void;
  onServerAddressChange: (value: string) => void;
  onServerPortChange: (value: number | undefined) => void;
  disabled?: boolean;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  launcherVisible = true,
  playerName = '',
  serverAddress = '',
  serverPort,
  onLauncherVisibleChange,
  onPlayerNameChange,
  onServerAddressChange,
  onServerPortChange,
  disabled = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* 启动器可见性 */}
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 pr-4">
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            {t('settings.advanced.launcherVisible', '启动器可见性')}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            {t('settings.advanced.launcherVisibleDesc', '启动游戏后是否显示启动器窗口')}
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={launcherVisible}
            onChange={(e) => onLauncherVisibleChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[var(--color-input)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
        </label>
      </div>

      {/* 玩家名称 */}
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 pr-4">
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            {t('settings.advanced.playerName', '玩家名称')}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            {t('settings.advanced.playerNameDesc', '启动游戏时使用的玩家名称')}
          </div>
        </div>
        <input
          type="text"
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          disabled={disabled}
          placeholder={t('settings.advanced.playerNamePlaceholder', 'Steve')}
          className="w-48 px-3 py-2 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
        />
      </div>

      {/* 自动连接服务器 */}
      <div className="flex items-start justify-between py-3">
        <div className="flex-1 pr-4">
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            {t('settings.advanced.serverAddress', '自动连接服务器')}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            {t('settings.advanced.serverAddressDesc', '启动游戏后自动连接到指定服务器')}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={serverAddress}
            onChange={(e) => onServerAddressChange(e.target.value)}
            disabled={disabled}
            placeholder={t('settings.advanced.serverAddressPlaceholder', '服务器地址')}
            className="w-32 px-3 py-2 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
          />
          <input
            type="number"
            value={serverPort || ''}
            onChange={(e) => onServerPortChange(e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled}
            placeholder={t('settings.advanced.serverPortPlaceholder', '端口')}
            className="w-20 px-3 py-2 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
