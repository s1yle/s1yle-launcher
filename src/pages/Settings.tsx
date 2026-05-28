import { ThemePreset, useThemeStore } from '../stores/themeStore';
import { AnimationConfig, UIMode, useUIModeStore } from '../stores/uiModeStore';
import TerminalThemePreview from '../components/common/TerminalThemePreview';
import { Toggle, VersionFilterDropdown } from '../components/common';
import { SettingsPanel } from '@/components/common/SettingsPanel/SettingPanel';
import { useState } from 'react';

const Settings = () => {
  const setAccentColor = useThemeStore((s) => s.setAccentColor);

  const { mode: uiMode, setMode: setUIMode, animation, setAnimation } = useUIModeStore();
  const [isCompat, setIsCompat] = useState(true)

  const handleAnimationSetting = () => {
    setAnimation({ enabled: !animation.enabled });
  }

  const handleThemeSelect = (preset: ThemePreset | undefined): void => {
    if (!preset) return;
    console.warn("切换相应主题色！", preset);
    // setAccentColor(preset.accentColor);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* UI 模式设置 */}
      <SettingsPanel
        label={"布局"}
      >
        {/* 条目 */}
        <Toggle
          checked={uiMode == UIMode.CLASSIC}
          onChange={(enabled) => setUIMode(enabled ? UIMode.CLASSIC : UIMode.ISLAND)}
          label='经典模式(classic)'
          disabled={false}
        />

        <Toggle
          checked={animation.enabled}
          onChange={handleAnimationSetting}
          label='开启页面动画'
          disabled={false}
        />
      </SettingsPanel>

      {/* 主题设置 */}
      <SettingsPanel
        label={"主题"}
      >
        {/* 条目 */}
        {/* 终端主题 */}
        <SettingsPanel.Item shouldLoad={true} >
          <SettingsPanel.Sub label='终端主题'>
            <SettingsPanel.Toggle
              checked={isCompat}
              onChange={(enabled) => { setIsCompat(enabled) }}
              label='简洁模式'
            />
            <TerminalThemePreview compact={isCompat} />
          </SettingsPanel.Sub>
        </SettingsPanel.Item>

      </SettingsPanel>


    </div >
  );
};

export default Settings;
