# Notificações — Guia de Integração para o Frontend

> Versão: 16/04/2026  
> Sistema: Server-Sent Events (SSE) + Web Push + REST para persistência

---

## Como funciona

O backend usa **SSE (Server-Sent Events)** para enviar notificações em tempo real a cada usuário conectado. Ao mesmo tempo, todas as notificações são persistidas no banco de dados para recuperação posterior.

| Evento | Gerado quando | Destinatário |
|--------|--------------|--------------|
| `NEW_BOOKING` | `POST /bookings` | Todos os ADMIN e EMPLOYEE |
| `BOOKING_CONFIRMED` | `POST /bookings/:id/confirm` | O cliente dono do agendamento |
| `BOOKING_CANCELLED` (cliente) | `POST /bookings/:id/cancel` pelo cliente | O cliente + todos os ADMIN e EMPLOYEE |
| `BOOKING_CANCELLED` (admin) | `POST /bookings/:id/cancel` pelo admin/employee | Só o cliente dono do agendamento |

---

## 1. Interface TypeScript

```ts
interface Notification {
  id: string;
  title: string;
  body: string;
  type?: 'NEW_BOOKING' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED';
  read: boolean;
  data?: {
    bookingId: string;
    courtId: string;
    clientId?: string;
  };
  createdAt: string; // ISO string
}
```

---

## 2. SSE Stream — notificações em tempo real

### Conectar

```ts
// SSE usa cookies automaticamente quando withCredentials = true
const source = new EventSource('/notifications/stream', {
  withCredentials: true,
});

source.onmessage = (event) => {
  const payload = JSON.parse(event.data);

  // filtrar heartbeat
  if (payload.type === 'heartbeat') return;

  const notification: Notification = payload;
  handleNewNotification(notification);
};

source.onerror = () => {
  // EventSource reconecta automaticamente com backoff exponencial
  // não é necessário nenhum código extra para reconexão
};

// fechar ao sair da página
window.addEventListener('beforeunload', () => source.close());
```

### Formato dos eventos recebidos

**Heartbeat** (a cada 30 seg — apenas para manter a conexão viva):
```json
{ "type": "heartbeat" }
```

**Nova reserva** (recebido por ADMIN e EMPLOYEE):
```json
{
  "id": "uuid",
  "title": "Nova reserva — Quadra 1",
  "body": "João Silva · 20/04/2026 10:00–12:00",
  "type": "NEW_BOOKING",
  "read": false,
  "data": {
    "bookingId": "uuid",
    "courtId": "uuid",
    "clientId": "uuid"
  },
  "createdAt": "2026-04-20T13:00:00.000Z"
}
```

**Reserva confirmada** (recebido pelo cliente):
```json
{
  "id": "uuid",
  "title": "Reserva confirmada! ✅",
  "body": "Sua reserva em Quadra 1 · 10:00–12:00 foi confirmada",
  "type": "BOOKING_CONFIRMED",
  "read": false,
  "data": {
    "bookingId": "uuid",
    "courtId": "uuid"
  },
  "createdAt": "2026-04-20T13:05:00.000Z"
}
```

**Reserva cancelada pelo admin** (recebido pelo cliente):
```json
{
  "id": "uuid",
  "title": "Reserva cancelada",
  "body": "Sua reserva em Quadra 1 · 10:00–12:00 foi cancelada",
  "type": "BOOKING_CANCELLED",
  "read": false,
  "data": {
    "bookingId": "uuid",
    "courtId": "uuid"
  },
  "createdAt": "2026-04-20T13:10:00.000Z"
}
```

**Reserva cancelada pelo cliente** (recebido por ADMIN e EMPLOYEE):
```json
{
  "id": "uuid",
  "title": "Reserva cancelada — Quadra 1",
  "body": "João Silva cancelou · 20/04/2026 10:00–12:00",
  "type": "BOOKING_CANCELLED",
  "read": false,
  "data": {
    "bookingId": "uuid",
    "courtId": "uuid",
    "clientId": "uuid"
  },
  "createdAt": "2026-04-20T13:10:00.000Z"
}
```

---

## 3. Endpoints REST

