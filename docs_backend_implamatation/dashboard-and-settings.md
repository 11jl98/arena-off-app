# Sistema de Dashboard e Configurações - Arena Off Beach

## Visão Geral

Este documento descreve dois módulos essenciais do sistema de gestão da arena:

1. **Dashboard**: Visão analítica em tempo real para administradores e funcionários
2. **Configurações da Arena**: Gerenciamento das informações institucionais

Ambos os módulos são restritos a usuários com roles **ADMIN** e **EMPLOYEE**.

---

## Módulo Dashboard

### Descrição

Dashboard com estatísticas em tempo real sobre reservas, receita, comandas abertas, cashback e informações operacionais.

### Endpoint

#### GET /dashboard

Obter estatísticas completas do dashboard.

**Permissões**: ADMIN, EMPLOYEE

**Response:**

```json
{
  "bookingsToday": {
    "total": 8,
    "confirmed": 5
  },
  "revenueToday": {
    "total": 1240.50,
    "description": "Reservas pagas"
  },
  "openTabs": {
    "total": 3,
    "totalConsumption": 245.80
  },
  "cashbackCirculating": {
    "total": 1580.30,
    "totalWallets": 42
  },
  "recentBookings": [
    {
      "id": "booking-uuid-1",
      "clientName": "João Luiz Ferreira",
      "courtName": "Quadra 4 - Futevôlei",
      "date": "2026-03-11T00:00:00.000Z",
      "startTime": "03:00",
      "endTime": "04:00",
      "status": "PENDING",
      "finalAmount": 100
    },
    {
      "id": "booking-uuid-2",
      "clientName": "teste",
      "courtName": "Quadra 1 - Beach Tennis",
      "date": "2026-03-13T00:00:00.000Z",
      "startTime": "14:00",
      "endTime": "16:00",
      "status": "PENDING",
      "finalAmount": 240
    },
    {
      "id": "booking-uuid-3",
      "clientName": "Rafael Silva",
      "courtName": "Quadra 1 - Beach Tennis",
      "date": "2026-03-13T00:00:00.000Z",
      "startTime": "08:00",
      "endTime": "10:00",
      "status": "CONFIRMED",
      "finalAmount": 240
    }
  ],
  "courts": [
    {
      "id": "court-uuid-1",
      "name": "Quadra 1 - Beach Tennis",
      "sportName": "Beach Tennis",
      "pricePerHour": 120
    },
    {
      "id": "court-uuid-2",
      "name": "Quadra 2 - Beach Tennis",
      "sportName": "Beach Tennis",
      "pricePerHour": 120
    },
    {
      "id": "court-uuid-3",
      "name": "Quadra 3 - Vôlei",
      "sportName": "Vôlei de Praia",
      "pricePerHour": 100
    },
    {
      "id": "court-uuid-4",
      "name": "Quadra 4 - Futevôlei",
      "sportName": "Futevôlei",
      "pricePerHour": 100
    },
    {
      "id": "court-uuid-5",
      "name": "Quadra 5 - Padel",
      "sportName": "Padel",
      "pricePerHour": 140
    },
    {
      "id": "court-uuid-6",
      "name": "Quadra 6 - Society",
      "sportName": "Futebol Society",
      "pricePerHour": 200
    }
  ]
}
```

### Cards do Dashboard

#### 1. Reservas Hoje
- **total**: Número total de reservas criadas para a data atual
- **confirmed**: Número de reservas com status CONFIRMED

**Query utilizada:**
```typescript
// Busca todas as reservas onde date = hoje
// Conta total e filtra por status CONFIRMED
```

#### 2. Receita Hoje
- **total**: Soma dos valores (finalAmount) de reservas pagas hoje
- **description**: "Reservas pagas"

**Query utilizada:**
```typescript
// Busca reservas com date = hoje e paymentStatus = PAID
// Soma campo finalAmount
```

#### 3. Comandas Abertas
- **total**: Número de comandas com status OPEN
- **totalConsumption**: Soma dos valores totais das comandas abertas

**Query utilizada:**
```typescript
// Busca tabs com status = OPEN
// Conta total e soma campo total (valor da comanda)
```

#### 4. Cashback Circulante
- **total**: Soma de todos os saldos de cashback disponíveis
- **totalWallets**: Número de carteiras de cashback cadastradas

**Query utilizada:**
```typescript
// Busca todas as cashbackWallets
// Conta total de wallets e soma campo balance
```

### Seções Adicionais

#### Últimas Reservas
Lista com as **10 últimas reservas** ordenadas por data e horário (mais recentes primeiro).

