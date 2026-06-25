import BaseSidebarContent, { type BaseSidebarContentProps } from '../BaseSidebarContent';

/** 游戏侧边栏内容组件（包裹 BaseSidebarContent，预设游戏相关上下文） */
const GameSidebarContent = (props: Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'>) => {
  return <BaseSidebarContent {...props} />;
};

export default GameSidebarContent;
