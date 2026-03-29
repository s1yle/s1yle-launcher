import PageWithSidebar from '../components/sidebar/PageWithSidebar';
import Download from './Download';

interface AccountListWithSidebarProps {
  onMenuClick?: (path: string, group: string, itemId: string, hasChildren: boolean) => void;
}

const DownloadWithSidebar = ({ onMenuClick }: AccountListWithSidebarProps) => {

  return (
    <PageWithSidebar
      contentClassName="p-8"
    >
      <Download/>
    </PageWithSidebar>
  );
};

export default DownloadWithSidebar;