import BaseSidebarContent, { type BaseSidebarContentProps } from './BaseSidebarContent';

const CommonSidebarContent = (props: Omit<BaseSidebarContentProps, 'groupTitle' | 'groupTitleI18nKey'>) => {
  return <BaseSidebarContent {...props} />;
};

export default CommonSidebarContent;
