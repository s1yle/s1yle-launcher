import { create } from 'zustand';

/** 导航项定义 */
export interface NavItem {
  /** 路由路径 */
  path: string;
  /** 显示标签 */
  label: string;
  /** 图标标识 */
  icon: string;
  /** 所属分组 */
  group: 'account' | 'game' | 'common' | 'none';
  /** 子导航项 */
  children?: NavItem[];
}

/** 页面切换方向 */
export type NavDirection = 'left' | 'right' | null;

/** 拖拽预览状态 */
export interface DragPreviewState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 拖拽来源路径 */
  fromPath: string;
  /** 拖拽目标路径 */
  toPath: string;
  /** 拖拽方向 */
  direction: 'left' | 'right';
}

/**
 * 导航状态 Store 的内部接口
 *
 * 管理页面导航状态、切换方向动画、侧边栏可见性。
 */
interface NavState {
  /** 当前页面路径 */
  currentPath: string;
  /** 上一个页面路径（用于返回） */
  previousPath: string | null;
  /** 是否正在导航中（用于过渡动画） */
  isNavigating: boolean;
  /** 侧边栏是否可见 */
  sidebarVisible: boolean;
  /** 页面切换动画方向 */
  direction: NavDirection;
  /** 拖拽预览状态 */
  dragPreview: DragPreviewState | null;

  /** 设置当前路径 */
  setCurrentPath: (path: string) => void;
  /** 设置上一个路径 */
  setPreviousPath: (path: string | null) => void;
  /** 设置导航状态 */
  setNavigating: (navigating: boolean) => void;
  /** 设置侧边栏可见性 */
  setSidebarVisible: (visible: boolean) => void;
  /** 设置页面切换方向 */
  setDirection: (direction: NavDirection) => void;
  /** 设置拖拽预览状态 */
  setDragPreview: (state: DragPreviewState | null) => void;
  /** 导航到指定路径并记录上一个路径 */
  navigate: (path: string) => void;
  /** 返回上一个路径 */
  goBack: () => string | null;
}

/**
 * 导航状态 Store
 *
 * 管理:
 * - 当前/上一个页面路径
 * - 导航方向（用于转场动画）
 * - 侧边栏可见性
 * - 拖拽预览状态
 */
export const useNavStore = create<NavState>((set, get) => ({
  currentPath: '/',
  previousPath: null,
  isNavigating: false,
  sidebarVisible: true,
  direction: null,
  dragPreview: null,

  setCurrentPath: (path: string) => {
    set({ currentPath: path });
  },

  setPreviousPath: (path: string | null) => {
    set({ previousPath: path });
  },

  setNavigating: (navigating: boolean) => {
    set({ isNavigating: navigating });
  },

  setSidebarVisible: (visible: boolean) => {
    set({ sidebarVisible: visible });
  },

  setDirection: (direction: NavDirection) => {
    set({ direction });
  },

  setDragPreview: (state: DragPreviewState | null) => {
    set({ dragPreview: state });
  },

  navigate: (path: string) => {
    const { currentPath } = get();
    if (path === currentPath) return;
    set({
      previousPath: currentPath,
      currentPath: path,
      isNavigating: true,
    });
  },

  goBack: () => {
    const { previousPath } = get();
    if (previousPath) {
      set({
        currentPath: previousPath,
        previousPath: null,
        isNavigating: true,
      });
    }
    return previousPath;
  },
}));
