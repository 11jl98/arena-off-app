import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  setUserProfile: (data: { user: User }) => void;
  updateUser: (user: Partial<User>) => void;
  clearUserProfile: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      setUserProfile: (data) => set({ user: data.user }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      clearUserProfile: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);
