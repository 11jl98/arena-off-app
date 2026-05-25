# Bookings — Guia de Migração para o Frontend

> Versão: atualização de 14/04/2026  
> Contexto: revisão completa do módulo de agendamentos (segurança, expiração automática, disponibilidade dinâmica)

---

## Resumo das mudanças

| # | O que mudou | Impacto no front |
|---|-------------|-----------------|
| 1 | **CLIENT não envia mais `clientId`** | Remover o campo do body no fluxo de cliente |
| 2 | **`GET /bookings` filtra automaticamente por cliente** | Não precisa mais passar `clientId` na query |
| 3 | **`PATCH /:id` não aceita mais `status`** | Remover qualquer envio de `status` nesse endpoint |
| 4 | **Novo campo `pendingExpiresAt` na resposta** | Exibir contador regressivo de 30 min para confirmar |
| 5 | **Slots dinâmicos no horário por quadra** | Resposta de `/available-slots` pode ter horários diferentes de 06–23 |
| 6 | **`403` ao cancelar agendamento de outro cliente** | Tratar o novo código de erro |

---

## 1. Criar agendamento — `POST /bookings`

### Fluxo ADMIN / EMPLOYEE (sem mudança)

```json
POST /bookings
{
  "courtId": "uuid",
  "sportId": "uuid",
  "clientId": "uuid",        // ainda obrigatório para agendamentos com cliente
  "date": "2026-05-10",
  "startTime": "10:00",
  "endTime": "12:00",
  "cashbackUsed": 20.00,     // opcional
  "promotionId": "uuid",     // opcional
  "notes": "string",         // opcional
  "splitPayment": false,     // opcional
  "numberOfPeople": 1        // opcional
}
```

### Fluxo CLIENT (mudança)

O backend agora **ignora** qualquer `clientId` enviado pelo CLIENT e usa o ID do usuário autenticado automaticamente.

```json
POST /bookings
{
  "courtId": "uuid",
  "sportId": "uuid",
  // ❌ NÃO enviar mais clientId — é preenchido automaticamente pelo backend
  "date": "2026-05-10",
  "startTime": "10:00",
  "endTime": "12:00",
  "cashbackUsed": 20.00,
  "notes": "string"
}
```

> **Agendamento de visitante (sem login):** enviar `guestName` em vez de `clientId`.  
> `guestName` é obrigatório quando `clientId` não é fornecido.

---

## 2. Resposta de criação — novo campo `pendingExpiresAt`

Todo agendamento novo nasce com status `PENDING` e um prazo de 30 minutos para ser confirmado antes de ser cancelado automaticamente.

```json
{
  "id": "uuid",
  "status": "PENDING",
  "pendingExpiresAt": "2026-05-10T10:30:00.000Z",   // ← NOVO
  "startTime": "10:00",
  "endTime": "12:00",
  ...
}
```

### Como usar no front

Exibir um contador regressivo enquanto `status === "PENDING"`:

```ts
const expiresAt = new Date(booking.pendingExpiresAt);
const diffMs = expiresAt.getTime() - Date.now();

if (diffMs <= 0) {
  // booking foi ou será cancelado em breve
} else {
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  // exibir "Confirme em MM:SS"
}
```

> O backend cancela automaticamente bookings PENDING expirados a cada 5 minutos via cron job.  
> Quando o booking é cancelado automaticamente, o cashback utilizado é **devolvido** à carteira do cliente.

---

## 3. Listar agendamentos — `GET /bookings`

### ADMIN / EMPLOYEE

Todos os filtros disponíveis continuam funcionando:

```
GET /bookings?courtId=uuid&clientId=uuid&date=2026-05-10&status=PENDING&paymentStatus=PENDING
```

### CLIENT (mudança)

O CLIENT agora **sempre vê apenas seus próprios agendamentos**. O parâmetro `clientId` é ignorado para esse papel.

```
GET /bookings?date=2026-05-10&status=CONFIRMED
// ❌ NÃO passar clientId — o backend usa o ID do usuário autenticado
```

Filtros disponíveis para CLIENT:
- `courtId`
- `date`
- `status`
- `paymentStatus`

---

## 4. Atualizar agendamento — `PATCH /bookings/:id`

> Disponível apenas para **ADMIN** e **EMPLOYEE**.

### Campos aceitos

```json
PATCH /bookings/:id
{
  "paymentStatus": "PAID",   // opcional — PENDING | PAID | PARTIAL
  "notes": "Observação"      // opcional
}
```

### Campo removido

```diff
- "status": "CONFIRMED"   ❌ não aceito mais
```

Para mudar o status use os endpoints dedicados:

| Ação | Endpoint |
|------|----------|
| Confirmar | `POST /bookings/:id/confirm` |
| Cancelar | `POST /bookings/:id/cancel` |

---

## 5. Cancelar agendamento — `POST /bookings/:id/cancel`

### Novos comportamentos

**Para CLIENT:** o backend verifica se o agendamento pertence ao usuário autenticado.

