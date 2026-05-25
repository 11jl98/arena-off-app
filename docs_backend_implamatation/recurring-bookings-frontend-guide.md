# Aulas Mensalistas (Recurring Bookings) — Guia de Integração Frontend

> Versão: 16/05/2026 (v2 — pagamentos mensais)
> Base URL: `/recurring-bookings`  
> Acesso: somente **ADMIN** e **EMPLOYEE** (JWT obrigatório)

---

## Visão Geral

O sistema de aulas mensalistas permite ao admin criar um **plano recorrente** que gera automaticamente todas as reservas de um período. Por exemplo: *"Futevôlei, Quadra 2, segunda e quarta, 19:00–20:00, de junho a agosto"* cria ~26 reservas de uma vez, cada uma bloqueando o slot normalmente no sistema de disponibilidade.

### Fluxo recomendado na UI

```
1. Admin preenche o formulário (igual à imagem "Nova Agenda — Mensalista")
      ↓
2. POST /recurring-bookings/preview   ← retorna conflitos e preço total SEM criar nada
      ↓
3. Exibir resumo ao admin:
   - Datas disponíveis (verde)
   - Datas com conflito (vermelho)
   - Valor total estimado
      ↓
4a. Sem conflitos → POST /recurring-bookings  (skipConflicts: false)
4b. Com conflitos → mostrar modal de confirmação
      → "Criar mesmo assim, pulando as datas conflitantes?"  → POST com skipConflicts: true
      → "Cancelar"
      ↓
5. Exibir resultado: plano criado + lista de reservas geradas + datas puladas
```

---

## Interfaces TypeScript

```ts
// ─── Dias da semana ──────────────────────────────────
// 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta,
// 4 = Quinta,  5 = Sexta,   6 = Sábado

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ─── Status do plano ─────────────────────────────────
type RecurringPlanStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

// ─── Tipo de reserva (novo campo em Booking) ─────────
type BookingType = 'AVULSO' | 'MENSALISTA' | 'EVENTO';

// ─── Request: Preview ────────────────────────────────
interface PreviewRecurringBookingRequest {
  courtId: string;           // UUID
  sportId?: string;          // UUID (opcional)
  clientId?: string;         // UUID — obrigatório se não informar guestName
  guestName?: string;        // obrigatório se não informar clientId
  startDate: string;         // "YYYY-MM-DD"
  endDate: string;           // "YYYY-MM-DD"
  daysOfWeek: DayOfWeek[];   // ex: [1, 3] = segunda e quarta
  startTime: string;         // "HH:mm"
  endTime: string;           // "HH:mm"
  promotionId?: string;      // UUID (opcional)
}

// ─── Response: Preview ───────────────────────────────
interface RecurringBookingPreviewResponse {
  totalOccurrences: number;       // total de datas no período (disponíveis + conflitos)
  availableDates: string[];       // datas livres "YYYY-MM-DD"
  conflictDates: string[];        // datas ocupadas "YYYY-MM-DD"
  pricePerBooking: number;        // preço base por aula (sem promoção)
  totalAmount: number;            // totalOccurrences disponíveis × pricePerBooking
  promotionApplied?: {
    id: string;
    name: string;
    discountAmount: number;
    finalPricePerBooking: number;
    totalAmountWithDiscount: number;
  };
}

// ─── Request: Criar plano ────────────────────────────
interface CreateRecurringBookingRequest extends PreviewRecurringBookingRequest {
  skipConflicts?: boolean;  // false (padrão) = rejeita se houver conflito
  notes?: string;
}

// ─── Response: Plano criado / detalhes ───────────────
interface RecurringBookingResponse {
  id: string;
  courtId: string;
  clientId?: string;
  guestName?: string;
  sportId?: string;
  startDate: string;         // ISO date
  endDate: string;           // ISO date
  daysOfWeek: DayOfWeek[];
  startTime: string;
  endTime: string;
  notes?: string;
  status: RecurringPlanStatus;
  bookingsCreated: number;   // quantas reservas foram geradas
  skippedDates: string[];    // datas que foram puladas por conflito
  createdAt: string;
  updatedAt: string;
  court?: { id: string; name: string };
  client?: { id: string; name: string; email: string };
  sport?: { id: string; name: string };
  bookings?: BookingResponse[];           // preenchido apenas no GET /:id
  monthlyPayments?: RecurringPlanPayment[]; // preenchido apenas no GET /:id
}

// ─── Booking (campos novos) ───────────────────────────
// O objeto BookingResponse existente ganhou dois campos:
interface BookingResponse {
  // ... campos existentes ...
  bookingType: BookingType;      // "AVULSO" | "MENSALISTA" | "EVENTO"
  recurringPlanId?: string;      // UUID do plano pai (se for mensalista)
}

// ─── Pagamento mensal do plano ────────────────────────
interface RecurringPlanPayment {
  id: string;
  planId: string;
  month: number;         // 1–12
  year: number;
  amount: number;        // valor total do mês (nº de aulas × preço por aula)
  bookingCount: number;  // nº de aulas naquele mês
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paidAt?: string;       // ISO datetime — preenchido ao registrar o pagamento
  notes?: string;
  createdAt: string;
}

// ─── Request: registrar pagamento de um mês ──────────
interface RegisterMonthlyPaymentRequest {
  month: number;   // 1–12
  year: number;
  notes?: string;  // ex: "Pago em dinheiro"
}
```

