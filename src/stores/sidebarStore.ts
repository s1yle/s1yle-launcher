import { create } from 'zustand';

interface SidebarState {
  /** 当前高亮的侧边栏项 ID（全局唯一，同一时间只有一项高亮） */
  activeItemId: string | null;
  /** 设置高亮项（传 null 清除高亮） */
  setActiveItem: (id: string | null) => void;
  /** 查询某项是否高亮 */
  isItemActive: (id: string) => boolean;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  activeItemId: null,
  setActiveItem: (id) => set({ activeItemId: id }),
  isItemActive: (id) => get().activeItemId === id,
}));
