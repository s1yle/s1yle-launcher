import { PanelLeft, PanelLeftOpen } from 'lucide-react';
import { RouteConfig } from '@/router/models';
import AppMain from './AppMain';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { ShellSpec } from './shell';
import { useSidebar } from './useSidebar';

/** AppShell 组件的 Props */
export interface AppShellProps {
  shell: ShellSpec;
  route: RouteConfig;
  handleMenuClick: (targetPath: string) => void;
}

/**
 * 布局壳体 - 统一的 header + 侧边栏 + 内容区编排。
 * 由 resolveShell 输出的规格驱动，不在此处做任何路由/模式判断。
 */
const AppShell = ({ shell, route, handleMenuClick }: AppShellProps) => {
  const { effectiveCollapsed, canHaveSidebar, toggleSidebar } = useSidebar(shell);
  const showSidebar = canHaveSidebar && !effectiveCollapsed;

  const header = <AppHeader kind={shell.header} route={route} handleMenuClick={handleMenuClick} />;

  const sidebarFooter = (
    <button
      onClick={toggleSidebar}
      className="w-full flex items-center gap-2 
          px-3 py-2 rounded-md text-sm 
          text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] 
          hover:bg-[var(--color-surface-hover)] transition-colors"
      title="收起侧边栏"
    >
      <PanelLeft className="w-4 h-4" />
      <span>收起侧边栏</span>
    </button>
  );

  const sidebarElement = canHaveSidebar ? (
    <AppSidebar
      handleMenuClick={handleMenuClick}
      footer={sidebarFooter}
      ownSidebar={route.ownSidebar === true}
    />
  ) : undefined;

  const collapsedToggleButton = effectiveCollapsed && canHaveSidebar && (
    <button
      onClick={toggleSidebar}
      className="fixed left-3 top-1/2 -translate-y-1/2 z-20 p-2 
        rounded-md bg-[var(--color-surface)] 
        border border-[var(--color-border)] 
        text-[var(--color-text-secondary)] 
        hover:text-[var(--color-text-primary)] 
        hover:bg-[var(--color-surface-hover)] 
        transition-colors shadow-md cursor-pointer"
      title="展开侧边栏"
    >
      <PanelLeftOpen className="w-4 h-4" />
    </button>
  );

  if (!shell.frame) {
    return (
      <>
        {header}
        <AppMain showSidebar={false} />
      </>
    );
  }

  return (
    <>
        {header}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ marginTop: shell.topInset || undefined }}
        >
          <AppMain showSidebar={showSidebar} sidebarElement={sidebarElement} />
        </div>
        {collapsedToggleButton}
    </>
  );
};

export default AppShell;
