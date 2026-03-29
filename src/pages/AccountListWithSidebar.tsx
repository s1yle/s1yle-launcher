import PageWithSidebar from '../components/sidebar/PageWithSidebar';
import AccountList from './AccountList';

const AccountListWithSidebar = () => {

  return (
    <PageWithSidebar
      contentClassName="p-8"
    >
      <AccountList />
    </PageWithSidebar>
  );
};

export default AccountListWithSidebar;