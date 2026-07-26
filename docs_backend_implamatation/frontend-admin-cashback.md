# Documento de Implementação — Frontend Admin (Painel Admin)

## Sistema de Cashback Dual

Este documento descreve as mudanças necessárias no painel admin para suportar o novo sistema de cashback com dois propósitos: **Quadra (COURT)** e **Bar (BAR)**.

---

## 1. Novas Telas / Modais

### 1.1. Tela de Carteiras de Cashback (Lista)

**Onde:** `/admin/cashback/wallets`

**Endpoint:** `GET /cashback/admin/wallets`

**Response:**
```json
{
  "id": "uuid",
  "clientId": "uuid",
  "balance": 150.00,
  "courtBalance": 100.00,
  "barBalance": 50.00,
  "blockedBalance": 0,
  "totalEarned": 500.00,
  "totalSpent": 350.00,
  "createdAt": "...",
  "updatedAt": "...",
  "client": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com"
  }
}
```

**Layout da lista:**

| Coluna | Descrição |
|--------|-----------|
| Cliente | Nome + email |
| Saldo Total | `balance` |
| Saldo Quadra | `courtBalance` (com badge verde) |
| Saldo Bar | `barBalance` (com badge azul) |
| Total Recebido | `totalEarned` |
| Total Gastos | `totalSpent` |
| Ações | Botão "Usar no Bar" |

**Funcionalidades:**
- Campo de busca por nome/email do cliente
- Filtros por saldo mínimo/máximo (total, court ou bar)
- Ordenação por qualquer coluna
- Paginação

---

### 1.2. Modal: "Usar Cashback no Bar"

**Ação:** Clicar no botão "Usar no Bar" na linha de um cliente (ou dentro da ficha do cliente)

**Endpoint:** `POST /cashback/admin/use-bar-cashback`

**Body do POST:**
```json
{
  "clientId": "uuid",
  "amount": 30.00
}
```

**Response:**
```json
{
  "transaction": {
    "id": "uuid",
    "type": "USED_TAB",
    "amount": -30.00,
    "purpose": "BAR",
    "notes": "Cashback utilizado no bar — admin: uuid",
    "createdAt": "..."
  },
  "wallet": {
    "balance": 20.00,
    "courtBalance": 50.00,
    "barBalance": 20.00
  }
}
```

**Layout do Modal:**

```
┌─────────────────────────────────────┐
│  Usar Cashback no Bar               │
│                                     │
│  Cliente: João Silva                │
│  Saldo Bar Cashback: R$ 50,00       │
│                                     │
│  Valor a usar: [     30,00     ]    │
│  (máx: R$ 50,00)                   │
│                                     │
│  ┌──────────┐ ┌──────────────┐      │
│  │ Cancelar │ │ Confirmar    │      │
│  └──────────┘ └──────────────┘      │
└─────────────────────────────────────┘
```

**Validações no frontend:**
- `amount` > 0
- `amount` <= `barBalance`
- Confirmar mostra alerta de confirmação: "Confirmar débito de R$ XX do cashback bar de [cliente]?"
- Após confirmar, exibir toast de sucesso com saldo atualizado

---

### 1.3. Detalhe da Carteira do Cliente

**Onde:** Ao clicar no nome do cliente na lista de wallets

**Endpoint:** `GET /cashback/transactions?clientId={clientId}&limit=50`

**Query params:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `clientId` | string | ID do cliente (obrigatório para admin) |
| `type` | enum | Filtrar por tipo de transação |
| `purpose` | `COURT \| BAR` | Filtrar por propósito |
| `startDate` | string | Data inicial (ISO) |
| `endDate` | string | Data final (ISO) |
| `limit` | number | Limite de registros |

**Layout:**

