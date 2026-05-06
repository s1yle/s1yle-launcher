import { useTranslation } from 'react-i18next';
import { useThemeStore, themePresets } from '../stores/themeStore';
import ThemePreview, { AccentColorPicker } from '../components/common/ThemePreview';

const Settings = () => {
  const { t } = useTranslation();
  const {
    mode,
    accentColor,
    setAccentColor,
    applyPreset,
  } = useThemeStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">

        <div className="bg-surface backdrop-blur-sm rounded-xl p-8 border border-border">
          {/* 主题设置 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{t('theme.title')}</h2>

            {/* 预设模板 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t('theme.preset.title')}</h3>
              <div className="grid grid-cols-2 gap-4">
                {themePresets.map((preset) => (
                  <ThemePreview
                    key={preset.id}
                    preset={preset}
                    selected={mode === preset.mode}
                    onSelect={() => applyPreset(preset)}
                  />
                ))}
              </div>
            </div>

            {/* 强调色 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t('theme.accent.title')}</h3>
              <AccentColorPicker selected={accentColor} onSelect={setAccentColor} />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Settings;
