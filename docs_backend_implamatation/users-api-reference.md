# API Reference — Users Module & Auth (Staff Flow)

**Base URL:** `{API_BASE_URL}`  
**Autenticação:** JWT via cookie `httpOnly` (`accessToken`) **ou** header `Authorization: Bearer {token}`  
**Roles disponíveis:** `CLIENT` | `EMPLOYEE` | `ADMIN`

---

## Autenticação

### Todos os endpoints de `/users/*` exigem:
- Usuário autenticado (JWT válido)
- Role **`ADMIN`** — qualquer outra role retorna `403 Forbidden`

---

## 1. Login (Admin / Funcionário)

```
POST /auth/login
```

> Login com e-mail e senha. Usado por **admins** e **funcionários** (não usa Google).

**Auth:** Nenhuma

**Request Body:**
```json
{
  "email": "admin@arenaoffbeach.com",
  "password": "minhasenha123"
}
```

**Response `200`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@arenaoffbeach.com",
    "name": "João Admin",
    "avatarUrl": null,
    "role": "ADMIN",
    "createdAt": "2026-04-07T00:00:00.000Z"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```

> Além do JSON, o servidor define os cookies `httpOnly`:
> - `accessToken` (expira em 1h)
> - `refreshToken` (expira em 7d)
>
> Se o frontend rodar em browser, pode usar os cookies automaticamente. Se for mobile/app nativo, use os tokens do JSON.

**Erros:**
| Status | Situação |
|--------|----------|
| `401` | Credenciais inválidas ou conta bloqueada |

---

## 2. Definir Senha (primeiro acesso / reset)

```
POST /auth/set-password
```

> Endpoint usado quando o admin/funcionário recebe o e-mail de convite e clica no link.  
> O frontend deve extrair o parâmetro `token` da URL (`?token=...`) e enviá-lo junto com a nova senha.

**Auth:** Nenhuma (`@Public`)

**Request Body:**
```json
{
  "token": "eyJ...",
  "password": "novaSenhaSegura123"
}
```

**Validações:**
- `password` — mínimo **8 caracteres**
- `token` — JWT gerado pelo servidor, válido por **24 horas**

**Response `200`:**
```json
{
  "message": "Password set successfully"
}
```

**Erros:**
| Status | Situação |
|--------|----------|
| `401` | Token inválido, expirado, ou com propósito incorreto |
| `401` | Usuário não encontrado pelo token |

> **Fluxo esperado no frontend:**
> 1. Usuário clica no link do e-mail: `https://admin.arenaoffbeach.com/auth/set-password?token=eyJ...`
> 2. Frontend carrega a página de "Definir Senha"
> 3. Usuário preenche a nova senha
> 4. Frontend faz `POST /auth/set-password` com `{ token, password }`
> 5. Redirecionar para `/auth/login`

---

## 3. Refresh Token

```
POST /auth/refresh
```

**Auth:** Nenhuma (`@Public`)

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```

---

## 4. Logout

```
POST /auth/logout
```

**Auth:** Requerida

**Response `200`:**
```json
{
  "message": "Logged out successfully"
}
```

> O servidor limpa os cookies `accessToken` e `refreshToken`.

---

## 5. Perfil do usuário logado

```
GET /auth/me
```

**Auth:** Requerida

**Response `200`:**
```json
{
  "id": "uuid",
  "email": "admin@arenaoffbeach.com",
  "role": "ADMIN"
}
```

---

## 6. Criar Admin

```
POST /users/admin
```

**Auth:** Requerida — Role: `ADMIN`

**Request Body:**
```json
{
  "name": "Maria Silva",
  "email": "maria@arenaoffbeach.com"
}
```

**Validações:**
- `name` — mínimo 2 caracteres
- `email` — formato de e-mail válido

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Maria Silva",
  "email": "maria@arenaoffbeach.com",
  "role": "ADMIN",
  "blocked": false,
  "avatarUrl": null,
  "createdAt": "2026-04-07T00:00:00.000Z"
}
```

> Após o cadastro, o sistema envia automaticamente um e-mail para `maria@arenaoffbeach.com` com o link para definir a senha (válido 24h).

**Erros:**
| Status | Situação |
|--------|----------|
| `409` | E-mail já cadastrado |
| `403` | Usuário logado não é ADMIN |
| `401` | Não autenticado |

---

## 7. Criar Funcionário

```
POST /users/employee
```

**Auth:** Requerida — Role: `ADMIN`

**Request Body:** *(mesmo schema de criar admin)*
```json
{
  "name": "Carlos Funcionário",
  "email": "carlos@arenaoffbeach.com"
}
```

**Response `201`:** *(mesmo schema, com `"role": "EMPLOYEE"`)*

---

## 8. Listar Usuários

```
GET /users
```

**Auth:** Requerida — Role: `ADMIN`

**Query Params:**

| Parâmetro | Tipo | Obrigatório | Default | Descrição |
|-----------|------|-------------|---------|-----------|
| `role` | `CLIENT \| EMPLOYEE \| ADMIN` | Não | — | Filtrar por role |
| `search` | string | Não | — | Busca parcial (case-insensitive) em `name` **ou** `email` (máx 100 chars) |
| `blocked` | `true \| false` | Não | — | Filtrar por status de bloqueio |
| `page` | number | Não | `1` | Página atual |
| `limit` | number | Não | `20` | Itens por página (máx 100) |

**Exemplos:**
```
GET /users
GET /users?role=EMPLOYEE
GET /users?search=joao
GET /users?search=joao&role=CLIENT&blocked=false
GET /users?blocked=true&page=1&limit=10
GET /users?role=ADMIN&page=2&limit=10
```

