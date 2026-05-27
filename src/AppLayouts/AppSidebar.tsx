import { motion } from 'framer-motion'
import { UIMode } from '../stores/uiModeStore'
import { SmartSidebar } from '../components/common'
import { useCallback, useEffect, useRef, useState } from 'react';
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
            <motion.div
                className={`AppSidebar
                    ${mode == UIMode.CLASSIC && 'relative'}
                    ${mode == UIMode.ISLAND && 'fixed'}
                    flex-shrink-0 left-0 top-0 bottom-0 z-30 
                    border-[var(--color-border)] 
                    shadow-[var(--shadow-lg)]
                    overflow-hidden`
                }
                // TODO: 加入 AnimationConfig 状态控制, enabled 时动画开启否则关闭
                style={{
                    width: sidebarWidth,
                    top: mode == UIMode.ISLAND ? '80px' : '0',
                }}
                initial={{
                    x: -sidebarWidth,
                    opacity: 0
                }}
                exit={{
                    x: -sidebarWidth,
                    opacity: 0
                }}
                animate={{
                    x: 0,
                    opacity: 1,
                }}
                transition={{
                    duration: transitionDuration,
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