---

## Endpoints

### 1. `POST /recurring-bookings/preview`

Simula o plano **sem criar nada**. Use para mostrar o resumo ao admin antes de confirmar.

**Request:**
```json
{
  "courtId": "uuid-da-quadra",
  "sportId": "uuid-do-esporte",
  "clientId": "uuid-do-cliente",
  "startDate": "2026-06-02",
  "endDate": "2026-08-29",
  "daysOfWeek": [1, 3],
  "startTime": "19:00",
  "endTime": "20:00"
}
```

**Response `200`:**
```json
{
  "totalOccurrences": 26,
  "availableDates": [
    "2026-06-02",
    "2026-06-04",
    "2026-06-08",
    "..."
  ],
  "conflictDates": [
    "2026-06-22"
  ],
  "pricePerBooking": 80.00,
  "totalAmount": 2000.00,
  "promotionApplied": null
}
```

**Erros possíveis:**
| Código | Mensagem | Causa |
|--------|----------|-------|
| `400` | `No occurrences found for the given date range and days of week` | Nenhuma data do período bate com os dias selecionados |
| `400` | `endTime must be after startTime` | Horário inválido |
| `404` | `Court not found` | quadra inexistente |

---

### 2. `POST /recurring-bookings`

Cria o plano e gera todas as reservas.

**Request (sem conflitos):**
```json
{
  "courtId": "uuid-da-quadra",
  "sportId": "uuid-do-esporte",
  "clientId": "uuid-do-cliente",
  "startDate": "2026-06-02",
  "endDate": "2026-08-29",
  "daysOfWeek": [1, 3],
  "startTime": "19:00",
  "endTime": "20:00",
  "notes": "Aula de futevôlei — turma avançada",
  "skipConflicts": false
}
```

**Request (pulando conflitos):**
```json
{
  "courtId": "uuid-da-quadra",
  "startDate": "2026-06-02",
  "endDate": "2026-08-29",
  "daysOfWeek": [1, 3],
  "startTime": "19:00",
  "endTime": "20:00",
  "skipConflicts": true
}
```

**Response `201` — sucesso:**
```json
{
  "id": "uuid-do-plano",
  "courtId": "uuid-da-quadra",
  "clientId": "uuid-do-cliente",
  "sportId": "uuid-do-esporte",
  "startDate": "2026-06-02T00:00:00.000Z",
  "endDate": "2026-08-29T00:00:00.000Z",
  "daysOfWeek": [1, 3],
  "startTime": "19:00",
  "endTime": "20:00",
  "notes": "Aula de futevôlei — turma avançada",
  "status": "ACTIVE",
  "bookingsCreated": 25,
  "skippedDates": ["2026-06-22"],
  "createdAt": "2026-05-16T17:45:00.000Z",
  "updatedAt": "2026-05-16T17:45:00.000Z",
  "court": { "id": "uuid", "name": "Quadra de Areia 2" },
  "client": { "id": "uuid", "name": "João Silva", "email": "joao@email.com" },
  "sport": { "id": "uuid", "name": "Futevôlei" }
}
```

