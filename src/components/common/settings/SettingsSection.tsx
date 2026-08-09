import  { ReactNode } from 'react';

/** 设置区块组件 Props */
export interface SettingsSectionProps {
  title: string;
  titleI18nKey?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 禁用区块（非激活态：灰显 + 不可交互） */
  disabled?: boolean;
}

/** 设置区块容器组件，包含标题图标和子项列表 */
const SettingsSection = ({
  title,
  icon,
  children,
  className = '',
  disabled = false,
}: SettingsSectionProps) => {
  return (
    <div className={`settings-section mb-6 ${className} ${disabled ? 'opacity-50 pointer-events-none select-none' : ''}`}>
      <div className="flex items-center gap-2 mb-4 pb-2 border-b 
          border-[var(--color-border)]">
        {icon && <span className="text-[var(--color-primary)]">{icon}</span>}
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default SettingsSection;