**Campos retornados:**
- `id`: UUID da reserva
- `clientName`: Nome do cliente
- `courtName`: Nome da quadra
- `date`: Data da reserva
- `startTime`: Horário de início (formato "HH:mm")
- `endTime`: Horário de fim (formato "HH:mm")
- `status`: Status da reserva (PENDING, CONFIRMED, CANCELLED, etc.)
- `finalAmount`: Valor final a ser pago

#### Quadras
Lista de todas as quadras ativas ordenadas por `displayOrder`.

**Campos retornados:**
- `id`: UUID da quadra
- `name`: Nome da quadra
- `sportName`: Nome do esporte
- `pricePerHour`: Preço por hora

### Performance

O endpoint Dashboard utiliza **queries paralelas** com `Promise.all()` para otimizar performance:

```typescript
const [
  bookingsToday,
  revenueToday,
  openTabs,
  cashbackCirculating,
  recentBookings,
  courts,
] = await Promise.all([
  // 6 queries simultâneas
]);
```

**Tempo de resposta esperado**: < 200ms

### Casos de Uso

#### Exemplo 1: Admin visualiza dashboard ao iniciar expediente

```bash
GET /dashboard
Authorization: Bearer {admin_token}

# Response: Dados completos do dashboard
# Admin vê:
# - 0 reservas confirmadas (início do dia)
# - R$ 0 em receita (ainda não houve pagamentos)
# - 0 comandas abertas
# - R$ 1580.30 em cashback circulante (42 carteiras)
```

#### Exemplo 2: Funcionário monitora operação durante o dia

```bash
GET /dashboard
Authorization: Bearer {employee_token}

# Response atualizado com dados do dia:
# - 8 reservas criadas, 5 confirmadas
# - R$ 1240.50 em receita de reservas pagas
# - 3 comandas abertas com R$ 245.80 em consumo
# - Lista de últimas reservas para acompanhamento
```

---

## Módulo Arena Settings

### Descrição

Gerenciamento das informações institucionais da arena através de um sistema key-value no banco de dados.

**Informações gerenciadas:**
- Nome da Arena
- Telefone
- Cidade
- Estado
- Endereço

### Endpoints

#### GET /arena-settings

Obter configurações atuais da arena.

**Permissões**: ADMIN, EMPLOYEE

**Response:**

```json
{
  "arenaName": "Arena Beach Sports",
  "phone": "(11) 99999-0000",
  "city": "São Paulo",
  "state": "SP",
  "address": "Av. Paulista, 1000"
}
```

**Valores padrão:**
Se as configurações não existirem no banco, o sistema retorna os valores default acima.

#### PATCH /arena-settings

Atualizar configurações da arena.

**Permissões**: ADMIN, EMPLOYEE

**Body (todos campos opcionais):**

```json
{
  "arenaName": "Arena Off Beach Sports",
  "phone": "(11) 98765-4321",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "address": "Av. Atlântica, 2000"
}
```

**Validações:**
- `phone`: Deve estar no formato `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX`
  - Válido: `(11) 99999-0000`, `(11) 3333-4444`
  - Inválido: `11999990000`, `(11)99999-0000`

**Response:**

```json
{
  "arenaName": "Arena Off Beach Sports",
  "phone": "(11) 98765-4321",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "address": "Av. Atlântica, 2000"
}
```

### Estrutura no Banco de Dados

As configurações são armazenadas na tabela `arena_settings` com estrutura key-value:

| key | value | type | description |
|-----|-------|------|-------------|
| arena_name | Arena Beach Sports | STRING | Arena name |
| phone | (11) 99999-0000 | STRING | Contact phone number |
| city | São Paulo | STRING | City location |
| state | SP | STRING | State location |
| address | Av. Paulista, 1000 | STRING | Full address |

**Comportamento de atualização:**
- Se a key já existe: atualiza o valor (UPSERT)
- Se a key não existe: cria novo registro
- Permite atualização parcial (apenas campos enviados são atualizados)

### Casos de Uso

#### Exemplo 1: Admin visualiza configurações atuais

```bash
GET /arena-settings
Authorization: Bearer {admin_token}

# Response:
{
  "arenaName": "Arena Beach Sports",
  "phone": "(11) 99999-0000",
  "city": "São Paulo",
  "state": "SP",
  "address": "Av. Paulista, 1000"
}
```

#### Exemplo 2: Admin atualiza telefone e endereço

```bash
PATCH /arena-settings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "phone": "(11) 98765-4321",
  "address": "Rua Augusta, 500 - Consolação"
}

# Response: Configurações completas com campos atualizados
{
  "arenaName": "Arena Beach Sports",
  "phone": "(11) 98765-4321",
  "city": "São Paulo",
  "state": "SP",
  "address": "Rua Augusta, 500 - Consolação"
}
```

