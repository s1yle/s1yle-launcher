import BaseSidebarContent, { BaseSidebarContentProps } from './BaseSidebarContent';

interface GameSidebarContentProps extends Omit<BaseSidebarContentProps, 'groupTitle'> {
  // 继承 BaseSidebarContentProps 但重写 groupTitle
}

const GameSidebarContent = ({ 
  items, 
  onMenuClick, 
  isActive, 
  hasChildrenItems,
}: GameSidebarContentProps) => {
  
  return (
    <BaseSidebarContent
      items={items}
      onMenuClick={onMenuClick}
      isActive={isActive}
      hasChildrenItems={hasChildrenItems}
      groupTitle="游戏"
    />
  );
};

export default GameSidebarContent;