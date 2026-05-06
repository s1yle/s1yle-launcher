import React from 'react';

interface BaseSidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

const BaseSidebarLayout = ({ children, title = "SMCL", subtitle = "使用 Rust 重写的MC启动器", footer }: BaseSidebarLayoutProps) => {
  return (
    <aside className="w-full h-full flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]">

      <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
        {children}
      </div>

      {footer && (
        <div className="border-t border-[var(--color-border)] p-3">
          {footer}
        </div>
      )}
    </aside>
  );
};

export default BaseSidebarLayout;
