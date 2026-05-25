# Guia de Migração de Autenticação — Frontend

**Data:** Abril 2026  
**Versão da API:** pós-migração cookie-only  
**Impacto:** Todos os clientes que consomem os endpoints `/auth/*`

---

## Resumo das mudanças

O backend agora usa **exclusivamente cookies `httpOnly`** para transportar os tokens JWT. Tokens **nunca** aparecem mais no corpo das respostas. O `Authorization: Bearer` foi removido e não funciona mais.

---

## O que mudou no contrato da API

### `POST /auth/login` e `POST /auth/register` e `POST /auth/google`

**Antes (body retornado):**
```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "CLIENT", "createdAt": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```

**Depois (body retornado):**
```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "CLIENT", "createdAt": "..." }
}
```

Os cookies `accessToken` e `refreshToken` são definidos automaticamente na resposta como `httpOnly; Secure; SameSite`.

---

### `POST /auth/refresh`

**Antes:** era necessário enviar o `refreshToken` no body:
```json
{ "refreshToken": "eyJ..." }
```

**Depois:** endpoint sem body. O cookie `refreshToken` é lido automaticamente pelo servidor.

```json
// body da requisição: vazio {}
// body da resposta:
{ "message": "Token refreshed" }
```

Os novos cookies `accessToken` e `refreshToken` são definidos na resposta.

---

### `POST /auth/logout`

Sem mudanças no contrato. Limpa os cookies no servidor.

---

### `GET /auth/me`

Sem mudanças. Retorna o usuário autenticado. Funciona automaticamente se o cookie `accessToken` estiver presente.

---

## O que o frontend precisa mudar

### 1. Não armazenar tokens (localStorage / sessionStorage / memória)

Remova qualquer código que armazene `accessToken` ou `refreshToken`:

```ts
// ❌ REMOVER
localStorage.setItem('accessToken', data.accessToken);
sessionStorage.setItem('refreshToken', data.refreshToken);
let tokenInMemory = data.accessToken;
```

### 2. Configurar `credentials: 'include'` em TODAS as requisições

Os cookies só são enviados automaticamente se a requisição incluir credenciais.

**Fetch nativo:**
```ts
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',  // ← obrigatório
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

**Axios — configuração global (recomendado):**
```ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // ← obrigatório em toda instância
});
```

### 3. Não enviar `Authorization: Bearer` — foi removido

```ts
// ❌ REMOVER — não funciona mais
headers: { 'Authorization': `Bearer ${token}` }
```

As requisições autenticadas só precisam de `withCredentials: true` (o cookie é enviado automaticamente pelo browser).

### 4. Novo fluxo de refresh de token

O refresh não precisa de body. Apenas chame o endpoint:

```ts
async function refreshTokens(): Promise<boolean> {
  try {
    await api.post('/auth/refresh'); // sem body, sem headers de token
    return true;
  } catch {
    return false; // 401 = refresh token expirado, redirecionar para login
  }
}
```

### 5. Interceptor de 401 para refresh automático (padrão recomendado)

```ts
let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(api(originalRequest)),
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post('/auth/refresh'); // sem body
      failedQueue.forEach(({ resolve }) => resolve());
      failedQueue = [];
      return api(originalRequest);
    } catch (refreshError) {
      failedQueue.forEach(({ reject }) => reject(refreshError));
      failedQueue = [];
      // Refresh falhou: limpar estado local e redirecionar
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
```

### 6. Gerenciamento de estado de autenticação

Como o `accessToken` não é mais acessível ao JavaScript, o estado do usuário autenticado deve vir exclusivamente de `/auth/me`:

```ts
// Verificar se está autenticado
async function getAuthenticatedUser() {
  try {
    const { data } = await api.get('/auth/me');
    return data; // { id, email, name, role, createdAt }
  } catch {
    return null; // 401 = não autenticado
  }
}
```

Chame `getAuthenticatedUser()` na inicialização do app (ex: `_app.tsx`, `App.vue`, context provider).

### 7. Logout

```ts
async function logout() {
  await api.post('/auth/logout'); // limpa cookies no servidor
  // limpar estado local
  setUser(null);
  router.push('/login');
}
```

---

## Ambiente de desenvolvimento (localhost)

Em desenvolvimento, os cookies são definidos com `SameSite: Lax` e **sem** `Secure`. Certifique-se de que:

- O frontend roda em `http://localhost:3000` (ou outra porta)
- O backend roda em `http://localhost:{PORT}`
- O domínio do frontend está em `ALLOWED_ORIGINS` no `.env` do backend

```env
# .env do backend
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_ACCESS_SECRET=<segredo-forte>
JWT_REFRESH_SECRET=<segredo-forte-diferente>
```

> **Atenção:** O backend lança erro na inicialização se `JWT_ACCESS_SECRET` ou `JWT_REFRESH_SECRET` não estiverem definidos.

---

## Ambiente de produção (HTTPS)

Em produção:
- Cookies são definidos com `Secure` e `SameSite: Strict`
- O frontend deve estar em HTTPS
- Configure `ALLOWED_ORIGINS` com o domínio exato do frontend (sem trailing slash)

```env
ALLOWED_ORIGINS=https://app.arena.com
```

---

## Aplicativos móveis / React Native

Cookies `httpOnly` **não funcionam** em WebViews ou fetch nativo sem configuração extra.

Para mobile, há duas opções:
1. **Usar `@react-native-cookies/cookies`** junto com `credentials: 'include'` — os cookies são gerenciados pela biblioteca, não expostos ao JS.
2. **Endpoint separado** — criar variantes dos endpoints que retornam token no body, protegidas por validação de client secret (API Key). Discutir com o time de backend antes de implementar.

---

## Resumo de endpoints sem mudança de uso

| Endpoint | Antes | Depois |
|---|---|---|
| `POST /auth/login` | enviar credenciais, ler `accessToken` do body | enviar credenciais, ignorar campo de token (não existe mais) |
| `POST /auth/register` | idem | idem |
| `POST /auth/google` | idem | idem |
| `POST /auth/refresh` | enviar `{ refreshToken }` no body | enviar requisição sem body |
| `POST /auth/logout` | chamar endpoint | sem mudança |
| `GET /auth/me` | enviar `Authorization: Bearer` | sem header, apenas `withCredentials: true` |
| Qualquer endpoint protegido | enviar `Authorization: Bearer` | apenas `withCredentials: true` |
