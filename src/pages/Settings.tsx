import { useTranslation } from 'react-i18next';
import { useThemeStore, themePresets } from '../stores/themeStore';
import { UIMode, useUIModeStore } from '../stores/uiModeStore';
import TerminalThemePreview from '../components/common/TerminalThemePreview';
import { Toggle } from '../components/common';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { SettingsPanel } from '@/components/SettingsPanel/SettingPanel';
import { useState } from 'react';

const Settings = () => {
  const { t } = useTranslation();
  const {
    mode,
    accentColor,
    setAccentColor,
    applyPreset,
  } = useThemeStore();

  const { mode: uiMode, setMode: setUIMode, animation, setAnimation } = useUIModeStore();

  const normalPresets = themePresets.filter(p => !p.terminalTheme);
  
  const [isCompat, setIsCompat] = useState(true)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* UI 模式设置 */}
      <SettingsPanel
        label={"布局"}
      >
        {/* 条目 */}
        <Toggle
          checked={uiMode == 'classic'}
          onChange={(enabled) => setUIMode(enabled ? 'classic' : 'island')}
          label='经典模式(classic)'
          disabled={false}
        />
      </SettingsPanel>

      {/* 主题设置 */}
      <SettingsPanel
        label={"主题"}
      >
        {/* 条目 */}
        {/* 终端主题 */}
        <SettingsPanel.Item hoverable={false}>
          <SettingsPanel.Sub label='终端主题'>
            <SettingsPanel.Toggle
              checked={isCompat}
              onChange={(enabled) => {setIsCompat(enabled)}}
              label='简洁模式'
            />
            <TerminalThemePreview compact={isCompat}/>
          </SettingsPanel.Sub>
        </SettingsPanel.Item>
        
      </SettingsPanel>


    </div>
  );
};

export default Settings;
