# Implementação: Pacotes de Horas (Hours Packages)

## Situação atual

| Componente | Status |
|---|---|
| Model `HoursPackage` no schema | ✅ Existe |
| CRUD admin (`/hours-packages`) | ✅ Implementado |
| Compra pelo cliente | ❌ Não implementado |
| Saldo de horas por cliente | ❌ Não implementado |
| Uso no agendamento | ❌ Não implementado |

---

## Fluxo esperado

```
1. Admin cria pacote → "10h por R$400 (20% de economia), validade 90 dias"
2. Cliente visualiza pacotes disponíveis
3. Cliente compra um pacote → saldo de 10h é creditado, expira em 90 dias
4. Ao criar agendamento, cliente escolhe usar horas do pacote
5. Sistema debita as horas usadas do saldo
6. Agendamento é criado com valor R$0 (ou pro-rata caso horas insuficientes)
```

---

## Backend — O que precisa ser implementado

### 1. Novo model no schema: `ClientHoursPackage`

Adicionar em `prisma/schema.prisma` antes do fechamento do módulo de promoções:

```prisma
model ClientHoursPackage {
  id              String   @id @default(uuid()) @db.Uuid
  clientId        String   @db.Uuid
  packageId       String   @db.Uuid
  hoursTotal      Int                        // cópia de HoursPackage.hours no momento da compra
  hoursUsed       Int      @default(0)
  pricePaid       Decimal  @db.Decimal(10, 2) // cópia de HoursPackage.totalPrice
  expiresAt       DateTime @db.Date
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  client  User         @relation(fields: [clientId], references: [id])
  package HoursPackage @relation(fields: [packageId], references: [id])

  @@index([clientId])
  @@index([active])
  @@index([expiresAt])
  @@map("client_hours_packages")
}
```

E adicionar a relação inversa no `HoursPackage`:
```prisma
  clientPackages  ClientHoursPackage[]
```

E no `User`:
```prisma
  hoursPackages   ClientHoursPackage[]
```

### 2. Novos endpoints necessários

#### Admin
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/hours-packages/:id/assign` | Atribui pacote manualmente a um cliente | ADMIN |
| `GET` | `/hours-packages/clients/:clientId` | Lista pacotes ativos de um cliente | ADMIN, EMPLOYEE |

#### Cliente
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/hours-packages/:id/purchase` | Compra um pacote | CLIENT |
| `GET` | `/hours-packages/my-packages` | Lista seus pacotes ativos com saldo | CLIENT |

#### Agendamento (alteração em `POST /bookings`)
Adicionar campo opcional `clientPackageId?: string` no `CreateBookingDto`.

**Lógica:**
- Se `clientPackageId` enviado → busca o `ClientHoursPackage` do cliente
- Valida: pertence ao cliente, está ativo, não expirou, tem horas suficientes
- Debita `hours` do saldo após criar o agendamento
- `calculatedAmount = 0` (já pago no pacote)

### 3. Response DTO sugerido — `ClientHoursPackageResponseDto`

```ts
{
  id: string;
  package: {
    id: string;
    name: string;
    hours: number;
  };
  hoursTotal: number;
  hoursUsed: number;
  hoursRemaining: number;  // hoursTotal - hoursUsed
  pricePaid: number;
  expiresAt: string;       // ISO date
  active: boolean;
  createdAt: string;
}
```

---

## Front Admin — Guia de implementação

### Tela: Gerenciamento de Pacotes (`/admin/pacotes`)

**Funcionalidades já suportadas pelo backend:**

#### Listagem
```
GET /hours-packages?activeOnly=false
```
Exibir tabela com: Nome, Horas, Preço total, Economia (%), Validade (dias), Status (ativo/inativo)

#### Criar pacote
```
POST /hours-packages
Body: { name, description?, hours, totalPrice, savingsPercent, validity? }
```

Campos do formulário:
- **Nome** — obrigatório, máx 100 chars
- **Descrição** — opcional, máx 500 chars
- **Horas** — número inteiro ≥ 1
- **Preço total (R$)** — ≥ 0
- **Economia (%)** — 0–100 (meramente informativo, exibido ao cliente)
- **Validade (dias)** — padrão 90

