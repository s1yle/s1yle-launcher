import { useTranslation } from 'react-i18next';
import { useThemeStore, themePresets, type BlurIntensity, type Density } from '../stores/themeStore';
import ThemePreview, { AccentColorPicker } from '../components/common/ThemePreview';


const Settings = () => {
  const { t } = useTranslation();
  const {
    mode,
    accentColor, setAccentColor,
    blurIntensity, setBlurIntensity,
    density, setDensity,
    applyPreset,
  } = useThemeStore();

  const blurOptions: { value: BlurIntensity; label: string }[] = [
    { value: 'none', label: t('theme.blur.none') },
    { value: 'low', label: t('theme.blur.low') },
    { value: 'medium', label: t('theme.blur.medium') },
    { value: 'high', label: t('theme.blur.high') },
  ];

  const densityOptions: { value: Density; label: string }[] = [
    { value: 'compact', label: t('theme.density.compact') },
    { value: 'normal', label: t('theme.density.normal') },
    { value: 'spacious', label: t('theme.density.spacious') },
  ];

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-text-primary mb-6 text-center">{t('settings.title')}</h1>
        <p className="text-lg text-text-secondary text-center mb-8">{t('settings.description', '配置MC启动器参数和系统设置')}</p>

        <div className="bg-surface backdrop-blur-sm rounded-xl p-8 border border-border">
          {/* 主题设置 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{t('theme.title')}</h2>

            {/* 预设模板 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t('theme.preset.title')}</h3>
              <div className="grid grid-cols-3 gap-4">
                {themePresets.map((preset) => (
                  <ThemePreview
                    key={preset.id}
                    preset={preset}
                    selected={mode === preset.mode && accentColor === preset.accentColor}
                    onSelect={() => applyPreset(preset)}
                  />
                ))}
                <div className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center h-full min-h-[140px] text-text-tertiary">
                  <span className="text-sm">{t('theme.custom', '自定义')}</span>
                </div>
              </div>
            </div>

            {/* 强调色 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t('theme.accent.title')}</h3>
              <AccentColorPicker selected={accentColor} onSelect={setAccentColor} />
            </div>

            {/* 模糊强度 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t('theme.blur.title')}</h3>
              <div className="flex gap-2">
                {blurOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBlurIntensity(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      blurIntensity === opt.value
                        ? 'bg-primary text-text-primary'
                        : 'bg-surface text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 界面密度 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t('theme.density.title')}</h3>
              <div className="flex gap-2">
                {densityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDensity(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      density === opt.value
                        ? 'bg-primary text-text-primary'
                        : 'bg-surface text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 常规设置 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{t('settings.general', '常规设置')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-text-primary font-medium">{t('settings.language')}</label>
                <select className="w-full p-3 bg-surface border border-border rounded-lg text-text-primary">
                  {languageOptions.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-medium">{t('settings.javaPath')}</label>
                <input
                  type="text"
                  placeholder={t('settings.javaPathPlaceholder', '自动检测')}
                  className="w-full p-3 bg-surface border border-border rounded-lg text-text-primary placeholder-text-tertiary"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-primary">{t('settings.autoStart', '开机自动启动')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-toggle-track peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-primary">{t('settings.checkUpdate', '检查更新')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-toggle-track peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 游戏设置 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{t('settings.game', '游戏设置')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-text-primary font-medium">{t('settings.memory')}</label>
                <input
                  type="range"
                  min="1024"
                  max="8192"
                  step="512"
                  defaultValue="4096"
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-text-tertiary">
                  <span>1GB</span>
                  <span>4GB</span>
                  <span>8GB</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-medium">{t('settings.windowSize')}</label>
                <select className="w-full p-3 bg-surface border border-border rounded-lg text-text-primary">
                  <option value="auto">{t('settings.autoFit', '自动适配')}</option>
                  <option value="800x600">800 × 600</option>
                  <option value="1024x768">1024 × 768</option>
                  <option value="1280x720">1280 × 720</option>
                  <option value="1920x1080">1920 × 1080</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-primary">{t('settings.gameLog', '启用游戏日志')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-toggle-track peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-primary">{t('settings.showFPS', '显示FPS')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-toggle-track peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 按钮区域 */}
          <div className="mt-8 pt-8 border-t border-border flex justify-end gap-4">
            <button className="px-6 py-3 bg-surface hover:bg-surface-hover text-text-primary font-medium rounded-lg transition-colors">
              {t('settings.reset', '恢复默认')}
            </button>
            <button className="px-6 py-3 bg-primary hover:bg-primary-hover text-text-primary font-medium rounded-lg transition-colors">
              {t('settings.save', '保存设置')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
