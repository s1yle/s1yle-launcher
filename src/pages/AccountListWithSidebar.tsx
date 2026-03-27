import PageWithSidebar from '../components/PageWithSidebar';
import AccountSidebarContent from '../components/AccountSidebarContent';
import AccountList from './AccountList';
import { getSidebarGroups } from '../router/config';
import { useLocation } from 'react-router-dom';

interface AccountListWithSidebarProps {
  onMenuClick?: (path: string, group: string, itemId: string, hasChildren: boolean) => void;
}

const AccountListWithSidebar = ({ onMenuClick }: AccountListWithSidebarProps) => {
  const location = useLocation();
  const groups = getSidebarGroups();
  
  // 检查当前路径是否激活
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // 检查是否有子菜单项展开
  const isExpanded = (_itemId: string) => {
    // 这里可以根据需要实现展开逻辑
    // 例如：如果当前路径是某个子菜单的路径，则展开对应的父菜单
    return false;
  };
  
  // 检查是否有子菜单
  const hasChildrenItems = (item: any) => {
    return !!(item.children && item.children.length > 0);
  };

  return (
    <PageWithSidebar
      sidebar={
        <AccountSidebarContent
          items={groups.account}
          onMenuClick={onMenuClick}
          isActive={isActive}
          isExpanded={isExpanded}
          hasChildrenItems={hasChildrenItems}
        />
      }
      sidebarWidth="w-55"
      contentClassName="p-8"
    >
      <AccountList />
    </PageWithSidebar>
  );
};

export default AccountListWithSidebar;