import { API_BASE_URL } from '@/utils/constants/app.constant';

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
  _retry?: boolean;
  _skipProactiveRefresh?: boolean;
}

const TOKEN_REFRESH_THRESHOLD = 50 * 60 * 1000;
const LAST_REFRESH_KEY = 'last-token-refresh';

class HttpClient {
  private baseURL: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private isOnline(): boolean {
    return navigator.onLine;
  }

  private async waitForConnection(maxWaitMs: number = 5000): Promise<boolean> {
    if (this.isOnline()) return true;

    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkConnection = () => {
        if (this.isOnline()) {
          window.removeEventListener('online', checkConnection);
          resolve(true);
        } else if (Date.now() - startTime > maxWaitMs) {
          window.removeEventListener('online', checkConnection);
          resolve(false);
        }
      };

      window.addEventListener('online', checkConnection);
      checkConnection();
    });
  }

  private getLastRefreshTime(): number {
    try {
      const stored = localStorage.getItem(LAST_REFRESH_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }

  private setLastRefreshTime(timestamp: number): void {
    localStorage.setItem(LAST_REFRESH_KEY, timestamp.toString());
  }

  private shouldProactivelyRefresh(): boolean {
    const lastRefresh = this.getLastRefreshTime();
    if (!lastRefresh) return false;
    
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (!authStorage) return false;
      
      const parsed = JSON.parse(authStorage);
      if (!parsed.state?.isAuthenticated) return false;
    } catch {
      return false;
    }
    
    const timeSinceRefresh = Date.now() - lastRefresh;
    return timeSinceRefresh > TOKEN_REFRESH_THRESHOLD;
  }

  public async refreshToken(retryCount: number = 0): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        if (!this.isOnline()) {
          console.warn('[AUTH] Offline - aguardando conexão...');
          const connected = await this.waitForConnection(3000);

          if (!connected) {
            console.warn('[AUTH] Ainda offline após 3s - mantendo sessão');
            return true;
          }
        }

        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const now = Date.now();
          this.setLastRefreshTime(now);
          console.log(
            '[AUTH] Access token renovado (refresh bem-sucedido):',
            new Date(now).toISOString()
          );
          window.dispatchEvent(new CustomEvent('token-refreshed', { detail: { timestamp: now } }));
          return true;
        }

        if (response.status === 401 || response.status === 403) {
          if (retryCount < 1) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            this.refreshPromise = null;
            return this.refreshToken(retryCount + 1);
          }
          this.emitSessionExpired();
          return false;
        }

        if (response.status >= 500) {
          console.error('[AUTH] Erro no servidor:', response.status);

          if (retryCount < 2) {
            const waitTime = 1000 * Math.pow(2, retryCount);
            console.log(`[AUTH] Retry ${retryCount + 1}/2 em ${waitTime}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            this.refreshPromise = null;
            return this.refreshToken(retryCount + 1);
          }

          console.warn('[AUTH] Servidor indisponível após retries - mantendo sessão');
          return true;
        }

        console.error('[AUTH] Refresh falhou com status:', response.status);
        return true;
      } catch (error) {
        console.error('[AUTH] Refresh network error:', error);

        if (retryCount < 2) {
          const waitTime = 1000 * Math.pow(2, retryCount);
          console.log(`[AUTH] Retry ${retryCount + 1}/2 em ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          this.refreshPromise = null;
          return this.refreshToken(retryCount + 1);
        }

        if (!this.isOnline()) {
          console.warn('[AUTH] Offline após retries - mantendo sessão');
          return true;
        }

        console.warn('[AUTH] Erro de rede persistente - mantendo sessão');
        return true;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private emitSessionExpired() {
    window.dispatchEvent(new CustomEvent('session-expired'));
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, _retry, _skipProactiveRefresh, ...fetchConfig } = config;

    if (!endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
      if (!this.isOnline()) {
        console.warn('[API] Offline - aguardando conexão para:', endpoint);
        const connected = await this.waitForConnection(5000);

        if (!connected) {
          throw new Error('Sem conexão com a internet');
        }
      }
    }

    // Renovação proativa: só em rotas autenticadas com sessão ativa
    if (
      !_retry &&
      !_skipProactiveRefresh &&
      !endpoint.startsWith('/auth/') &&
      this.shouldProactivelyRefresh()
    ) {
      await this.refreshToken();
    }

    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      url += `?${new URLSearchParams(params).toString()}`;
    }

    const headers: Record<string, string> = {
      ...(fetchConfig.headers as Record<string, string>),
    };

    if (!fetchConfig.body || !(fetchConfig.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...fetchConfig,
      credentials: 'include',
      headers,
    });

    if (response.status === 401 && !_retry && !endpoint.startsWith('/auth/')) {
      const refreshed = await this.refreshToken();

      if (refreshed) {
        return this.request<T>(endpoint, { ...config, _retry: true, _skipProactiveRefresh: true });
      }

      if (endpoint !== '/auth/refresh') {
        this.emitSessionExpired();
      }
      throw new Error('Session expired');
    }

    if (!response.ok) {
      let errorBody: any = {};
      errorBody = await response.json();

      const error = new Error(errorBody.message || `HTTP ${response.status}`);
      (error as any).status = response.status;
      (error as any).body = errorBody;
      throw error;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  get<T>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  post<T>(endpoint: string, data?: unknown, config?: RequestConfig) {
    const isFormData = data instanceof FormData;

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? {} : { 'Content-Type': 'application/json', ...config?.headers },
    });
  }

  postFormData<T>(endpoint: string, formData: FormData, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  putFormData<T>(endpoint: string, formData: FormData, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: formData,
      headers: {},
    });
  }
}

export const httpClient = new HttpClient(API_BASE_URL);
