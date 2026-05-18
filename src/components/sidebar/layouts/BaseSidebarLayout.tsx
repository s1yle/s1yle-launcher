import React from 'react';

interface BaseSidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
}

const BaseSidebarLayout = ({ children, title = "SMCL", subtitle = "使用 Rust 重写的 MC 启动器", footer, header }: BaseSidebarLayoutProps) => {
  return (
    <aside className="w-full h-full flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] pt-5">

      {header && (
        <div className="border-b border-[var(--color-border)] p-3">
          {header}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-custom">
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
