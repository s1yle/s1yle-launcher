import { useTranslation } from 'react-i18next';
import { useThemeStore, themePresets } from '../stores/themeStore';
import { useUIModeStore } from '../stores/uiModeStore';
import ThemePreview, { AccentColorPicker } from '../components/common/ThemePreview';
import TerminalThemePreview from '../components/common/TerminalThemePreview';
import { Toggle } from '../components/common';

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* UI 模式设置 */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setUIMode('island')}
            className={`
              relative p-4 rounded-md transition-all cursor-pointer
              ${uiMode === 'island'
                ? 'shadow-separator bg-primary-subtle'
                : 'shadow-separator hover:shadow-separator-hover'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏝️</span>
              <div className="text-left">
                <div className="text-sm font-medium text-text-primary">灵动岛</div>
                <div className="text-xs text-text-secondary">悬浮导航</div>
              </div>
            </div>
            {uiMode === 'island' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          <button
            onClick={() => setUIMode('classic')}
            className={`
              relative p-4 rounded-md transition-all cursor-pointer
              ${uiMode === 'classic'
                ? 'shadow-separator bg-primary-subtle'
                : 'shadow-separator hover:shadow-separator-hover'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div className="text-left">
                <div className="text-sm font-medium text-text-primary">经典</div>
                <div className="text-xs text-text-secondary">侧边栏</div>
              </div>
            </div>
            {uiMode === 'classic' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </section>

      {/* 动画设置 */}
      <section className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-medium text-text-primary">动画</span>
          <Toggle
            checked={animation.enabled}
            onChange={(checked) => setAnimation({ ...animation, enabled: checked })}
          />
        </div>
        
        {animation.enabled && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setAnimation({ ...animation, direction: 'slide-up' })}
              className={`
                relative p-3 rounded-md transition-all cursor-pointer
                ${animation.direction === 'slide-up'
                  ? 'shadow-separator bg-primary-subtle'
                  : 'shadow-separator hover:shadow-separator-hover'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-primary-subtle flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-text-primary">从下往上</span>
              </div>
            </button>

            <button
              onClick={() => setAnimation({ ...animation, direction: 'slide-down' })}
              className={`
                relative p-3 rounded-md transition-all cursor-pointer
                ${animation.direction === 'slide-down'
                  ? 'shadow-separator bg-primary-subtle'
                  : 'shadow-separator hover:shadow-separator-hover'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-primary-subtle flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-text-primary">从上往下</span>
              </div>
            </button>
          </div>
        )}
      </section>

      {/* 主题设置 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-text-primary mb-3">{t('theme.title')}</h2>

        <div className="mb-4">
          <h3 className="text-xs text-text-secondary mb-2">{t('theme.preset.title')}</h3>
          <div className="grid grid-cols-2 gap-3">
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

        <div className="mb-4">
          <h3 className="text-xs text-text-secondary mb-2">{t('theme.accent.title')}</h3>
          <AccentColorPicker selected={accentColor} onSelect={setAccentColor} />
        </div>
      </section>

      {/* 终端主题 */}
      <section>
        <TerminalThemePreview />
      </section>
    </div>
  );
};

export default Settings;
