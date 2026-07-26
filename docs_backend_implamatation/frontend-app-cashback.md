# Documento de Implementação — Frontend App Cliente

## Sistema de Cashback Dual

Este documento descreve as mudanças necessárias no aplicativo do cliente para suportar o novo sistema de cashback com dois propósitos: **Quadra (COURT)** e **Bar (BAR)**.

---

## 1. Tela de Carteira / Saldo

**Onde:** Aba "Carteira" ou "Cashback" no app

**Endpoint:** `GET /cashback/wallet`

**Response:**
```json
{
  "id": "uuid",
  "clientId": "uuid",
  "balance": 150.00,
  "courtBalance": 100.00,
  "barBalance": 50.00,
  "totalEarned": 500.00,
  "totalSpent": 350.00,
  "recentTransactions": [
    {
      "id": "uuid",
      "type": "EARNED_BONUS",
      "amount": 50.00,
      "purpose": "BAR",
      "notes": "Cashback from QR receipt",
      "createdAt": "2026-07-25T..."
    }
  ]
}
```

**Layout sugerido:**

```
┌────────────────────────────────┐
│  💰 Meu Cashback               │
│                                │
│  ┌───── Total ──────────────┐  │
│  │      R$ 150,00            │  │
│  └───────────────────────────┘  │
│                                │
│  ┌─────────┬─────────────────┐  │
│  │ Quadra  │ Bar             │  │
│  │ R$ 100  │ R$ 50           │  │
│  │ 🏟️      │ 🍺              │  │
│  └─────────┴─────────────────┘  │
│                                │
│  ═══════════════════════════  │
│  » usar na quadra:            │
│    selecione ao agendar       │
│  » usar no bar:               │
│    solicite ao atendente      │
│  ═══════════════════════════  │
│                                │
│  Extrato:                      │
│  ┌──────────────────────────┐  │
│  │ Hoje                     │  │
│  │ +R$ 50,00 · Bônus QR    │  │
│  │   Destino: Bar 🍺        │  │
│  ├──────────────────────────┤  │
│  │ Ontem                    │  │
│  │ +R$ 20,00 · Consumo     │  │
│  │   Destino: Quadra 🏟️    │  │
│  ├──────────────────────────┤  │
│  │ 23/07                    │  │
│  │ -R$ 30,00 · Agendamento │  │
│  │   Origem: Quadra 🏟️     │  │
│  └──────────────────────────┘  │
│                                │
│  [ Ver extrato completo ]      │
└────────────────────────────────┘
```

**Regras de exibição:**
- Se `barCashbackEnabled === false` na config (`GET /cashback/admin/config`), não mostrar o card "Bar", mostrar apenas saldo único (legado)
- Transações com `purpose: COURT` mostram ícone de quadra
- Transações com `purpose: BAR` mostram ícone de bar/cerveja

---

## 2. Fluxo de Scan de QR — Com Escolha de Propósito

### Passo 1: Scan do QR (inalterado)

App abre câmera → escaneia QR da notinha → chama `POST /cashback/qr-receipt`

### Passo 2: Confirmação + Escolha (NOVO)

Após validar a notinha (valor encontrado), exibir tela de escolha:

**Request:**
```json
{
  "receiptData": "https://sefaz.fazenda...",
  "purpose": "COURT"  // ou "BAR"
}
```

Se o usuário não enviar `purpose`, o backend usa `COURT` como default.

```
┌────────────────────────────────┐
│  ✅ Notinha Encontrada!        │
│                                │
│  Estabelecimento: Arena Off    │
│  Valor da compra: R$ 120,00   │
│  Data: 25/07/2026              │
│                                │
│  ─── Cashback Gerado ──────   │
│  R$ 6,00 (5%)                 │
│                                │
│  Onde quer usar esse valor?   │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🏟️  Na Quadra           │  │
│  │    Usar em agendamentos  │  │
│  │    de quadra             │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🍺  No Bar               │  │
│  │    Usar no consumo do    │  │
│  │    bar (com atendente)   │  │
│  └──────────────────────────┘  │
│                                │
│  [ Confirmar ]                 │
└────────────────────────────────┘
```

### Passo 3: Confirmação final

```
┌────────────────────────────────┐
│  ✅ Cashback Adicionado!       │
│                                │
│  R$ 6,00 adicionado ao seu    │
│  saldo de Bar 🍺              │
│                                │
│  Saldo atual:                  │
│  Quadra: R$ 100,00             │
│  Bar:    R$ 56,00  ← +R$ 6,00 │
│                                │
│  [ Voltar para Home ]          │
└────────────────────────────────┘
```

**Regras:**
- Se `barCashbackEnabled === false` (consultar endpoint de config), pular passo 2, cashback vai direto para COURT
- Usuário pode escolher qualquer um dos dois, independente de saldos
- A escolha é final e irreversível

---

## 3. Tela de Agendamento — Uso de Cashback

**Onde:** Tela de criação de booking

**Endpoint:** `POST /bookings`

**Body relevante:**
```json
{
  "courtId": "uuid",
  "date": "2026-07-26",
  "startTime": "14:00",
  "endTime": "15:00",
  "clientId": "uuid",
  "cashbackUsed": 30.00
}
```

