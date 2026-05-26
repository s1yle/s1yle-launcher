import { useEffect, useState } from "react";
import RouterRenderer from "../components/RouterRenderer"
import useLayoutStore, { PAGE_TRANSITION_DURATION } from "@/stores/LayoutStore";

export interface AppMainProps {
    hasOwnSidebar: boolean;
    isSidebarCollapsed: boolean;
}

const AppMain = ({
    hasOwnSidebar = false,
    isSidebarCollapsed = false,
}: AppMainProps) => {

    const width = useLayoutStore((s) => s.sidebarWidth)
    let [appliedWidth, setAppliedWidth] = useState(width);

    // TODO: 加入 isResizing 标志位优化 useEffect 性能:
    // - 当isResizing === true（正在拖拽）：实时应用宽度
    // - 当isResizing === false（普通状态）：延迟应用宽度
    useEffect(() => {
        const timer = setTimeout(() => {
            setAppliedWidth(width);
        }, PAGE_TRANSITION_DURATION * 10);

        return () => clearTimeout(timer);
    }, [width]);

    const paddingLeft = hasOwnSidebar && !isSidebarCollapsed ? appliedWidth : 0;

    return (
        <>
            <main
                className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-custom pt-30"
                style={{
                    background: 'var(--color-bg-secondary)',
                    height: '100%',
                    paddingLeft,
                }}
            >
                <RouterRenderer />
            </main>
        </>
    )
}

export default AppMain;