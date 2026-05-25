# API Reference — Reports Module (Relatório Mensal)

**Base URL:** `{API_BASE_URL}`  
**Autenticação:** JWT via cookie `httpOnly` (`accessToken`) **ou** header `Authorization: Bearer {token}`  
**Roles permitidas:** `ADMIN` | `EMPLOYEE`

---

## Visão geral

O módulo de relatórios fornece uma análise completa dos agendamentos de um mês específico. Os dados incluem KPIs de receita, taxas de ocupação por quadra, horários de pico, comparativo com o mês anterior e ranking de clientes.

**Estratégia de cache:**
- **Meses passados:** calculados uma única vez e salvos no banco. Chamadas subsequentes retornam instantaneamente.
- **Mês atual:** sempre recalculado em tempo real (dados ainda mudam).

---

## 1. Relatório Mensal

```
GET /reports/monthly
```

**Auth:** Requerida — Roles: `ADMIN`, `EMPLOYEE`

**Query Params:**

| Parâmetro | Tipo | Obrigatório | Default | Descrição |
|-----------|------|-------------|---------|-----------|
| `year` | number | Não | Ano atual | Ano do relatório (mínimo: 2024) |
| `month` | number | Não | Mês atual | Mês do relatório (1–12) |

**Exemplos:**
```
GET /reports/monthly                    → mês atual
GET /reports/monthly?year=2026&month=4  → abril de 2026
GET /reports/monthly?year=2026&month=1  → janeiro de 2026
```

**Erros:**
| Status | Situação |
|--------|----------|
| `400` | `month` fora do intervalo 1–12, `year` < 2024, ou valores não numéricos |
| `401` | Não autenticado |
| `403` | Role insuficiente (apenas ADMIN e EMPLOYEE) |

---

## 2. Response Schema

```
GET /reports/monthly → 200 OK
```

```json
{
  "period": {
    "year": 2026,
    "month": 5,
    "label": "Maio 2026"
  },
  "generatedAt": "2026-05-04T18:00:00.000Z",
  "summary": {
    "totalBookings": 142,
    "confirmedBookings": 118,
    "cancelledBookings": 14,
    "noShowBookings": 6,
    "completedBookings": 4,
    "pendingBookings": 0,
    "cancellationRate": 9.9,
    "noShowRate": 4.2,
    "grossRevenue": 14200.00,
    "cashbackDiscounts": 850.00,
    "netRevenue": 13350.00,
    "avgBookingValue": 113.14
  },
  "byPaymentMethod": [
    { "method": "PIX", "count": 74, "total": 8920.00 },
    { "method": "CREDIT_CARD", "count": 32, "total": 3800.00 },
    { "method": "CASH", "count": 12, "total": 630.00 }
  ],
  "byCourt": [
    {
      "courtId": "uuid",
      "courtName": "Quadra 1 — Beach Tennis",
      "bookings": 58,
      "confirmedBookings": 52,
      "revenue": 6240.00,
      "occupancyRate": 0.712
    }
  ],
  "bySport": [
    {
      "sportId": "uuid",
      "sportName": "Beach Tennis",
      "bookings": 80,
      "revenue": 9600.00
    }
  ],
  "byDayOfWeek": [
    { "day": 0, "label": "Domingo", "bookings": 28 },
    { "day": 1, "label": "Segunda", "bookings": 12 },
    { "day": 2, "label": "Terça", "bookings": 14 },
    { "day": 3, "label": "Quarta", "bookings": 16 },
    { "day": 4, "label": "Quinta", "bookings": 18 },
    { "day": 5, "label": "Sexta", "bookings": 22 },
    { "day": 6, "label": "Sábado", "bookings": 32 }
  ],
  "byHour": [
    { "hour": 7, "bookings": 4 },
    { "hour": 8, "bookings": 12 },
    { "hour": 9, "bookings": 18 },
    { "hour": 16, "bookings": 22 },
    { "hour": 17, "bookings": 28 },
    { "hour": 18, "bookings": 32 },
    { "hour": 19, "bookings": 26 }
  ],
  "topClients": [
    {
      "clientId": "uuid",
      "name": "João Silva",
      "bookings": 8,
      "totalSpent": 960.00
    }
  ],
  "comparison": {
    "previousMonth": {
      "totalBookings": 130,
      "netRevenue": 12100.00
    },
    "bookingsDelta": 9.2,
    "revenueDelta": 10.3
  }
}
```