Todos os endpoints exigem autenticação via cookie `accessToken`. Cada usuário só acessa as **suas próprias** notificações.

### `GET /notifications`

Lista as notificações do usuário autenticado.

**Query params:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `read` | `true` \| `false` | Filtrar por lidas/não-lidas (opcional) |
| `limit` | `number` | Máximo de resultados, padrão `50` |

```
GET /notifications?read=false&limit=20
```

**Resposta:**
```json
[
  {
    "id": "uuid",
    "title": "Nova reserva — Quadra 1",
    "body": "João Silva · 20/04/2026 10:00–12:00",
    "type": "NEW_BOOKING",
    "read": false,
    "data": { "bookingId": "uuid", "courtId": "uuid", "clientId": "uuid" },
    "createdAt": "2026-04-20T13:00:00.000Z"
  }
]
```

---

### `GET /notifications/unread-count`

Retorna a contagem de notificações não lidas. Usar para o badge do sino.

```
GET /notifications/unread-count
```

**Resposta:**
```json
{ "count": 3 }
```

---

### `PATCH /notifications/:id/read`

Marca uma notificação específica como lida.

```
PATCH /notifications/uuid-da-notificacao/read
```

**Resposta:** a notificação atualizada com `"read": true`

---

### `PATCH /notifications/read-all`

Marca todas as notificações do usuário como lidas.

```
PATCH /notifications/read-all
```

**Resposta:**
```json
{ "message": "All notifications marked as read" }
```

---

## 4. Fluxo do painel admin (estilo iFood)

### Ao abrir o painel

```ts
// 1. buscar contagem para o badge
const { count } = await fetch('/notifications/unread-count').then(r => r.json());
setBadgeCount(count);

// 2. buscar fila de agendamentos PENDING
const pendingBookings = await fetch('/bookings?status=PENDING').then(r => r.json());
renderPendingQueue(pendingBookings);

// 3. abrir stream SSE
const source = new EventSource('/notifications/stream', { withCredentials: true });
source.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  if (payload.type === 'heartbeat') return;

  if (payload.type === 'NEW_BOOKING') {
    playNotificationSound();
    showToast(payload.title, payload.body);
    setBadgeCount(prev => prev + 1);
    refreshPendingQueue();
  }

  // cliente cancelou a reserva (PENDING ou CONFIRMED)
  if (payload.type === 'BOOKING_CANCELLED') {
    playNotificationSound();
    showToast(payload.title, payload.body);
    setBadgeCount(prev => prev + 1);
    refreshPendingQueue(); // pode ter saído da fila de pendentes
  }
};
```

### Ação: aceitar agendamento

```ts
async function acceptBooking(bookingId: string) {
  await fetch(`/bookings/${bookingId}/confirm`, { method: 'POST' });
  // o cliente recebe automaticamente um SSE BOOKING_CONFIRMED
  refreshPendingQueue();
}
```

### Ação: recusar agendamento

```ts
async function rejectBooking(bookingId: string) {
  await fetch(`/bookings/${bookingId}/cancel`, { method: 'POST' });
  // o cliente recebe automaticamente um SSE BOOKING_CANCELLED
  refreshPendingQueue();
}
```

### Abrir gaveta de notificações

```ts
async function openNotificationsDrawer() {
  const notifications = await fetch('/notifications?read=false').then(r => r.json());
  renderNotifications(notifications);

  // marcar todas como lidas
  await fetch('/notifications/read-all', { method: 'PATCH' });
  setBadgeCount(0);
}
```

---

## 5. Fila de pendentes — `GET /bookings?status=PENDING`

O painel admin lista os agendamentos aguardando confirmação. Cada item tem `pendingExpiresAt` para exibir o contador regressivo.

```ts
interface PendingBooking {
  id: string;
  status: 'PENDING';
  pendingExpiresAt: string; // ISO — usar para countdown
  client?: { id: string; name: string; email: string };
  guestName?: string;
  court: { id: string; name: string };
  date: string;
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
  finalAmount: number;
  cashbackUsed: number;
  notes?: string;
}
```

### Contador regressivo por card

