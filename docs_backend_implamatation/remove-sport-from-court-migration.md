# Migração: Remoção de `sport` do modelo `Court`

## Contexto

O campo `sportId` foi removido do modelo `Court`. O esporte agora pertence **exclusivamente ao `Booking`** (e demais entidades que criam reservas: `RecurringBookingPlan`, `EventBookingSlot`). Quadras são agnósticas de esporte — é possível jogar qualquer esporte em qualquer quadra.

---

## O que mudou na API

### `GET /courts` e `GET /courts/:id`

**Antes:**
```json
{
  "id": "uuid",
  "sportId": "uuid",
  "name": "Quadra 1",
  "pricePerHour": 120,
  "sport": {
    "id": "uuid",
    "name": "Beach Tennis",
    "icon": "🎾"
  },
  ...
}
```

**Depois:**
```json
{
  "id": "uuid",
  "name": "Quadra 1",
  "pricePerHour": 120,
  ...
}
```

Campos **removidos**: `sportId`, `sport`.

---

### `GET /courts?sportId=xxx` — filtro removido

O query param `?sportId=` não existe mais e será ignorado. Remover do front qualquer chamada com esse filtro.

---

### `POST /courts` e `PATCH /courts/:id`

**Antes:** body incluía `sportId: string` (obrigatório no POST).

**Depois:** campo `sportId` **não deve mais ser enviado**. Será rejeitado/ignorado.

---

### `GET /bookings`, `GET /bookings/:id` — shape de `court` mudou

**Antes:**
```json
{
  "court": {
    "id": "uuid",
    "name": "Quadra 1",
    "pricePerHour": 120,
    "sport": {
      "id": "uuid",
      "name": "Beach Tennis"
    }
  },
  "sport": { "id": "uuid", "name": "Beach Tennis" },
  ...
}
```

**Depois:**
```json
{
  "court": {
    "id": "uuid",
    "name": "Quadra 1",
    "pricePerHour": 120
  },
  "sport": { "id": "uuid", "name": "Beach Tennis" },
  ...
}
```

- `court.sport` foi **removido**.
- `sport` na raiz do booking **permanece intacto** — use este campo para exibir o esporte da reserva.

---

### `GET /recurring-booking-plans/:id` — mesma mudança no `court`

Dentro do objeto de plano recorrente, os bookings aninhados também tiveram `court.sport` removido. Use `booking.sport` (raiz) da mesma forma.

---

### `GET /dashboard/stats` — shape de `courts` mudou

**Antes:**
```json
{
  "courts": [
    {
      "id": "uuid",
      "name": "Quadra 1",
      "sportName": "Beach Tennis",
      "pricePerHour": 120
    }
  ]
}
```

**Depois:**
```json
{
  "courts": [
    {
      "id": "uuid",
      "name": "Quadra 1",
      "pricePerHour": 120
    }
  ]
}
```

Campo **removido**: `sportName`.

---

### `GET /sports` — sem mudanças

O endpoint de esportes continua funcionando normalmente. A lista de esportes disponíveis ainda existe para ser usada no formulário de **criação de reserva** (onde o campo `sportId` permanece obrigatório).

---

## Resumo das mudanças necessárias no front

| Localização no front | Ação necessária |
|---|---|
| Formulário "Criar Quadra" | Remover campo `sportId` |
| Formulário "Editar Quadra" | Remover campo `sportId` |
| Listagem de quadras (`/courts`) | Remover exibição de `sport.name` e `sportId` |
| Detalhe de quadra (`/courts/:id`) | Remover exibição de `sport` |
| Filtro de quadras por esporte | Remover `?sportId=` da chamada |
| Card de booking — exibição do esporte | Usar `booking.sport.name` (já existia na raiz) em vez de `booking.court.sport.name` |
| Dashboard — card de quadras | Remover exibição de `sportName` |
| Tipos TypeScript do front (`Court`) | Remover `sportId: string` e `sport?: { id, name, icon }` |
| Tipos TypeScript do front (`CourtInfo`) no dashboard | Remover `sportName: string` |
| Tipos TypeScript do front (`BookingCourt`) | Remover `sport?: { id, name }` do shape de `court` dentro de booking |

---

## Fluxo correto após a migração

```
Criar reserva:
  front envia: { courtId, sportId, date, startTime, endTime, ... }
  sportId refere-se ao esporte DA RESERVA — não da quadra

Exibir esporte de uma reserva:
  usar: booking.sport.name
  NÃO usar: booking.court.sport.name (removido)

Criar/editar quadra:
  front envia: { name, pricePerHour, covered, lighting, ... }
  SEM sportId
```
