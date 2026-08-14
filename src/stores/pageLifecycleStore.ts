import { create } from 'zustand';

/**
 * 页面生命周期注册表。
 *
 * 由 RouterRenderer 维护"当前 DOM 中实际挂载的页面路径"（mountedPath），
 * 供 safeNavigate 在导航前检查当前页面是否已关闭/已切换。
 * 退出中的旧层由 RouterRenderer 自管理（动画完成或硬超时后 setState 移除），
 * 不再依赖 framer-motion 的 safeToRemove。
 */
interface PageLifecycleState {
  /** 当前 DOM 中实际挂载的页面路径（null = 尚未有页面完成挂载） */
  mountedPath: string | null;
  setMountedPath: (path: string | null) => void;
}

export const usePageLifecycleStore = create<PageLifecycleState>((set) => ({
  mountedPath: null,
  setMountedPath: (path) => set({ mountedPath: path }),
}));
