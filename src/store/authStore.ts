import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  lastTokenRefresh: number;
  isChecking: boolean;
  setAuthenticated: (isAuth: boolean) => void;
  setTokenRefresh: (timestamp: number) => void;
  setIsChecking: (isChecking: boolean) => void;
  reset: () => void;
}

const initialState = {
  isAuthenticated: false,
  lastTokenRefresh: 0,
  isChecking: true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
      setTokenRefresh: (timestamp) => set({ lastTokenRefresh: timestamp }),
      setIsChecking: (isChecking) => set({ isChecking }),
      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        lastTokenRefresh: state.lastTokenRefresh,
      }),
    }
  )
);
