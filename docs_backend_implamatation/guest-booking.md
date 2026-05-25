# Manual Booking — Agendamento Manual (Painel Admin)

Referência completa para o formulário de agendamento manual criado por funcionários e admins.

---

## Mudanças recentes

| Campo | Antes | Agora |
|---|---|---|
| `sportId` | não existia | **obrigatório** — esporte selecionado pelo operador |
| `clientId` | obrigatório | opcional |
| `guestName` | não existia | obrigatório quando `clientId` ausente |

---

## Regras de negócio

### Esporte
- `sportId` é **sempre obrigatório** independente do tipo de cliente
- Todas as quadras suportam todos os esportes cadastrados
- Liste os esportes disponíveis via `GET /sports` antes de renderizar o formulário
- Se o esporte não existir ou estiver inativo → **404 / 400**

### Cliente
| Cenário | `clientId` | `guestName` | Promoções/cashback |
|---|---|---|---|
| Cliente cadastrado | UUID válido | ignorado | ✅ aplicados |
| Visitante sem cadastro | ausente | obrigatório (≥ 2 chars) | ❌ não aplicados |
| Nenhum dos dois | ausente | ausente | ❌ **400 Bad Request** |

---

## Endpoints relevantes

### Listar esportes (para preencher dropdown)

```
GET /sports
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "id": "c2a97e1c-15df-59d2-958a-c86c051ffb19",
    "name": "Futebol",
    "description": null,
    "icon": null,
    "active": true,
    "createdAt": "2026-04-09T00:00:00.000Z"
  }
]
```

---

### Criar agendamento

```
POST /bookings
Authorization: Bearer <token>  — role: ADMIN ou EMPLOYEE
Content-Type: application/json
```

**Request body:**
```ts
{
  courtId:        string    // UUID da quadra — obrigatório
  sportId:        string    // UUID do esporte — obrigatório
  clientId?:      string    // UUID do usuário cadastrado — opcional
  guestName?:     string    // nome do visitante (min 2 chars) — obrigatório se sem clientId
  date:           string    // "YYYY-MM-DD"
  startTime:      string    // "HH:mm"
  endTime:        string    // "HH:mm"
  cashbackUsed?:  number    // valor do cashback a descontar (só com clientId)
  notes?:         string
  splitPayment?:  boolean
  numberOfPeople?: number   // padrão: 1
}
```

**Exemplo — cliente cadastrado:**
```json
{
  "courtId": "6ba59f13-c56d-59f2-8526-386741f59b08",
  "sportId": "c2a97e1c-15df-59d2-958a-c86c051ffb19",
  "clientId": "a1b2c3d4-0000-0000-0000-000000000001",
  "date": "2026-04-10",
  "startTime": "14:00",
  "endTime": "15:00"
}
```

**Exemplo — visitante sem cadastro:**
```json
{
  "courtId": "6ba59f13-c56d-59f2-8526-386741f59b08",
  "sportId": "c2a97e1c-15df-59d2-958a-c86c051ffb19",
  "guestName": "João Silva",
  "date": "2026-04-10",
  "startTime": "14:00",
  "endTime": "15:00"
}
```

---

**Response 201:**
```ts
{
  id:               string
  courtId:          string
  clientId?:        string          // presente apenas se cliente cadastrado
  guestName?:       string          // presente apenas se visitante
  sport?: {                         // esporte selecionado no agendamento
    id:   string
    name: string
  }
  date:             string          // ISO 8601
  startTime:        string          // "HH:mm"
  endTime:          string          // "HH:mm"
  calculatedAmount: number
  cashbackUsed:     number
  finalAmount:      number
  status:           "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  paymentStatus:    "PENDING" | "PAID" | "PARTIALLY_PAID" | "CANCELLED" | "REFUNDED"
  notes?:           string
  splitPayment:     boolean
  numberOfPeople:   number
  createdAt:        string
  updatedAt:        string
  confirmedAt?:     string
  cancelledAt?:     string
  court?: {
    id:           string
    name:         string
    pricePerHour: number
    sport: {              // esporte padrão da quadra (pode diferir do esporte do agendamento)
      id:   string
      name: string
    }
  }
  client?: {              // presente apenas se cliente cadastrado
    id:    string
    name:  string
    email: string
  }
}
```

---

## Erros comuns

| Status | Campo | Quando ocorre |
|---|---|---|
| `400` | `sportId` | ausente ou não é UUID válido |
| `400` | `guestName` | `clientId` ausente e `guestName` também ausente ou < 2 chars |
| `400` | `date` | fora do formato `YYYY-MM-DD` |
| `400` | `startTime`/`endTime` | fora do formato `HH:mm` |
| `400` | — | esporte inativo |
| `400` | — | quadra inativa |
| `401` | — | token ausente ou inválido |
| `403` | — | role `CLIENT` tentando criar agendamento manual |
| `404` | `courtId` | quadra não encontrada |
| `404` | `sportId` | esporte não encontrado |
| `409` | — | quadra já reservada no horário |

---

## Lógica do formulário

```
┌────────────────────────────────────────────┐
│ 1. Selecionar quadra  (GET /courts)         │
│ 2. Selecionar esporte (GET /sports) ← NOVO │
│ 3. Selecionar data e horário               │
│ 4. Cliente cadastrado?                      │
│     ○ Sim → buscar user → clientId          │
│     ○ Não → campo "Nome do visitante"       │
│ 5. Campos opcionais: notas, rateio, nº pax  │
└────────────────────────────────────────────┘
```