```ts
function getRemainingSeconds(pendingExpiresAt: string): number {
  return Math.max(
    0,
    Math.floor((new Date(pendingExpiresAt).getTime() - Date.now()) / 1000),
  );
}
// Quando chegar a 0, o booking será cancelado automaticamente pelo cron
// (a cada 5 min pelo backend)
```

---

## 6. Fluxo do cliente

O cliente recebe notificações assim que o admin confirma ou cancela.

```ts
// abrir stream (mesmo componente de layout, sempre que logado)
const source = new EventSource('/notifications/stream', { withCredentials: true });

source.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  if (payload.type === 'heartbeat') return;

  if (payload.type === 'BOOKING_CONFIRMED') {
    showSuccessAlert('Sua reserva foi confirmada!');
    setBadgeCount(prev => prev + 1);
  }

  if (payload.type === 'BOOKING_CANCELLED') {
    showWarningAlert('Sua reserva foi cancelada.');
    setBadgeCount(prev => prev + 1);
  }
};
```

---

## 7. Web Push — notificações nativas do browser

Além do SSE (que só funciona com a aba aberta), o sistema suporta **Web Push** para notificar o usuário mesmo com o browser fechado.

### 7.1 Criar o Service Worker

Crie o arquivo `public/sw.js` (ou `sw.ts` transpilado):

```js
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'Arena Off Beach';
  const options = {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',   // ajuste para o ícone do seu app
    badge: '/icons/badge-72.png',
    data: data.data ?? {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(clients.openWindow(url));
});
```

### 7.2 Registrar e fazer subscribe (cliente e admin)

```ts
async function registerPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  // 1. registrar o service worker
  const registration = await navigator.serviceWorker.register('/sw.js');

  // 2. verificar permissão
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  // 3. buscar a VAPID public key do backend
  const { publicKey } = await fetch('/push/vapid-public-key').then(r => r.json());
  if (!publicKey) return; // push desabilitado no servidor

  // 4. criar a subscription no browser
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // 5. enviar ao backend (requer autenticação via cookie)
  await fetch('/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
      platform: 'WEB',
    }),
  });
}

// helpers
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
```

**Quando chamar `registerPush()`:** após o login bem-sucedido, ou na montagem do layout principal (se o usuário já estiver logado).

### 7.3 Remover subscribe ao fazer logout

```ts
async function unregisterPush(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  // avisar o backend primeiro
  await fetch('/push/unsubscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}
```

### 7.4 Notificações push recebidas por papel

| Tipo push | Recebido por | `data.url` sugerida |
|-----------|-------------|--------------------|
| `NEW_BOOKING` | ADMIN, EMPLOYEE | `/dashboard` |
| `BOOKING_CANCELLED` (cliente cancelou) | ADMIN, EMPLOYEE | `/dashboard` |
| `BOOKING_CONFIRMED` | CLIENT | `/bookings` |
| `BOOKING_CANCELLED` (admin cancelou) | CLIENT | `/bookings` |

### 7.5 Pontos de atenção

- O push só funciona em **HTTPS** (ou `localhost` para testes)
- O `GET /push/vapid-public-key` retorna `{ publicKey: null }` se as VAPID keys não estiverem configuradas no servidor — nesse caso o push está desabilitado e não há erro
- As subscriptions expiradas são removidas automaticamente pelo backend quando recebem HTTP 410/404 do servidor de push
- O Service Worker precisa estar na raiz do domínio (ou ter escopo adequado) para interceptar pushes do domínio inteiro

---

## 8. Consideração de escala

O stream SSE usa um **`Subject` RxJS em memória** dentro do processo Node.js. Funciona perfeitamente em ambiente de instância única (Railway, Render, Docker com 1 réplica).

O **Web Push** não tem essa limitação — as mensagens são enviadas diretamente para o servidor de push do browser (FCM/APNs), independente de quantas réplicas estejam rodando.

Se o projeto for escalado para **múltiplas réplicas**, será necessário substituir o `Subject` por um broker externo (Redis Pub/Sub) apenas para o SSE. O contrato de interface dos endpoints não muda — apenas a implementação interna do `NotificationService`.