---

## 3. Schemas Detalhados

### `PeriodDto`
```typescript
{
  year: number;
  month: number;   // 1–12
  label: string;   // "Maio 2026" (sempre em português)
}
```

### `SummaryDto`
```typescript
{
  totalBookings: number;        // todos os status
  confirmedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancellationRate: number;     // % (0–100), uma casa decimal
  noShowRate: number;           // % (0–100), uma casa decimal
  grossRevenue: number;         // soma de calculatedAmount (CONFIRMED + COMPLETED)
  cashbackDiscounts: number;    // soma de cashbackUsed (CONFIRMED + COMPLETED)
  netRevenue: number;           // grossRevenue - cashbackDiscounts
  avgBookingValue: number;      // netRevenue / confirmedBookings (arredondado)
}
```

### `PaymentMethodStatsDto`
```typescript
{
  method: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "CASHBACK" | "MIXED";
  count: number;   // pagamentos PAID no período
  total: number;   // soma dos valores em R$
}
```

### `CourtStatsDto`
```typescript
{
  courtId: string;
  courtName: string;
  bookings: number;            // todos os status
  confirmedBookings: number;   // apenas CONFIRMED + COMPLETED
  revenue: number;             // receita líquida (calculatedAmount - cashbackUsed)
  occupancyRate: number;       // 0.0–1.0 → multiply by 100 for %
                               // horas CONFIRMED / total de horas disponíveis no mês
                               // baseado nos AvailabilitySlots configurados por quadra
}
```

> **Como renderizar `occupancyRate`:**
> ```javascript
> const pct = (court.occupancyRate * 100).toFixed(1) + '%'
> // → "71.2%"
> ```

### `SportStatsDto`
```typescript
{
  sportId: string;
  sportName: string;
  bookings: number;   // todos os status
  revenue: number;    // receita líquida (CONFIRMED + COMPLETED)
}
```

### `DayOfWeekStatsDto`
```typescript
{
  day: number;    // 0=Domingo, 1=Segunda, ..., 6=Sábado
  label: string;  // "Domingo", "Segunda", etc.
  bookings: number;
}
```

> **Nota:** o array sempre contém todos os 7 dias (0–6). Dias sem agendamentos terão `bookings: 0`.

### `HourStatsDto`
```typescript
{
  hour: number;    // 6–23 (apenas horas com pelo menos 1 agendamento são retornadas)
  bookings: number;
}
```

> **Nota:** o array é esparso — horas sem agendamentos são omitidas para economizar dados.

### `TopClientDto`
```typescript
{
  clientId: string;
  name: string;
  bookings: number;     // todos os status
  totalSpent: number;   // soma de finalAmount (CONFIRMED + COMPLETED)
}
```

> Limitado a **top 10**. Agendamentos de visitantes (`guestName`, sem conta) são excluídos.

### `ComparisonDto`
```typescript
{
  previousMonth: {
    totalBookings: number;
    netRevenue: number;
  };
  bookingsDelta: number | null;  // % variação, null se não houver dados do mês anterior
  revenueDelta: number | null;   // positivo = crescimento, negativo = queda
}
```

---

## 4. Guia de Renderização (Frontend)

### Cards de KPI (topo da página)
Usar os campos de `summary`:

| Card | Campo | Formato |
|------|-------|---------|
| Total de Agendamentos | `summary.totalBookings` | número inteiro |
| Receita Líquida | `summary.netRevenue` | `R$ 13.350,00` |
| Taxa de Cancelamento | `summary.cancellationRate` | `9.9%` |
| Ticket Médio | `summary.avgBookingValue` | `R$ 113,14` |

