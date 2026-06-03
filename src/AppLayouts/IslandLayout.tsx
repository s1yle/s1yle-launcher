import { AnimatePresence, motion } from "framer-motion"
import { DURATION } from "../utils/animations";
import { useBackgroundStore } from "../stores/backgroundStore";

export interface IslandLayoutProps {
    children: React.ReactNode,
    header: React.ReactNode,
    sidebar: React.ReactNode,
    sidebarWidth: number;
    sidebarTransitionDuration: number;
    hasOwnSidebar: boolean;
    isSidebarCollapsed: boolean;
    collapsedToggleButton: React.ReactNode;
}

const IslandLayout = ({
    children,
    header,
    sidebar,
    sidebarWidth = 15,
    sidebarTransitionDuration = DURATION.SIDEBAR_TRANSITION,
    hasOwnSidebar = false,
    isSidebarCollapsed = false,
    collapsedToggleButton,
}: IslandLayoutProps) => {
    const isCustomBg = useBackgroundStore((s) => s.config.type !== 'none');
    return (
        <>
            {header}
            {/* //外层动画容器 */}
            <AnimatePresence mode='wait'>
                <motion.div
                    className={isCustomBg ? 'bg-transparent' : 'bg-[var(--color-bg-secondary)]'}
                    style={{ width: 'auto', height: '100%', marginTop: '80px' }}
                    exit={{ x: -sidebarWidth, opacity: 0 }}
                    transition={{
                        duration: sidebarTransitionDuration,
                    }}
                >
                    <div
                        className="flex flex-1 overflow-hidden"
                        style={{ height: '100%', }}
                    >
                    {/* 侧边栏容器 — AnimatePresence 始终保持挂载，确保 exit 动画可执行 */}
                    <AnimatePresence>
                        {hasOwnSidebar && !isSidebarCollapsed && (
                            sidebar
                        )}
                    </AnimatePresence>
                        {children}
                    </div>

                </motion.div>
            </AnimatePresence>
            {/* 侧边栏折叠按钮 */}
            {collapsedToggleButton}
        </>
    )
}

export default IslandLayout;