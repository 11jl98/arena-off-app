# Booking Auto-Confirm — Guia de Migração Frontend

## Resumo

O sistema de confirmação manual de agendamentos pelo admin foi removido. **Todo agendamento criado (via admin ou app do cliente) nasce imediatamente com status `CONFIRMED`.**

Não existe mais janela de 30 minutos nem etapa de aprovação.

---

## O que mudou na API

### POST /bookings (criação de agendamento)

**Antes:**
```json
{
  "status": "PENDING",
  "confirmedAt": null,
  "pendingExpiresAt": "2026-07-14T14:30:00.000Z"
}
```

**Agora:**
```json
{
  "status": "CONFIRMED",
  "confirmedAt": "2026-07-14T14:00:00.000Z",
  "pendingExpiresAt": null
}
```

> O campo `pendingExpiresAt` continua presente no response mas sempre será `null`. Pode ser ignorado com segurança.

---

### POST /bookings/:id/confirm (confirmação manual)

O endpoint **continua existindo** e não foi removido da API, mas agora é **idempotente**: se o booking já estiver `CONFIRMED`, retorna o booking normalmente sem erro.

Não há necessidade de chamar esse endpoint no fluxo normal — ele existe apenas para compatibilidade interna (ex: webhook do MercadoPago PIX).

---

## Notificações

| Evento | Destinatário | Quando dispara |
|--------|-------------|----------------|
| `NEW_BOOKING` | Admin/Funcionários | Na criação (igual a antes) |
| `BOOKING_CONFIRMED` | Cliente | **Na criação** (antes era só após o admin confirmar) |

O cliente agora recebe a notificação de confirmação imediatamente ao criar o agendamento, sem precisar aguardar ação do admin.

---

## Impactos no App do Cliente

### Remover
- Tela/estado de "aguardando confirmação"
- Contador regressivo dos 30 minutos (`pendingExpiresAt`)
- Polling ou listener para mudança de `PENDING` → `CONFIRMED`
- Badge/aviso de "pendente de aprovação"

### Atualizar
- Após `POST /bookings` com sucesso, exibir diretamente tela de **"Agendamento confirmado!"**
- O status recebido no response já será `CONFIRMED` — não há transição de estado a aguardar

---

## Impactos no Painel Admin

### Remover
- Botão/ação "Confirmar agendamento"
- Listagem/filtro de bookings com status `PENDING` para aprovação
- Qualquer lógica que trate `PENDING` como "aguardando confirmação do admin"

### Atualizar
- Notificação de novo agendamento recebida normalmente — o agendamento já aparece como `CONFIRMED` no dashboard
- Filtros de status: `PENDING` pode ser removido da UI (todos os bookings novos chegam como `CONFIRMED`)

> **Nota:** O status `PENDING` ainda existe no enum do backend para compatibilidade com agendamentos recorrentes e outros fluxos internos. Apenas o fluxo de criação avulsa foi alterado.

---

## Status de Booking válidos (sem mudança no enum)

```
PENDING → não usado em criação avulsa (mantido para outros fluxos)
CONFIRMED → estado inicial de todo agendamento criado
COMPLETED → agendamento realizado
NO_SHOW → cliente não compareceu
CANCELLED → cancelado pelo cliente ou admin
```

---

## Checklist de adaptação

- [ ] Remover tela/componente de "aguardando confirmação"
- [ ] Remover uso de `pendingExpiresAt` (countdown timer)
- [ ] Redirecionar para "confirmado" diretamente após criação
- [ ] Remover botão "confirmar" do painel admin
- [ ] Remover filtro/listagem de bookings PENDING para aprovação
- [ ] Remover chamada a `POST /bookings/:id/confirm` do fluxo normal de criação
