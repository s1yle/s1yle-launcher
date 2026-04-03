import BaseSidebarContent, { type BaseSidebarContentProps } from './BaseSidebarContent';

const GameSidebarContent = (props: Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'>) => {
  return <BaseSidebarContent {...props} />;
};

export default GameSidebarContent;