**Response `200`:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Maria Silva",
      "email": "maria@arenaoffbeach.com",
      "role": "ADMIN",
      "blocked": false,
      "avatarUrl": null,
      "createdAt": "2026-04-07T00:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

> Para calcular o total de páginas: `Math.ceil(total / limit)`

---

## 9. Buscar Usuário por ID

```
GET /users/:id
```

**Auth:** Requerida — Role: `ADMIN`

**Path Params:**
- `id` — UUID do usuário

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "João Cliente",
  "email": "joao@email.com",
  "role": "CLIENT",
  "blocked": false,
  "avatarUrl": null,
  "clientProfile": {
    "cpf": "123.456.789-00",
    "phone": "+5511999999999",
    "birthDate": "1995-06-15",
    "address": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  },
  "createdAt": "2026-04-07T00:00:00.000Z"
}
```

> Para usuários `ADMIN` ou `EMPLOYEE`, `clientProfile` é `null` (eles não possuem perfil de cliente).

**Erros:**
| Status | Situação |
|--------|----------|
| `404` | Usuário não encontrado |
| `400` | `id` não é um UUID válido |

---

## 10. Editar Usuário

```
PATCH /users/:id
```

**Auth:** Requerida — Role: `ADMIN`

**Request Body:** *(todos os campos são opcionais)*
```json
{
  "name": "Novo Nome",
  "email": "novoemail@arenaoffbeach.com"
}
```

**Response `200`:** *(objeto `UserResponseDto` atualizado)*

**Erros:**
| Status | Situação |
|--------|----------|
| `404` | Usuário não encontrado |
| `409` | Novo e-mail já em uso |

---

## 11. Bloquear Usuário

```
PATCH /users/:id/block
```

**Auth:** Requerida — Role: `ADMIN`

**Request Body:** Nenhum

**Response `200`:** *(objeto `UserResponseDto` com `"blocked": true`)*

> Usuário bloqueado não consegue fazer login — recebe `401 Account blocked`.

---

## 12. Desbloquear Usuário

```
PATCH /users/:id/unblock
```

**Auth:** Requerida — Role: `ADMIN`

**Request Body:** Nenhum

**Response `200`:** *(objeto `UserResponseDto` com `"blocked": false`)*

---

## 13. Reenviar E-mail de Definição de Senha

```
PATCH /users/:id/reset-password
```

**Auth:** Requerida — Role: `ADMIN`

> Gera um novo token de 24h e reenvia o e-mail de "Defina sua senha".  
> Útil quando o link original expirou ou o usuário nunca acessou.

**Request Body:** Nenhum

**Response `200`:**
```json
{
  "message": "Password reset email sent"
}
```

---

## 14. Deletar Usuário

```
DELETE /users/:id
```

**Auth:** Requerida — Role: `ADMIN`

> **Atenção:** Delete **permanente**. Não há soft-delete.

**Response `204`:** Sem corpo

**Erros:**
| Status | Situação |
|--------|----------|
| `404` | Usuário não encontrado |

---

## Tipos e Schemas

### `UserResponseDto`
```typescript
{
  id: string;                            // UUID
  name: string;
  email: string;
  role: "CLIENT" | "EMPLOYEE" | "ADMIN";
  blocked: boolean;
  avatarUrl?: string;                    // null se não definido
  clientProfile?: ClientProfileDto | null; // presente apenas em GET /users/:id
  createdAt: string;                     // ISO 8601
}
```

### `ClientProfileDto`
> Presente apenas na resposta de `GET /users/:id` para usuários com `role: "CLIENT"`.  
> Para `ADMIN` e `EMPLOYEE`, o campo `clientProfile` é `null`.

```typescript
{
  cpf?: string;        // CPF formatado — pode ser null
  phone?: string;      // Ex: "+5511999999999" — pode ser null
  birthDate?: string;  // ISO 8601 date (ex: "1995-06-15") — pode ser null
  address?: string;
  city?: string;
  state?: string;      // Sigla do estado (ex: "SP")
  zipCode?: string;    // CEP (ex: "01310-100") — pode ser null
}
```

### `AuthResponseDto` (apenas no login)
```typescript
{
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;   // segundos (3600 = 1h)
}
```

### `PaginatedUsersResponseDto`
```typescript
{
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}
```

---

## Comportamentos importantes

### Google OAuth — apenas para clientes
O endpoint `POST /auth/google` **só funciona para usuários com role `CLIENT`**. Se um admin ou funcionário tentar logar com Google, receberá `401`. O painel administrativo deve usar **exclusivamente** o fluxo de e-mail + senha (`POST /auth/login`).

### Fluxo completo de criação de equipe

```
Admin logado
    │
    ├── POST /users/admin   →  cria usuário ADMIN sem senha
    │       └── servidor envia e-mail automático com link de 24h
    │
    └── POST /users/employee  →  cria usuário EMPLOYEE sem senha
            └── servidor envia e-mail automático com link de 24h

Novo funcionário recebe o e-mail
    │
    └── clica no link  →  frontend abre /auth/set-password?token=...
            │
            └── POST /auth/set-password { token, password }
                    │
                    └── redireciona para /auth/login
```

### Erros genéricos

| Status | Significado |
|--------|-------------|
| `400` | Dados inválidos (validação de campos) |
| `401` | Não autenticado ou token inválido/expirado |
| `403` | Autenticado, mas sem permissão (role insuficiente) |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: e-mail já cadastrado) |
| `429` | Rate limit excedido (100 req/min) |
| `500` | Erro interno do servidor |
