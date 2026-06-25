import BaseSidebarContent, { type BaseSidebarContentProps } from '../BaseSidebarContent';

/** 账户侧边栏内容组件（包裹 BaseSidebarContent，预设账户相关上下文） */
const AccountSidebarContent = (props: Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'>) => {
  return <BaseSidebarContent {...props} />;
};

export default AccountSidebarContent;
