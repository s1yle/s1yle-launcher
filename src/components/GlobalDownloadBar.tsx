import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { useDownloadStore } from '../stores/downloadStore';
import { getRouteConfigByPath } from '../router/config';
import { Z_INDEX } from '../utils/zIndex';

/**
 * 全局下载进度条 - 轻量替代浮动下载面板。
 * 有下载任务时在顶部居中显示聚合进度，点击跳转 /download/progress 查看详情。
 * 当前路由配置 hideGlobalDownloadBar 时隐藏（如下载进度页本身）。
 */
const GlobalDownloadBar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const downloadingVersions = useDownloadStore((s) => s.downloadingVersions);

  const activeList = useMemo(() => {
    return Array.from(downloadingVersions.values()).filter((v) => v.status === 'downloading');
  }, [downloadingVersions]);

  const totalProgress = useMemo(() => {
    if (activeList.length === 0) return 0;
    return activeList.reduce((acc, v) => acc + v.progress, 0) / activeList.length;
  }, [activeList]);

  const currentRoute = getRouteConfigByPath(location.pathname);
  if (currentRoute?.hideGlobalDownloadBar) return null;

  if (activeList.length === 0) return null;

  return (
    <button
      onClick={() => navigate('/download/progress')}
      className="fixed left-1/2 -translate-x-1/2 top-15 flex 
        items-center gap-3 rounded-full 
        border border-[var(--color-border)] bg-[var(--color-surface)]/90 
        backdrop-blur-md shadow-lg px-4 py-2 cursor-pointer 
        hover:bg-[var(--color-surface-hover)] transition-colors"
      style={{ zIndex: Z_INDEX.POPUP }}
      title={t('download.progressTitle')}
    >
      <Download className="w-4 h-4 text-[var(--color-primary)]" />
      <span className="text-xs font-medium text-[var(--color-text-primary)] select-none">
        {t('download.totalTasks', { count: activeList.length })} · {totalProgress.toFixed(1)}%
      </span>
      <div className="w-24 h-1.5 rounded-full overflow-hidden bg-[var(--color-surface-tertiary)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
          style={{ width: `${totalProgress}%` }}
        />
      </div>
    </button>
  );
};

export default GlobalDownloadBar;