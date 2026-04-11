# Sistema de Reservas - Arena Off Beach

## Visão Geral

O módulo de Reservas (Bookings) gerencia todo o fluxo de agendamento de quadras esportivas. Possui sistema em tempo real para verificação de disponibilidade, prevenção de conflitos de reserva, cálculo automático de preços com aplicação de promoções e integração com cashback.

## Características Principais

### Resiliência em Tempo Real
- **Constraint única no banco**: `@@unique([courtId, date, startTime])` previne reservas duplicadas
- **Verificação dupla**: Validação antes de criar + tratamento de erro de constraint
- **Race condition protection**: Mesmo que 2 usuários tentem reservar simultaneamente, apenas 1 terá sucesso

### Cálculo Inteligente de Preços
- Preço base calculado: `Court.pricePerHour × horas`
- Aplicação automática da melhor promoção disponível
- Desconto com cashback do cliente
- Preço final: `calculatedAmount - cashbackUsed`

### Disponibilidade Dinâmica
- Listagem de horários disponíveis por quadra e data
- Slots de 1 hora (6h às 23h)
- Verificação de sobreposição de horários
- Exclusão de reservas canceladas no cálculo

## Endpoints da API

### POST /bookings
Criar nova reserva (CLIENT, EMPLOYEE, ADMIN)

**Body:**
```json
{
  "courtId": "uuid-da-quadra",
  "clientId": "uuid-do-cliente",
  "date": "2026-03-20",
  "startTime": "18:00",
  "endTime": "20:00",
  "cashbackUsed": 10.00,
  "notes": "Aniversário do grupo",
  "splitPayment": false,
  "numberOfPeople": 4
}
```

**Validações:**
- ✅ Quadra deve existir e estar ativa
- ✅ `endTime` deve ser depois de `startTime`
- ✅ Duração mínima de 1 hora
- ✅ Horário deve estar disponível (sem conflitos)
- ✅ Cashback usado não pode exceder o valor total

