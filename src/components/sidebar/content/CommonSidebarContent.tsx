import BaseSidebarContent, { BaseSidebarContentProps } from './BaseSidebarContent';

interface CommonSidebarContentProps extends Omit<BaseSidebarContentProps, 'groupTitle'> {
  // 继承 BaseSidebarContentProps 但重写 groupTitle
}

const CommonSidebarContent = ({ 
  items, 
  onMenuClick, 
  isActive, 
  hasChildrenItems,
}: CommonSidebarContentProps) => {
  
  return (
    <BaseSidebarContent
      items={items}
      onMenuClick={onMenuClick}
      isActive={isActive}
      hasChildrenItems={hasChildrenItems}
      groupTitle="通用"
    />
  );
};

export default CommonSidebarContent;