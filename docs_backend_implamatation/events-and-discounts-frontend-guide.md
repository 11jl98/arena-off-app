# Events & Discounts — Frontend Implementation Guide

> **Data de implementação:** 18 de maio de 2026  
> **Escopo:** Agendamentos de Eventos (multi-quadra) + Descontos manuais em Eventos e Mensalistas + Dados de Eventos no Dashboard e Relatórios

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Novos Tipos e Enums](#novos-tipos-e-enums)
3. [Módulo de Eventos](#módulo-de-eventos)
   - [Preview de Evento](#1-preview-de-evento)
   - [Criar Evento](#2-criar-evento)
   - [Listar Eventos](#3-listar-eventos)
   - [Buscar Evento por ID](#4-buscar-evento-por-id)
   - [Registrar Pagamento do Evento](#5-registrar-pagamento-do-evento)
   - [Cancelar Evento](#6-cancelar-evento)
4. [Descontos em Mensalistas](#descontos-em-mensalistas)
   - [Criar Plano com Desconto](#criar-plano-mensalista-com-desconto)
   - [Atualizar Desconto](#atualizar-desconto-de-plano-existente)
5. [Dashboard — Mudanças](#dashboard--mudanças)
   - [Novo card: eventStats](#novo-card-eventstats)
   - [bookingType em recentBookings](#bookingtype-em-recentbookings)
6. [Relatório Mensal — Mudanças](#relatório-mensal--mudanças)
7. [Schemas TypeScript](#schemas-typescript)
8. [Fluxo Recomendado de UI](#fluxo-recomendado-de-ui)
9. [Regras de Negócio](#regras-de-negócio)

---

## Visão Geral

Esta release adiciona dois grandes blocos de funcionalidade:

| Feature | Descrição |
|---|---|
| **Eventos** | Alocação de múltiplas quadras em datas/horários avulsos para torneios, festivais, etc. |
| **Desconto em Evento** | Desconto por slot (quadra) aplicado antes de fechar o evento — valor absoluto (R$) ou percentual (%) |
| **Desconto em Mensalista** | Desconto manual na criação do plano ou edição posterior via endpoint PATCH dedicado |

Ambos os tipos de agendamento utilizam o enum `DiscountType`:

```
ABSOLUTE   // valor fixo em R$
PERCENTAGE // percentual sobre o preço base da quadra
```

---

## Novos Tipos e Enums

```typescript
type DiscountType = 'ABSOLUTE' | 'PERCENTAGE';

type EventPlanStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

// PaymentStatus já existente — os valores relevantes para eventos:
// 'PENDING' | 'PAID' | 'CANCELLED'
```

---

## Módulo de Eventos

Base URL: `/events`  
Autenticação: `Bearer <token>` — roles `ADMIN` e `EMPLOYEE`

---

### 1. Preview de Evento

Verifica disponibilidade e calcula valores **sem criar nenhum registro**. Use antes de confirmar o evento ao usuário.

```
POST /events/preview
```

**Request body:**

```typescript
{
  name: string;            // nome do evento (mín. 2 chars)
  clientId?: string;       // UUID — se for cliente cadastrado
  guestName?: string;      // obrigatório se clientId não informado
  notes?: string;

  slots: Array<{
    courtId: string;       // UUID da quadra
    sportId?: string;      // UUID do esporte (opcional)
    date: string;          // "YYYY-MM-DD"
    startTime: string;     // "HH:mm"
    endTime: string;       // "HH:mm"
    discountType?: 'ABSOLUTE' | 'PERCENTAGE';  // padrão: ABSOLUTE
    discountValue?: number; // padrão: 0
  }>;
}
```

**Response `200`:**

```typescript
{
  hasConflicts: boolean;   // true = algum slot está indisponível
  totalAmount: number;     // soma dos finalAmount disponíveis
  slots: Array<{
    courtId: string;
    courtName: string;
    date: string;
    startTime: string;
    endTime: string;
    baseAmount: number;      // pricePerHour × horas
    discountType: DiscountType;
    discountValue: number;
    discountAmount: number;  // valor descontado calculado
    finalAmount: number;     // baseAmount - discountAmount
    available: boolean;
    conflictReason?: string; // presente quando available = false
  }>;
}
```

> **UI tip:** mostre cada slot com um indicador verde/vermelho de disponibilidade. Bloqueie o botão "Confirmar" se `hasConflicts = true`.

---

### 2. Criar Evento

Mesmo payload do preview. Se algum slot tiver conflito, a API **rejeita com 409** — não há opção de pular conflitos em eventos.

```
POST /events
```

**Request body:** idêntico ao preview.

**Response `201`:**

```typescript
{
  id: string;
  name: string;
  clientId?: string;
  guestName?: string;
  notes?: string;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  totalAmount: number;
  paidAt?: string;         // ISO 8601
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string; email: string };
  slots: Array<{
    id: string;
    eventPlanId: string;
    courtId: string;
    courtName?: string;
    sportId?: string;
    sportName?: string;
    date: string;          // ISO 8601 date
    startTime: string;
    endTime: string;
    baseAmount: number;
    discountType: DiscountType;
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
  }>;
}
```

**Erro `409` — conflito de slots:**

```typescript
{
  message: "One or more slots have booking conflicts.",
  conflicts: Array<{
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>
}
```

---

### 3. Listar Eventos

```
GET /events
GET /events?clientId=<uuid>
GET /events?status=ACTIVE
GET /events?clientId=<uuid>&status=CANCELLED
```

**Response `200`:** array de `EventBookingResponseDto` (sem `slots` detalhados — apenas contagem via `_count`).

---

### 4. Buscar Evento por ID

```
GET /events/:id
```

**Response `200`:** `EventBookingResponseDto` completo com `slots[]`.

---

### 5. Registrar Pagamento do Evento

Marca o evento inteiro como pago. Não há parcelamento — um evento = um pagamento.

```
POST /events/:id/payment
```

**Request body:**

```typescript
{
  notes?: string;  // observação opcional (ex: "PIX recebido")
}
```

**Response `200`:** `EventBookingResponseDto` com `paymentStatus: "PAID"` e `paidAt` preenchido.

**Erros:**
- `400` — evento já pago
- `400` — evento cancelado
- `404` — evento não encontrado

---

### 6. Cancelar Evento

```
POST /events/:id/cancel
```

**Request body:** vazio `{}`

**Response `200`:** `EventBookingResponseDto` com `status: "CANCELLED"`. Todos os agendamentos futuros vinculados são cancelados automaticamente.

**Erros:**
- `400` — evento já cancelado
- `404` — evento não encontrado

---

## Descontos em Mensalistas

### Criar Plano Mensalista com Desconto

O endpoint `POST /recurring-bookings` agora aceita campos opcionais de desconto:

```typescript
// Campos adicionados ao CreateRecurringBookingDto:
{
  // ... campos já existentes ...
  discountType?: 'ABSOLUTE' | 'PERCENTAGE';
  discountValue?: number;  // >= 0
}
```

O desconto é aplicado **antes** de promoções automáticas. O `calculatedAmount` de cada booking já reflete o desconto.

**Exemplo — R$ 20 de desconto fixo:**
```json
{
  "courtId": "...",
  "startDate": "2026-06-01",
  "endDate": "2026-08-31",
  "daysOfWeek": [1, 3],
  "startTime": "19:00",
  "endTime": "20:00",
  "clientId": "...",
  "discountType": "ABSOLUTE",
  "discountValue": 20
}
```

**Exemplo — 10% de desconto:**
```json
{
  ...
  "discountType": "PERCENTAGE",
  "discountValue": 10
}
```

**Response** agora inclui:
```typescript
{
  // ... campos já existentes ...
  discountType?: DiscountType;
  discountValue?: number;
  manualDiscount?: number;  // valor em R$ calculado e armazenado
}
```

---

### Atualizar Desconto de Plano Existente

Permite editar o desconto de um plano mensalista ativo. Atualiza automaticamente:
- Os campos do plano
- Todos os agendamentos futuros com `paymentStatus: PENDING`
- Os valores dos pagamentos mensais ainda em aberto

```
PATCH /recurring-bookings/:id/discount
```

**Request body:**

```typescript
{
  discountType: 'ABSOLUTE' | 'PERCENTAGE';  // obrigatório
  discountValue: number;                     // obrigatório, >= 0
}
```

**Response `200`:** `RecurringBookingResponseDto` completo com os novos valores de desconto.

**Erros:**
- `400` — plano cancelado
- `404` — plano não encontrado

> **Para remover o desconto:** envie `discountType: "ABSOLUTE"` e `discountValue: 0`.

---

## Schemas TypeScript

Cole no seu projeto de tipos compartilhados:

```typescript
// ─── Enums ────────────────────────────────────────────────────────────────────

export type DiscountType = 'ABSOLUTE' | 'PERCENTAGE';
export type EventPlanStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'REFUNDED';

// ─── Events ───────────────────────────────────────────────────────────────────

export interface CreateEventSlotPayload {
  courtId: string;
  sportId?: string;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
  discountType?: DiscountType;
  discountValue?: number;
}

export interface CreateEventBookingPayload {
  name: string;
  clientId?: string;
  guestName?: string;
  notes?: string;
  slots: CreateEventSlotPayload[];
}

export interface EventSlotPreview {
  courtId: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  baseAmount: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
  available: boolean;
  conflictReason?: string;
}

export interface EventBookingPreview {
  slots: EventSlotPreview[];
  totalAmount: number;
  hasConflicts: boolean;
}

export interface EventSlot {
  id: string;
  eventPlanId: string;
  courtId: string;
  courtName?: string;
  sportId?: string;
  sportName?: string;
  date: string;
  startTime: string;
  endTime: string;
  baseAmount: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
}

export interface EventBooking {
  id: string;
  name: string;
  clientId?: string;
  guestName?: string;
  notes?: string;
  status: EventPlanStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string; email: string };
  slots?: EventSlot[];
}

// ─── Recurring / Mensalista Discount ─────────────────────────────────────────

export interface UpdateRecurringDiscountPayload {
  discountType: DiscountType;
  discountValue: number;
}

// Campos adicionados ao RecurringBookingResponse já existente:
export interface RecurringDiscountFields {
  discountType?: DiscountType;
  discountValue?: number;
  manualDiscount?: number;
}
```

---

## Dashboard — Mudanças

### Endpoint

```
GET /dashboard/stats
```

> Não há parâmetros novos. A resposta agora inclui o campo `eventStats` e o campo `bookingType` em cada item de `recentBookings`.

---

### Novo card: eventStats

Campo adicionado ao objeto de resposta de `GET /dashboard/stats`:

```typescript
eventStats: {
  activeEvents: number;    // eventos com status ACTIVE no sistema
  pendingPayment: number;  // eventos ACTIVE ainda com paymentStatus PENDING
  pendingAmount: number;   // R$ total em aberto (soma de totalAmount dos pendentes)
}
```

**Exemplo de resposta:**

```json
"eventStats": {
  "activeEvents": 4,
  "pendingPayment": 2,
  "pendingAmount": 1850.00
}
```

**Sugestão de card no dashboard:**

```
┌─────────────────────────────────┐
│  🎯 Eventos                     │
│                                 │
│  4 eventos ativos               │
│  2 com pagamento pendente       │
│  R$ 1.850,00 em aberto          │
└─────────────────────────────────┘
```

---

### bookingType em recentBookings

Cada item do array `recentBookings` agora inclui o campo `bookingType`:

```typescript
// antes
interface RecentBooking {
  id: string;
  clientName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
}

// agora
interface RecentBooking {
  id: string;
  clientName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  bookingType: 'AVULSO' | 'MENSALISTA' | 'EVENTO';  // ← novo
}
```

**Uso recomendado:** exibir um badge colorido na listagem de reservas recentes.

```tsx
const BADGE_COLORS = {
  AVULSO:     'bg-blue-100 text-blue-800',
  MENSALISTA: 'bg-purple-100 text-purple-800',
  EVENTO:     'bg-orange-100 text-orange-800',
};

<span className={`badge ${BADGE_COLORS[booking.bookingType]}`}>
  {booking.bookingType}
</span>
```

---

## Relatório Mensal — Mudanças

### Endpoint

```
GET /reports/monthly?year=2026&month=5
```

> Não há parâmetros novos. A resposta agora inclui o campo `eventoStats`.

---

### Novo bloco: eventoStats

Campo adicionado ao objeto de resposta de `GET /reports/monthly`, posicionado **entre `mensalistaStats` e `byCourt`**:

```typescript
eventoStats: {
  totalEvents: number;       // eventos com ao menos 1 slot no período
  totalValue: number;        // soma dos totalAmount de todos os planos
  collectedAmount: number;   // soma dos totalAmount com paymentStatus = 'PAID'
  pendingAmount: number;     // soma dos totalAmount com paymentStatus = 'PENDING'
}
```

**Exemplo de resposta:**

```json
"eventoStats": {
  "totalEvents": 3,
  "totalValue": 4200.00,
  "collectedAmount": 2800.00,
  "pendingAmount": 1400.00
}
```

> **Nota:** Um evento com `status = CANCELLED` nunca aparece em `eventoStats`.
> O campo `byBookingType` do relatório já inclui a entrada `"EVENTO"` automaticamente — os bookings de quadra vinculados ao evento são contabilizados junto com os demais tipos.

**Sugestão de exibição no relatório:**

```
┌──────────────────────────────────────────┐
│  Eventos no Período                      │
│                                          │
│  Total de eventos    │   3               │
│  Faturamento total   │  R$ 4.200,00      │
│  Valor coletado      │  R$ 2.800,00      │
│  A receber           │  R$ 1.400,00      │
└──────────────────────────────────────────┘
```

---

### Tipos TypeScript atualizados

```typescript
export interface EventStats {
  activeEvents: number;
  pendingPayment: number;
  pendingAmount: number;
}

export interface EventoStats {
  totalEvents: number;
  totalValue: number;
  collectedAmount: number;
  pendingAmount: number;
}

// Adicionar a DashboardStatsResponse já existente:
export interface DashboardStatsResponse {
  // ... campos já existentes ...
  eventStats: EventStats;           // ← novo
  recentBookings: RecentBooking[];  // bookingType adicionado ao item
}

// Adicionar a MonthlyReportResponse já existente:
export interface MonthlyReportResponse {
  // ... campos já existentes ...
  eventoStats: EventoStats;  // ← novo (entre mensalistaStats e byCourt)
}
```

---

## Fluxo Recomendado de UI

### Criar Evento

```
1. Usuário seleciona quadras, datas e horários
   └─ Para cada slot, pode definir desconto (tipo + valor)

2. Clique em "Verificar Disponibilidade"
   └─ POST /events/preview
   └─ Mostrar tabela com slots: verde (disponível) / vermelho (conflito)
   └─ Mostrar totalAmount calculado

3. Se hasConflicts = false → habilitar botão "Confirmar Evento"
   Se hasConflicts = true  → bloquear confirmação, destacar conflitos

4. Clique em "Confirmar Evento"
   └─ POST /events
   └─ Redirecionar para tela de detalhes do evento

5. Na tela de detalhes:
   └─ Botão "Registrar Pagamento" → POST /events/:id/payment
   └─ Botão "Cancelar Evento"    → POST /events/:id/cancel
```

### Desconto em Mensalista

```
Ao criar plano (já existente):
  └─ Adicionar campo "Desconto" com toggle ABSOLUTO / PERCENTUAL + input valor
  └─ Mostrar preview do valor com desconto aplicado

Em plano já criado (nova feature):
  └─ Botão "Editar Desconto" → modal com tipo + valor
  └─ PATCH /recurring-bookings/:id/discount
  └─ Feedback: "Desconto atualizado. X agendamentos e Y cobranças mensais foram recalculados."
```

---

## Regras de Negócio

| Regra | Comportamento |
|---|---|
| Conflito em evento | **Bloqueante** — toda a criação é rejeitada se qualquer slot conflitar |
| Conflito em mensalista | **Configurável** — campo `skipConflicts: true` pula datas conflitantes |
| Desconto máximo | Não pode exceder o `baseAmount` do slot/booking (mínimo = R$ 0,00) |
| Desconto PERCENTAGE | Calculado sobre `pricePerHour × horas` — nunca sobre o valor já descontado |
| Pagamento de evento | Um único pagamento para o evento inteiro (não parcelado) |
| Cancelar evento | Cancela automaticamente todos os agendamentos futuros vinculados |
| Atualizar desconto mensalista | Afeta apenas bookings futuros com `paymentStatus = PENDING`; bookings já pagos não são alterados |
| `bookingType` dos agendamentos | Eventos criam bookings com `bookingType: "EVENTO"` |
| Dashboard `revenueToday` | Inclui receita de eventos pagos (além de avulsos) |
