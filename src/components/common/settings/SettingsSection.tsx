import React, { ReactNode } from 'react';

export interface SettingsSectionProps {
  title: string;
  titleI18nKey?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

// 设置项容器
const SettingsSection = ({
  title,
  icon,
  children,
  className = '',
}: SettingsSectionProps) => {
  return (
    <div className={`settings-section mb-6 ${className}`}>
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