**Pseudocódigo do payload:**
```ts
const payload = {
  courtId:   selectedCourt.id,
  sportId:   selectedSport.id,   // sempre presente
  date,
  startTime,
  endTime,
  ...(isRegisteredClient
    ? { clientId: selectedUser.id }
    : { guestName: guestNameInput }),
  ...(notes            && { notes }),
  ...(splitPayment     && { splitPayment }),
  ...(numberOfPeople > 1 && { numberOfPeople }),
};
```

> **Nota:** `cashbackUsed` só deve ser exibido/enviado quando `clientId` estiver preenchido.

---

## Como identificar agendamento de visitante na listagem

```ts
const isGuest      = !booking.clientId && !!booking.guestName;
const displayName  = isGuest ? booking.guestName : booking.client?.name;
const displaySport = booking.sport?.name ?? booking.court?.sport?.name;
```

> `booking.sport` é o esporte **selecionado no agendamento**.  
> `booking.court.sport` é o esporte padrão da quadra — pode ser diferente quando a arena suportar múltiplos esportes por quadra no futuro.

---

## Regra de negócio

| Cenário | `clientId` | `guestName` | Promoções/cashback |
|---|---|---|---|
| Cliente cadastrado | UUID válido | ignorado | ✅ aplicados |
| Visitante sem cadastro | ausente / null | obrigatório (≥ 2 chars) | ❌ não aplicados |
| Nenhum dos dois | ausente | ausente | ❌ **400 Bad Request** |

---

## Endpoint

```
POST /bookings
Authorization: Bearer <token>  — role: ADMIN ou EMPLOYEE
Content-Type: application/json
```

---

## Request body

```ts
{
  courtId:       string   // UUID da quadra — obrigatório
  clientId?:     string   // UUID do usuário cadastrado — opcional
  guestName?:    string   // nome do visitante — obrigatório quando clientId ausente (mín. 2 chars)
  date:          string   // "YYYY-MM-DD"
  startTime:     string   // "HH:mm"
  endTime:       string   // "HH:mm"
  cashbackUsed?: number   // valor a descontar do cashback (só com clientId)
  notes?:        string   // observações
  splitPayment?: boolean  // rachar entre amigos
  numberOfPeople?: number // padrão: 1
}
```

### Exemplos

**Com cliente cadastrado:**
```json
{
  "courtId": "6ba59f13-c56d-59f2-8526-386741f59b08",
  "clientId": "a1b2c3d4-0000-0000-0000-000000000001",
  "date": "2026-04-10",
  "startTime": "14:00",
  "endTime": "15:00"
}
```

**Visitante sem cadastro:**
```json
{
  "courtId": "6ba59f13-c56d-59f2-8526-386741f59b08",
  "guestName": "João Silva",
  "date": "2026-04-10",
  "startTime": "14:00",
  "endTime": "15:00"
}
```

---

## Response — 201 Created

```ts
{
  id:               string          // UUID do agendamento
  courtId:          string
  clientId?:        string          // presente apenas se cliente cadastrado
  guestName?:       string          // presente apenas se visitante
  date:             string          // ISO 8601
  startTime:        string          // "HH:mm"
  endTime:          string          // "HH:mm"
  calculatedAmount: number
  cashbackUsed:     number
  finalAmount:      number
  status:           BookingStatus   // "PENDING" | "CONFIRMED" | "CANCELLED"
  paymentStatus:    PaymentStatus   // "PENDING" | "PAID" | "REFUNDED"
  notes?:           string
  splitPayment:     boolean
  numberOfPeople:   number
  createdAt:        string
  updatedAt:        string
  confirmedAt?:     string
  cancelledAt?:     string
  court?: {
    id:           string
    name:         string
    pricePerHour: number
    sport: {
      id:   string
      name: string
    }
  }
  client?: {         // presente apenas se cliente cadastrado
    id:    string
    name:  string
    email: string
  }
}
```

---

## Erros comuns

| Status | Quando ocorre |
|---|---|
| `400 Bad Request` | `clientId` e `guestName` ausentes ao mesmo tempo |
| `400 Bad Request` | `guestName` com menos de 2 caracteres |
| `400 Bad Request` | `date` fora do formato `YYYY-MM-DD` |
| `400 Bad Request` | `startTime`/`endTime` fora do formato `HH:mm` |
| `401 Unauthorized` | Token ausente ou inválido |
| `403 Forbidden` | Role CLIENT tentando criar agendamento manual |
| `404 Not Found` | `courtId` não encontrado |
| `409 Conflict` | Quadra já reservada no horário |

---

## Lógica do formulário no front

```
┌─────────────────────────────────────────┐
│ Cliente cadastrado?                     │
│  ○ Sim → mostrar campo de busca de user │
│  ○ Não → mostrar campo "Nome do cliente"│
└─────────────────────────────────────────┘
```

**Pseudocódigo de montagem do payload:**
```ts
const payload = {
  courtId,
  date,
  startTime,
  endTime,
  ...(isRegisteredClient
    ? { clientId: selectedUser.id }
    : { guestName: guestNameInput }),
  ...(notes     && { notes }),
  ...(splitPayment !== undefined && { splitPayment }),
  ...(numberOfPeople > 1 && { numberOfPeople }),
};
```

> **Cashback:** o campo `cashbackUsed` só deve ser exibido/enviado quando `clientId` estiver preenchido. Para visitantes o backend ignora qualquer promoção.

---

## Como identificar agendamento de visitante na listagem

```ts
const isGuest = !booking.clientId && !!booking.guestName;
const displayName = isGuest ? booking.guestName : booking.client?.name;
```