**Response:**
```json
{
  "id": "uuid",
  "courtId": "uuid-da-quadra",
  "clientId": "uuid-do-cliente",
  "date": "2026-03-20T00:00:00.000Z",
  "startTime": "18:00",
  "endTime": "20:00",
  "calculatedAmount": 160,
  "cashbackUsed": 10,
  "finalAmount": 150,
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "notes": "Aniversário do grupo",
  "splitPayment": false,
  "numberOfPeople": 4,
  "createdAt": "2026-03-18T15:30:00.000Z",
  "updatedAt": "2026-03-18T15:30:00.000Z",
  "confirmedAt": null,
  "cancelledAt": null,
  "court": {
    "id": "uuid-da-quadra",
    "name": "Quadra Central 1",
    "pricePerHour": 80,
    "sport": {
      "id": "uuid-do-esporte",
      "name": "Beach Tennis"
    }
  },
  "client": {
    "id": "uuid-do-cliente",
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

**Lógica de Preço:**
1. Calcula duração: `(20:00 - 18:00) = 2 horas`
2. Preço base: `80 × 2 = R$ 160`
3. Busca melhor promoção disponível
4. Se tem promoção: aplica desconto → `calculatedAmount`
5. Subtrai cashback usado: `160 - 10 = R$ 150` → `finalAmount`

**Tratamento de Race Condition:**
```json
// Se alguém reservou segundos antes
{
  "statusCode": 409,
  "message": "Court is already booked for this time slot",
  "error": "Conflict"
}
```

### GET /bookings
Listar reservas (Todos os usuários autenticados)

**Query Parameters:**
- `courtId`: Filtrar por quadra específica
- `clientId`: Filtrar por cliente
- `date`: Filtrar por data (formato YYYY-MM-DD)
- `status`: Filtrar por status (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
- `paymentStatus`: Filtrar por status de pagamento

**Exemplos:**
```
GET /bookings
GET /bookings?courtId=uuid&date=2026-03-20
GET /bookings?clientId=uuid&status=CONFIRMED
GET /bookings?date=2026-03-20&status=PENDING
```

**Response:**
```json
[
  {
    "id": "uuid",
    "courtId": "uuid-da-quadra",
    "date": "2026-03-20T00:00:00.000Z",
    "startTime": "18:00",
    "endTime": "20:00",
    "calculatedAmount": 160,
    "finalAmount": 150,
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "court": {
      "name": "Quadra Central 1",
      "sport": { "name": "Beach Tennis" }
    },
    "client": {
      "name": "João Silva",
      "email": "joao@example.com"
    },
    ...
  }
]
```

**Ordenação:** Por data (decrescente) e horário (decrescente)

### GET /bookings/available-slots
Listar horários disponíveis (Todos os usuários autenticados)

**Query Parameters (obrigatórios):**
- `courtId`: UUID da quadra
- `date`: Data no formato YYYY-MM-DD

**Exemplo:**
```
GET /bookings/available-slots?courtId=uuid-da-quadra&date=2026-03-20
```

**Response:**
```json
{
  "courtId": "uuid-da-quadra",
  "date": "2026-03-20",
  "slots": [
    {
      "startTime": "06:00",
      "endTime": "07:00",
      "available": true,
      "pricePerHour": 80
    },
    {
      "startTime": "07:00",
      "endTime": "08:00",
      "available": true,
      "pricePerHour": 80
    },
    {
      "startTime": "08:00",
      "endTime": "09:00",
      "available": false,
      "pricePerHour": 80
    },
    ...
    {
      "startTime": "22:00",
      "endTime": "23:00",
      "available": true,
      "pricePerHour": 80
    }
  ]
}
```

**Configuração de Horários:**
- Abertura: 6h
- Fechamento: 23h
- Slots de 1 hora cada
- Total: 17 slots por dia

### GET /bookings/:id
Obter detalhes de uma reserva (Todos os usuários autenticados)

**Response:**
```json
{
  "id": "uuid",
  "courtId": "uuid-da-quadra",
  "clientId": "uuid-do-cliente",
  "date": "2026-03-20T00:00:00.000Z",
  "startTime": "18:00",
  "endTime": "20:00",
  "calculatedAmount": 160,
  "cashbackUsed": 10,
  "finalAmount": 150,
  "status": "CONFIRMED",
  "paymentStatus": "PAID",
  "notes": "Aniversário do grupo",
  "splitPayment": false,
  "numberOfPeople": 4,
  "createdAt": "2026-03-18T15:30:00.000Z",
  "updatedAt": "2026-03-18T15:30:00.000Z",
  "confirmedAt": "2026-03-18T15:35:00.000Z",
  "cancelledAt": null,
  "court": {
    "id": "uuid-da-quadra",
    "name": "Quadra Central 1",
    "pricePerHour": 80,
    "sport": {
      "id": "uuid-do-esporte",
      "name": "Beach Tennis"
    }
  },
  "client": {
    "id": "uuid-do-cliente",
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

### PATCH /bookings/:id
Atualizar reserva (ADMIN, EMPLOYEE)

**Body (todos campos opcionais):**
```json
{
  "status": "CONFIRMED",
  "paymentStatus": "PAID",
  "notes": "Cliente pagou via PIX"
}
```

**Response:** Reserva atualizada completa

### DELETE /bookings/:id
Deletar reserva (ADMIN apenas)

**Response:**
```json
{
  "message": "Booking deleted successfully"
}
```

### POST /bookings/:id/confirm
Confirmar reserva (ADMIN, EMPLOYEE)

**Validações:**
- ❌ Não pode confirmar reserva cancelada
- ❌ Não pode confirmar reserva já confirmada

**Response:** Reserva com `status: "CONFIRMED"` e `confirmedAt` preenchido

### POST /bookings/:id/cancel
Cancelar reserva (ADMIN, EMPLOYEE, CLIENT)

**Validações:**
- ❌ Não pode cancelar reserva já cancelada
- ❌ Não pode cancelar reserva completada

**Response:** Reserva com `status: "CANCELLED"` e `cancelledAt` preenchido

### POST /bookings/check-availability
Verificar disponibilidade (Todos os usuários autenticados)

**Body:**
```json
{
  "courtId": "uuid-da-quadra",
  "date": "2026-03-20",
  "startTime": "18:00",
  "endTime": "20:00"
}
```

**Response:**
```json
{
  "available": true
}
```

ou

```json
{
  "available": false
}
```

**Lógica de Verificação:**
1. Busca todas as reservas da quadra na data (exceto canceladas)
2. Verifica sobreposição de horários
3. Retorna `false` se houver qualquer conflito

**Detecção de Sobreposição:**
```
Conflito ocorre quando:
- Novo início está dentro de reserva existente, OU
- Novo fim está dentro de reserva existente, OU
- Novo horário engloba completamente reserva existente

Exemplo de conflito:
Existente: 18:00 - 20:00
Novo:      19:00 - 21:00  ❌ Sobrepõe
Novo:      17:00 - 19:00  ❌ Sobrepõe
Novo:      17:00 - 21:00  ❌ Engloba
Novo:      16:00 - 18:00  ✅ Não sobrepõe
Novo:      20:00 - 22:00  ✅ Não sobrepõe
```

## Exemplos de Casos de Uso

### Exemplo 1: Cliente Reserva Quadra pelo App

```bash
# Passo 1: Verificar horários disponíveis
GET /bookings/available-slots?courtId=court-uuid&date=2026-03-20
Authorization: Bearer {client_token}

# Response: Lista de slots com availability

# Passo 2: Verificar disponibilidade específica (opcional)
POST /bookings/check-availability
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "courtId": "court-uuid",
  "date": "2026-03-20",
  "startTime": "18:00",
  "endTime": "20:00"
}

# Response: { "available": true }

# Passo 3: Criar reserva
POST /bookings
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "courtId": "court-uuid",
  "clientId": "client-uuid",
  "date": "2026-03-20",
  "startTime": "18:00",
  "endTime": "20:00",
  "cashbackUsed": 15.00,
  "numberOfPeople": 4
}

# Response: Reserva criada com preços calculados
# - calculatedAmount: 160 (preço base) ou menos se tiver promoção
# - finalAmount: 145 (160 - 15 de cashback)
# - status: PENDING
# - paymentStatus: PENDING
```

### Exemplo 2: Race Condition - Dois Clientes Reservam Simultaneamente

```bash
# Cliente A e Cliente B tentam reservar ao mesmo tempo

# Cliente A (request enviado às 15:30:00.100)
POST /bookings
{
  "courtId": "court-uuid",
  "clientId": "client-a-uuid",
  "date": "2026-03-20",
  "startTime": "18:00",
  "endTime": "20:00"
}

# Cliente B (request enviado às 15:30:00.150)
POST /bookings
{
  "courtId": "court-uuid",
  "clientId": "client-b-uuid",
  "date": "2026-03-20",
  "startTime": "18:00",
  "endTime": "20:00"
}

# Resultado:
# Cliente A: 200 OK - Reserva criada ✅
# Cliente B: 409 Conflict - "Court is already booked for this time slot" ❌

# A constraint única do banco garante que apenas 1 reserva seja criada
```

### Exemplo 3: Admin Reserva Manualmente com Promoção

```bash
# Admin cria reserva para cliente em horário promocional
POST /bookings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "courtId": "court-uuid",
  "clientId": "client-uuid",
  "date": "2026-03-20",
  "startTime": "17:30",
  "endTime": "19:30",
  "numberOfPeople": 2,
  "notes": "Reserva feita por telefone"
}

# Sistema automaticamente:
# 1. Calcula: 80 × 2 = R$ 160
# 2. Busca promoções aplicáveis (ex: 50% após 17h)
# 3. Aplica melhor promoção: R$ 80
# 4. Response:
{
  "calculatedAmount": 80,
  "finalAmount": 80,
  "status": "PENDING",
  ...
}

# Admin confirma a reserva
POST /bookings/{booking-id}/confirm
Authorization: Bearer {admin_token}

# Response: status alterado para "CONFIRMED"
```

### Exemplo 4: Funcionário Lista Reservas do Dia

```bash
# Listar todas as reservas de hoje
GET /bookings?date=2026-03-20
Authorization: Bearer {employee_token}

# Response: Array de todas as reservas do dia com status

# Listar apenas reservas pendentes
GET /bookings?date=2026-03-20&status=PENDING
Authorization: Bearer {employee_token}

# Listar reservas de uma quadra específica
GET /bookings?courtId=court-uuid&date=2026-03-20
Authorization: Bearer {employee_token}
```

### Exemplo 5: Cliente Cancela Reserva

```bash
# Cliente visualiza suas reservas
GET /bookings?clientId=client-uuid
Authorization: Bearer {client_token}

# Cliente cancela uma reserva
POST /bookings/{booking-id}/cancel
Authorization: Bearer {client_token}

# Response: Reserva com status "CANCELLED" e cancelledAt preenchido
{
  "id": "booking-uuid",
  "status": "CANCELLED",
  "cancelledAt": "2026-03-18T16:00:00.000Z",
  ...
}
```

## Regras de Negócio

### Criação de Reserva

1. **Validação de Quadra:**
   - Quadra deve existir
   - Quadra deve estar ativa

2. **Validação de Horário:**
   - `endTime` > `startTime`
   - Duração mínima: 1 hora
   - Horário deve estar disponível (sem conflitos)

3. **Cálculo de Preço:**
   - Preço base = `pricePerHour × horas`
   - Busca melhor promoção disponível automaticamente
   - Se promoção aplicável: `calculatedAmount = preço com desconto`
   - Se não: `calculatedAmount = preço base`

4. **Cashback:**
   - `cashbackUsed` ≤ `calculatedAmount`
   - `finalAmount = calculatedAmount - cashbackUsed`

5. **Status Inicial:**
   - `status: PENDING`
   - `paymentStatus: PENDING`

### Verificação de Disponibilidade

1. **Busca Reservas:**
   - Mesma quadra
   - Mesma data
   - Status ≠ CANCELLED

2. **Detecção de Conflito:**
   - Verifica sobreposição de horários
   - Usa conversão para minutos (performance)
   - Retorna `false` no primeiro conflito encontrado

3. **Exclusão de Reservas:**
   - Pode excluir uma reserva específica da verificação
   - Útil para edição de reservas existentes

### Slots Disponíveis

1. **Configuração:**
   - Horário de abertura: 6h
   - Horário de fechamento: 23h
   - Duração de cada slot: 1 hora
   - Total: 17 slots por dia

2. **Geração:**
   - Percorre horários de 6h até 22h
   - Para cada slot, verifica se há conflito
   - Marca como disponível ou não

3. **Informações:**
   - `startTime` e `endTime` do slot
   - `available`: boolean
   - `pricePerHour`: preço base da quadra

### Estados da Reserva

```
PENDING → CONFIRMED → COMPLETED
   ↓
CANCELLED

Transições permitidas:
- PENDING → CONFIRMED (via confirm)
- PENDING → CANCELLED (via cancel)
- CONFIRMED → CANCELLED (via cancel)
- CONFIRMED → COMPLETED (manual ou automático)

Transições bloqueadas:
- CANCELLED → qualquer outro
- COMPLETED → CANCELLED
```

## Integração com Outros Módulos

### Com Módulo de Quadras (Courts)

```javascript
// Busca quadra para obter preço
const court = await courtRepository.findById(courtId);
const basePrice = court.pricePerHour * hours;
```

### Com Módulo de Promoções

```javascript
// Busca e aplica melhor promoção automaticamente
const promotion = await promotionService.findBestPromotion({
  date: new Date(data.date),
  startTime: data.startTime,
  endTime: data.endTime,
  basePrice,
  hours,
  clientId: data.clientId,
});

const calculatedAmount = promotion ? promotion.finalPrice : basePrice;
```

### Com Módulo de Cashback (Futuro)

```javascript
// Valida saldo de cashback disponível
const wallet = await cashbackService.getWallet(clientId);
if (cashbackUsed > wallet.balance) {
  throw new BadRequestException('Insufficient cashback balance');
}

// Após pagamento, debita cashback usado
await cashbackService.useCashback(clientId, cashbackUsed, bookingId);
```

### Com Módulo de Pagamentos (Futuro)

```javascript
// Após criar reserva, redireciona para pagamento
const booking = await bookingService.createBooking(data);
const payment = await paymentService.createPaymentIntent({
  bookingId: booking.id,
  amount: booking.finalAmount,
  method: 'PIX'
});

// Após pagamento confirmado, atualiza status
await bookingService.updateBooking(bookingId, {
  paymentStatus: 'PAID'
});
```

## Estrutura do Banco de Dados

### Tabela: bookings

```sql
id                UUID PRIMARY KEY
courtId           UUID NOT NULL REFERENCES courts(id)
clientId          UUID NOT NULL REFERENCES users(id)
date              DATE NOT NULL
startTime         VARCHAR NOT NULL  -- "HH:mm"
endTime           VARCHAR NOT NULL  -- "HH:mm"
calculatedAmount  DECIMAL(10,2) NOT NULL
cashbackUsed      DECIMAL(10,2) DEFAULT 0
finalAmount       DECIMAL(10,2) NOT NULL
status            BookingStatus DEFAULT 'PENDING'
paymentStatus     PaymentStatus DEFAULT 'PENDING'
notes             TEXT
splitPayment      BOOLEAN DEFAULT false
numberOfPeople    INTEGER DEFAULT 1
createdAt         TIMESTAMP DEFAULT now()
updatedAt         TIMESTAMP DEFAULT now()
confirmedAt       TIMESTAMP
cancelledAt       TIMESTAMP

UNIQUE(courtId, date, startTime)  -- Previne reservas duplicadas
```

**Índices:**
- `courtId` - Buscar reservas de uma quadra
- `clientId` - Buscar reservas de um cliente
- `date` - Buscar reservas de uma data
- `status` - Filtrar por status
- `paymentStatus` - Filtrar por status de pagamento
- Índice composto: `(courtId, date)` - Query mais comum

**Constraint Única:**
- `@@unique([courtId, date, startTime])` - **CRÍTICO para resiliência**
- Garante que não existam 2 reservas para mesma quadra, data e horário
- Banco rejeita automaticamente inserções conflitantes
- Erro P2002 capturado e convertido para ConflictException

## Permissões de Acesso

| Endpoint | CLIENT | EMPLOYEE | ADMIN |
|----------|--------|----------|-------|
| POST /bookings | ✅ | ✅ | ✅ |
| GET /bookings | ✅ | ✅ | ✅ |
| GET /bookings/available-slots | ✅ | ✅ | ✅ |
| GET /bookings/:id | ✅ | ✅ | ✅ |
| PATCH /bookings/:id | ❌ | ✅ | ✅ |
| DELETE /bookings/:id | ❌ | ❌ | ✅ |
| POST /bookings/:id/confirm | ❌ | ✅ | ✅ |
| POST /bookings/:id/cancel | ✅ | ✅ | ✅ |
| POST /bookings/check-availability | ✅ | ✅ | ✅ |

**Notas:**
- Clientes podem criar, ver e cancelar suas próprias reservas
- Funcionários podem confirmar e gerenciar reservas
- Apenas Admin pode deletar permanentemente

## Considerações de Performance

### 1. Índices Estratégicos

```sql
-- Queries mais comuns
CREATE INDEX idx_bookings_court_date ON bookings(courtId, date);
CREATE INDEX idx_bookings_client ON bookings(clientId);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### 2. Verificação de Disponibilidade

```typescript
// Conversão para minutos: O(1)
const startMinutes = hours * 60 + minutes;

// Comparação numérica (rápida) ao invés de string
if (startMinutes >= bookingStart && startMinutes < bookingEnd) {
  // conflito detectado
}
```

### 3. Busca de Reservas

```typescript
// Filtra por status no banco (não em memória)
where: {
  courtId,
  date,
  status: {
    notIn: [BookingStatus.CANCELLED]
  }
}
```

### 4. Includes Seletivos

```typescript
// Inclui relações apenas quando necessário
include: includeRelations ? {
  court: {
    include: {
      sport: {
        select: { id: true, name: true }  // Apenas campos necessários
      }
    }
  }
} : undefined
```

### 5. Ordenação no Banco

```typescript
// Deixa o banco ordenar (usa índices)
orderBy: [
  { date: 'desc' },
  { startTime: 'desc' }
]
```

## Tratamento de Erros

### ConflictException (409)
```json
{
  "statusCode": 409,
  "message": "Court is already booked for this time slot",
  "error": "Conflict"
}
```

**Quando ocorre:**
- Tentativa de criar reserva em horário já ocupado
- Capturado a partir do erro P2002 do Prisma (constraint violation)

### BadRequestException (400)
```json
{
  "statusCode": 400,
  "message": "End time must be after start time",
  "error": "Bad Request"
}
```

**Quando ocorre:**
- Horário de fim antes ou igual ao de início
- Duração menor que 1 hora
- Quadra inativa
- Cashback usado excede valor total
- Tentativa de confirmar reserva cancelada
- Tentativa de cancelar reserva completada

### NotFoundException (404)
```json
{
  "statusCode": 404,
  "message": "Court not found",
  "error": "Not Found"
}
```

**Quando ocorre:**
- Quadra não existe
- Reserva não existe

## Próximas Melhorias

- [ ] Sistema de notificações (push/email) para confirmação e lembretes
- [ ] Reservas recorrentes (semanal, mensal)
- [ ] Lista de espera quando horário está ocupado
- [ ] Check-in automático via QR Code na quadra
- [ ] Histórico de uso por cliente (estatísticas)
- [ ] Sistema de avaliações pós-reserva
- [ ] Integração com calendários (Google Calendar, iCal)
- [ ] Política de cancelamento com multas
- [ ] Bloqueio de horários para manutenção
- [ ] Dashboard analítico de ocupação
- [ ] Reservas em grupo com divisão de pagamento
- [ ] Validação de saldo de cashback antes de criar reserva
- [ ] Expiração automática de reservas não pagas após X horas
- [ ] Webhooks para eventos de reserva (criada, confirmada, cancelada)
