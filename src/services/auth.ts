import { httpClient } from './api';
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';
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
  accessToken: string;
  refreshToken: string;
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
 
  async signInWithGoogle(): Promise<void> {
    await signInWithRedirect(auth, googleProvider);
  },

  async handleRedirectResult(): Promise<AuthResponse | null> {
    try {
      console.log('[AuthService] Checking for redirect result...');
      
      let result = await getRedirectResult(auth);
      
      if (!result) {
        console.log('[AuthService] First attempt: No redirect result');
        await new Promise(resolve => setTimeout(resolve, 500));
        result = await getRedirectResult(auth);
      }
      
      if (!result) {
        console.log('[AuthService] Second attempt: No redirect result');
        
        if (auth.currentUser) {
          console.log('[AuthService] Found currentUser, using it instead', auth.currentUser.email);
          const user = auth.currentUser;
          const idToken = await user.getIdToken();

          const payload: GoogleAuthPayload = {
            idToken,
            email: user.email || '',
            name: user.displayName || '',
            googleId: user.uid,
            avatarUrl: user.photoURL || undefined,
          };

          console.log('[AuthService] Sending authentication to backend...');
          const response = await httpClient.post<AuthResponse>('/auth/google', payload);
          console.log('[AuthService] Authentication successful via currentUser');
          return response;
        }
        
        console.log('[AuthService] No redirect result or currentUser found');
        return null;
      }

      console.log('[AuthService] Redirect result found, processing user...', result.user.email);
      const user = result.user;
      const idToken = await user.getIdToken();

      const payload: GoogleAuthPayload = {
        idToken,
        email: user.email || '',
        name: user.displayName || '',
        googleId: user.uid,
        avatarUrl: user.photoURL || undefined,
      };

      console.log('[AuthService] Sending authentication to backend...');
      const response = await httpClient.post<AuthResponse>('/auth/google', payload);
      console.log('[AuthService] Authentication successful');
      return response;
    } catch (error) {
      console.error('[AuthService] Firebase Auth Error:', error);
      throw error;
    }
  },

  async getProfile(): Promise<ProfileResponse> {
    const response = await httpClient.get<ProfileResponse>('/auth/me');
    return response;
  },

  async signOut(): Promise<void> {
    try {
      // Sign out from Firebase
      await auth.signOut();
    } catch (error) {
      console.error('Firebase signOut error:', error);
    }
    
    // Sign out from backend
    await httpClient.post('/auth/logout', {});
  },

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await httpClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      {}
    );
    return response;
  },

  async updateProfile(data: { name: string; photoURL?: string }): Promise<ProfileResponse> {
    const response = await httpClient.patch<ProfileResponse>('/auth/me', {
      name: data.name,
      avatarUrl: data.photoURL,
    });
    return response;
  },
};
