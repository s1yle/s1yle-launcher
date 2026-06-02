import { UIMode, useUIModeStore } from '../stores/uiModeStore';
import TerminalThemePreview from '../components/common/TerminalThemePreview';
import { Toggle } from '../components/common';
import { SettingsPanel } from '@/components/common/SettingsPanel/SettingPanel';
import { useState } from 'react';
import DropDown from '@/components/common/DropDown';
import { useFontSizeStore, fontScaleConfig, type FontScale } from '@/stores/fontSizeStore';

const Settings = () => {
  const { mode: uiMode, setMode: setUIMode, animation, setAnimation } = useUIModeStore();
  const [isCompat, setIsCompat] = useState(true)
  const fontScale = useFontSizeStore((s) => s.fontScale);
  const setFontScale = useFontSizeStore((s) => s.setFontScale);

  const handleAnimationSetting = () => {
    setAnimation({ enabled: !animation.enabled });
  }

  const handleFontScaleSelect = (option: { id: string; label: string }) => {
    const value = fontScaleConfig.fromId(option.id);
    setFontScale(value);
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

        <SettingsPanel.Sub label='字体大小'>
          <DropDown
            options={fontScaleConfig.options}
            value={fontScaleConfig.options.find(
              o => o.id === fontScaleConfig.toId(fontScale)
            )}
            onSelect={handleFontScaleSelect}
            buttonWidth='w-xs'
          />
        </SettingsPanel.Sub>
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
