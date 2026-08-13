import { useCallback, useEffect, useRef } from 'react';
import { SmartSidebar } from '../components/common'
import useLayoutStore from '@/stores/layoutStore';

/** AppSidebar 组件的 Props */
export interface AppSidebarProps {
  handleMenuClick: (targetPath: string) => void;
  footer: React.ReactNode;
  /** 是否为页面自带侧边栏（显示当前菜单子项） */
  ownSidebar?: boolean;
}

const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 400;

/** 应用侧边栏 - 包含 SmartSidebar 和拖动调整宽度功能 */
const AppSidebar = ({
  handleMenuClick,
  footer,
  ownSidebar = false,
}: AppSidebarProps) => {

  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth);
  const setSidebarWidth = useLayoutStore((s) => s.setSidebarWidth);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, startWidthRef.current + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [sidebarWidth]);

  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleSidebarResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  return (
    <div className="AppSidebar h-full flex flex-col overflow-hidden border- border-[var(--color-border)] relative">
      <div className="h-full flex flex-col flex-shrink-0" style={{ width: sidebarWidth }}>
        <SmartSidebar onMenuClick={handleMenuClick} showAllGroups={true} footer={footer} ownSidebar={ownSidebar} />
        <div
          className="absolute right-0 top-0 bottom-0 w-1
            cursor-col-resize hover:bg-[var(--color-primary)]
            hover:opacity-50 transition-opacity z-10"
          onMouseDown={handleSidebarResizeMouseDown}
        />
      </div>
    </div>
  )
}

export default AppSidebar
