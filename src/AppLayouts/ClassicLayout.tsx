import { AnimatePresence, motion } from "framer-motion"
import { DURATION } from "../utils/animations";

export interface ClassicLayoutProps {
    children: React.ReactNode,
    header: React.ReactNode,
    sidebar: React.ReactNode,
    sidebarWidth: number;
    sidebarTransitionDuration: number;
    shouldShowSidebar: boolean;
    collapsedToggleButton: React.ReactNode;
}

const ClassicLayout = ({
    children,
    header,
    sidebar,
    sidebarWidth = 15,
    sidebarTransitionDuration = DURATION.SIDEBAR_TRANSITION,
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
                        duration: sidebarTransitionDuration,
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