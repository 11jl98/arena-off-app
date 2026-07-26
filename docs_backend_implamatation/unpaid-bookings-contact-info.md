# Agendamentos Não Pagos — Dados de Contato do Cliente

> **Data de implementação:** 25 de maio de 2026

---

## O que mudou

O endpoint de listagem de agendamentos agora retorna `cpf` e `phone` dentro do objeto `client` de cada reserva. Isso permite identificar e contactar clientes com pagamentos pendentes.

**Nenhum endpoint novo foi criado** — a mudança é aditiva na resposta existente.

---

## Endpoint

```
GET /bookings
```

**Autenticação:** Cookie JWT obrigatório  
**Roles:** ADMIN, EMPLOYEE

### Query params relevantes

| Param | Tipo | Descrição |
|---|---|---|
| `paymentStatus` | `PENDING \| PAID \| PARTIALLY_PAID \| CANCELLED \| REFUNDED` | Filtrar por status de pagamento |
| `bookingType` | `AVULSO \| MENSALISTA \| EVENTO` | Filtrar por tipo de agendamento |
| `status` | `PENDING \| CONFIRMED \| CANCELLED \| NO_SHOW \| COMPLETED` | Filtrar por status do agendamento |
| `date` | `YYYY-MM-DD` | Filtrar por data |
| `courtId` | `UUID` | Filtrar por quadra |
| `clientId` | `UUID` | Filtrar por cliente (UUID) |
| `clientName` | `string` | Busca por nome do cliente |

### Consulta recomendada — avulsos não pagos

```
GET /bookings?paymentStatus=PENDING&bookingType=AVULSO
```

---

## Resposta

### Shape do `client` (atualizado)

```typescript
interface BookingClient {
  id: string;
  name: string;
  email: string;
  cpf: string | null;    // novo — null se o cliente não preencheu o perfil
  phone: string | null;  // novo — null se o cliente não preencheu o perfil
}
```

### Exemplo de resposta completa

```json
[
  {
    "id": "a1b2c3d4-...",
    "courtId": "e5f6g7h8-...",
    "clientId": "i9j0k1l2-...",
    "guestName": null,
    "sport": { "id": "...", "name": "Beach Tennis" },
    "date": "2026-05-25T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "10:00",
    "calculatedAmount": 120.00,
    "cashbackUsed": 0,
    "finalAmount": 120.00,
    "status": "CONFIRMED",
    "paymentStatus": "PENDING",
    "bookingType": "AVULSO",
    "pendingExpiresAt": "2026-05-25T10:30:00.000Z",
    "client": {
      "id": "i9j0k1l2-...",
      "name": "João Silva",
      "email": "joao@email.com",
      "cpf": "123.456.789-09",
      "phone": "11999999999"
    },
    "court": {
      "id": "e5f6g7h8-...",
      "name": "Quadra 1",
      "pricePerHour": 120.00,
      "sport": { "id": "...", "name": "Beach Tennis" }
    }
  }
]
```

---

## Casos especiais

### Cliente sem perfil preenchido

Se o cliente nunca chamou `PATCH /users/me`, o `clientProfile` não existe — `cpf` e `phone` chegam como `null`:

```json
"client": {
  "id": "...",
  "name": "Maria Souza",
  "email": "maria@email.com",
  "cpf": null,
  "phone": null
}
```

Nesse caso, o único canal de contato disponível é o `email`.

### Guest booking (sem conta)

Agendamentos com `clientId = null` (convidados) **não possuem o campo `client`**. Apenas `guestName` está disponível, sem dados de contato estruturado:

```json
{
  "clientId": null,
  "guestName": "Pedro Convidado",
  "client": undefined
}
```

---

## Tipos TypeScript

```typescript
export interface BookingClient {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
}

export interface BookingResponse {
  id: string;
  courtId: string;
  clientId?: string;
  guestName?: string;
  sport?: { id: string; name: string };
  date: string;
  startTime: string;
  endTime: string;
  calculatedAmount: number;
  cashbackUsed: number;
  finalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookingType: BookingType;
  notes?: string;
  splitPayment: boolean;
  numberOfPeople: number;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  pendingExpiresAt?: string;
  mpOrderId?: string;
  recurringPlanId?: string;
  court?: {
    id: string;
    name: string;
    pricePerHour: number;
    sport: { id: string; name: string };
  };
  client?: BookingClient;
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'REFUNDED';
type BookingType = 'AVULSO' | 'MENSALISTA' | 'EVENTO';
```

---

## Sugestão de UI — Tela de Cobranças Pendentes

```
┌─────────────────────────────────────────────────────────────────┐
│  Agendamentos Pendentes de Pagamento                            │
│  Filtro: bookingType=AVULSO  paymentStatus=PENDING              │
├──────────────┬────────────┬──────────────┬──────────────────────┤
│ Cliente      │ Data/Hora  │ Valor        │ Contato              │
├──────────────┼────────────┼──────────────┼──────────────────────┤
│ João Silva   │ 25/05 9h   │ R$ 120,00    │ 📞 11 99999-9999     │
│              │ Quadra 1   │              │ ✉️ joao@email.com    │
├──────────────┼────────────┼──────────────┼──────────────────────┤
│ Maria Souza  │ 25/05 10h  │ R$ 80,00     │ ⚠️ Sem telefone      │
│              │ Quadra 2   │              │ ✉️ maria@email.com   │
├──────────────┼────────────┼──────────────┼──────────────────────┤
│ Pedro (guest)│ 25/05 11h  │ R$ 60,00     │ ⚠️ Sem contato       │
└──────────────┴────────────┴──────────────┴──────────────────────┘
```

### Lógica de exibição do contato

```typescript
function getContactInfo(booking: BookingResponse) {
  if (!booking.client) {
    return { type: 'guest', label: 'Sem dados de contato' };
  }
  return {
    type: 'registered',
    email: booking.client.email,
    phone: booking.client.phone ?? null,   // pode ser null
    cpf: booking.client.cpf ?? null,        // para identificação
  };
}
```

---

## Fluxo de cobrança recomendado

```
1. Carregar lista
   └─ GET /bookings?paymentStatus=PENDING&bookingType=AVULSO

2. Para cada agendamento:
   ├─ Tem client.phone → exibir botão "Ligar / WhatsApp"
   ├─ Tem client.email → exibir botão "Enviar e-mail"
   └─ Só guestName    → marcar como "sem contato disponível"

3. Após receber pagamento manualmente:
   └─ PATCH /bookings/:id
      Body: { "paymentStatus": "PAID" }
```
