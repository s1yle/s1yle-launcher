import PageWithSidebar from '../components/sidebar/PageWithSidebar';
import AccountList from './AccountList';

interface AccountListWithSidebarProps {
  onMenuClick?: (path: string, group: string, itemId: string, hasChildren: boolean) => void;
}

const AccountListWithSidebar = ({ onMenuClick }: AccountListWithSidebarProps) => {

  return (
    <PageWithSidebar
      contentClassName="p-8"
    >
      <AccountList />
    </PageWithSidebar>
  );
};

export default AccountListWithSidebar;