export type UserRole = 'CLIENT' | 'EMPLOYEE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  photoURL?: string; // Alias for Firebase compatibility
  role: UserRole;
  isBlocked: boolean;
  cashbackBalance?: number;
  createdAt?: string;
}
