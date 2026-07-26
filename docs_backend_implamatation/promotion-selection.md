# Seleção de Promoção na Criação de Reserva

## Novas APIs

---

### 1. Listar promoções disponíveis para um booking
**`POST /promotion-application/check-all`**

Usar **antes** de criar a reserva para exibir as opções ao cliente.

**Request:**
```json
{
  "date": "2026-04-15",
  "startTime": "18:00",
  "endTime": "20:00",
  "basePrice": 200.00,
  "hours": 2,
  "clientId": "uuid-do-cliente"
}
```

**Response:** `AppliedPromotionDto[]`
```json
[
  {
    "promotion": {
      "id": "uuid-da-promocao",
      "name": "Happy Hour",
      "type": "SPECIAL_HOURS",
      "discountPercent": 20
    },
    "originalPrice": 200.00,
    "discountAmount": 40.00,
    "finalPrice": 160.00
  },
  {
    "promotion": {
      "id": "outro-uuid",
      "name": "Combo 2h + 1h",
      "type": "HOURS_COMBO"
    },
    "originalPrice": 200.00,
    "discountAmount": 33.33,
    "finalPrice": 166.67,
    "extraHours": 1
  }
]
```

> Se retornar array vazio `[]`, não há promoções disponíveis para esse horário/data.

### Promoção por Data (`DATE_BASED`)

Promoções do tipo `DATE_BASED` são elegíveis puramente pela data da reserva, independentemente do horário ou dia da semana.

**Exemplo — 30% de desconto no feriado de 07/09:**

```json
{
  "promotion": {
    "id": "uuid-promocao-feriado",
    "name": "Feriado 7 de Setembro",
    "type": "DATE_BASED",
    "discountPercent": 30,
    "startDate": "2026-09-07",
    "endDate": "2026-09-07"
  },
  "originalPrice": 200.00,
  "discountAmount": 60.00,
  "finalPrice": 140.00
}
```

> Para datas fora de `startDate`/`endDate`, a promoção não aparece no resultado de `check-all`.

---

### 2. Criar reserva com promoção escolhida
**`POST /bookings`** — campo `promotionId` adicionado (opcional)

**Com promoção escolhida:**
```json
{
  "courtId": "uuid",
  "sportId": "uuid",
  "clientId": "uuid",
  "date": "2026-04-15",
  "startTime": "18:00",
  "endTime": "20:00",
  "promotionId": "uuid-da-promocao-escolhida",
  "cashbackUsed": 0
}
```

**Sem `promotionId`:** comportamento anterior — aplica automaticamente a melhor promoção disponível.

---

### Fluxo recomendado

```
1. Usuário preenche quadra + data + horário
2. POST /promotion-application/check-all
      ├── [] vazio → sem promoções, seguir normalmente
      └── [promoção A, promoção B] → exibir opções para o cliente escolher
3. POST /bookings com promotionId da opção escolhida
```

---

### Erros possíveis

| Status | Motivo |
|--------|--------|
| `400 Bad Request` | `promotionId` enviado mas a promoção não é aplicável ao booking (expirou, fora do horário, etc.) |

> O `promotionId` deve ser sempre um UUID retornado pelo endpoint `check-all` para o **mesmo** conjunto de parâmetros — não cachear IDs de sessões anteriores.
