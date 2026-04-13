export type UserRole = 'CLIENT' | 'EMPLOYEE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  photoURL?: string;
  role: UserRole;
  isBlocked: boolean;
  cashbackBalance?: number;
  createdAt?: string;
}
