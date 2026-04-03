import { useTranslation } from 'react-i18next';

const GameSettingsAppearance = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-text-primary mb-6 text-center">
          {t('gameSettings.appearance', '外观')}
        </h1>
        <p className="text-lg text-text-secondary text-center mb-8">
          {t('gameSettings.appearanceDesc', '配置窗口外观和显示参数')}
        </p>
        <div className="bg-surface backdrop-blur-sm rounded-xl p-8 border border-border">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-text-primary font-medium">{t('gameSettings.windowSize', '窗口尺寸')}</label>
              <select className="w-full p-3 bg-surface-active border border-border rounded-lg text-text-primary">
                <option value="auto">{t('gameSettings.autoFit', '自动适配')}</option>
                <option value="800x600">800 × 600</option>
                <option value="1024x768">1024 × 768</option>
                <option value="1280x720">1280 × 720</option>
                <option value="1920x1080">1920 × 1080</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-primary">{t('gameSettings.fullscreen', '全屏启动')}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-toggle-track peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSettingsAppearance;
