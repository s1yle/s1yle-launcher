import BaseSidebarContent, { type BaseSidebarContentProps } from './BaseSidebarContent';

interface GameSidebarContentProps extends Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'> {}

const GameSidebarContent = (props: GameSidebarContentProps) => {
  return (
    <BaseSidebarContent
      groupTitle="Game"
      groupTitleI18nKey="sidebar.group.game"
      {...props}
    />
  );
};

export default GameSidebarContent;