#### Exemplo 3: Funcionário atualiza informações da arena após mudança

```bash
PATCH /arena-settings
Authorization: Bearer {employee_token}
Content-Type: application/json

{
  "arenaName": "Arena Off Beach - Unidade Paulista",
  "city": "São Paulo",
  "state": "SP",
  "address": "Av. Paulista, 1500 - Bela Vista"
}

# Response: Todas as configurações atualizadas
```

#### Exemplo 4: Validação de telefone inválido

```bash
PATCH /arena-settings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "phone": "11999990000"
}

# Response: 400 Bad Request
{
  "statusCode": 400,
  "message": [
    "Phone must be in format (XX) XXXXX-XXXX or (XX) XXXX-XXXX"
  ],
  "error": "Bad Request"
}
```

---

## Integração Frontend

### Dashboard

```typescript
// Chamada inicial ao carregar página
const dashboardData = await fetch('/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Atualizar a cada 30 segundos
setInterval(async () => {
  const updatedData = await fetch('/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  updateDashboardUI(updatedData);
}, 30000);
```

**Sugestões de UI:**

1. **Cards de Estatísticas**: 
   - Reservas Hoje (azul claro) - ícone de calendário
   - Receita Hoje (verde claro) - ícone de dinheiro
   - Comandas Abertas (roxo claro) - ícone de utensílios
   - Cashback Circulante (amarelo claro) - ícone de moedas

2. **Tabela de Últimas Reservas**:
   - Ordenação por data e horário
   - Status com badges coloridos (pendente=amarelo, confirmada=azul, cancelada=vermelho)
   - Valor em Real formatado

3. **Lista de Quadras**:
   - Cards com nome, esporte e preço por hora
   - Indicador visual de disponibilidade (opcional)

### Configurações da Arena

```typescript
// Obter configurações
const settings = await fetch('/arena-settings', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Atualizar configurações
const updateSettings = async (data) => {
  return await fetch('/arena-settings', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
};

// Exemplo de uso
await updateSettings({
  phone: '(11) 98765-4321',
  address: 'Novo endereço'
});
```

**Sugestões de UI:**

1. **Formulário de Edição**:
   - Campos de texto para cada configuração
   - Máscara no campo telefone: `(XX) XXXXX-XXXX`
   - Validação em tempo real
   - Botão "Salvar" que envia apenas campos alterados

2. **Preview das Configurações**:
   - Card com informações de contato
   - Ícone de edição para cada campo
   - Confirmação de sucesso após atualização

---

## Permissões de Acesso

| Endpoint | ADMIN | EMPLOYEE | CLIENT |
|----------|-------|----------|--------|
| GET /dashboard | ✅ | ✅ | ❌ |
| GET /arena-settings | ✅ | ✅ | ❌ |
| PATCH /arena-settings | ✅ | ✅ | ❌ |

**Nota**: Apenas usuários autenticados com roles ADMIN ou EMPLOYEE podem acessar estes endpoints.

---

## Performance e Otimizações

### Dashboard

1. **Queries Paralelas**: Utiliza `Promise.all()` para executar 6 queries simultaneamente
2. **Índices de Banco**: 
   - `booking.date` - Para filtrar reservas do dia
   - `booking.status` - Para contar confirmadas
   - `booking.paymentStatus` - Para calcular receita
   - `tab.status` - Para comandas abertas
   - `court.active` - Para listar quadras

3. **Aggregate Functions**: Utiliza `count()` e `aggregate._sum` do Prisma para cálculos no banco

4. **Select Seletivo**: Busca apenas campos necessários nas relações

### Arena Settings

1. **Batch Upsert**: Atualiza múltiplas settings em uma única transação
2. **Cache Potencial**: Valores mudam raramente, ideal para caching (Redis/memória)
3. **Index Único**: Campo `key` tem índice único para queries rápidas

---

## Próximas Melhorias

### Dashboard
- [ ] Filtro de data (ver estatísticas de dias anteriores)
- [ ] Gráfico de receita semanal/mensal
- [ ] Top 5 clientes mais ativos
- [ ] Taxa de ocupação das quadras por período
- [ ] Comparativo com período anterior
- [ ] Export de relatórios em PDF/Excel
- [ ] Notificações em tempo real via WebSocket

### Arena Settings
- [ ] Upload de logotipo da arena
- [ ] Configuração de horário de funcionamento
- [ ] Redes sociais (Instagram, Facebook, WhatsApp)
- [ ] Email de contato
- [ ] Configurações de políticas (cancelamento, pagamento)
- [ ] Múltiplas unidades/filiais
- [ ] Histórico de alterações (audit log)
