# Mercado Pago PIX Payment Integration — Frontend Guide

## Overview

This document describes the PIX payment flow via Mercado Pago (MP) that has been integrated into the backend. The flow is:

1. Client creates a booking (status: `PENDING`)
2. Client initiates PIX payment → receives QR code
3. Client pays via PIX in their bank app
4. MP webhook fires → backend auto-confirms the booking + notifies client + notifies admins
5. If booking is cancelled after payment → full refund is issued automatically (or via admin endpoint)

---

## Environment Variables Required (Backend)

Add these to your `.env`:

```
MP_ACCESS_TOKEN=APP_USR-...     # your Mercado Pago access token
MP_WEBHOOK_SECRET=your-secret   # the secret configured in MP developer dashboard
```

---

## API Endpoints

### 1. Initiate PIX Payment

**`POST /payments/initiate`**

Requires authentication. Available for `CLIENT`, `EMPLOYEE`, and `ADMIN` roles.

**Request body:**
```json
{
  "bookingId": "uuid-of-the-booking",
  "payerEmail": "optional@email.com"   // only needed for guest bookings (no linked client)
}
```

> Note: `payerEmail` is optional when the booking has a logged-in client (email is taken from the client profile).

**Response `200`:**
```json
{
  "paymentId": "uuid",
  "bookingId": "uuid",
  "mpOrderId": "ord01...",
  "amount": 200.00,
  "status": "action_required",
  "pixQrCode": "00020126...",
  "pixQrCodeBase64": "iVBORw0KGgoAAAANSUhEU...",
  "pixTicketUrl": "https://www.mercadopago.com.br/..."
}
```

