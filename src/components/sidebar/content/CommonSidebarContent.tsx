import BaseSidebarContent, { type BaseSidebarContentProps } from './BaseSidebarContent';

interface CommonSidebarContentProps extends Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'> {}

const CommonSidebarContent = (props: CommonSidebarContentProps) => {
  return (
    <BaseSidebarContent
      groupTitle="Common"
      groupTitleI18nKey="sidebar.group.common"
      {...props}
    />
  );
};

export default CommonSidebarContent;
