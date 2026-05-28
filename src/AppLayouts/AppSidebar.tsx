import { motion } from 'framer-motion'
import { UIMode } from '../stores/uiModeStore'
import { SmartSidebar } from '../components/common'
import { useCallback, useEffect, useRef, } from 'react';
import useLayoutStore from '@/stores/layoutStore';

export interface AppSidebarProps {
  mode: UIMode;
  transitionDuration?: number;
  handleMenuClick: (targetPath: string) => void;
  footer: React.ReactNode;
}

const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 400;

const AppSidebar = ({
  mode = UIMode.ISLAND,
  transitionDuration = 0.2,
  handleMenuClick,
  footer,
}: AppSidebarProps) => {

  // 获取 sidebar 的宽度
  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth);
  const setSidebarWidth = useLayoutStore((s) => s.setSidebarWidth);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 如果 isResizingRef.current === false ，不处理
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
    <>
      {/*  
        FIXME: 侧边栏动画过渡开始时，内容提前切换导致视觉闪烁bug 
        复现：transition执行期间，sidebar子组件已渲染，预期：动画完成后再切换内容
      */}
      {/* OPTIMIZE: 侧边栏阴影优化，仅保留右侧box-shadow，移除多余阴影 */}
      {/* TODO: 接入 AnimationConfig 全局状态，控制动画开关，支持禁用动画 */}
      {/* TODO: 扩展侧边栏动画：新增滑入、淡入粒度控制，支持自定义过渡曲线 */}
      <motion.div
        className={`AppSidebar
                    ${mode == UIMode.CLASSIC && 'relative'}
                    ${mode == UIMode.ISLAND && 'fixed'}
                    flex-shrink-0 left-0 top-0 bottom-0 z-30 
                    border-[var(--color-border)] 
                    shadow-[var(--shadow-lg)]
                    overflow-hidden`
        }
        style={{
          width: sidebarWidth,
          top: mode == UIMode.ISLAND ? '80px' : '0',
        }}
        initial={{
          x: -sidebarWidth,
          opacity: 0
        }}
        exit={{
          x: sidebarWidth,
          opacity: 0
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        transition={{
          duration: transitionDuration,
          // duration: 1,
        }}
      >
        <SmartSidebar onMenuClick={handleMenuClick} showAllGroups={true} footer={footer} />
        <div
          className="absolute right-0 top-0 bottom-0 w-1 
            cursor-col-resize hover:bg-[var(--color-primary)] 
            hover:opacity-50 transition-opacity z-10"
          onMouseDown={handleSidebarResizeMouseDown}
        />
      </motion.div>
    </>
  )
}

export default AppSidebar
