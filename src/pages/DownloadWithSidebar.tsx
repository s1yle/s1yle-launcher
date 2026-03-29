import PageWithSidebar from '../components/sidebar/PageWithSidebar';
import Download from './Download';

const DownloadWithSidebar = () => {

  return (
    <PageWithSidebar
      contentClassName="p-8"
    >
      <Download/>
    </PageWithSidebar>
  );
};

export default DownloadWithSidebar;