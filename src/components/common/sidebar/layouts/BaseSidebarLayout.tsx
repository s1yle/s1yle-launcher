import React from 'react';

export interface BaseSidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
}

const BaseSidebarLayout = ({
  children, title = "SMCL",
  subtitle = "使用 Rust 重写的 MC 启动器",
  footer,
  header
}: BaseSidebarLayoutProps) => {
  return (
    <aside
      className="w-full h-full flex flex-col 
      bg-[var(--color-bg-tertiary)] "
    >

      {header && (
        <div className="border-b border-[var(--color-border)] p-3">
          {header}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-custom scrollbar-hide">
        {children}
      </div>

      {footer && (
        <div className="border-t border-[var(--color-border)] p-2">
          {footer}
        </div>
      )}
    </aside>
  );
};

export default BaseSidebarLayout;
