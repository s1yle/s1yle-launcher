import { AnimatePresence, motion } from "framer-motion"

export interface IslandLayoutProps {
    children: React.ReactNode,
    header: React.ReactNode,
    sidebar: React.ReactNode,
    sidebarWidth: number;
    sidebar_transition_duration: number;
    hasOwnSidebar: boolean;
    isSidebarCollapsed: boolean;
    isNavigating: boolean;
    collapsedToggleButton: React.ReactNode;
}

const IslandLayout = ({
    children,
    header,
    sidebar,
    sidebarWidth = 15,
    sidebar_transition_duration = 0.2,
    hasOwnSidebar = false,
    isSidebarCollapsed = false,
    isNavigating = false,
    collapsedToggleButton,
}: IslandLayoutProps) => {
    return (
        <>
            {header}
            {/* //外层动画容器 */}
            <AnimatePresence mode='wait'>
                <motion.div
                    className='bg-[var(--color-bg-secondary)]'
                    style={{ width: 'auto', height: '100%', marginTop: '80px' }}
                    exit={{ x: -sidebarWidth, opacity: 0 }}
                    transition={{
                        duration: sidebar_transition_duration,
                    }}
                >
                    <div
                        className="flex flex-1 overflow-hidden"
                        style={{ height: '100%', }}
                    >
                        {hasOwnSidebar && !isSidebarCollapsed && (
                            <>
                                {/* 有独立侧边栏的页面：显示侧边栏 + 内容 */}
                                {/* 侧边栏容器 */}
                                <AnimatePresence>
                                    {!isNavigating && !isSidebarCollapsed && (
                                        sidebar
                                    )}
                                </AnimatePresence>
                            </>
                        )}
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