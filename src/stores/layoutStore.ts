import { create } from "zustand";
import { persist } from "zustand/middleware";

/** AppMain 侧边栏宽度变化防抖延迟（秒），避免拖拽调整宽度时频繁触发重排 */
export const LAYOUT_DEBOUNCE_DURATION = 0.10;
/** 侧边栏面板滑入/滑出动画持续时间（秒），同时也是布局 exit 动画的持续时间 */
export const SIDEBAR_TRANSITION_DURATION = 0.2;

/**
 * 布局 Store 的属性接口
 */
interface LayoutStoreProps {
   /** 侧边栏宽度（像素） */
   sidebarWidth: number;
   /** 侧边栏是否已折叠 */
   isSidebarCollapsed: boolean;
}

/**
 * 布局 Store 的完整状态接口，包含 setter 方法
 */
interface LayoutStoreState extends LayoutStoreProps {
    /** 设置侧边栏宽度 */
    setSidebarWidth: (w: number) => void;
    /** 切换侧边栏折叠状态 */
    setIsSidebarCollapsed: (collapsed: boolean) => void;
}

/**
 * 布局 Store
 *
 * 管理侧边栏宽度和折叠状态。
 * 用户偏好持久化存储到 localStorage。
 */
export const useLayoutStore = create<LayoutStoreState>()(
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

/** 布局 Store 默认导出 */
export default useLayoutStore;
