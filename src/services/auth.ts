import { httpClient } from './api';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';

export interface GoogleAuthPayload {
  idToken: string;
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN';
    avatarUrl?: string;
    isBlocked: boolean;
    createdAt: string;
  };
}

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN';
    avatarUrl?: string;
    isBlocked: boolean;
    createdAt: string;
  };
}

export const AuthService = {

  async signInWithGoogle(): Promise<AuthResponse> {
    const result = await signInWithPopup(auth, googleProvider);

    const user = result.user;
    const idToken = await user.getIdToken();

    const payload: GoogleAuthPayload = {
      idToken,
      email: user.email || '',
      name: user.displayName || '',
      googleId: user.uid,
      avatarUrl: user.photoURL || undefined,
    };

    const response = await httpClient.post<AuthResponse>('/auth/google', payload);
    return response;
  },

  async getProfile(): Promise<ProfileResponse> {
    const response = await httpClient.get<ProfileResponse>('/auth/me');
    return response;
  },

  async signOut(): Promise<void> {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Firebase signOut error:', error);
    }
    
    await httpClient.post('/auth/logout', {});
  },

  async updateProfile(data: { name: string; photoURL?: string }): Promise<ProfileResponse> {
    const response = await httpClient.patch<ProfileResponse>('/auth/me', {
      name: data.name,
      avatarUrl: data.photoURL,
    });
    return response;
  },
};