> **Nota:** `savingsPercent` é um campo **descritivo** — não é calculado automaticamente pelo backend. O admin deve calcular e informar (ex: quadra custa R$100/h, 10h = R$1000, cobrado R$400 → 60% de economia).

#### Editar / Inativar
```
PATCH /hours-packages/:id
Body: campos parciais
```
Para inativar sem deletar: `{ active: false }`

#### Deletar
```
DELETE /hours-packages/:id
```
⚠️ Só deletar se o pacote não tiver sido comprado por nenhum cliente (verificar antes de exibir botão).

---

### Tela: Pacotes de um cliente (`/admin/clientes/:id → aba Pacotes`)

**Requer implementação de backend (endpoint `/hours-packages/clients/:clientId`).**

Exibir:
- Lista de `ClientHoursPackage` do cliente
- Para cada: nome do pacote, horas restantes / total, data de expiração, status

Ação disponível:
- Atribuir pacote manualmente ao cliente → `POST /hours-packages/:id/assign` com `{ clientId }`

---

## Front Cliente — Guia de implementação

### Tela: Loja de Pacotes (`/pacotes`)

**Endpoint:**
```
GET /hours-packages
```
(sem `activeOnly=false` → retorna apenas ativos por padrão)

**Card de pacote:**
```
┌─────────────────────────────┐
│  Pack 10h                   │
│  10 horas de quadra         │
│                             │
│  R$ 400,00                  │
│  Economia de 20%            │
│  Válido por 90 dias         │
│                             │
│  [Adquirir pacote]          │
└─────────────────────────────┘
```

**Compra:**
```
POST /hours-packages/:id/purchase
```
Sem body (cliente identificado pelo JWT). Resposta: `ClientHoursPackageResponseDto`.

---

### Tela: Meus Pacotes (`/meus-pacotes`)

**Endpoint:**
```
GET /hours-packages/my-packages
```

Exibir para cada pacote ativo:
- Nome, horas restantes (barra de progresso), data de expiração
- Alerta visual se expirar em ≤ 7 dias
- Ocultar pacotes expirados ou esgotados (ou exibir como "expirado" em cinza)

```
┌──────────────────────────────────────┐
│  Pack 10h                            │
│  ████████░░░░  7h restantes de 10h   │
│  Expira em 15/07/2026               │
└──────────────────────────────────────┘
```

---

### Fluxo de agendamento com pacote

**Passo a passo na tela de criação de agendamento:**

1. Cliente preenche quadra + data + horário
2. Frontend chama `GET /hours-packages/my-packages` em paralelo com `POST /promotion-application/check-all`
3. Se cliente tem pacote ativo com horas suficientes para a reserva, exibir opção:

```
┌─────────────────────────────────────────────┐
│  Forma de pagamento                         │
│                                             │
│  ○ Pagar normalmente      R$ 200,00         │
│  ● Usar Pack 10h          R$ 0,00           │
│    (7h restantes → ficará com 5h)           │
│                                             │
│  ○ Promoção Happy Hour    R$ 160,00 (-20%)  │
└─────────────────────────────────────────────┘
```

4. Se o cliente escolher o pacote, enviar `clientPackageId` no body do agendamento:

```
POST /bookings
{
  "courtId": "uuid",
  "sportId": "uuid",
  "clientId": "uuid",
  "date": "2026-05-10",
  "startTime": "17:00",
  "endTime": "19:00",
  "clientPackageId": "uuid-do-cliente-hours-package"
}
```

5. Backend valida e debita as horas. Se pacote tiver horas insuficientes (ex: reserva = 3h, saldo = 2h), retornar erro `400` indicando saldo insuficiente — neste caso o cliente deve escolher outra forma.

> **Regra:** pacote e promoção são mutuamente exclusivos — não aplicar os dois simultaneamente.

---

## Resumo de prioridades de implementação

| Prioridade | O que fazer |
|---|---|
| 1 | Criar model `ClientHoursPackage` no schema + migration |
| 2 | Endpoint `POST /hours-packages/:id/purchase` |
| 3 | Endpoint `GET /hours-packages/my-packages` |
| 4 | Integrar `clientPackageId` no `POST /bookings` |
| 5 | Endpoint `POST /hours-packages/:id/assign` (admin) |
| 6 | Endpoint `GET /hours-packages/clients/:clientId` (admin) |
| 7 | Fronts: loja, meus pacotes, seleção no agendamento |
