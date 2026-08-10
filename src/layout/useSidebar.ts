import { useMemo } from 'react';
import useLayoutStore from '@/stores/layoutStore';
import { ShellSpec } from './shell';

/**
 * 侧边栏折叠状态。
 * 无侧边栏的页面恒折叠；有侧边栏时跟随用户偏好（持久化）。
 */
export function useSidebar(shell: ShellSpec) {
  const isSidebarCollapsed = useLayoutStore((s) => s.isSidebarCollapsed);
  const setIsSidebarCollapsed = useLayoutStore((s) => s.setIsSidebarCollapsed);

  const canHaveSidebar = shell.sidebar !== 'none';

  const effectiveCollapsed = useMemo(
    () => (canHaveSidebar ? isSidebarCollapsed : true),
    [canHaveSidebar, isSidebarCollapsed]
  );

  const toggleSidebar = () => setIsSidebarCollapsed(!effectiveCollapsed);

  return { effectiveCollapsed, canHaveSidebar, toggleSidebar };
}
