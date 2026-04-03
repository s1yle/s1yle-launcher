import BaseSidebarContent, { type BaseSidebarContentProps } from './BaseSidebarContent';

interface AccountSidebarContentProps extends Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'> {}

const AccountSidebarContent = (props: AccountSidebarContentProps) => {
  return (
    <BaseSidebarContent
      groupTitle="Account"
      groupTitleI18nKey="sidebar.group.account"
      {...props}
    />
  );
};

export default AccountSidebarContent;
