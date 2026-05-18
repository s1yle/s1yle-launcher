import { useTranslation } from 'react-i18next';
import { useThemeStore, themePresets } from '../stores/themeStore';
import { useUIModeStore } from '../stores/uiModeStore';
import ThemePreview, { AccentColorPicker } from '../components/common/ThemePreview';
import TerminalThemePreview from '../components/common/TerminalThemePreview';

const Settings = () => {
  const { t } = useTranslation();
  const {
    mode,
    accentColor,
    setAccentColor,
    applyPreset,
  } = useThemeStore();
  
  const { mode: uiMode, setMode: setUIMode } = useUIModeStore();

  // 分离普通主题和终端主题
  const normalPresets = themePresets.filter(p => !p.terminalTheme);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">

        <div className="bg-surface backdrop-blur-sm rounded-xl p-8 border border-border">
          {/* UI 模式设置 */}
          <div className="mb-8 pb-8 border-b border-border">
            <h2 className="text-2xl font-bold text-text-primary mb-6">界面模式</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setUIMode('island')}
                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-200
                  ${uiMode === 'island'
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center
                    ${uiMode === 'island' ? 'bg-primary/20' : 'bg-surface-hover'}
                  `}>
                    <span className="text-2xl">🏝️</span>
                  </div>
                  <h3 className="font-semibold text-text-primary">灵动岛模式</h3>
                  <p className="text-xs text-text-secondary text-center">
                    现代化悬浮导航，简洁高效
                  </p>
                </div>
                {uiMode === 'island' && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setUIMode('classic')}
                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-200
                  ${uiMode === 'classic'
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center
                    ${uiMode === 'classic' ? 'bg-primary/20' : 'bg-surface-hover'}
                  `}>
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="font-semibold text-text-primary">经典模式</h3>
                  <p className="text-xs text-text-secondary text-center">
                    传统侧边栏布局，功能完整
                  </p>
                </div>
                {uiMode === 'classic' && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 主题设置 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{t('theme.title')}</h2>

            {/* 预设模板 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t('theme.preset.title')}</h3>
              <div className="grid grid-cols-2 gap-4">
                {normalPresets.map((preset) => (
                  <ThemePreview
                    key={preset.id}
                    preset={preset}
                    selected={mode === preset.mode && !useThemeStore.getState().terminalTheme}
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

          {/* 极客终端风格（新功能） */}
          <div className="border-t border-border pt-8">
            <TerminalThemePreview />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
