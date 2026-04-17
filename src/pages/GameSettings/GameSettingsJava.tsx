import { useTranslation } from 'react-i18next';

const GameSettingsJava = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-text-primary mb-6 text-center">
          {t('gameSettings.java', 'Java 管理')}
        </h1>
        <p className="text-lg text-text-secondary text-center mb-8">
          {t('gameSettings.javaDesc', '配置 Java 运行时路径和 JVM 参数')}
        </p>
        <div className="bg-surface backdrop-blur-sm rounded-xl p-8 border border-border">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-text-primary font-medium">{t('gameSettings.javaPath', 'Java 路径')}</label>
              <input type="text" placeholder={t('gameSettings.javaPathPlaceholder', '自动检测')} className="w-full p-3 bg-surface-active border border-border rounded-lg text-text-primary placeholder-text-tertiary" />
            </div>
            <div className="space-y-2">
              <label className="text-text-primary font-medium">{t('gameSettings.javaArgs', 'JVM 参数')}</label>
              <textarea rows={3} placeholder="-Xmx4G -Xms2G" className="w-full p-3 bg-surface-active border border-border rounded-lg text-text-primary placeholder-text-tertiary resize-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSettingsJava;
