import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/stores/gameStore';
import { useSafeNavigate } from '@/router/navigation';
import { updateGameSettings, updateGlobalGameSettings, GameSettings } from '@/helper/rustInvoke';
import { SettingsPanel, Toggle, Slider, useNotification, Page, PageSection } from '@/components/common';
import PartitionBar, { getPartitionColor } from '@/components/common/PartitionBar';
import { useRouteParams } from '@/router/routeParams';
import { useGameSettingsForm, formatMemory } from '@/hooks/useGameSettingsForm';
import { useRouteData } from '@/router/routeData';
import { getErrorMessage } from '@/utils/errorUtils';

/** 游戏游戏设置页面 - Java 配置、内存分配、窗口设置 */
const GameGameSettings = () => {
  const { t } = useTranslation();
  const { gameId } = useRouteParams();
  const safeNavigate = useSafeNavigate();
  const setSelectedGame = useGameStore(s => s.setSelectedGame);
  const getGame = useGameStore(s => s.getGame);
  const games = useGameStore(s => s.games);
  const { success, error: notifyError } = useNotification();

  const initialData = useRouteData<{ loaded: GameSettings; global: GameSettings }>()
    ?? { loaded: {}, global: {} };

  // 全局游戏设置（独立设置关闭时展示/编辑的就是它，对所有游戏生效）
  const [globalSettings, setGlobalSettings] = useState<GameSettings>(initialData.global);
  // 游戏独立设置（仅对当前游戏生效；第一次打开时由全局复制而来，之后保留不再覆盖）
  const [gameSettings, setGameSettings] = useState<GameSettings>(initialData.loaded);
  // 是否启用游戏独立设置
  const [useGameSettings, setUseGameSettings] = useState(initialData.loaded.use_game_settings || false);
  // 独立设置是否已初始化（第一次打开时从全局复制，之后保留）
  const independentInitializedRef = useRef(initialData.loaded.use_game_settings || false);
  // 自动分配内存开关（显式状态，避免写入推荐值后开关自动弹回）
  const [autoMemory, setAutoMemory] = useState(
    initialData.loaded.use_game_settings
      ? !initialData.loaded.min_memory && !initialData.loaded.max_memory
      : !initialData.global.min_memory && !initialData.global.max_memory
  );

  const isInitialLoad = useRef(true);
  const lastSavedSettings = useRef<string>(
    JSON.stringify(initialData.loaded.use_game_settings ? initialData.loaded : initialData.global)
  );

  const game = gameId ? getGame(gameId) : null;

  // 当前展示/编辑的设置：独立设置开启时编辑游戏独立值，关闭时编辑全局值
  const settings: GameSettings = useGameSettings ? gameSettings : globalSettings;

  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    // 编辑当前激活的设置：独立设置开启时改游戏独立值，否则改全局值
    if (useGameSettings) {
      setGameSettings(prev => ({ ...prev, [key]: value }));
    } else {
      setGlobalSettings(prev => ({ ...prev, [key]: value }));
    }
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

  useEffect(() => {
    if (gameId) {
      const inst = getGame(gameId);
      if (inst) {
        setSelectedGame(gameId);
      } else {
        safeNavigate('/game-list');
      }
    }
  }, [gameId]);

  // 保存设置（防抖）- 仅在用户修改后保存当前激活的设置
  useEffect(() => {
    if (!game || isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // 仅保存当前激活的设置（独立 or 全局）
    const active = useGameSettings ? gameSettings : globalSettings;
    const currentSettingsStr = JSON.stringify(active);
    if (currentSettingsStr === lastSavedSettings.current) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        if (useGameSettings) {
          await updateGameSettings(game.name, { ...active, use_game_settings: true });
        } else {
          await updateGlobalGameSettings(active);
        }
        lastSavedSettings.current = currentSettingsStr;
        success(t('settings.saved', '设置已保存'));
      } catch (e) {
        const msg = getErrorMessage(e);
        notifyError(t('settings.saveFailed', '保存设置失败'), msg);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [game?.id, gameSettings, globalSettings, useGameSettings]);

  // 显示游戏列表为空
  if (!games || games.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary">
        {t('games.noGames', '暂无游戏，请先添加游戏')}
      </div>
    );
  }

  // 显示未选择游戏
  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary">
        {t('gameInfo.selectGame', '请在侧边栏选择游戏')}
      </div>
    );
  }

  // 切换“使用游戏独立设置”
  // - 第一次打开：以当前全局设置为基线覆盖游戏独立值
  // - 关闭：保留游戏独立值（不清理），仅切回全局
  // - 后续打开：沿用上次保留的独立值，不再从全局覆盖
  const handleUseGameSettingsChange = async (checked: boolean) => {
    try {
      if (checked) {
        let next: GameSettings;
        if (!independentInitializedRef.current) {
          next = { ...globalSettings, use_game_settings: true };
          independentInitializedRef.current = true;
        } else {
          next = { ...gameSettings, use_game_settings: true };
        }
        setGameSettings(next);
        setUseGameSettings(true);
        lastSavedSettings.current = JSON.stringify(next);
        await updateGameSettings(game.name, next);
      } else {
        setUseGameSettings(false);
        lastSavedSettings.current = JSON.stringify(globalSettings);
        await updateGameSettings(game.name, { ...gameSettings, use_game_settings: false });
      }
    } catch (e) {
      const msg = getErrorMessage(e);
      notifyError(t('settings.saveFailed', '保存设置失败'), msg);
    }
  };

  return (
    <Page className="flex-1 overflow-y-auto px-6 pt-6">
      <PageSection>
        <div className="max-w-4xl mx-auto space-y-6">
          <SettingsPanel
            label={'基础设置 - ' + game.name}
          >
          <Toggle
            label={t('settings.useGameSettings', '使用游戏独立设置')}
            bgHidden
            checked={useGameSettings}
            onChange={handleUseGameSettingsChange}
            disabled={false}
          />

          {/* 基础设置 */}
          <SettingsPanel.Item>

            {/* Java 配置 */}
            <SettingsPanel.Sub
              label={t('settings.java.title', 'Java 配置')}
              disabled={!useGameSettings}
            >

              {/* Java 路径选择 */}
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
              disabled={!useGameSettings}
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
                    // 分配占满可用内存时（gap 为 0）才展示"（可用 X GB）"后缀
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

          <SettingsPanel.Item>
            {/* 窗口配置 */}
            <SettingsPanel.Sub
              label={t('settings.window.title', '窗口配置')}
              disabled={!useGameSettings}
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

export default GameGameSettings;
