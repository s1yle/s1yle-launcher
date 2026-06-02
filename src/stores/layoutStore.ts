import { create } from "zustand";
import { persist } from "zustand/middleware";

/** AppMain 侧边栏宽度变化防抖延迟（秒），避免拖拽调整宽度时频繁触发重排 */
export const LAYOUT_DEBOUNCE_DURATION = 0.10;
/** 侧边栏面板滑入/滑出动画持续时间（秒），同时也是布局 exit 动画的持续时间 */
export const SIDEBAR_TRANSITION_DURATION = 0.2;

interface LayoutStoreProps {
   sidebarWidth: number;
   isSidebarCollapsed: boolean;
}

interface LayoutStoreState extends LayoutStoreProps {
    setSidebarWidth: (w: number) => void;
    setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const useLayoutStore = create<LayoutStoreState>()(
    persist(
        (set, get) => ({
            sidebarWidth: 220,
            setSidebarWidth: async (w: number) => {
                set({ sidebarWidth:w });
            },
            isSidebarCollapsed: false,
            setIsSidebarCollapsed: async (collapsed: boolean) => {
                const { isSidebarCollapsed } = get();
                set({ isSidebarCollapsed: !isSidebarCollapsed })
            }
        }),
        { 
            name: 'layout-storage',
            partialize: (state) => ({
                sidebarWidth: state.sidebarWidth,
                isSidebarCollapsed: state.isSidebarCollapsed
            }),
        }
    )
);

export default useLayoutStore;