```
POST /bookings/:id/cancel
```

**Resposta de sucesso:** `200` com o booking atualizado (`status: "CANCELLED"`)

**Novo erro possível:**
```json
// 403 Forbidden — CLIENT tentando cancelar agendamento de outro usuário
{
  "statusCode": 403,
  "message": "You can only cancel your own bookings"
}
```

**Reembolso de cashback:** se o booking usou cashback (`cashbackUsed > 0`), o valor é automaticamente devolvido à carteira do cliente no momento do cancelamento.

---

## 6. Slots disponíveis — `GET /bookings/available-slots`

```
GET /bookings/available-slots?courtId=uuid&date=2026-05-10
```

### Mudança de comportamento

Os slots agora refletem o **horário de funcionamento configurado para cada quadra** por dia da semana, em vez de um horário fixo global (06:00–23:00).

Isso significa que:
- Quadras de areia podem ter horário `07:00–22:00` em dias úteis e `07:00–20:00` aos domingos
- A lista de slots retornada pode variar por quadra e por dia

Se nenhum horário estiver configurado para a quadra naquele dia da semana, o sistema usa o fallback padrão de `06:00–23:00`.

### Formato da resposta (sem mudança)

```json
{
  "courtId": "uuid",
  "date": "2026-05-10",
  "slots": [
    { "startTime": "07:00", "endTime": "08:00", "available": true,  "pricePerHour": 120.00 },
    { "startTime": "08:00", "endTime": "09:00", "available": false, "pricePerHour": 120.00 },
    { "startTime": "09:00", "endTime": "10:00", "available": true,  "pricePerHour": 120.00 }
  ]
}
```

> **Importante:** não assuma mais que os slots vão de `06:00` a `23:00`. Renderize somente os slots retornados pela API.

---

## 7. Interface TypeScript atualizada

```ts
// Booking response
interface BookingResponse {
  id: string;
  courtId: string;
  clientId?: string;
  guestName?: string;
  sport?: { id: string; name: string };
  date: string;              // ISO date string
  startTime: string;         // "HH:mm"
  endTime: string;           // "HH:mm"
  calculatedAmount: number;
  cashbackUsed: number;
  finalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  splitPayment: boolean;
  numberOfPeople: number;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  pendingExpiresAt?: string; // ← NOVO — presente apenas quando status = PENDING
  court?: {
    id: string;
    name: string;
    pricePerHour: number;
    sport: { id: string; name: string };
  };
  client?: {
    id: string;
    name: string;
    email: string;
  };
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL';

// PATCH /bookings/:id — sem o campo status
interface UpdateBookingPayload {
  paymentStatus?: PaymentStatus;
  notes?: string;
}

// Available slots
interface AvailableSlot {
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  available: boolean;
  pricePerHour: number;
}

interface AvailabilitySummary {
  courtId: string;
  date: string;
  slots: AvailableSlot[];
}
```

---

## 8. Matriz de permissões por endpoint

| Endpoint | ADMIN | EMPLOYEE | CLIENT |
|----------|-------|----------|--------|
| `POST /bookings` | ✅ | ✅ | ✅ (clientId automático) |
| `GET /bookings` | ✅ todos | ✅ todos | ✅ apenas os próprios |
| `GET /bookings/:id` | ✅ | ✅ | ✅ |
| `PATCH /bookings/:id` | ✅ | ✅ | ❌ |
| `DELETE /bookings/:id` | ✅ | ❌ | ❌ |
| `POST /bookings/:id/confirm` | ✅ | ✅ | ❌ |
| `POST /bookings/:id/cancel` | ✅ | ✅ | ✅ (apenas os próprios) |
| `GET /bookings/available-slots` | ✅ | ✅ | ✅ |
| `POST /bookings/check-availability` | ✅ | ✅ | ✅ |

---

## 9. Fluxo completo de agendamento pelo CLIENT

```
1. GET /bookings/available-slots?courtId=X&date=Y
   → Exibir grade com slots disponíveis

2. POST /bookings
   body: { courtId, sportId, date, startTime, endTime, cashbackUsed? }
   → Receber booking com status PENDING e pendingExpiresAt
   → Iniciar contador regressivo de 30 minutos na tela

3. Aguardar confirmação de um ADMIN/EMPLOYEE
   → Montar listener (polling ou websocket) em GET /bookings/:id
   → Quando status mudar de PENDING → CONFIRMED: exibir confirmação

4. Se o cliente quiser cancelar:
   → POST /bookings/:id/cancel
   → Cashback é devolvido automaticamente se havia sido usado
```

---

## 10. Erros novos a tratar

| Status | Mensagem | Quando ocorre |
|--------|----------|---------------|
| `403` | `You can only cancel your own bookings` | CLIENT tenta cancelar booking de outro usuário |
| `400` | `Saldo de cashback insuficiente` | cashbackUsed maior que o saldo disponível na carteira |
| `409` | `Court is not available for the selected time slot` | Conflito de horário ao criar booking |