```
┌──────────────────────────────────────────────┐
│  Carteira: João Silva                        │
│                                              │
│  ┌───────────────┬──────────────┬──────────┐ │
│  │ Saldo Total   │ Quadra       │ Bar      │ │
│  │ R$ 150,00     │ R$ 100,00    │ R$ 50,00 │ │
│  └───────────────┴──────────────┴──────────┘ │
│                                              │
│  Histórico de Transações:                    │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ Filtros: [Todas] [Quadra] [Bar]         ││
│  │ Data: [___] a [___]                      ││
│  ├──────────────────────────────────────────┤│
│  │ Data       │ Tipo     │ Valor  │ Prop.  ││
│  │ 25/07/2026 │ Bônus QR │ +R$ 50 │ Bar    ││
│  │ 24/07/2026 │ Consumo  │ +R$ 20 │ Quadra ││
│  │ 23/07/2026 │ Booking  │ -R$ 30 │ Quadra ││
│  │ 22/07/2026 │ Bar      │ -R$ 20 │ Bar    ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

**Transaction Response:**
```json
{
  "id": "uuid",
  "type": "EARNED_BONUS",
  "amount": 50.00,
  "purpose": "BAR",
  "notes": "Cashback from QR receipt",
  "tabId": null,
  "bookingId": null,
  "qrReceiptId": "uuid",
  "createdAt": "2026-07-25T..."
}
```

**Filtros:**
- Abas: "Todas" | "Quadra" | "Bar" (filtro `purpose`)
- Período (data início / data fim)
- Tipo de transação (select)

**Ícones sugestivos:**
- COURT: 🏟️ ou ícone de quadra
- BAR: 🍺 ou ícone de bar

---

### 1.4. Tela de Configurações de Cashback

**Onde:** `/admin/settings` (ou `/admin/cashback/config`)

**Endpoint:** `GET /cashback/admin/config` | `PATCH /cashback/admin/config`

**Response `GET /cashback/admin/config`:**
```json
{
  "defaultCashbackPercentage": 5,
  "minPurchaseAmount": 10,
  "expirationDays": 365,
  "maxCashbackPerTransaction": 500,
  "barCashbackEnabled": true
}
```

**Body `PATCH /cashback/admin/config`:**
```json
{
  "defaultCashbackPercentage": 5,
  "minPurchaseAmount": 10,
  "expirationDays": 365,
  "maxCashbackPerTransaction": 500,
  "barCashbackEnabled": true
}
```

**Layout do formulário:**

```
┌──────────────────────────────────────┐
│  Configurações de Cashback           │
│                                      │
│  ┌─── Geral ───────────────────────┐ │
│  │ Porcentagem padrão: [ 5 ] %     │ │
│  │ Valor mínimo da nota: [ 10 ]    │ │
│  │ Máximo por transação: [ 500 ]   │ │
│  │ Dias para expirar: [ 365 ]      │ │
│  └──────────────────────────────────┘ │
│                                       │
│  ┌─── Cashback Bar ────────────────┐  │
│  │ Habilitar cashback para bar     │  │
│  │ [✅] Ativado                     │  │
│  │                                  │  │
│  │ ℹ️ Quando ativado, o cliente     │  │
│  │ poderá escolher se quer o        │  │
│  │ cashback para quadra ou bar      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌────────────────────────────────┐     │
│  │          Salvar                │     │
│  └────────────────────────────────┘     │
└──────────────────────────────────────────┘
```

---

## 2. Mudanças em Telas Existentes

### 2.1. Resumo / Dashboard

No card de "Cashback" do dashboard, adicionar:

```
┌── Cashback ───────────────────────┐
│  Saldo Total: R$ 15.230,00       │
│  ├─ Quadra:  R$ 12.400,00        │
│  └─ Bar:     R$  2.830,00        │
│                                   │
│  Total de carteiras: 342          │
│  Transações no mês: 1.203         │
└───────────────────────────────────┘
```

---

## 3. Endpoints Utilizados (Admin)

| Método | Endpoint | Role | Descrição |
|--------|----------|------|-----------|
| GET | `/cashback/admin/wallets` | ADMIN | Lista todas as carteiras |
| GET | `/cashback/admin/summary` | ADMIN | Resumo agregado |
| GET | `/cashback/admin/config` | ADMIN | Obter config |
| PATCH | `/cashback/admin/config` | ADMIN | Atualizar config |
| **POST** | **`/cashback/admin/use-bar-cashback`** | **ADMIN, EMPLOYEE** | **Debitar bar cashback do cliente** |
| GET | `/cashback/wallet?clientId=X` | ADMIN, EMPLOYEE | Ver carteira de um cliente |
| GET | `/cashback/transactions?clientId=X` | ADMIN, EMPLOYEE | Extrato com filtros |

---

## 4. Comportamentos de UX

| Cenário | Comportamento |
|---------|---------------|
| Cliente não tem bar cashback | Botão "Usar no Bar" desabilitado, tooltip: "Cliente sem saldo de bar cashback" |
| Bar cashback desabilitado na config | Seção de bar cashback oculta em todo o admin |
| Tenta usar mais cashback que o saldo | Input não aceita valor > saldo disponível |
| Sucesso ao usar cashback | Toast verde, modal fecha |
| Erro (ex: cliente não encontrado) | Toast vermelho com mensagem de erro |
