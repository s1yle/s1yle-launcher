import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 用户角色枚举 */
export enum UserRole {
  /** 玩家角色 */
  PLAYER = 'player',
  /** 管理员/服主角色 */
  ADMIN = 'admin',
  /** 创作者角色 */
  CREATOR = 'creator'
}

/**
 * 用户角色状态 Store 的内部接口
 */
interface UserRoleState {
  /** 当前角色 */
  currentRole: UserRole;
  /** 上一个角色（用于过渡动画） */
  previousRole: UserRole | null;
  /** 是否正在角色切换过渡中 */
  isTransitioning: boolean;

  /** 切换到指定角色（支持带导航的过渡动画） */
  switchRole: (role: UserRole, shouldNavigate?: boolean) => void;
  /** 在 PLAYER 和 ADMIN 之间快速切换 */
  toggleRole: () => void;
  /** 设置过渡状态 */
  setTransitioning: (value: boolean) => void;
}

// 角色专属页面路径前缀
const ROLE_SPECIFIC_PATHS: Record<UserRole, string[]> = {
  [UserRole.PLAYER]: [],
  [UserRole.ADMIN]: ['/admin'],
  [UserRole.CREATOR]: []
};

/**
 * 用户角色 Store
 *
 * 支持 player / admin / creator 三种角色切换。
 * 切换时带有过渡动画，支持角色专属页面自动导航。
 * 持久化存储到 localStorage。
 */
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
