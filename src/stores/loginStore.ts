import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 登录状态 Store 的内部接口
 *
 * 管理用户的登录状态和登录时间，内置 7 天过期机制。
 */
interface LoginState {
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 登录时间戳，用于判断是否过期 */
  loginTime: number | null;
  
  /** 标记为已登录并记录当前时间戳 */
  setLoggedIn: () => void;
  /** 标记为已登出并清空时间戳 */
  setLoggedOut: () => void;
  /** 检查登录状态是否仍然有效（未过期） */
  checkLoginStatus: () => boolean;
}

const LOGIN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 登录状态 Store
 *
 * 管理登录状态和登录时间，登录状态在 7 天后自动过期。
 * 持久化存储到 localStorage。
 */
export const useLoginStore = create<LoginState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      loginTime: null,
      
      setLoggedIn: () => {
        set({ 
          isLoggedIn: true, 
          loginTime: Date.now() 
        });
      },
      
      setLoggedOut: () => {
        set({ 
          isLoggedIn: false, 
          loginTime: null 
        });
      },
      
      checkLoginStatus: () => {
        const { loginTime } = get();
        if (!loginTime) return false;
        
        const now = Date.now();
        const isExpired = (now - loginTime) > LOGIN_EXPIRY_MS;
        
        if (isExpired) {
          set({ isLoggedIn: false, loginTime: null });
          return false;
        }
        
        return true;
      }
    }),
    {
      name: 'login-storage',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        loginTime: state.loginTime,
      }),
    }
  )
);