**Variação com mês anterior** (badge verde/vermelho):
```javascript
const delta = report.comparison.bookingsDelta
if (delta === null) return '—'
return delta > 0 ? `+${delta}%` : `${delta}%`
```

---

### Gráfico de Barras — Agendamentos por Dia da Semana
Fonte: `byDayOfWeek`

```javascript
const labels = report.byDayOfWeek.map(d => d.label)  // ["Domingo", ..., "Sábado"]
const data   = report.byDayOfWeek.map(d => d.bookings)
```

> Recomendação: destaque visualmente o dia com maior valor (`Math.max(...data)`).

---

### Gráfico de Linha — Horários de Pico
Fonte: `byHour`

```javascript
// Preencher horas sem dados com 0 para o eixo X ser contínuo
const allHours = Array.from({ length: 18 }, (_, i) => i + 6) // 6–23
const hourMap  = Object.fromEntries(report.byHour.map(h => [h.hour, h.bookings]))
const data     = allHours.map(h => hourMap[h] ?? 0)
```

---

### Gráfico de Pizza — Métodos de Pagamento
Fonte: `byPaymentMethod`

```javascript
const labels = report.byPaymentMethod.map(p => translateMethod(p.method))
const data   = report.byPaymentMethod.map(p => p.total)

function translateMethod(method) {
  const map = {
    PIX: 'Pix',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    CASH: 'Dinheiro',
    CASHBACK: 'Cashback',
    MIXED: 'Misto',
  }
  return map[method] ?? method
}
```

---

### Tabela — Ocupação por Quadra
Fonte: `byCourt`

| Quadra | Agendamentos | Receita | Ocupação |
|--------|-------------|---------|---------|
| `courtName` | `bookings` | `R$ revenue` | `(occupancyRate * 100).toFixed(1)%` |

> Ordenar por `bookings` decrescente (já vem ordenado da API).

---

### Tabela — Top 10 Clientes
Fonte: `topClients`

| # | Cliente | Agendamentos | Total Gasto |
|---|---------|-------------|-------------|
| `index + 1` | `name` | `bookings` | `R$ totalSpent` |

---

### Seletor de Período
Sugestão de navegação:

```javascript
// Botões "Mês anterior" / "Próximo mês"
function previousMonth(year, month) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}
function nextMonth(year, month) {
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  if (isCurrentMonth) return null // não navegar para o futuro
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
}
```

---

## 5. Comportamentos Importantes

### Cache de meses passados
Quando um mês passado é requisitado pela primeira vez, a API calcula e salva no banco. A **segunda chamada** para o mesmo mês retorna instantaneamente sem queries pesadas. Isso significa:
- O primeiro request de um mês passado pode levar alguns segundos
- Requisições subsequentes são sempre rápidas
- Para o mês atual, o dado é sempre recalculado (nunca cacheado)

### Comparativo sem histórico
Se o mês anterior não tiver dados (ex: primeiro mês de operação), `comparison.bookingsDelta` e `comparison.revenueDelta` serão `null`. O frontend deve tratar esse caso:

```javascript
const delta = report.comparison.bookingsDelta
const badge = delta === null ? '—' : delta >= 0 ? `▲ ${delta}%` : `▼ ${Math.abs(delta)}%`
```

### Taxa de ocupação
`occupancyRate` é calculado com base nos **AvailabilitySlots** configurados por quadra/dia-da-semana no painel. Se uma quadra não tiver slots configurados, o sistema usa uma janela padrão de **17 horas/dia** (06:00–23:00). Valores acima de `1.0` não são possíveis.

### Agendamentos sem esporte ou sem cliente
- `bySport`: agendamentos sem `sportId` são omitidos
- `topClients`: agendamentos de visitantes (`guestName`, sem conta no app) são omitidos

---

## 6. Erros Genéricos

| Status | Significado |
|--------|-------------|
| `400` | Parâmetros inválidos (ex: `month=13`, `year=2020`) |
| `401` | Não autenticado ou token inválido/expirado |
| `403` | Autenticado, mas role insuficiente |
| `429` | Rate limit excedido (100 req/min) |
| `500` | Erro interno do servidor |
