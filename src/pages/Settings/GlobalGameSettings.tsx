import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  updateGlobalGameSettings,
  type GameSettings,
} from '@/helper/rustInvoke';
import { SettingsPanel, Toggle, Slider, useNotification, Page, PageSection } from '@/components/common';
import PartitionBar, { getPartitionColor } from '@/components/common/PartitionBar';
import { useGameSettingsForm, formatMemory } from '@/hooks/useGameSettingsForm';
import { useRouteData } from '@/router/routeData';
import { getErrorMessage } from '@/utils/errorUtils';

/** 全局游戏设置页面 - 所有游戏共用的默认参数（Java、内存、窗口） */
const GlobalGameSettings = () => {
  const { t } = useTranslation();
  const { success, error: notifyError } = useNotification();

  const globalData = useRouteData<GameSettings>();
  const [settings, setSettings] = useState<GameSettings>(globalData ?? {});
  // 自动分配内存开关（显式状态，避免写入推荐值后开关自动弹回）
  const [autoMemory, setAutoMemory] = useState(
    !globalData?.min_memory && !globalData?.max_memory
  );

  const isInitialLoad = useRef(true);
  const lastSavedSettings = useRef<string>(JSON.stringify(globalData ?? {}));

  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const {
    systemMemory,
    usedMemory,
    availMemory,
    gameMemory,
    gapMemory,
    handleAutoMemoryChange,
    currentResolution,
    resolutionOptionsWithCurrent,
    javaOptions,
    selectedJavaOption,
    handleJavaSelect,
    handleBrowseJava,
  } = useGameSettingsForm({
    settings,
    updateSetting,
    autoMemory,
    setAutoMemory,
    onJavaSelectFailed: (msg) => notifyError(t('settings.java.selectFailed', '选择 Java 路径失败'), msg),
  });

  // 保存设置（防抖）- 仅在用户修改后保存
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const currentSettingsStr = JSON.stringify(settings);
    if (currentSettingsStr === lastSavedSettings.current) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await updateGlobalGameSettings(settings);
        lastSavedSettings.current = currentSettingsStr;
        success(t('settings.saved', '设置已保存'));
      } catch (e) {
        const msg = getErrorMessage(e);
        notifyError(t('settings.saveFailed', '保存设置失败'), msg);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [settings]);

  return (
    <Page className="flex-1 overflow-y-auto px-6 pt-6">
      <PageSection>
          <div className="max-w-4xl mx-auto space-y-6">
            <SettingsPanel label={t('gameSettings.title', '全局游戏设置')}>
              {/* Java 配置 */}
              <SettingsPanel.Item>
                <SettingsPanel.Sub
                  label={t('settings.java.title', 'Java 配置')}
                >
                  <div className="overflow-hidden">
                    <SettingsPanel.DropDown
                      label={t('settings.java.path', '游戏 Java')}
                      options={javaOptions}
                      value={selectedJavaOption}
                      onSelect={handleJavaSelect}
                      buttonWidth="w-full"
                    />

                    <SettingsPanel.Input
                      label={t('settings.java.custom', '自定义')}
                      value={settings.java_path || ''}
                      onChange={(value) => updateSetting('java_path', value)}
                      placeholder={t('settings.java.pathPlaceholder', 'Java 可执行文件路径 (java.exe)')}
                      disabled={false}
                      onBrowse={handleBrowseJava}
                    />
                  </div>
                </SettingsPanel.Sub>
              </SettingsPanel.Item>

              {/* 内存分配 */}
              <SettingsPanel.Item>
                <SettingsPanel.Sub
                  label='游戏内存'
                  gap='10px'
                >
                  {/* 自动分配开关 */}
                  <SettingsPanel.CheckSwitch
                    checked={autoMemory}
                    onChange={handleAutoMemoryChange}
                    label={t('settings.memoryAuto', '自动分配内存')}
                    disabled={false}
                    className='mt-3'
                  />

                  {/* 内存分配滑块（-Xmx，启动实际使用的最大堆内存）；最低内存仅做展示/随动，不参与启动 */}
                  {!autoMemory && (
                    <Slider
                      value={settings.max_memory || 2048}
                      min={512}
                      max={systemMemory || 16384}
                      step={256}
                      onChange={(v) => {
                        updateSetting('max_memory', v);
                        if (Math.min(settings.min_memory ?? 1024, v) !== (settings.min_memory ?? 1024)) {
                          updateSetting('min_memory', v);
                        }
                      }}
                      label={t('settings.memoryDesc', '分配给游戏的最大内存')}
                      unit="MB"
                      fillColor={getPartitionColor({ level: 2 })}
                      clampMax={systemMemory || 16384}
                      disabled={false}
                    />
                  )}

                  {/* 分区条：已用内存占全内存份额，游戏分配占剩余可用份额，余量最浅色 */}
                  <PartitionBar
                    parts={[
                      {
                        label: t('settings.memoryUsed', '已使用内存'),
                        value: usedMemory,
                        dataText: `${formatMemory(usedMemory)} / ${formatMemory(systemMemory)}`,
                        level: 1,
                      },
                      {
                        label: t('settings.memoryGameAlloc', '游戏分配'),
                        value: gameMemory,
                        dataText: gapMemory === 0
                          ? `${formatMemory(settings.max_memory ? settings.max_memory : -1)}（${t('settings.memoryAvailable', '可用')} ${formatMemory(availMemory)}）`
                          : formatMemory(gameMemory),
                        level: 2,
                      },
                      ...(gapMemory > 0
                        ? [{ label: '', value: gapMemory, level: 3 }]
                        : []),
                    ]}
                    className='mb-3'
                  />
                </SettingsPanel.Sub>
              </SettingsPanel.Item>

              {/* 窗口配置 */}
              <SettingsPanel.Item>
                <SettingsPanel.Sub
                  label={t('settings.window.title', '窗口配置')}
                  gap='6px'
                >
                  <SettingsPanel.Row
                    label='分辨率'
                  >
                    <SettingsPanel.DropDown
                      label={''}
                      options={resolutionOptionsWithCurrent}
                      value={resolutionOptionsWithCurrent.find((o) => o.id === currentResolution)}
                      onSelect={(option) => {
                        const [width, height] = option.id.split('x').map(Number);
                        updateSetting('width', width);
                        updateSetting('height', height);
                      }}
                      disabled={settings.fullscreen}
                    />

                    <SettingsPanel.CheckSwitch
                      checked={settings.fullscreen || false}
                      onChange={(checked) => updateSetting('fullscreen', checked)}
                      label={t('settings.window.fullscreen', '全屏')}
                      disabled={false}
                    />
                  </SettingsPanel.Row>

                  <SettingsPanel.Row
                    label={t('settings.advanced.launcherVisible', '启动器可见性')}
                    description={t('settings.advanced.launcherVisibleDesc', '启动游戏后是否显示启动器窗口')}
                  >
                    <Toggle
                      checked={settings.launcher_visible ?? true}
                      onChange={(checked) => updateSetting('launcher_visible', checked)}
                      disabled={false}
                      hoverable={false}
                      bgHidden
                      variant="item"
                    />
                  </SettingsPanel.Row>
                </SettingsPanel.Sub>
              </SettingsPanel.Item>
            </SettingsPanel>
          </div>
        </PageSection>
    </Page>
  );
};

export default GlobalGameSettings;