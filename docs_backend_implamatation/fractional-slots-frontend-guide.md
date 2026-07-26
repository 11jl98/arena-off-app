# Slots Fracionados — Guia para o Frontend

> Versão: 24/07/2026
> Contexto: suporte a horários quebrados (30min, 1h30, etc.) com granularidade global configurável

---

## Resumo das mudanças

| # | O quê | Impacto no front |
|---|-------|-----------------|
| 1 | **`GET /arena-settings`** agora retorna `slotDurationMinutes` | Saber a granularidade dos slots |
| 2 | **`PATCH /arena-settings`** aceita `slotDurationMinutes` | Tela de configurações da arena |
| 3 | **`GET /courts/:courtId/available-slots?date=`** pode retornar slots de 30min | UI de seleção de horário precisa lidar com slots de qualquer duração |
| 4 | **Precificação quebrada** | Valor calculado proporcionalmente (R$ 100/h → 30min = R$ 50) |
| 5 | **Promoção `HOURS_COMBO`** aceita `minHours`/`bonusHours` decimais | Enviar `1.5` em vez de `1` para 1h30 |
| 6 | **Pacotes de horas** aceitam `hours` decimal | Criar pacote de 5.5h |

---

## 1. Configuração global — `GET /arena-settings`

A resposta agora inclui:

```json
{
  "arenaName": "Arena Beach Sports",
  "phone": "(11) 99999-0000",
  "cnpj": "",
  "city": "São Paulo",
  "state": "SP",
  "address": "Av. Paulista, 1000",
  "slotDurationMinutes": 30
}
```

| Campo | Tipo | Descrição | Default |
|-------|------|-----------|---------|
| `slotDurationMinutes` | `number` | Granularidade dos slots de horário (mín. 15) | `60` |

Use esse valor para configurar o grid de horários no frontend (ex: se `30`, mostrar slots `10:00`, `10:30`, `11:00`, etc.).

---

## 2. Atualizar configuração — `PATCH /arena-settings`

```json
PATCH /arena-settings
{
  "slotDurationMinutes": 30
}
```

Validação: `@Min(15)` — qualquer valor abaixo de 15 é rejeitado.

---

## 3. Slots disponíveis — `GET /bookings/available-slots?courtId=&date=`

### Comportamento anterior

Slots fixos de 1 em 1 hora (`06:00`, `07:00`, ..., `22:00`).

### Novo comportamento

Os slots seguem a `slotDurationMinutes` configurada globalmente:

**Exemplo com 30min:**
```json
{
  "courtId": "uuid",
  "date": "2026-07-24",
  "slots": [
    { "startTime": "06:00", "endTime": "06:30", "available": true, "pricePerHour": 100.00 },
    { "startTime": "06:30", "endTime": "07:00", "available": false, "pricePerHour": 100.00 },
    { "startTime": "07:00", "endTime": "07:30", "available": true, "pricePerHour": 100.00 },
    ...
  ]
}
```

**Exemplo com 15min:**
```json
    { "startTime": "06:00", "endTime": "06:15", ... },
    { "startTime": "06:15", "endTime": "06:30", ... },
```

### O que muda na UI

- O grid de horários não pode mais assumir intervalos de 1h
- Use `slotDurationMinutes` do `/arena-settings` para desenhar os slots
- O valor final da reserva é calculado como `pricePerHour * duraçãoEmHoras` (já funcionava)

### Exemplo de cálculo de preço

| Duração | Fórmula | Valor |
|---------|---------|-------|
| 30min | R$ 100 × 0.5 | R$ 50 |
| 1h30 | R$ 100 × 1.5 | R$ 150 |
| 2h45 | R$ 100 × 2.75 | R$ 275 |

---

## 4. Criar agendamento — `POST /bookings`

Sem mudança no contrato. Qualquer `startTime`/`endTime` com formato `HH:mm` é aceito:

```json
{
  "courtId": "uuid",
  "sportId": "uuid",
  "date": "2026-07-24",
  "startTime": "10:00",
  "endTime": "11:30",
  ...
}
```

**Validação:** duração mínima é > 0 (qualquer valor positivo é aceito).

---

## 5. Promoções — `HOURS_COMBO` com valores decimais

`minHours` e `bonusHours` agora aceitam decimais:

```json
POST /promotions
{
  "name": "Leve 1h30, ganhe 30min",
  "type": "HOURS_COMBO",
  "minHours": 1.5,
  "bonusHours": 0.5
}
```

---

## 6. Pacotes de horas — `POST /hours-packages`

`hours` agora aceita decimais:

```json
{
  "name": "Pacote 5h30",
  "hours": 5.5,
  "totalPrice": 450.00,
  "savingsPercent": 18.18
}
```

---

## Endpoints afetados

| Método | Rota | Mudança |
|--------|------|---------|
| `GET` | `/arena-settings` | + campo `slotDurationMinutes` |
| `PATCH` | `/arena-settings` | + campo opcional `slotDurationMinutes` |
| `GET` | `/bookings/available-slots?courtId=&date=` | Slots seguem granularidade configurada (requer JWT) |
| `POST` | `/promotions` | `minHours`/`bonusHours` aceitam decimal |
| `PATCH` | `/promotions/:id` | `minHours`/`bonusHours` aceitam decimal |
| `POST` | `/hours-packages` | `hours` aceita decimal |
| `PATCH` | `/hours-packages/:id` | `hours` aceita decimal |
