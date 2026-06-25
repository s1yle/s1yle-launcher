import { useCallback, useEffect, useRef } from 'react';
import { UIMode } from '../stores/uiModeStore'
import { SmartSidebar } from '../components/common'
import useLayoutStore from '@/stores/layoutStore';
import { DURATION } from '@/utils/animations';

/** AppSidebar 组件的 Props */
export interface AppSidebarProps {
  mode: UIMode;
  transitionDuration?: number;
  handleMenuClick: (targetPath: string) => void;
  footer: React.ReactNode;
}

const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 400;

/** 应用侧边栏 - 包含 SmartSidebar 和拖动调整宽度功能 */
const AppSidebar = ({
  mode = UIMode.ISLAND,
  transitionDuration = DURATION.SIDEBAR_TRANSITION,
  handleMenuClick,
  footer,
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
      <SmartSidebar onMenuClick={handleMenuClick} showAllGroups={true} footer={footer} />
      <div
        className="absolute right-0 top-0 bottom-0 w-1
          cursor-col-resize hover:bg-[var(--color-primary)]
          hover:opacity-50 transition-opacity z-10"
        onMouseDown={handleSidebarResizeMouseDown}
      />
    </div>
  )
}

export default AppSidebar
