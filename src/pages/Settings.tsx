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

          {/* 页面切换动画设置 */}
          <div className="mb-8 pb-8 border-b border-border">
            <h2 className="text-2xl font-bold text-text-primary mb-6">页面切换动画</h2>
            
            <div className="space-y-4">
              {/* 启用/禁用动画 */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-hover">
                <div className="flex flex-col gap-1">
                  <span className="text-text-primary font-medium">启用动画</span>
                  <span className="text-xs text-text-secondary">页面切换时播放过渡动画</span>
                </div>
                <Toggle
                  checked={animation.enabled}
                  onChange={(checked) => setAnimation({ ...animation, enabled: checked })}
                />
              </div>

              {/* 动画方向选择 */}
              {animation.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAnimation({ ...animation, direction: 'slide-up' })}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all duration-200
                      ${animation.direction === 'slide-up'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-text-primary">从下往上</span>
                      <span className="text-xs text-text-secondary">页面向上滑入</span>
                    </div>
                    {animation.direction === 'slide-up' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setAnimation({ ...animation, direction: 'slide-down' })}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all duration-200
                      ${animation.direction === 'slide-down'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-text-primary">从上往下</span>
                      <span className="text-xs text-text-secondary">页面向下滑入</span>
                    </div>
                    {animation.direction === 'slide-down' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              )}
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
