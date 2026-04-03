import { create } from 'zustand';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  group: 'account' | 'game' | 'common' | 'none';
  children?: NavItem[];
}

interface NavState {
  currentPath: string;
  previousPath: string | null;
  isNavigating: boolean;
  sidebarVisible: boolean;

  setCurrentPath: (path: string) => void;
  setPreviousPath: (path: string | null) => void;
  setNavigating: (navigating: boolean) => void;
  setSidebarVisible: (visible: boolean) => void;
  navigate: (path: string) => void;
  goBack: () => string | null;
}

export const useNavStore = create<NavState>((set, get) => ({
  currentPath: '/',
  previousPath: null,
  isNavigating: false,
  sidebarVisible: true,

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