**Mudança:** O valor usado no booking sempre vem do `courtBalance`.

**Layout (trecho de pagamento):**

```
┌────────────────────────────────┐
│  Resumo do Agendamento        │
│                                │
│  Quadra: Society 1             │
│  Data: 26/07 - 14h às 15h     │
│                                │
│  Valor: R$ 100,00              │
│                                │
│  Cashback Disponível:          │
│  🏟️  Quadra: R$ 100,00       │
│  🍺  Bar:    R$ 56,00         │
│                                │
│  Usar Cashback da Quadra:      │
│  [ R$  30,00  ]  (máx: R$ 100) │
│                                │
│  Total a pagar: R$ 70,00       │
│                                │
│  [ Confirmar Agendamento ]     │
└────────────────────────────────┘
```

**Regras:**
- Input de cashback só considera `courtBalance` como disponível
- Máximo: min(`courtBalance`, valor do agendamento)
- Exibir saldos separados para informação do usuário

---

## 4. Tela de Extrato Detalhado

**Onde:** "Ver extrato completo" na carteira

**Endpoint:** `GET /cashback/transactions`

**Query params:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `purpose` | `COURT \| BAR` | Filtrar por propósito |
| `type` | enum | Filtrar por tipo |
| `startDate` | string | Data inicial (ISO) |
| `endDate` | string | Data final (ISO) |
| `limit` | number | Limite (default 50) |

**Layout:**

```
┌────────────────────────────────┐
│  Extrato de Cashback          │
│                                │
│  [Todas] [Quadra 🏟️] [Bar 🍺] │
│                                │
│  ┌──────────────────────────┐  │
│  │ 25/07                    │  │
│  │ → +R$ 50,00 · Bônus QR  │  │
│  │   Destino: Bar 🍺        │  │
│  │                          │  │
│  │ → +R$ 20,00 · Consumo   │  │
│  │   Destino: Quadra 🏟️    │  │
│  ├──────────────────────────┤  │
│  │ 24/07                    │  │
│  │ → -R$ 30,00 · Booking   │  │
│  │   Origem: Quadra 🏟️     │  │
│  ├──────────────────────────┤  │
│  │ 22/07                    │  │
│  │ → -R$ 20,00 · Bar       │  │
│  │   Origem: Bar 🍺         │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

**Filtros:**
- Abas: "Todas" | "Quadra 🏟️" | "Bar 🍺"
- Por data (opcional)
- Scroll infinito ou paginação

---

## 5. Notificações Push

**Novos templates:**

| Evento | Título | Corpo |
|--------|--------|-------|
| QR processado (COURT) | 💰 Cashback recebido! | R$ XX,00 adicionado para usar em quadras 🏟️ |
| QR processado (BAR) | 💰 Cashback recebido! | R$ XX,00 adicionado para usar no bar 🍺 |
| Bar cashback usado | 🍺 Cashback utilizado | R$ XX,00 foi usado no bar. Saldo atual: R$ XX |

---

## 6. Fluxo de Onboarding / Educação

Na primeira vez que o usuário for escanear um QR (ou quando bar cashback for habilitado):

```
┌────────────────────────────────┐
│  🆕 Novidade!                  │
│                                │
│  Agora você pode escolher     │
│  onde usar seu cashback!      │
│                                │
│  🏟️  Quadra: para pagar      │
│     agendamentos              │
│                                │
│  🍺  Bar: para consumir no   │
│     bar (com o atendente)     │
│                                │
│  Os saldos são separados e    │
│  a escolha é definitiva.      │
│                                │
│  [ Entendi! ]                  │
└────────────────────────────────┘
```

---

## 7. Comportamentos de UX

| Cenário | Comportamento |
|---------|---------------|
| Bar cashback desabilitado | Tela de escolha não aparece; cashback vai direto para COURT |
| Saldo court = 0 e tenta agendar | Input de cashback fica zerado, não bloqueia agendamento |
| Saldo bar = 0 na tela do bar | Mensagem: "Você não tem cashback para usar no bar" |
| QR já processado | Toast de erro: "Este cupom já foi utilizado" |
| QR de outro estabelecimento | Toast de erro: "Cupom não pertence a este estabelecimento" |

---

## 8. Endpoints Utilizados (Cliente)

| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/cashback/wallet` | Saldo da carteira |
| GET | `/cashback/transactions` | Extrato com filtro `purpose` |
| POST | `/cashback/qr-receipt` | Processar QR (body com `purpose`) |
| GET | `/cashback/qr-receipts` | Histórico de receipts |
| POST | `/bookings` | Criar agendamento (com `cashbackUsed`) |

---

## 9. Checklist de Implementação

- [ ] Tela de carteira com saldos segregados (courtBalance + barBalance)
- [ ] Tela de extrato com abas de filtro por propósito
- [ ] Fluxo de QR: validação → escolha COURT/BAR → confirmação
- [ ] Input de cashback no booking usando apenas courtBalance
- [ ] Exibição informativa de ambos os saldos no booking
- [ ] Notificações push com templates por propósito
- [ ] Modal/tooltip de onboarding para cashback dual
- [ ] Tratamento de erro quando bar cashback está desabilitado
