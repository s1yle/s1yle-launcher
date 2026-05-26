import { create } from "zustand";
import { persist } from "zustand/middleware";


export const PAGE_TRANSITION_DURATION = 0.10;
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