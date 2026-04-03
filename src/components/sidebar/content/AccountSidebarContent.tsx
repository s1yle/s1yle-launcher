import BaseSidebarContent, { type BaseSidebarContentProps } from './BaseSidebarContent';

const AccountSidebarContent = (props: Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'>) => {
  return <BaseSidebarContent {...props} />;
};

export default AccountSidebarContent;
