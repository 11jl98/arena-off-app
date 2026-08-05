# Mercado Pago Card Payment (Checkout Bricks) — Frontend Guide

## Overview

Credit/debit card payments are processed through the Mercado Pago **Card Payment Brick**.
The card number and CVV are collected inside Mercado Pago's secure iframe and **never**
reach our backend — the browser only sends a single-use `cardToken` plus the fraud
`sessionId` to `POST /payments/initiate-card`.

```
Navegador (Card Payment Brick) ──dados do cartão──▶ Mercado Pago
        ▲                                                │ cardToken + sessionId
        └────────────── POST /payments/initiate-card ◀───┘
                  (backend valida o booking; valor vem do DB)
```

> Same webhook as PIX confirms the payment / releases the booking on refusal.

---

## Environment Variables Required (Frontend)

```
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-...    # public key (não é o access token!)
```

> Remove the placeholder (`APP_USR-00000000-...`) — while it's a placeholder the card
> option renders an error panel and no Brick is created.

---

## Frontend Implementation Map

| Concern | File |
|---|---|
| SDK singleton + `getSessionId()` | `src/lib/mercadopago.ts` |
| SDK preload (app boot) | `src/App.tsx` |
| Payload/response types | `src/types/index.ts` (`InitiateCardPaymentPayload` / `InitiateCardPaymentResponse`) |
| API call | `src/services/payments.ts` → `PaymentsService.initiateCardPayment` |
| Flow state (`onlinePaymentMode`, `cardPaymentData`) | `src/hooks/useBookingFlow/index.tsx` |
| Payment method selection (PIX / Cartão / Presencial) | `src/pages/Reservas/view/steps/Step3Checkout.tsx` |
| Card Payment Brick rendering + submit | `src/pages/Reservas/components/CardPaymentForm.tsx` |
| Pending/approved/rejected screens | `src/pages/Reservas/view/steps/Step4Success.tsx` |

---

## API Endpoint

### `POST /payments/initiate-card`

Requires authentication. Available for `CLIENT`, `EMPLOYEE`, and `ADMIN` roles.

**Request body:**
```json
{
  "bookingId": "uuid-of-the-booking",
  "cardToken": "card_token_created_by_the_brick",
  "paymentMethodId": "visa",
  "paymentMethodType": "credit_card",
  "installments": 1,
  "sessionId": "fraud-session-id",
  "payer": {
    "email": "client@email.com",
    "identification": { "type": "CPF", "number": "12345678900" }
  }
}
```

**Response `200`:**
```json
{
  "paymentId": "uuid",
  "bookingId": "uuid",
  "mpOrderId": "ord01...",
  "amount": 200.00,
  "status": "approved",
  "transactionSecurityUrl": null,
  "installments": 1,
  "paymentMethodId": "visa",
  "lastFourDigits": "1234"
}
```

> When `status` is `rejected`, the backend should include the reason so the UI can
> explain the refusal. Accepted fields (any of them): `statusDetail` / `status_detail`
> or `rejectionReason` / `rejection_reason`, with either the full MP code
> (`cc_rejected_insufficient_amount`) or the short code (`FUND`). The frontend maps
> these to friendly PT-BR messages.

`status` can be:
- `approved` — payment captured; booking is confirmed by the webhook moments later.
- `rejected` — payment refused; let the user review and retry (Brick stays mounted).
- `pending` — under review / 3DS. The **Brick handles the 3DS challenge automatically**,
  so the frontend just shows an "em análise" panel and keeps polling the booking.

**Error cases:**
| HTTP | Reason |
|------|--------|
| `400` | Booking is not in PENDING status |
| `400` | Booking already paid or cancelled |
| `400` | Invalid/expired card token |
| `403` | CLIENT trying to pay for another client's booking |
| `404` | Booking not found |

> `transactionSecurityUrl` is only consumed by non-Brick integrations. With the Brick you
> must **not** redirect manually — the SDK resumes the authentication flow itself.

---

## Security Rules (both sides)

- Card number / CVV **never** go through the backend — only the token created by MP.
- The amount is **always** read from `booking.finalAmount` on the server; the frontend sends
  no money value (`initialization.amount` is used by the Brick only for display/installments).
- `sessionId` comes from the same SDK instance that created the token
  (`MP.getSessionId()`), which keeps the fraud analysis consistent.
- Backend validates the booking owner, status, and reuses the PIX webhook to confirm/refund.

---

## Frontend UX Flow

### Step 1 — Select payment method (Step3Checkout)
Three options: **PIX**, **Cartão**, **Presencial**.
- PIX and Cartão both create the booking with `paymentMethod: 'MERCADO_PAGO'`; the
  sub-instrument is tracked via `onlinePaymentMode: 'pix' | 'card'` (persisted in session).

### Step 2 — Create booking
```
POST /bookings  (payOnline: true)
→ { id, status: "PENDING", pendingExpiresAt, finalAmount, ... }
```
For **PIX** the QR code is generated right away (`/payments/initiate`).
For **Card** the booking is created and the user lands on the payment screen with the Brick.

### Step 3 — Pay with the Brick (CardPaymentForm)
- `initMercadoPago` runs with `{ locale: 'pt-BR', advancedFraudPrevention: true }`.
- Brick renders with `initialization.amount = booking.finalAmount` and the payer (CPF/email)
  prefilled from the user profile.
- `onSubmit(formData)`:
  1. `const sessionId = await getMpSessionId()`
  2. `POST /payments/initiate-card` with `formData.token`, `payment_method_id`,
     `installments`, `sessionId` and payer identification.
  3. Handle `approved` / `rejected` / `pending` (3DS is automatic inside the Brick).

### Step 4 — Wait for confirmation (Step4Success)
Reuses `usePixPaymentWatch` (SSE + poll every 5s on `GET /bookings/:id`):
- `CONFIRMED` → success screen with receipt.
- `CANCELLED` → expired/refused; slot released, offer "escolher outro horário".

---

## Testing

1. Set `VITE_MERCADO_PAGO_PUBLIC_KEY` to a **test** public key.
2. Create a booking and select **Cartão**.
3. Fill the Brick with MP sandbox test card data and submit.
4. Approve/refuse the payment in the MP dashboard; the webhook updates the booking.
5. Confirm the success / rejection / "em análise" states behave correctly.

## Notes

- The Brick button is disabled while the SDK script is loading; the form area shows a spinner.
- If `VITE_MERCADO_PAGO_PUBLIC_KEY` is missing/placeholder, the card option shows an
  explanatory error panel instead of silently failing.
- Payment option is **credit card only** — `debit_card` and `prepaid_card` are excluded in
  the Brick customization.
