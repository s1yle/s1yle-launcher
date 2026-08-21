import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/stores/gameStore';
import { useSafeNavigate } from '@/router/navigation';
import { updateGameSettings, updateGlobalGameSettings, GameSettings } from '@/helper/rustInvoke';
import { SettingsPanel, Toggle, GameSettingsSections, useNotification, Page, PageSection } from '@/components/common';
import { useRouteParams } from '@/router/routeParams';
import { useGameSettingsForm } from '@/hooks/useGameSettingsForm';
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

  const form = useGameSettingsForm({
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

          <GameSettingsSections
            form={form}
            settings={settings}
            updateSetting={updateSetting}
            autoMemory={autoMemory}
            disabled={!useGameSettings}
          />

        </SettingsPanel>

        </div>
      </PageSection>
    </Page>
  );
};

export default GameGameSettings;
