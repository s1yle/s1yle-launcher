import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Coffee, Box, Monitor, Terminal, User, Globe } from 'lucide-react';
import { useInstanceStore } from '../../../stores/instanceStore';
import { getInstanceSettings, updateInstanceSettings, IsolationMode, GameSettings } from '../../../helper/rustInvoke';
import { useNotification } from '../../../components/common';
import {
  SettingsSection,
  SettingItem,
  JavaPathSelector,
  MemorySlider,
  IsolationModeSelector,
  JVMArgsEditor,
  AdvancedSettings,
} from '../../../components/settings';

const InstanceGameSettings: React.FC = () => {
  console.log('🎮 InstanceGameSettings 组件已渲染！');
  
  const { t } = useTranslation();
  const storeLoading = useInstanceStore(s => s.loading);
  const selectedInstanceId = useInstanceStore(s => s.selectedInstanceId);
  const instance = useInstanceStore(s => s.getSelectedInstance());
  const instances = useInstanceStore(s => s.instances);
  const { success, error: notifyError } = useNotification();

  const [settings, setSettings] = useState<GameSettings>({});
  const [settingsLoading, setSettingsLoading] = useState(false);

  console.log('[GameSettings] Rendered!', { 
    storeLoading, 
    selectedInstanceId, 
    instance: instance?.name, 
    instancesCount: instances?.length 
  });

  // 加载实例设置
  useEffect(() => {
    if (!instance) return;

    const loadSettings = async () => {
      try {
        setSettingsLoading(true);
        const loadedSettings = await getInstanceSettings(instance.id);
        setSettings(loadedSettings);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        notifyError(t('settings.loadFailed', '加载设置失败'), msg);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, [instance?.id]);

  // 保存设置（防抖）
  useEffect(() => {
    if (!instance || settingsLoading) return;

    const timer = setTimeout(async () => {
      try {
        await updateInstanceSettings(instance.id, settings);
        success(t('settings.saved', '设置已保存'));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        notifyError(t('settings.saveFailed', '保存设置失败'), msg);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [instance?.id, settings]);

  // 显示加载状态
  if (storeLoading || settingsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[var(--color-text-tertiary)]">
          {t('common.loading', '加载中...')}
        </div>
      </div>
    );
  }

  // 显示实例列表为空
  if (!instances || instances.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-tertiary)]">
        {t('instances.noInstances', '暂无实例，请先添加游戏实例')}
      </div>
    );
  }

  // 显示未选择实例
  if (!instance) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-tertiary)]">
        {t('instanceInfo.selectInstance', '请在侧边栏选择游戏实例')}
      </div>
    );
  }

  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 基础设置 */}
        <SettingsSection
          title={t('settings.basic', '基础设置')}
          icon={<Settings className="w-5 h-5" />}
        >
          <SettingItem
            label={t('settings.useInstanceSettings', '启用实例特定游戏设置')}
            description={t('settings.useInstanceSettingsDesc', '启用后，以下设置将仅应用于当前实例，不影响其他实例')}
          >
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.use_instance_settings || false}
                onChange={(e) => updateSetting('use_instance_settings', e.target.checked)}
                disabled={settingsLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--color-input)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
            </label>
          </SettingItem>
        </SettingsSection>

        {/* Java 配置 */}
        <SettingsSection
          title={t('settings.java.title', 'Java 配置')}
          icon={<Coffee className="w-5 h-5" />}
        >
          <SettingItem
            label={t('settings.java.path', '游戏 Java')}
            description={t('settings.java.pathDesc', '指定用于启动游戏的 Java 可执行文件路径')}
          >
            <JavaPathSelector
              value={settings.java_path}
              onChange={(path) => updateSetting('java_path', path)}
              disabled={settingsLoading}
            />
          </SettingItem>

          <SettingItem
            label={t('settings.java.version', 'Java 版本')}
            description={t('settings.java.versionDesc', '建议根据 Minecraft 版本选择合适的 Java 版本')}
          >
            <select
              value={settings.java_version || ''}
              onChange={(e) => updateSetting('java_version', e.target.value || undefined)}
              disabled={settingsLoading}
              className="px-3 py-2 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
            >
              <option value="">{t('settings.java.auto', '自动')}</option>
              <option value="8">Java 8 (1.16.5 及以下)</option>
              <option value="16">Java 16 (1.17-1.17.1)</option>
              <option value="17">Java 17 (1.18-1.20.4)</option>
              <option value="21">Java 21 (1.20.5+)</option>
            </select>
          </SettingItem>

          <SettingItem
            label={t('settings.memory.title', '内存分配')}
            description={t('settings.memory.desc', '分配给游戏的内存大小')}
          >
            <MemorySlider
              minMemory={settings.min_memory || 4096}
              maxMemory={settings.max_memory || 8192}
              autoMemory={!settings.min_memory && !settings.max_memory}
              onMinChange={(value) => updateSetting('min_memory', value)}
              onMaxChange={(value) => updateSetting('max_memory', value)}
              onAutoChange={(checked) => {
                if (checked) {
                  updateSetting('min_memory', undefined);
                  updateSetting('max_memory', undefined);
                }
              }}
              disabled={settingsLoading}
            />
          </SettingItem>
        </SettingsSection>

        {/* 版本隔离 */}
        <SettingsSection
          title={t('settings.isolation.title', '版本隔离')}
          icon={<Box className="w-5 h-5" />}
        >
          <IsolationModeSelector
            value={settings.isolation_mode || IsolationMode.Global}
            onChange={(mode) => updateSetting('isolation_mode', mode)}
            disabled={settingsLoading}
          />
        </SettingsSection>

        {/* 窗口配置 */}
        <SettingsSection
          title={t('settings.window.title', '窗口配置')}
          icon={<Monitor className="w-5 h-5" />}
        >
          <SettingItem
            label={t('settings.window.resolution', '分辨率')}
            description={t('settings.window.resolutionDesc', '游戏窗口的宽度和高度')}
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.width || 1280}
                onChange={(e) => updateSetting('width', Number(e.target.value))}
                disabled={settingsLoading}
                className="w-24 px-3 py-2 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                placeholder="宽度"
              />
              <span className="text-[var(--color-text-secondary)]">×</span>
              <input
                type="number"
                value={settings.height || 720}
                onChange={(e) => updateSetting('height', Number(e.target.value))}
                disabled={settingsLoading}
                className="w-24 px-3 py-2 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                placeholder="高度"
              />
            </div>
          </SettingItem>

          <SettingItem label={t('settings.window.fullscreen', '全屏')}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.fullscreen || false}
                onChange={(e) => updateSetting('fullscreen', e.target.checked)}
                disabled={settingsLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--color-input)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
            </label>
          </SettingItem>

          <SettingItem label={t('settings.window.maximized', '最大化')}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maximized ?? true}
                onChange={(e) => updateSetting('maximized', e.target.checked)}
                disabled={settingsLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--color-input)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
            </label>
          </SettingItem>

          <SettingItem label={t('settings.window.vsync', '垂直同步')}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.vsync ?? true}
                onChange={(e) => updateSetting('vsync', e.target.checked)}
                disabled={settingsLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--color-input)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
            </label>
          </SettingItem>
        </SettingsSection>

        {/* JVM 参数 */}
        <SettingsSection
          title={t('settings.java.jvmArgs', 'JVM 参数')}
          icon={<Terminal className="w-5 h-5" />}
        >
          <SettingItem
            label={t('settings.java.jvmArgsLabel', '自定义 JVM 参数')}
            description={t('settings.java.jvmArgsDesc', '添加额外的 JVM 启动参数')}
          >
            <JVMArgsEditor
              value={settings.jvm_args}
              onChange={(args) => updateSetting('jvm_args', args)}
              disabled={settingsLoading}
            />
          </SettingItem>
        </SettingsSection>

        {/* 高级设置 */}
        <SettingsSection
          title={t('settings.advanced.title', '高级设置')}
          icon={<User className="w-5 h-5" />}
        >
          <AdvancedSettings
            launcherVisible={settings.launcher_visible ?? true}
            playerName={settings.player_name || ''}
            serverAddress={settings.server_address || ''}
            serverPort={settings.server_port}
            onLauncherVisibleChange={(value) => updateSetting('launcher_visible', value)}
            onPlayerNameChange={(value) => updateSetting('player_name', value)}
            onServerAddressChange={(value) => updateSetting('server_address', value)}
            onServerPortChange={(value) => updateSetting('server_port', value)}
            disabled={settingsLoading}
          />
        </SettingsSection>
      </div>
    </div>
  );
};

export default InstanceGameSettings;
