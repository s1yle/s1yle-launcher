import React from 'react';

interface BaseSidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const BaseSidebarLayout = ({ children, title = "SMCL", subtitle = "使用 Rust 重写的MC启动器" }: BaseSidebarLayoutProps) => {
  return (
    <aside className="w-55 h-full flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]">
      <div className="p-6 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
        {children}
      </div>
    </aside>
  );
};

export default BaseSidebarLayout;