> **Nota:** o campo `bookings` **não** é retornado na criação. Use `GET /:id` para listar todas as reservas do plano.

**Response `409` — conflito com `skipConflicts: false`:**
```json
{
  "statusCode": 409,
  "message": {
    "message": "Some dates have conflicts. Use skipConflicts=true to skip them.",
    "conflictDates": ["2026-06-22", "2026-07-06"]
  },
  "error": "Conflict"
}
```

> Para ler os conflitos: `error.response.message.conflictDates`

**Response `409` — todas as datas ocupadas:**
```json
{
  "statusCode": 409,
  "message": "All dates in the range are already booked. Cannot create plan.",
  "error": "Conflict"
}
```

---

### 3. `GET /recurring-bookings`

Lista planos com filtros opcionais.

**Query params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `clientId` | UUID | Filtrar por cliente |
| `courtId` | UUID | Filtrar por quadra |
| `status` | string | `ACTIVE` \| `CANCELLED` \| `COMPLETED` |

**Exemplo:**
```
GET /recurring-bookings?courtId=uuid&status=ACTIVE
```

**Response `200`:** array de `RecurringBookingResponse[]` (sem o campo `bookings`)

---

### 4. `GET /recurring-bookings/:id`

Retorna o plano com **todas as reservas** associadas.

**Response `200`:**
```json
{
  "id": "uuid-do-plano",
  "status": "ACTIVE",
  "bookingsCreated": 25,
  "skippedDates": ["2026-06-22"],
  "monthlyPayments": [
    {
      "id": "uuid-payment-junho",
      "planId": "uuid-do-plano",
      "month": 6,
      "year": 2026,
      "amount": 640.00,
      "bookingCount": 8,
      "status": "PENDING",
      "paidAt": null,
      "createdAt": "2026-05-16T18:00:00.000Z"
    },
    {
      "id": "uuid-payment-julho",
      "planId": "uuid-do-plano",
      "month": 7,
      "year": 2026,
      "amount": 720.00,
      "bookingCount": 9,
      "status": "PENDING",
      "paidAt": null,
      "createdAt": "2026-05-16T18:00:00.000Z"
    }
  ],
  "bookings": [
    {
      "id": "uuid-reserva-1",
      "date": "2026-06-02T00:00:00.000Z",
      "startTime": "19:00",
      "endTime": "20:00",
      "status": "CONFIRMED",
      "paymentStatus": "PENDING",
      "bookingType": "MENSALISTA",
      "recurringPlanId": "uuid-do-plano",
      "calculatedAmount": 80.00,
      "finalAmount": 80.00
    }
  ]
}
```

---

### 5. `GET /recurring-bookings/:id/payments`

Lista as **faturas mensais** do plano. Cada fatura cobre um mês/ano.

**Response `200`:** array de `RecurringPlanPayment[]`

```json
[
  {
    "id": "uuid-payment-junho",
    "planId": "uuid-do-plano",
    "month": 6,
    "year": 2026,
    "amount": 640.00,
    "bookingCount": 8,
    "status": "PENDING",
    "paidAt": null,
    "createdAt": "2026-05-16T18:00:00.000Z"
  },
  {
    "id": "uuid-payment-julho",
    "planId": "uuid-do-plano",
    "month": 7,
    "year": 2026,
    "amount": 720.00,
    "bookingCount": 9,
    "status": "PENDING",
    "paidAt": null,
    "createdAt": "2026-05-16T18:00:00.000Z"
  }
]
```

---

### 6. `POST /recurring-bookings/:id/payments`

Registra o recebimento de **um mês específico** do plano. Quando confirmado:
- A fatura daquele mês muda para `status: "PAID"`
- Todas as reservas daquele mês mudam para `paymentStatus: "PAID"`

**Request:**
```json
{
  "month": 6,
  "year": 2026,
  "notes": "Pago em dinheiro — 01/06/2026"
}
```

