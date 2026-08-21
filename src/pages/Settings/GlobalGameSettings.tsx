import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  JavaInstallation,
  updateGlobalGameSettings,
  type GameSettings,
} from '@/helper/rustInvoke';
import { SettingsPanel, GameSettingsSections, useNotification, Page, PageSection } from '@/components/common';
import { useGameSettingsForm } from '@/hooks/useGameSettingsForm';
import { useRouteData } from '@/router/routeData';
import { getErrorMessage } from '@/utils/errorUtils';

/** 全局游戏设置页面 - 所有游戏共用的默认参数（Java、内存、窗口） */
const GlobalGameSettings = () => {
  const { t } = useTranslation();
  const { error: notifyError } = useNotification();

  const routeData = useRouteData<{ loaded: GameSettings; javas: JavaInstallation[] }>();
  const [settings, setSettings] = useState<GameSettings>(routeData?.loaded ?? {});
  // 自动分配内存开关（显式状态，避免写入推荐值后开关自动弹回）
  const [autoMemory, setAutoMemory] = useState(
    !routeData?.loaded?.min_memory && !routeData?.loaded?.max_memory
  );

  const isInitialLoad = useRef(true);
  const lastSavedSettings = useRef<string>(JSON.stringify(routeData?.loaded ?? {}));

  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const form = useGameSettingsForm({
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

    try {
      updateGlobalGameSettings(settings);
      lastSavedSettings.current = currentSettingsStr;
    } catch (e) {
      const msg = getErrorMessage(e);
      notifyError(t('settings.saveFailed', '保存设置失败'), msg);
    }
  }, [settings]);

  return (
    <Page className="flex-1 overflow-y-auto px-6 pt-6">
      <PageSection>
        <div className="max-w-4xl mx-auto space-y-6">
          <SettingsPanel label={t('gameSettings.title', '全局游戏设置')}>
            <GameSettingsSections
              form={form}
              settings={settings}
              updateSetting={updateSetting}
              autoMemory={autoMemory}
            />
          </SettingsPanel>
        </div>
      </PageSection>
    </Page>
  );
};

export default GlobalGameSettings;