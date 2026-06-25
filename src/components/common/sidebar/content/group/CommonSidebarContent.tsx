import BaseSidebarContent, { type BaseSidebarContentProps } from '../BaseSidebarContent';

/** 通用侧边栏内容组件（包裹 BaseSidebarContent，预设通用上下文） */
const CommonSidebarContent = (props: Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'>) => {
  return <BaseSidebarContent {...props} />;
};

export default CommonSidebarContent;