**Response `200`:** a fatura atualizada
```json
{
  "id": "uuid-payment-junho",
  "planId": "uuid-do-plano",
  "month": 6,
  "year": 2026,
  "amount": 640.00,
  "bookingCount": 8,
  "status": "PAID",
  "paidAt": "2026-06-01T10:00:00.000Z",
  "notes": "Pago em dinheiro — 01/06/2026",
  "createdAt": "2026-05-16T18:00:00.000Z"
}
```

**Erros possíveis:**
| Código | Mensagem | Causa |
|--------|----------|-------|
| `404` | `Recurring booking plan not found` | ID do plano inválido |
| `404` | `No payment record found for 6/2026` | Mês/ano não pertence ao plano |
| `400` | `Payment for 6/2026 is already registered as paid` | Já foi pago |
| `400` | `Cannot register payment for a cancelled plan` | Plano cancelado |

---

### 7. `POST /recurring-bookings/:id/cancel`

Cancela o plano e todas as reservas **futuras** (data ≥ hoje). Reservas passadas ficam intactas.
As faturas mensais **PENDING** a partir do mês atual também são marcadas como `CANCELLED`.

**Response `200`:** plano atualizado com `status: "CANCELLED"` e `bookings` com datas futuras em `status: "CANCELLED"`

**Erros possíveis:**
| Código | Mensagem | Causa |
|--------|----------|-------|
| `404` | `Recurring booking plan not found` | ID inválido |
| `400` | `Plan is already cancelled` | Já cancelado |

---

## Comportamento das reservas geradas

Cada reserva mensalista difere das avulsas:

| Campo | Avulso | Mensalista |
|-------|--------|------------|
| `status` inicial | `PENDING` | `CONFIRMED` |
| `pendingExpiresAt` | 30 min após criação | `null` (não expira) |
| `bookingType` | `AVULSO` | `MENSALISTA` |
| `recurringPlanId` | `null` | UUID do plano |
| `paymentStatus` inicial | `PENDING` | `PENDING` (até o admin registrar o mês) |

Ao usar `POST /:id/payments`, **todas as reservas do mês indicado** passam para `paymentStatus: PAID` automaticamente.

### Modelo de pagamento

O sistema gera automaticamente **uma fatura por mês** ao criar o plano:

```
Plano: Futevôlei, seg+qua, 19:00–20:00, junho–agosto 2026
Quadra: R$ 80,00/aula

→ Fatura junho/2026:  8 aulas × R$80 = R$640  (PENDING)
→ Fatura julho/2026:  9 aulas × R$80 = R$720  (PENDING)
→ Fatura agosto/2026: 8 aulas × R$80 = R$640  (PENDING)
```

O pagamento é **manual** — o admin registra o recebimento mês a mês via `POST /:id/payments`.

---

## Implementação sugerida da UI

### Formulário "Nova Agenda — Mensalista"

Baseado na tela da imagem, o formulário precisa dos seguintes campos:

```
┌─────────────────────────────────────────────────┐
│  Tipo: ○ Avulso  ● Mensalista  ○ Evento          │
│                                                   │
│  Cliente: [busca por nome/email/doc]  [Novo]      │
│                                                   │
│  Quadra: [select]                                 │
│  Esporte: [select]                                │
│                                                   │
│  Data Início: [date picker]                       │
│  Data Fim:    [date picker]                       │
│                                                   │
│  Dias da semana: ☐ Dom ☑ Seg ☐ Ter ☑ Qua         │
│                  ☐ Qui ☐ Sex ☐ Sáb               │
│                                                   │
│  Horário Início: [HH:mm]  Horário Fim: [HH:mm]   │
│  ou: Horário Início + Duração (calcular endTime)  │
│                                                   │
│  Observações: [textarea opcional]                 │
│                                                   │
│  [Verificar Disponibilidade]                      │
└─────────────────────────────────────────────────┘
```

### Componente de preview (após `POST /preview`)

