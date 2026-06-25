import DownloadGame from './DownloadGame';

/** 带侧边栏的下载页面包装 */
const DownloadWithSidebar = () => {
  return (
    <div className="p-8">
      <DownloadGame />
    </div>
  );
};

export default DownloadWithSidebar;
