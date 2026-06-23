import { create } from 'zustand';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  group: 'account' | 'game' | 'common' | 'none';
  children?: NavItem[];
}

export type NavDirection = 'left' | 'right' | null;

export interface DragPreviewState {
  isDragging: boolean;
  fromPath: string;
  toPath: string;
  direction: 'left' | 'right';
}

interface NavState {
  currentPath: string;
  previousPath: string | null;
  isNavigating: boolean;
  sidebarVisible: boolean;
  direction: NavDirection;
  dragPreview: DragPreviewState | null;

  setCurrentPath: (path: string) => void;
  setPreviousPath: (path: string | null) => void;
  setNavigating: (navigating: boolean) => void;
  setSidebarVisible: (visible: boolean) => void;
  setDirection: (direction: NavDirection) => void;
  setDragPreview: (state: DragPreviewState | null) => void;
  navigate: (path: string) => void;
  goBack: () => string | null;
}

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
