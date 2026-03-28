import BaseSidebarContent, { BaseSidebarContentProps } from './BaseSidebarContent';

interface AccountSidebarContentProps extends Omit<BaseSidebarContentProps, 'groupTitle'> {
  // 继承 BaseSidebarContentProps 但重写 groupTitle
}

const AccountSidebarContent = ({ 
  items, 
  onMenuClick, 
  isActive, 
  hasChildrenItems,
}: AccountSidebarContentProps) => {
  
  return (
    <BaseSidebarContent
      items={items}
      onMenuClick={onMenuClick}
      isActive={isActive}
      hasChildrenItems={hasChildrenItems}
      groupTitle="账户"
    />
  );
};

export default AccountSidebarContent;