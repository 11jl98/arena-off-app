import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  lastTokenRefresh: number;
  isChecking: boolean;
  setAuthenticated: (isAuth: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setTokenRefresh: (timestamp: number) => void;
  setIsChecking: (isChecking: boolean) => void;
  reset: () => void;
}

const initialState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  lastTokenRefresh: 0,
  isChecking: true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),
      setTokenRefresh: (timestamp) => set({ lastTokenRefresh: timestamp }),
      setIsChecking: (isChecking) => set({ isChecking }),
      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        lastTokenRefresh: state.lastTokenRefresh,
      }),
    }
  )
);
