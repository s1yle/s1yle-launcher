import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { type SidebarMenuItem } from '../../../router/config';

export interface BaseChildrenContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (path: string, group: string, itemId: string, hasChildren: boolean) => void;
  isActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
  groupTitle?: string;
  groupTitleI18nKey?: string;
}

const BaseChildrenContent = ({
  items,
  onMenuClick,
  isActive,
  hasChildrenItems,
  groupTitle,
  groupTitleI18nKey,
}: BaseChildrenContentProps) => {
  const { t } = useTranslation();

  const defaultIsActive = (_path: string) => false;
  const defaultHasChildrenItems = (item: SidebarMenuItem) => !!(item.children && item.children.length > 0);

  const activeCheck = isActive || defaultIsActive;
  const childrenCheck = hasChildrenItems || defaultHasChildrenItems;

  const handleClick = (path: string, group: string, itemId: string, hasChildren: boolean) => {
    if (onMenuClick) {
      onMenuClick(path, group, itemId, hasChildren);
    }
  };

  const renderMenuItem = (item: SidebarMenuItem, level: number = 0) => {
    const hasChildren = childrenCheck(item);
    const active = activeCheck(item.path);

    return (
      <div key={item.id}>
        <button
          onClick={() => handleClick(item.path, item.group, item.id, hasChildren)}
          className={`
            w-full flex items-center gap-3 px-4 py-2.5 mb-1 rounded-lg transition-all duration-200
            ${active
              ? 'bg-white/20 text-white font-semibold'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
            }
            ${level > 0 ? 'ml-4' : ''}
          `}
          style={{ paddingLeft: level > 0 ? `${1 + level * 0.5}rem` : '1rem' }}
        >
          <span className="w-5 h-5 flex-shrink-0 text-current opacity-70">
            {item.icon}
          </span>
          <span className="text-sm text-left flex-1 truncate">
            {t(item.titleI18nKey, item.title)}
          </span>
          {hasChildren && (
            <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          )}
        </button>

        {hasChildren && item.children && (
          <div className="ml-2">
            {item.children.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {groupTitle && (
        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-4">
          {groupTitleI18nKey ? t(groupTitleI18nKey, groupTitle) : groupTitle}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item) => renderMenuItem(item))}
      </div>
    </div>
  );
};

export default BaseChildrenContent;
