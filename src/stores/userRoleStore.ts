import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin',
  CREATOR = 'creator'
}

interface UserRoleState {
  currentRole: UserRole;
  previousRole: UserRole | null;
  isTransitioning: boolean;

  switchRole: (role: UserRole, shouldNavigate?: boolean) => void;
  toggleRole: () => void;
  setTransitioning: (value: boolean) => void;
}

// 角色专属页面路径前缀
const ROLE_SPECIFIC_PATHS: Record<UserRole, string[]> = {
  [UserRole.PLAYER]: [],
  [UserRole.ADMIN]: ['/admin'],
  [UserRole.CREATOR]: []
};

export const useUserRoleStore = create<UserRoleState>()(
  persist(
    (set, get) => ({
      currentRole: UserRole.PLAYER,
      previousRole: null,
      isTransitioning: false,

      switchRole: (role, shouldNavigate = true) => {
        const { currentRole } = get();
        if (role === currentRole) return;

        // 检查当前是否在目标角色的专属页面上
        const targetPaths = ROLE_SPECIFIC_PATHS[role];
        const needsNavigation = shouldNavigate && targetPaths.length > 0;

        if (needsNavigation) {
          // 先设置过渡状态
          set({
            isTransitioning: true,
            previousRole: currentRole
          });

          // 切换角色（导航在组件中处理）
          setTimeout(() => {
            set({
              currentRole: role,
              isTransitioning: false,
              previousRole: null
            });
          }, 200);
        } else {
          // 普通切换
          set({
            isTransitioning: true,
            previousRole: currentRole
          });

          setTimeout(() => {
            set({ currentRole: role, isTransitioning: false });
          }, 350);
        }
      },

      toggleRole: () => {
        const { currentRole } = get();
        const newRole = currentRole === UserRole.PLAYER ? UserRole.ADMIN : UserRole.PLAYER;
        get().switchRole(newRole);
      },

      setTransitioning: (value) => set({ isTransitioning: value }),
    }),
    {
      name: 'user-role-storage',
    }
  )
);
