import React from 'react';

interface PageWithSidebarProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarWidth?: string;
  contentClassName?: string;
}

const PageWithSidebar = ({ 
  sidebar, 
  children, 
  sidebarWidth = 'w-55',
  contentClassName = ''
}: PageWithSidebarProps) => {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 独立侧边栏 */}
      <div className={`${sidebarWidth} h-full flex-shrink-0`}>
        {sidebar}
      </div>
      
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