import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/stores/gameStore';
import { logger } from '@/helper/logger';
import { useSafeNavigate } from '@/router/navigation';
import { getGameSettings, updateGameSettings, getGlobalGameSettings, updateGlobalGameSettings, GameSettings, selectJavaPath, scanJavaInstallations, JavaInstallation, getMemoryUsage, getDisplayResolutions } from '@/helper/rustInvoke';
import { SettingsPanel, Toggle, Slider, useNotification, Page, PageSection } from '@/components/common';
import PartitionBar, { getPartitionColor } from '@/components/common/PartitionBar';
import { DropDownOption } from '@/components/common/DropDown';
import { useRouteParams } from '@/router/routeParams';

/** 游戏游戏设置页面 - Java 配置、内存分配、窗口设置 */
const GameGameSettings = () => {
  const { t } = useTranslation();
  const { gameId } = useRouteParams();
  const safeNavigate = useSafeNavigate();
  const setSelectedGame = useGameStore(s => s.setSelectedGame);
  const getGame = useGameStore(s => s.getGame);
  const storeLoading = useGameStore(s => s.loading);
  const games = useGameStore(s => s.games);
  const { success, error: notifyError } = useNotification();

  const [settings, setSettings] = useState<GameSettings>({});
  // 全局游戏设置（未启用独立设置时，界面展示/编辑的就是它，对所有游戏生效）
  const [globalSettings, setGlobalSettings] = useState<GameSettings>({});
  // 游戏独立设置原始值（加载时拉取；切换开关时作为恢复基线）
  const gameSettingsRef = useRef<GameSettings>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [javaPaths, setJavaPaths] = useState<JavaInstallation[]>([]);
  const [systemMemory, setSystemMemory] = useState(0);
  const [usedMemory, setUsedMemory] = useState(0);
  // 自动分配内存开关（显式状态，避免写入推荐值后开关自动弹回）
  const [autoMemory, setAutoMemory] = useState(false);
  // 显示器真实分辨率列表（Rust get_display_resolutions）
  const [displayResolutions, setDisplayResolutions] = useState<string[]>([]);

  const isInitialLoad = useRef(true);
  const lastSavedSettings = useRef<string>('');

  const game = gameId ? getGame(gameId) : null;

  // 分辨率选项：真实显示器模式 + 常用预设兜底（去重，保持顺序）
  // 注意：useMemo 必须与其它 hooks 一起置于提前 return 之前
  const resolutionOptions: DropDownOption[] = useMemo(() => {
    const presets = ['854x480', '1280x720', '1920x1080', '2560x1440', '3840x2160'];
    const merged = [...new Set([...displayResolutions, ...presets])];
    return merged.map((res) => ({ id: res, label: res }));
  }, [displayResolutions]);

  const currentResolution = settings.width && settings.height
    ? `${settings.width}x${settings.height}`
    : '1280x720';

  // 当前值不在选项内（自定义分辨率）时动态并入，保证下拉显示当前值
  const resolutionOptionsWithCurrent = useMemo(() => {
    if (resolutionOptions.some((o) => o.id === currentResolution)) {
      return resolutionOptions;
    }
    return [{ id: currentResolution, label: currentResolution }, ...resolutionOptions];
  }, [resolutionOptions, currentResolution]);

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

  // 加载游戏设置
  useEffect(() => {
    if (!game) return;

    const loadSettings = async () => {
      try {
        setSettingsLoading(true);
        const [loadedSettings, global] = await Promise.all([
          getGameSettings(game.name),
          getGlobalGameSettings(),
        ]);
        console.log('[GameSettings] Loaded settings:', loadedSettings);
        console.log('[GameSettings] Global settings:', global);
        setGlobalSettings(global);
        gameSettingsRef.current = loadedSettings;

        // 未启用独立设置 → 界面展示/编辑全局设置；启用 → 展示/编辑游戏独立设置
        const merged = loadedSettings.use_game_settings
          ? { ...loadedSettings }
          : { ...global, use_game_settings: false };

        setSettings(merged);
        lastSavedSettings.current = JSON.stringify(merged);
        isInitialLoad.current = true;
        // 开关状态与持久化配置同步（无 min/max 即自动分配中）
        setAutoMemory(!merged.min_memory && !merged.max_memory);

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
  }, [game?.id]);

  // 加载显示器真实分辨率（失败静默，保留预设兜底）
  useEffect(() => {
    getDisplayResolutions().then(setDisplayResolutions).catch(console.error);
  }, []);

  // 轮询真实内存使用（1s），数据来自 Rust get_memory_usage
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const [used, total] = await getMemoryUsage();
        if (cancelled || total === 0) return;
        setUsedMemory(used);
        setSystemMemory(total);
      } catch (e) {
        console.error('[GameSettings] memory refresh failed:', e);
      }
    };
    refresh();
    const timer = setInterval(refresh, 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // 保存设置（防抖）- 仅在用户修改后保存
  useEffect(() => {
    if (!game || settingsLoading || isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const currentSettingsStr = JSON.stringify(settings);
    if (currentSettingsStr === lastSavedSettings.current) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        console.log('[GameSettings] Saving settings:', settings);
        // 启用独立设置 → 保存到当前游戏；未启用 → 保存到全局设置
        if (settings.use_game_settings) {
          await updateGameSettings(game.name, settings);
        } else {
          await updateGlobalGameSettings(settings);
        }
        lastSavedSettings.current = currentSettingsStr;
        success(t('settings.saved', '设置已保存'));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        notifyError(t('settings.saveFailed', '保存设置失败'), msg);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [game?.id, settings, settingsLoading]);

  // 显示加载状态
  if (storeLoading || settingsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-tertiary">
          {t('common.loading', '加载中...')}
        </div>
      </div>
    );
  }

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

  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    console.log('[GameSettings] Update setting:', key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // 切换“使用游戏独立设置”
  // - 启用：以全局设置（或此前已保存的独立设置）为基线赋给当前游戏并立即落盘
  // - 关闭：仅写回开关（保留已保存的独立值，再次启用时恢复）；界面上回到全局设置
  const handleUseGameSettingsChange = async (checked: boolean) => {
    try {
      if (checked) {
        const base = gameSettingsRef.current.use_game_settings
          ? { ...gameSettingsRef.current }
          : { ...globalSettings };
        const next = { ...base, use_game_settings: true };
        gameSettingsRef.current = next;
        setSettings(next);
        lastSavedSettings.current = JSON.stringify(next);
        await updateGameSettings(game.name, next);
      } else {
        setSettings({ ...globalSettings, use_game_settings: false });
        await updateGameSettings(game.name, { use_game_settings: false });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      notifyError(t('settings.saveFailed', '保存设置失败'), msg);
    }
  };

  // 内存自动分配开关（显式状态 state，加载时从配置同步）
  const handleAutoMemoryChange = (checked: boolean) => {
    setAutoMemory(checked);
    if (checked) {
      // 自动分配：把当前推荐值真正写入设置（防抖落盘），保证启动时使用的是实际分配值
      updateSetting('min_memory', 1024);
      updateSetting('max_memory', recommendedMemory);
    } else {
      updateSetting('min_memory', 1024);
      updateSetting('max_memory', 2048);
    }
  };

  const formatMemory = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

// PCL 语义：可用 = 总 - 已用；游戏分配 part 与滑块同源（max_memory = -Xmx，启动实际分配值），
  // 自动分配时实时展示: 剩余空隙 = total - (已用 + 游戏分配)
  const availMemory = Math.max(0, systemMemory - usedMemory);
  // HMCL 风格推荐值：可用内存 - 2G（系统/浏览器预留），下限 1G，上限不超总内存
  const recommendedMemory = Math.max(1024, Math.min(availMemory - 2048, systemMemory || 16384));
  const gameMemory = autoMemory
    ? Math.min(recommendedMemory, availMemory)
    : Math.min(settings.max_memory || 2048, availMemory);
  const gapMemory = Math.max(0, availMemory - gameMemory);

  // 扫描系统中已安装的 Java
  const scanCommonJavaPaths = async (): Promise<JavaInstallation[]> => {
    try {
      return await scanJavaInstallations();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn(`[GameSettings] 扫描 Java 失败: ${msg}`);
      return [];
    }
  };

  // DropDown 选项：自动选择 + 已扫描 Java + 当前自定义路径兜底
  const javaOptions: DropDownOption[] = [
    { id: 'auto', label: t('settings.java.auto', '自动选择合适的 Java') },
    ...javaPaths.map(java => ({
      id: java.path,
      label: `${java.version} (${java.vendor}${java.is_jdk ? ', JDK' : ''})`,
    })),
    ...(settings.java_path && !javaPaths.some(j => j.path === settings.java_path)
      ? [{ id: settings.java_path, label: settings.java_path }]
      : []),
  ];

  const selectedJavaOption = javaOptions.find(o => o.id === (settings.java_path || 'auto')) ?? javaOptions[0];

  const handleJavaSelect = (option: DropDownOption) => {
    if (option.id === 'auto') {
      updateSetting('java_path', undefined);
    } else {
      updateSetting('java_path', option.id);
    }
  };

  const handleBrowseJava = async () => {
    try {
      const path = await selectJavaPath();
      if (path) {
        updateSetting('java_path', path);
        const versionMatch = path.match(/java[-_]?(\d+)/i);
        const version = versionMatch ? `Java ${versionMatch[1]}` : 'Unknown';
        setJavaPaths(prev => [...prev, { path, version, vendor: '手动添加', is_jdk: true }]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      notifyError(t('settings.java.selectFailed', '选择 Java 路径失败'), msg);
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
            checked={settings.use_game_settings || false}
            onChange={handleUseGameSettingsChange}
            disabled={settingsLoading}
          />
          <p className="text-xs text-text-tertiary px-4 pb-2">
            {t('settings.useGameSettingsDesc', '未启用时，修改将应用于所有游戏（全局设置）；启用后，以下设置将仅应用于当前游戏')}
          </p>

          {/* 基础设置 */}
          <SettingsPanel.Item
          // label={t('settings.useGameSettings', '启用游戏特定游戏设置')}
          // description={t('settings.useGameSettingsDesc', '启用后，以下设置将仅应用于当前游戏，不影响其他游戏。未启用时使用全局默认配置')}
          >

            {/* Java 配置 */}
            <SettingsPanel.Sub
              label={t('settings.java.title', 'Java 配置')}
              disabled={!settings.use_game_settings}
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
                  disabled={settingsLoading}
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
              disabled={!settings.use_game_settings}
            >

              {/* 自动分配开关 */}
              <SettingsPanel.CheckSwitch
                checked={autoMemory}
                onChange={handleAutoMemoryChange}
                label={t('settings.memoryAuto', '自动分配内存')}
                disabled={settingsLoading}
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
                  disabled={settingsLoading}
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
              disabled={!settings.use_game_settings}
              gap='6px'
            >
              <SettingsPanel.Row
                label='分辨率'
              >
                <SettingsPanel.DropDown
                  // label={t('settings.window.resolution', '游戏窗口分辨率')}
                  label={''}
                  options={resolutionOptionsWithCurrent}
                  value={resolutionOptionsWithCurrent.find((o) => o.id === currentResolution)}
                  onSelect={(option) => {
                    const [width, height] = option.id.split('x').map(Number);
                    updateSetting('width', width);
                    updateSetting('height', height);
                  }}
                  disabled={settingsLoading || settings.fullscreen}
                />

                <SettingsPanel.CheckSwitch
                  checked={settings.fullscreen || false}
                  onChange={(checked) => updateSetting('fullscreen', checked)}
                  label={t('settings.window.fullscreen', '全屏')}
                  disabled={settingsLoading}
                />
              </SettingsPanel.Row>

              <SettingsPanel.Row
                label={t('settings.advanced.launcherVisible', '启动器可见性')}
                description={t('settings.advanced.launcherVisibleDesc', '启动游戏后是否显示启动器窗口')}
              >
                <Toggle
                  checked={settings.launcher_visible ?? true}
                  onChange={(checked) => updateSetting('launcher_visible', checked)}
                  disabled={settingsLoading}
                  hoverable={false}
                  bgHidden
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
