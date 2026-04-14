import { useCallback } from 'react';
import { useAuthStore, useUserStore } from '@/store';
import { AuthService } from '@/services/auth.ts';
import { useNotify } from '@/hooks/useNotify';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants/app.constant';

export const useAuth = () => {
    const { error: showError, success: showSuccess } = useNotify();
    const {
        isAuthenticated,
        isChecking,
        setAuthenticated,
        setTokens,
        setIsChecking,
        reset: resetAuth,
    } = useAuthStore();
    const { user, setUser, clearUserProfile } = useUserStore();
    const navigate = useNavigate();


    const loginWithGoogle = useCallback(async () => {
        try {
            setIsChecking(true);
            const response = await AuthService.signInWithGoogle();

            const mappedUser = {
                ...response.user,
                photoURL: response.user.avatarUrl,
            };

            setTokens(response.accessToken, response.refreshToken);
            setUser(mappedUser);
            setAuthenticated(true);
            showSuccess('Login realizado com sucesso!');
            navigate(ROUTES.HOME, { replace: true });
        } catch (err: unknown) {
            const message =
                (err as any)?.response?.data?.message ||
                (err as any)?.message ||
                'Erro ao fazer login com Google';
            showError(message);
        } finally {
            setIsChecking(false);
        }
    }, [setIsChecking, setTokens, setUser, setAuthenticated, showSuccess, navigate, showError]);

    const checkAuth = useCallback(async () => {
        try {
            setIsChecking(true);
            if (!isAuthenticated) {
                setIsChecking(false);
                return false;
            }

            const response = await AuthService.getProfile();
            const mappedUser = {
                ...response.user,
                photoURL: response.user.avatarUrl,
            };
            setUser(mappedUser);
            return true;
        } catch {
            resetAuth();
            clearUserProfile();
            return false;
        } finally {
            setIsChecking(false);
        }
    }, [
        isAuthenticated,
        setUser,
        resetAuth,
        clearUserProfile,
        setIsChecking,
    ]);

    const logout = useCallback(async () => {
        try {
            await AuthService.signOut();
            showSuccess('Logout realizado com sucesso!');
        } finally {
            resetAuth();
            clearUserProfile();
        }
    }, [resetAuth, clearUserProfile, showSuccess]);

    return {
        user,
        isAuthenticated,
        isChecking,
        loginWithGoogle,
        signOut: logout,
        logout,
        checkAuth,
    };
};