```
┌──────────────────────────────────────────────────┐
│  Resumo do Plano                                 │
│                                                  │
│  Total de ocorrências: 26                        │
│  ✅ Disponíveis: 25                              │
│  ❌ Com conflito: 1                              │
│                                                  │
│  Datas com conflito:                             │
│  • 22/06/2026  ← tooltip ou modal com detalhe   │
│                                                  │
│  Valor por aula: R$ 80,00                        │
│  Valor total: R$ 2.000,00                        │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │   Cancelar   │  │  Criar Plano (25 aulas) │   │
│  └──────────────┘  └────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

Quando houver conflitos, antes de chamar `POST /recurring-bookings`, exibir modal:

```
⚠️ Existem 1 data(s) com conflito.
Deseja criar o plano pulando essas datas?

As seguintes datas serão ignoradas:
• 22/06/2026

[Cancelar]  [Criar mesmo assim]
```

### Tratamento de erros

```ts
async function criarPlano(data: CreateRecurringBookingRequest) {
  try {
    const response = await api.post('/recurring-bookings', data);
    return response.data;
  } catch (err) {
    if (err.response?.status === 409) {
      const body = err.response.data;
      // conflito com datas específicas
      if (body.message?.conflictDates) {
        return { conflictDates: body.message.conflictDates };
      }
      // todas as datas ocupadas
      showError(body.message);
    }
    throw err;
  }
}
```

---

## Mapeamento de dias da semana

```ts
const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

// Exibir dias do plano:
plan.daysOfWeek.map(d => DAY_LABELS[d]).join(', ')
// "Segunda, Quarta"
```

---

## Permissões

| Ação | CLIENT | EMPLOYEE | ADMIN |
|------|--------|----------|-------|
| Preview | ❌ | ✅ | ✅ |
| Criar plano | ❌ | ✅ | ✅ |
| Listar planos | ❌ | ✅ | ✅ |
| Ver detalhe (GET /:id) | ❌ | ✅ | ✅ |
| Listar faturas (GET /:id/payments) | ❌ | ✅ | ✅ |
| Registrar pagamento (POST /:id/payments) | ❌ | ✅ | ✅ |
| Cancelar plano | ❌ | ✅ | ✅ |
| Ver reserva individual (via `/bookings`) | ✅ (própria) | ✅ | ✅ |

---

## Impacto em funcionalidades existentes

### `GET /bookings/available-slots`
As datas geradas pelo plano mensalista **bloqueiam** os slots normalmente. Nenhuma mudança necessária no front.

### `GET /bookings`
As reservas mensalistas aparecem na listagem normal com os novos campos `bookingType: "MENSALISTA"` e `recurringPlanId`. O front pode:
- Exibir um badge "Mensalista" nas reservas com `bookingType === "MENSALISTA"`
- Linkar para o plano pai via `recurringPlanId`

### `POST /bookings/:id/cancel`
Continua funcionando para cancelar **uma reserva individual** do plano, sem afetar as demais. Para cancelar o plano inteiro, usar `POST /recurring-bookings/:id/cancel`.

---

## Checklist de implementação

- [ ] Formulário com toggle Avulso / Mensalista / Evento
- [ ] Seleção de múltiplos dias da semana (checkboxes 0–6)
- [ ] Data início + data fim (date range picker)
- [ ] Botão "Verificar Disponibilidade" → chama `POST /preview`
- [ ] Componente de resumo com datas disponíveis e conflitantes
- [ ] Modal de confirmação quando há conflitos
- [ ] Chamada `POST /recurring-bookings` com `skipConflicts`
- [ ] Tela de detalhe do plano com lista de aulas (GET /:id)
- [ ] **Seção de faturas mensais no detalhe do plano** (GET /:id — campo `monthlyPayments`)
- [ ] **Botão "Registrar Pagamento" por fatura** → abre modal com campo de observação → `POST /:id/payments`
- [ ] **Exibir status de cada fatura:** PENDING (amarelo), PAID (verde), CANCELLED (cinza)
- [ ] **Badge "Pago" nas reservas do mês após pagamento registrado** (`paymentStatus === "PAID"`)
- [ ] Botão "Cancelar Plano" com confirmação
- [ ] Badge "Mensalista" na agenda/listagem de reservas
- [ ] Link da reserva → plano pai (quando `recurringPlanId` presente)
- [ ] Filtro por `status` na listagem de planos (`ACTIVE`, `CANCELLED`, `COMPLETED`)