**Frontend should:**
- Display the PIX QR code image (from `pixQrCodeBase64`)
- Show the copy-paste PIX key (from `pixQrCode`)
- Optionally show a link via `pixTicketUrl`
- Start polling or listening via SSE (see [Booking Status Polling](#polling)) to detect confirmation

**Error cases:**
| HTTP | Reason |
|------|--------|
| `400` | Booking is not in PENDING status |
| `400` | Active payment already exists |
| `400` | No payer email (guest booking without payerEmail field) |
| `403` | CLIENT trying to pay for another client's booking |
| `404` | Booking not found |

---

### 2. Webhook (Mercado Pago → Backend)

**`POST /payments/webhook/mercadopago?data.id={orderId}`**

This is handled automatically by the backend. **No frontend action needed.**

MP calls this when payment status changes. The backend:
1. Validates the HMAC signature
2. Fetches the order from MP
3. If approved → confirms booking + notifies client and admins
4. If cancelled/expired → marks payment as `CANCELLED`

**Webhook URL to register in MP Developer Dashboard:**
```
https://your-domain.com/payments/webhook/mercadopago
```

---

### 3. Manual Refund (Admin only)

**`POST /payments/refund/:bookingId`**

Requires `ADMIN` role.

**Response `200`:**
```json
{ "success": true }
```

**Error cases:**
| HTTP | Reason |
|------|--------|
| `404` | No paid PIX payment found for this booking |

> Note: Cancelling a booking via `DELETE /bookings/:id` or `PATCH /bookings/:id/cancel` also auto-refunds any paid PIX payment if one exists.

---

## Booking Response — Updated Fields

`GET /bookings/:id` now includes `mpOrderId`:

```json
{
  "id": "...",
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "mpOrderId": "ord01...",
  "..."
}
```

Use `mpOrderId` to track which MP order is associated with this booking.

---

## Slot Lifecycle & Concurrency

### Como um slot de horário funciona

Um slot (quadra + data + horário de início) pode existir em múltiplos estados. O backend usa um **índice único parcial** no banco:

> `UNIQUE (courtId, date, startTime) WHERE status NOT IN ('CANCELLED', 'NO_SHOW')`

Isso significa:
- **PENDING** → slot está ocupado (aguardando pagamento, expira em 30 min)
- **CONFIRMED** → slot está definitivamente reservado
- **CANCELLED** / **NO_SHOW** → slot está **livre novamente** para nova reserva

```
LIVRE → POST /bookings → PENDING (slot bloqueado por 30min)
  └→ PIX pago → webhook → CONFIRMED (slot definitivamente reservado)
  └→ 30min sem pagamento → auto-CANCELLED → LIVRE
  └→ cancelamento manual → CANCELLED → LIVRE
```

---

### O que o frontend DEVE fazer

#### 1. Verificar disponibilidade antes de abrir o fluxo de pagamento

Antes de mostrar a tela de pagamento PIX, sempre chamar:
```
GET /bookings/available-slots?courtId=X&date=YYYY-MM-DD
```
Verificar se o slot ainda aparece como `available: true`.

#### 2. Tratar 409 Conflict em `POST /bookings`

Dois usuários podem tentar reservar o mesmo horário ao mesmo tempo. O segundo receberá:
```json
HTTP 409
{ "message": "A quadra não está disponível para o horário selecionado" }
```
**O frontend deve exibir uma mensagem clara** e redirecionar para escolher outro horário — não tentar novamente automaticamente.

#### 3. Exibir contador regressivo na tela PIX

O booking retorna `pendingExpiresAt`. Exibir um contador baseado nesse campo:
```
Pague em: MM:SS
```
Quando o contador chegar a zero → fazer `GET /bookings/:id`:
- Se `status === "CANCELLED"` → exibir "Tempo esgotado. Tente novamente." e redirecionar para seleção de horário
- O slot estará livre para nova reserva imediatamente

#### 4. Idempotência no `POST /payments/initiate`

Se o usuário clicar em "Pagar" duas vezes, o segundo request retornará:
```json
HTTP 400
{ "message": "An active payment already exists for this booking" }
```
O frontend deve desabilitar o botão após o primeiro clique bem-sucedido.

#### 5. Erro `500` em `POST /payments/initiate`

Se ocorrer um erro interno após a comunicação com o Mercado Pago:
```json
HTTP 500
{ "message": "Falha ao registrar o pagamento. A cobrança PIX foi cancelada. Tente novamente." }
```
Neste caso, o backend **automaticamente cancela a order no MP** antes de responder. O frontend pode oferecer ao usuário a opção de tentar novamente com o **mesmo bookingId** — o booking ainda está PENDING (a menos que tenha expirado).

---

### Ciclo completo de estados (referência)

| `booking.status` | `booking.paymentStatus` | Slot disponível? | Ação frontend |
|---|---|---|---|
| `PENDING` | `PENDING` | ❌ Não (bloqueado) | Mostrar tela PIX |
| `CONFIRMED` | `PAID` | ❌ Não | Mostrar confirmação |
| `CANCELLED` | `PENDING` | ✅ Sim | Novo agendamento |
| `CANCELLED` | `REFUNDED` | ✅ Sim | Mostrar "reembolso em andamento" |

---

## PIX Payment Flow (Frontend UX)

### Step 1 — Create booking
```
POST /bookings
→ { id, status: "PENDING", paymentStatus: "PENDING", pendingExpiresAt: "...", ... }
```

### Step 2 — Initiate PIX
```
POST /payments/initiate  { bookingId }
→ { pixQrCodeBase64, pixQrCode, pixTicketUrl, mpOrderId, status: "action_required" }
```
> Se retornar 500: o MP order foi cancelado automaticamente. Exibir mensagem e oferecer "Tentar novamente".

### Step 3 — Show PIX screen
Display:
- QR code image (base64 PNG): `<img src="data:image/png;base64,${pixQrCodeBase64}" />`
- Copy button with PIX key: `pixQrCode`
- "Open in bank app" link: `pixTicketUrl`
- Countdown timer calculado a partir de `booking.pendingExpiresAt`

### Step 4 — Wait for confirmation
Poll `GET /bookings/:id` every 5 seconds ou escutar via SSE (notifications stream).

Quando `booking.status === "CONFIRMED"`:
- Exibir tela de sucesso
- Navegar para detalhes do agendamento

Quando `booking.status === "CANCELLED"` (expirou sem pagamento):
- Exibir "Tempo esgotado. O horário foi liberado."
- Redirecionar para seleção de horário (slot está livre novamente)

---

## Payment Statuses

| `paymentStatus` | Meaning |
|---|---|
| `PENDING` | PIX initiated, waiting for payment |
| `PAID` | PIX received, booking confirmed |
| `CANCELLED` | PIX expired or cancelled |
| `REFUNDED` | Full refund processed |

---

## Notification Events

When the PIX payment is confirmed, the backend sends:

**To the client** (via `notifyClient`): a push notification + in-app notification informing the booking is confirmed.

**To all admins/employees** (via `notifyAdmins`): a push notification + in-app notification about the new confirmed booking.

The frontend notification stream (`GET /notifications/stream`) will deliver these in real-time.

---

## PIX Rate

Mercado Pago charges **0.49% per transaction** (paid by the business). The full booking amount is charged to the client — rate handling is internal to the business.

---

## Security Notes

- Webhook endpoint is public (`@Public()`) but validated via HMAC SHA256
- All other payment endpoints require JWT authentication
- CLIENT role can only pay for their own bookings
- Only ADMINs can trigger manual refunds

---

## Testing

### Test credentials
Use Mercado Pago sandbox credentials:
- `APP_USR-xxxx-TEST` access token (from MP developer dashboard → test credentials)
- Use MP's test user accounts to simulate PIX payments

### Test PIX payment flow
1. Create a booking via `POST /bookings`
2. Call `POST /payments/initiate` with the bookingId
3. In MP sandbox, simulate payment approval via the MP dashboard or test API
4. The webhook fires automatically and the booking status changes to `CONFIRMED`

### Simulate webhook locally
Use `ngrok` or similar to expose your local backend:
```bash
ngrok http 3000
# Register https://xxxx.ngrok.io/payments/webhook/mercadopago in MP dashboard
```
