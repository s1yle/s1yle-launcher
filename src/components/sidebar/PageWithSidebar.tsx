import React from 'react';

interface PageWithSidebarProps {
  children: React.ReactNode;
  contentClassName?: string;
}

const PageWithSidebar = ({ 
  children, 
  contentClassName = ''
}: PageWithSidebarProps) => {
  return (
    <div className="flex flex-1 overflow-hidden">

      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto relative">
        <div className={`relative z-10 min-h-full ${contentClassName}`}>
          {children}
        </div>
      </main>

    </div>
  );
};

export default PageWithSidebar;