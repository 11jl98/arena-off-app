export type UserRole = 'CLIENT' | 'EMPLOYEE' | 'ADMIN';

export interface ClientProfile {
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  photoURL?: string;
  role: UserRole;
  isBlocked: boolean;
  cashbackBalance?: number;
  cpf?: string | null;
  phone?: string | null;
  clientProfile?: ClientProfile | null;
  createdAt?: string;
}
