import { useTranslation } from 'react-i18next';

const GameSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-text-primary mb-6 text-center">
          {t('gameSettings.title', '全局游戏设置')}
        </h1>
        <p className="text-lg text-text-secondary text-center mb-8">
          {t('gameSettings.subtitle', '配置所有游戏实例的默认参数')}
        </p>

        <div className="bg-surface backdrop-blur-sm rounded-xl p-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                {t('gameSettings.java', 'Java 设置')}
              </h2>

              <div className="space-y-2">
                <label className="text-text-primary font-medium">
                  {t('gameSettings.javaPath', 'Java 路径')}
                </label>
                <input
                  type="text"
                  placeholder={t('gameSettings.javaPathPlaceholder', '自动检测')}
                  className="w-full p-3 bg-surface-active border border-border rounded-lg text-text-primary placeholder-text-tertiary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-medium">
                  {t('gameSettings.javaArgs', 'JVM 参数')}
                </label>
                <textarea
                  rows={3}
                  placeholder="-Xmx4G -Xms2G"
                  className="w-full p-3 bg-surface-active border border-border rounded-lg text-text-primary placeholder-text-tertiary resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                {t('gameSettings.window', '窗口设置')}
              </h2>

              <div className="space-y-2">
                <label className="text-text-primary font-medium">
                  {t('gameSettings.windowSize', '窗口尺寸')}
                </label>
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

          <div className="mt-8 pt-8 border-t border-border flex justify-end gap-4">
            <button className="px-6 py-3 bg-surface hover:bg-surface-hover text-text-primary font-medium rounded-lg transition-colors">
              {t('gameSettings.reset', '恢复默认')}
            </button>
            <button className="px-6 py-3 bg-primary hover:bg-primary-hover text-text-primary font-medium rounded-lg transition-colors">
              {t('gameSettings.save', '保存设置')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
