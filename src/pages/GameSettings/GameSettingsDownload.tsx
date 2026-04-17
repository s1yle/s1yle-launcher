import { useTranslation } from 'react-i18next';

const GameSettingsDownload = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-text-primary mb-6 text-center">
          {t('gameSettings.download', '下载')}
        </h1>
        <p className="text-lg text-text-secondary text-center mb-8">
          {t('gameSettings.downloadDesc', '配置下载源和并发参数')}
        </p>
        <div className="bg-surface backdrop-blur-sm rounded-xl p-8 border border-border">
          <p className="text-text-tertiary text-center">功能开发中...</p>
        </div>
      </div>
    </div>
  );
};

export default GameSettingsDownload;
