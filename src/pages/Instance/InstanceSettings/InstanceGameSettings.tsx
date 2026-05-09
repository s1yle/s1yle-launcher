import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Coffee, 
  Monitor, 
  ChevronDown, 
  ChevronUp,
  Check,
  FolderOpen,
} from 'lucide-react';
import { useInstanceStore } from '../../../stores/instanceStore';
import { getInstanceSettings, updateInstanceSettings, GameSettings, selectJavaPath } from '../../../helper/rustInvoke';
import { Toggle, useNotification } from '../../../components/common';
import { SettingsSection, SettingItem } from '../../../components/settings';
import MemorySlider from '../../../components/settings/MemorySlider';
import Mask from '../../../components/common/Mask';
import { useRouteParams } from '../../../components/RouterRenderer';

const InstanceGameSettings: React.FC = () => {
  const { t } = useTranslation();
  const { instanceId } = useRouteParams();
  const navigate = useNavigate();
  const setSelectedInstance = useInstanceStore(s => s.setSelectedInstance);
  const getInstance = useInstanceStore(s => s.getInstance);
  const storeLoading = useInstanceStore(s => s.loading);
  const instances = useInstanceStore(s => s.instances);
  const { success, error: notifyError } = useNotification();

  const [settings, setSettings] = useState<GameSettings>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [javaPaths, setJavaPaths] = useState<Array<{ version: string; path: string }>>([]);
  const [javaExpanded, setJavaExpanded] = useState(false);

  const instance = instanceId ? getInstance(instanceId) : null;

  useEffect(() => {
    if (instanceId) {
      const inst = getInstance(instanceId);
      if (inst) {
        setSelectedInstance(instanceId);
      } else {
        navigate('/instance-list');
      }
    }
  }, [instanceId]);

  // 加载实例设置
  useEffect(() => {
    if (!instance) return;

    const loadSettings = async () => {
      try {
        setSettingsLoading(true);
        const loadedSettings = await getInstanceSettings(instance.id);
        console.log('[GameSettings] Loaded settings:', loadedSettings);
        setSettings(loadedSettings);
        
        // 扫描常见的 Java 安装路径
        const commonJavaPaths = await scanCommonJavaPaths();
        setJavaPaths(commonJavaPaths);
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
        console.log('[GameSettings] Saving settings:', settings);
        await updateInstanceSettings(instance.id, settings);
        success(t('settings.saved', '设置已保存'));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        notifyError(t('settings.saveFailed', '保存设置失败'), msg);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [instance?.id, settings, settingsLoading]);

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
    console.log('[GameSettings] Update setting:', key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // 分辨率选项
  const resolutionOptions = [
    '854x480',
    '1280x720',
    '1920x1080',
    '2560x1440',
    '3840x2160',
  ];

  const currentResolution = settings.width && settings.height 
    ? `${settings.width}x${settings.height}`
    : '1280x720';

  // 扫描常见 Java 路径
  const scanCommonJavaPaths = async (): Promise<Array<{ version: string; path: string }>> => {
    const paths: Array<{ version: string; path: string }> = [];
    
    // 这里可以添加扫描逻辑，暂时返回空数组
    // 实际应该调用 Rust 后端来扫描
    return paths;
  };

  const handleBrowseJava = async () => {
    try {
      const path = await selectJavaPath();
      if (path) {
        updateSetting('java_path', path);
        // 尝试从路径提取版本信息
        const versionMatch = path.match(/java[-_]?(\d+)/i);
        const version = versionMatch ? `Java ${versionMatch[1]}` : 'Unknown';
        setJavaPaths(prev => [...prev, { version, path }]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      notifyError(t('settings.java.selectFailed', '选择 Java 路径失败'), msg);
    }
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
            description={t('settings.useInstanceSettingsDesc', '启用后，以下设置将仅应用于当前实例，不影响其他实例。未启用时使用全局默认配置')}
          >

            <Toggle
              checked={settings.use_instance_settings || false}
              onChange={(checked) => updateSetting('use_instance_settings', checked)}
              disabled={settingsLoading}
            />
          </SettingItem>
        </SettingsSection>

        

        {/* Java 配置 */}
        <Mask
          active={!settings.use_instance_settings}
          label={t('mask.globalSettings', '使用全局设置')}
          description={t('mask.globalSettingsDesc', '当前实例使用全局游戏设置。启用"实例特定游戏设置"后可自定义')}
        >
          <SettingsSection
            title={t('settings.java.title', 'Java 配置')}
            icon={<Coffee className="w-5 h-5" />}
          >
          <div className="space-y-4">
            {/* Java 路径显示 */}
            <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
              <button
                onClick={() => setJavaExpanded(!javaExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Coffee className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">
                      {t('settings.java.path', '游戏 Java')}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] truncate max-w-md">
                      {settings.java_path || t('settings.java.auto', '自动选择合适的 Java')}
                    </div>
                  </div>
                </div>
                {javaExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                )}
              </button>

              <AnimatePresence>
                {javaExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 space-y-3 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
                      {/* 自动选择 */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="java-selection"
                          checked={!settings.java_path}
                          onChange={() => updateSetting('java_path', undefined)}
                          disabled={settingsLoading}
                          className="w-4 h-4 text-[var(--color-primary)] bg-[var(--color-input)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {t('settings.java.auto', '自动选择合适的 Java')}
                        </span>
                      </label>

                      {/* Java 列表 */}
                      {javaPaths.map((java) => (
                        <label key={java.path} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="java-selection"
                            checked={settings.java_path === java.path}
                            onChange={() => updateSetting('java_path', java.path)}
                            disabled={settingsLoading}
                            className="w-4 h-4 text-[var(--color-primary)] bg-[var(--color-input)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[var(--color-text-primary)]">
                              {java.version}
                            </div>
                            <div className="text-xs text-[var(--color-text-tertiary)] truncate">
                              {java.path}
                            </div>
                          </div>
                          {settings.java_path === java.path && (
                            <Check className="w-4 h-4 text-[var(--color-primary)]" />
                          )}
                        </label>
                      ))}

                      {/* 自定义路径 */}
                      <div className="pt-2 border-t border-[var(--color-border)]">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="radio"
                            name="java-selection"
                            checked={!!settings.java_path && !javaPaths.some(j => j.path === settings.java_path)}
                            onChange={() => {}}
                            disabled={settingsLoading}
                            className="w-4 h-4 text-[var(--color-primary)] bg-[var(--color-input)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
                          />
                          <span className="text-sm text-[var(--color-text-primary)]">
                            {t('settings.java.custom', '自定义')}
                          </span>
                        </label>
                        <div className="flex gap-2 pl-7">
                          <input
                            type="text"
                            value={settings.java_path || ''}
                            onChange={(e) => updateSetting('java_path', e.target.value)}
                            disabled={settingsLoading}
                            placeholder={t('settings.java.pathPlaceholder', 'Java 可执行文件路径 (java.exe)')}
                            className="flex-1 px-3 py-2 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={handleBrowseJava}
                            disabled={settingsLoading}
                            className="px-3 py-2 bg-[var(--color-primary)] text-white rounded text-sm hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <FolderOpen className="w-4 h-4" />
                            {t('common.browse', '浏览')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 内存分配 */}
            <div>
              <div className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                {t('settings.memory.title', '游戏内存')}
              </div>
              <MemorySlider
                minMemory={settings.min_memory}
                maxMemory={settings.max_memory}
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
            </div>
          </div>
          </SettingsSection>

        {/* 窗口配置 */}
          <SettingsSection
            title={t('settings.window.title', '窗口配置')}
            icon={<Monitor className="w-5 h-5" />}
          >
          <SettingItem
            label={t('settings.window.resolution', '游戏窗口分辨率')}
            description={t('settings.window.resolutionDesc', '选择合适的分辨率或自定义')}
          >
            <div className="flex items-center gap-3">
              <select
                value={currentResolution}
                onChange={(e) => {
                  const [width, height] = e.target.value.split('x').map(Number);
                  updateSetting('width', width);
                  updateSetting('height', height);
                }}
                disabled={settingsLoading || settings.fullscreen}
                className="px-4 py-2 bg-[var(--color-surface-active)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              >
                {resolutionOptions.map((res) => (
                  <option key={res} value={res}>
                    {res}
                  </option>
                ))}
              </select>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.fullscreen || false}
                  onChange={(e) => updateSetting('fullscreen', e.target.checked)}
                  disabled={settingsLoading}
                  className="w-4 h-4 rounded bg-[var(--color-input)] border-[var(--color-border)] text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">
                  {t('settings.window.fullscreen', '全屏')}
                </span>
              </label>
            </div>
          </SettingItem>

          <SettingItem
            label={t('settings.advanced.launcherVisible', '启动器可见性')}
            description={t('settings.advanced.launcherVisibleDesc', '启动游戏后是否显示启动器窗口')}
          >
              <Toggle
                checked={settings.launcher_visible ?? true}
                onChange={(checked) => updateSetting('launcher_visible', checked)}
                disabled={settingsLoading}
              />
          </SettingItem>
          </SettingsSection>
        </Mask>
      </div>
    </div>
  );
};

export default InstanceGameSettings;
