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
        setIsChecking,
        reset: resetAuth,
    } = useAuthStore();
    const { user, setUser, clearUserProfile } = useUserStore();
    const navigate = useNavigate();

    const clearSession = useCallback(() => {
        resetAuth();
        clearUserProfile();
    }, [resetAuth, clearUserProfile]);

    const loginWithGoogle = useCallback(async () => {
        try {
            setIsChecking(true);
            const response = await AuthService.signInWithGoogle();

            const mappedUser = {
                ...response.user,
                photoURL: response.user.avatarUrl,
            };

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
    }, [setIsChecking, setUser, setAuthenticated, showSuccess, navigate, showError]);

    /**
     * Verifica a sessão chamando /auth/me.
     * O cookie httpOnly é enviado automaticamente pelo browser.
     * - Sucesso → atualiza usuário e marca autenticado
     * - 401 definitivo (após refresh falhar) → limpa sessão e redireciona para login
     * - Erro de rede/offline → preserva estado atual sem deslogar (comportamento de app nativo)
     */
    const checkAuth = useCallback(async () => {
        try {
            setIsChecking(true);
            const response = await AuthService.getProfile();
            const mappedUser = {
                ...response.user,
                photoURL: response.user.avatarUrl,
            };
            setUser(mappedUser);
            setAuthenticated(true);
            return true;
        } catch (err: unknown) {
            const status = (err as any)?.status;
            const message = (err as any)?.message;

            // Sessão definitivamente expirada — refresh também falhou
            if (status === 401 || message === 'Session expired') {
                clearSession();
                return false;
            }

            // Erro de rede, servidor indisponível, offline:
            // manter estado atual sem deslogar (age como app nativo)
            console.warn('[Auth] Não foi possível verificar sessão (erro de rede):', message);
            return isAuthenticated;
        } finally {
            setIsChecking(false);
        }
    }, [isAuthenticated, setUser, setAuthenticated, clearSession, setIsChecking]);

    const logout = useCallback(async () => {
        try {
            await AuthService.signOut();
            showSuccess('Logout realizado com sucesso!');
        } finally {
            clearSession();
        }
    }, [clearSession, showSuccess]);

    return {
        user,
        isAuthenticated,
        isChecking,
        loginWithGoogle,
        signOut: logout,
        logout,
        checkAuth,
        clearSession,
    };
};
