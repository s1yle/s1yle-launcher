import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LoginState {
  isLoggedIn: boolean;
  loginTime: number | null;
  
  setLoggedIn: () => void;
  setLoggedOut: () => void;
  checkLoginStatus: () => boolean;
}

const LOGIN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

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
