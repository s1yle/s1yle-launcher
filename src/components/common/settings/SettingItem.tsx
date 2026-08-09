import { ReactNode } from 'react';

/** 设置项组件 Props */
export interface SettingItemProps {
  label: string;
  labelI18nKey?: string;
  description?: string;
  descriptionI18nKey?: string;
  children: ReactNode;
  className?: string;
}

/** 设置项组件，包含标签、描述和子控制区 */
const SettingItem = ({
  label,
  description,
  children,
  className = '',
}: SettingItemProps) => {
  return (
    <div className={`setting-item flex items-start justify-between gap-x-4 py-3 ${className}`}>
      {/* 标签区：min-w-0 允许窄窗口文字换行而不溢出，pr-4 保证与子项留白 */}
      <div className="flex-1 min-w-0 pr-4">
        {/* 标签 */}
        <div className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </div>
        {/* 描述 */}
        {description && (
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            {description}
          </div>
        )}
      </div>
      {/* 子项 */}
      <div className="ml-4 flex-shrink-0">
        {children}
      </div>
    </div>
  );
};

export default SettingItem;
