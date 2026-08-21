import { useTranslation } from 'react-i18next';
import { SettingsPanel } from './SettingsPanel/SettingPanel';
import Toggle from './Toggle';
import { Slider } from './Slider';
import PartitionBar, { getPartitionColor } from './PartitionBar';
import { useGameSettingsForm, formatMemory } from '@/hooks/useGameSettingsForm';
import type { GameSettings } from '@/helper/rustInvoke';

/**
 * 游戏设置共用区块：Java 配置 / 内存分配 / 窗口配置。
 * 由「全局游戏设置」与「单游戏设置」两个页面复用，仅通过 `disabled` 区分可用态。
 */
export interface GameSettingsSectionsProps {
  /** useGameSettingsForm 的返回值（注入共享表单逻辑） */
  form: ReturnType<typeof useGameSettingsForm>;
  /** 当前正在编辑的设置对象 */
  settings: GameSettings;
  /** 更新当前编辑设置的单个字段 */
  updateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  /** 是否启用自动分配内存（由页面持有） */
  autoMemory: boolean;
  /** 是否禁用区块（单游戏设置关闭独立设置时使用） */
  disabled?: boolean;
}

const GameSettingsSections = ({
  form,
  settings,
  updateSetting,
  autoMemory,
  disabled = false,
}: GameSettingsSectionsProps) => {
  const { t } = useTranslation();
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
  } = form;

  return (
    <>
      {/* Java 配置 */}
      <SettingsPanel.Item>
        <SettingsPanel.Sub
          label={t('settings.java.title', 'Java 配置')}
          disabled={disabled}
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
          disabled={disabled}
        >
          <SettingsPanel.CheckSwitch
            checked={autoMemory}
            onChange={handleAutoMemoryChange}
            label={t('settings.memoryAuto', '自动分配内存')}
            disabled={false}
            className='mt-3'
          />

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
          disabled={disabled}
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
    </>
  );
};

export default GameSettingsSections;