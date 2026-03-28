import React from 'react';

interface BaseSidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const BaseSidebarLayout = ({ children, title = "MC启动器", subtitle = "简洁高效的游戏启动管理" }: BaseSidebarLayoutProps) => {
  return (
    <aside 
      style={{
        backgroundColor: '#191919',   //黑色背景
      }}
      className="w-55 bg-white/10 backdrop-blur-md h-full flex flex-col"
    >
      <div className="p-6 border-b border-white/20">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-300 mt-1">{subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>

      {/* 提示区域 - 可选 */}
      {/* <div className="p-4 border-t border-white/20">
        <div className="bg-indigo-500/20 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-white">提示：</span>
            点击菜单切换页面，左侧侧边栏固定显示
          </p>
        </div>
      </div> */}
    </aside>
  );
};

export default BaseSidebarLayout;