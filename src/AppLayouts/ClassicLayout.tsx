import { AnimatePresence, motion } from "framer-motion"

export interface ClassicLayoutProps {
    children: React.ReactNode,
    header: React.ReactNode,
    sidebar: React.ReactNode,
    sidebarWidth: number;
    sidebar_transition_duration: number;
    shouldShowSidebar: boolean;
    collapsedToggleButton: React.ReactNode;
}

const ClassicLayout = ({
    children,
    header,
    sidebar,
    sidebarWidth = 15,
    sidebar_transition_duration = 0.2,
    shouldShowSidebar = false,
    collapsedToggleButton,
}: ClassicLayoutProps) => {
    return (
        <>
            {header}
            {/* //外层动画容器 */}
            <AnimatePresence mode='wait'>
                <motion.div
                    className='bg-[var(--color-bg-secondary)]'
                    style={{ width: 'auto', height: '100%' }}
                    exit={{ x: -sidebarWidth, opacity: 0 }}
                    transition={{
                        duration: sidebar_transition_duration,
                    }}
                >
                    <div
                        className="flex flex-1 overflow-hidden"
                        style={{ height: '100%' }}
                    >
                        {/* 侧边栏容器 */}
                        <AnimatePresence>
                            {shouldShowSidebar && (
                                sidebar
                            )}
                        </AnimatePresence>

                        {/* 页面内容 */}
                        {children}
                    </div>

                </motion.div>
            </AnimatePresence>
            {collapsedToggleButton}
        </>
    )
}

export default ClassicLayout;