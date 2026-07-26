# Sistema de Promoções - Arena Off Beach

## Visão Geral

O módulo de Promoções permite criar e gerenciar diferentes tipos de ofertas especiais para reservas de quadras, incluindo descontos por horário, combos de horas e promoções especiais. O sistema calcula automaticamente a melhor promoção aplicável para cada reserva.

## Tipos de Promoções

### 1. SPECIAL_HOURS (Horários Especiais)
Descontos aplicados em horários específicos do dia.

**Exemplos:**
- 50% de desconto após as 17h
- R$ 20 de desconto entre 14h-16h
- Desconto em dias específicos da semana

**Configuração:**
- `discountPercent`: Percentual de desconto (ex: 50 = 50%)
- `discountFixed`: Valor fixo de desconto (ex: 20.00)
- `startTime`: Horário inicial (ex: "17:00")
- `endTime`: Horário final (ex: "21:00")
- `daysOfWeek`: Dias da semana aplicáveis [0-6] (0=Domingo)

### 2. HOURS_COMBO (Combo de Horas)
Pague X horas e ganhe Y horas extras.

**Exemplos:**
- Pague 2 horas, ganhe 1 hora extra
- Reserve 4 horas, ganhe 2 horas extras

**Configuração:**
- `minHours`: Horas mínimas necessárias (ex: 2)
- `bonusHours`: Horas extras concedidas (ex: 1)

### 3. FIRST_BOOKING (Primeira Reserva)
Desconto especial para a primeira reserva de novos clientes.

**Configuração:**
- `discountPercent` ou `discountFixed`: Desconto aplicado

### 4. DATE_BASED (Promoção por Data / Período)
Desconto aplicado em uma data específica ou em um período contínuo de datas.

**Exemplos:**
- 30% de desconto no feriado de 07 de setembro
- R$ 50 de desconto durante o período de 20/12 a 31/12

**Configuração:**
- `discountPercent` ou `discountFixed`: Desconto aplicado
- `startDate`: Data inicial da promoção (obrigatório)
- `endDate`: Data final da promoção (obrigatório)
- Para uma única data, use `startDate` e `endDate` iguais (ex: ambos `"2026-09-07"`)

**Regras de aplicabilidade:**
- A reserva deve estar dentro do intervalo `[startDate, endDate]`.
- Não utiliza `startTime`, `endTime` nem `daysOfWeek` — a elegibilidade é puramente por data.
- Se o admin preencher `startTime`/`endTime`/`daysOfWeek` em uma promoção `DATE_BASED`, esses campos serão ignorados na verificação de elegibilidade.

## Pacotes de Horas (Hours Packages)

Venda de pacotes de horas com desconto para uso futuro.

**Exemplos:**
- Pacote 10 horas por R$ 400 (economia de 20%)
- Pacote 20 horas por R$ 700 (economia de 30%)

**Características:**
- Validade padrão: 90 dias
- Economia em percentual calculada automaticamente
- Cliente pode usar as horas ao longo do período de validade

## Endpoints da API

### Promoções

#### POST /promotions
Criar nova promoção (ADMIN apenas)

**Body:**
```json
{
  "name": "Happy Hour Vespertino",
  "description": "50% de desconto após as 17h",
  "type": "SPECIAL_HOURS",
  "discountPercent": 50,
  "startTime": "17:00",
  "endTime": "21:00",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "startDate": "2026-03-01",
  "endDate": "2026-12-31",
  "maxUsage": 1000,
  "usagePerClient": 5,
  "active": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Happy Hour Vespertino",
  "description": "50% de desconto após as 17h",
  "type": "SPECIAL_HOURS",
  "discountPercent": 50,
  "startTime": "17:00",
  "endTime": "21:00",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "startDate": "2026-03-01T00:00:00.000Z",
  "endDate": "2026-12-31T00:00:00.000Z",
  "maxUsage": 1000,
  "currentUsage": 0,
  "usagePerClient": 5,
  "active": true,
  "createdAt": "2026-03-18T10:00:00.000Z",
  "updatedAt": "2026-03-18T10:00:00.000Z"
}
```

#### GET /promotions
Listar todas as promoções (ADMIN/EMPLOYEE)

**Query Parameters:**
- `type`: Filtrar por tipo (SPECIAL_HOURS, HOURS_COMBO, etc.)
- `active`: true/false - filtrar por status ativo
- `includeExpired`: true/false - incluir promoções expiradas

**Exemplo:**
```
GET /promotions?type=SPECIAL_HOURS&active=true
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Happy Hour Vespertino",
    "type": "SPECIAL_HOURS",
    ...
  },
  {
    "id": "uuid",
    "name": "Desconto Fim de Semana",
    "type": "SPECIAL_HOURS",
    ...
  }
]
```

#### GET /promotions/:id
Obter detalhes de uma promoção (ADMIN/EMPLOYEE)

**Response:**
```json
{
  "id": "uuid",
  "name": "Happy Hour Vespertino",
  "description": "50% de desconto após as 17h",
  "type": "SPECIAL_HOURS",
  "discountPercent": 50,
  "startTime": "17:00",
  "endTime": "21:00",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "maxUsage": 1000,
  "currentUsage": 45,
  "active": true,
  ...
}
```

#### PATCH /promotions/:id
Atualizar promoção (ADMIN apenas)

**Body (todos campos opcionais):**
```json
{
  "name": "Happy Hour Vespertino Atualizado",
  "discountPercent": 60,
  "maxUsage": 2000,
  "active": false
}
```

#### DELETE /promotions/:id
Deletar promoção (ADMIN apenas)

**Response:**
```json
{
  "message": "Promotion deleted successfully"
}
```

### Pacotes de Horas

#### POST /hours-packages
Criar pacote de horas (ADMIN apenas)

**Body:**
```json
{
  "name": "Pacote 10 Horas",
  "description": "10 horas de uso com 20% de desconto",
  "hours": 10,
  "totalPrice": 400,
  "savingsPercent": 20,
  "validity": 90,
  "active": true
}
```

#### GET /hours-packages
Listar pacotes (Todos os usuários autenticados)

**Query Parameters:**
- `activeOnly`: true/false - padrão true

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Pacote 10 Horas",
    "description": "10 horas de uso com 20% de desconto",
    "hours": 10,
    "totalPrice": 400,
    "savingsPercent": 20,
    "validity": 90,
    "active": true,
    "createdAt": "2026-03-18T10:00:00.000Z",
    "updatedAt": "2026-03-18T10:00:00.000Z"
  }
]
```

#### GET /hours-packages/:id
Obter detalhes do pacote (Todos os usuários autenticados)

#### PATCH /hours-packages/:id
Atualizar pacote (ADMIN apenas)

#### DELETE /hours-packages/:id
Deletar pacote (ADMIN apenas)

### Aplicação de Promoções

#### POST /promotion-application/check-best
Verificar melhor promoção disponível (Todos os usuários autenticados)

**Body:**
```json
{
  "date": "2026-03-20",
  "startTime": "17:30",
  "endTime": "19:30",
  "basePrice": 100,
  "hours": 2,
  "clientId": "uuid-optional"
}
```

**Response (quando há promoção aplicável):**
```json
{
  "promotion": {
    "id": "uuid",
    "name": "Happy Hour Vespertino",
    "description": "50% de desconto após as 17h",
    "type": "SPECIAL_HOURS",
    "discountPercent": 50,
    ...
  },
  "originalPrice": 100,
  "discountAmount": 50,
  "finalPrice": 50,
  "extraHours": null
}
```

**Response (combo de horas):**
```json
{
  "promotion": {
    "id": "uuid",
    "name": "Pague 2 Leve 3",
    "type": "HOURS_COMBO",
    "minHours": 2,
    "bonusHours": 1,
    ...
  },
  "originalPrice": 100,
  "discountAmount": 50,
  "finalPrice": 100,
  "extraHours": 1
}
```

**Response (sem promoção aplicável):**
```json
null
```

#### POST /promotion-application/calculate
Calcular desconto de uma promoção específica (ADMIN/EMPLOYEE)

**Body:**
```json
{
  "promotionId": "uuid",
  "basePrice": 100,
  "hours": 2
}
```

**Response:**
```json
{
  "promotion": {
    "id": "uuid",
    "name": "Happy Hour Vespertino",
    ...
  },
  "originalPrice": 100,
  "discountAmount": 50,
  "finalPrice": 50,
  "extraHours": null
}
```

## Exemplos de Casos de Uso

### Exemplo 1: Criar Promoção de Horário Especial

```bash
# Criar promoção de 50% após as 17h em dias de semana
POST /promotions
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Happy Hour Vespertino",
  "description": "50% de desconto após as 17h",
  "type": "SPECIAL_HOURS",
  "discountPercent": 50,
  "startTime": "17:00",
  "endTime": "21:00",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "startDate": "2026-03-01",
  "endDate": "2026-12-31",
  "maxUsage": 500,
  "usagePerClient": 3,
  "active": true
}
```

### Exemplo 2: Criar Combo de Horas

```bash
# Pague 2 horas, ganhe 1 hora extra
POST /promotions
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Pague 2 Leve 3",
  "description": "Reserve 2 horas e ganhe 1 hora extra grátis",
  "type": "HOURS_COMBO",
  "minHours": 2,
  "bonusHours": 1,
  "startDate": "2026-03-01",
  "endDate": "2026-06-30",
  "maxUsage": 200,
  "usagePerClient": 1,
  "active": true
}
```

### Exemplo 3: Criar Promoção por Data (Feriado)

```bash
# 30% de desconto no feriado de 07 de setembro
POST /promotions
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Feriado 7 de Setembro",
  "description": "30% de desconto no feriado",
  "type": "DATE_BASED",
  "discountPercent": 30,
  "startDate": "2026-09-07",
  "endDate": "2026-09-07",
  "maxUsage": 100,
  "usagePerClient": 1,
  "active": true
}
```

### Exemplo 4: Criar Promoção por Período

```bash
# R$ 50 de desconto durante todo o mês de dezembro
POST /promotions
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Desconto de Dezembro",
  "description": "R$ 50 de desconto em qualquer reserva de dezembro",
  "type": "DATE_BASED",
  "discountFixed": 50,
  "startDate": "2026-12-01",
  "endDate": "2026-12-31",
  "maxUsage": 500,
  "usagePerClient": 2,
  "active": true
}
```

### Exemplo 5: Criar Pacote de Horas

```bash
# Pacote 10 horas com 20% de economia
POST /hours-packages
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Pacote 10 Horas",
  "description": "10 horas de uso com 20% de desconto",
  "hours": 10,
  "totalPrice": 400,
  "savingsPercent": 20,
  "validity": 90,
  "active": true
}
```

### Exemplo 4: Verificar Melhor Promoção para uma Reserva

```bash
# Cliente quer reservar na quinta-feira às 18h por 2 horas
POST /promotion-application/check-best
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "date": "2026-03-20",
  "startTime": "18:00",
  "endTime": "20:00",
  "basePrice": 100,
  "hours": 2,
  "clientId": "client-uuid"
}

# Response:
{
  "promotion": {
    "id": "promotion-uuid",
    "name": "Happy Hour Vespertino",
    "type": "SPECIAL_HOURS",
    "discountPercent": 50
  },
  "originalPrice": 100,
  "discountAmount": 50,
  "finalPrice": 50,
  "extraHours": null
}
```

## Regras de Negócio

### Validação de Promoções

1. **Horários**: Formato "HH:mm" (ex: "17:00", "09:30")
2. **Dias da Semana**: Array com valores 0-6 (0=Domingo, 6=Sábado)
3. **Descontos**: 
   - Percentual: 0-100%
   - Pode ter `discountPercent` OU `discountFixed`, não ambos
4. **Datas**: 
   - `startDate` e `endDate` são opcionais para os tipos `SPECIAL_HOURS`, `HOURS_COMBO` e `FIRST_BOOKING`
   - Para `DATE_BASED`, `startDate` e `endDate` são **obrigatórios**
   - Se não definidas, a promoção não tem limite de data
5. **Limites de Uso**:
   - `maxUsage`: Total de vezes que a promoção pode ser usada
   - `usagePerClient`: Vezes que cada cliente pode usar
   - `currentUsage`: Contador automático de uso

### Filtros de Aplicabilidade

O sistema verifica automaticamente:

1. ✅ **Status Ativo**: Promoção deve estar `active: true`
2. ✅ **Período de Validade**: Data atual entre `startDate` e `endDate`
3. ✅ **Dia da Semana**: Dia da reserva deve estar em `daysOfWeek` (ignorado para `DATE_BASED`)
4. ✅ **Horário**: Horário da reserva deve estar entre `startTime` e `endTime` (ignorado para `DATE_BASED`)
5. ✅ **Limites de Uso**: `currentUsage < maxUsage`
6. ✅ **Requisitos Mínimos**: Para combos, verificar `minHours`

### Cálculo de Descontos

#### SPECIAL_HOURS
```javascript
if (discountPercent) {
  desconto = precoBase * (discountPercent / 100)
} else if (discountFixed) {
  desconto = discountFixed
}
precoFinal = precoBase - desconto
```

#### DATE_BASED
```javascript
if (discountPercent) {
  desconto = precoBase * (discountPercent / 100)
} else if (discountFixed) {
  desconto = discountFixed
}
precoFinal = precoBase - desconto
```

#### HOURS_COMBO
```javascript
if (horasReservadas >= minHours) {
  precoPorHora = precoBase / horasReservadas
  valorHorasExtras = precoPorHora * bonusHours
  // Cliente paga o mesmo, mas ganha horas extras
  precoFinal = precoBase
  horasExtras = bonusHours
}
```

### Seleção da Melhor Promoção

Quando múltiplas promoções são aplicáveis:

1. O sistema calcula o desconto de cada uma
2. Retorna a promoção com **maior valor de desconto**
3. Para combos, considera o valor das horas extras

## Integração com Módulo de Reservas

### Fluxo Completo

1. **Cliente seleciona quadra, data e horário**
2. **Sistema calcula preço base** (Court.pricePerHour * hours)
3. **Verifica promoções aplicáveis** via `/promotion-application/check-best`
4. **Exibe opções ao cliente**:
   - Preço original
   - Promoção aplicável (se houver)
   - Preço final com desconto
   - Horas extras (se combo)
5. **Cliente confirma reserva**
6. **Sistema registra uso da promoção** (incrementa `currentUsage`)
7. **Booking criado** com preços corretos

### Exemplo de Integração no Frontend

```javascript
// 1. Obter preço da quadra
const court = await getCourtDetails(courtId);
const basePrice = court.pricePerHour * hours;

// 2. Verificar melhor promoção
const promotion = await fetch('/promotion-application/check-best', {
  method: 'POST',
  body: JSON.stringify({
    date: selectedDate,
    startTime: selectedStartTime,
    endTime: selectedEndTime,
    basePrice: basePrice,
    hours: hours,
    clientId: currentUser.id
  })
}).then(r => r.json());

// 3. Exibir ao usuário
if (promotion) {
  console.log(`Promoção: ${promotion.promotion.name}`);
  console.log(`Preço original: R$ ${promotion.originalPrice}`);
  console.log(`Desconto: R$ ${promotion.discountAmount}`);
  console.log(`Preço final: R$ ${promotion.finalPrice}`);
  if (promotion.extraHours) {
    console.log(`Horas extras: ${promotion.extraHours}h`);
  }
} else {
  console.log(`Preço: R$ ${basePrice}`);
}

// 4. Criar reserva com promoção aplicada
const booking = await createBooking({
  courtId,
  date: selectedDate,
  startTime: selectedStartTime,
  endTime: selectedEndTime,
  calculatedAmount: promotion ? promotion.finalPrice : basePrice,
  promotionId: promotion?.promotion.id
});
```

## Estrutura do Banco de Dados

### Tabela: promotions

```sql
id              UUID PRIMARY KEY
name            VARCHAR NOT NULL
description     TEXT
type            ENUM('SPECIAL_HOURS', 'HOURS_COMBO', 'FIRST_BOOKING', 'DATE_BASED')

-- Condições
minHours        INTEGER
bonusHours      INTEGER
discountPercent DECIMAL(5,2)
discountFixed   DECIMAL(10,2)

-- Período de validade
startTime       VARCHAR  -- "HH:mm"
endTime         VARCHAR  -- "HH:mm"
daysOfWeek      INTEGER[] -- [0,1,2,3,4,5,6]
startDate       DATE
endDate         DATE

-- Limites de uso
maxUsage        INTEGER
currentUsage    INTEGER DEFAULT 0
usagePerClient  INTEGER DEFAULT 1

active          BOOLEAN DEFAULT true
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

### Tabela: hours_packages

```sql
id              UUID PRIMARY KEY
name            VARCHAR NOT NULL
description     TEXT
hours           INTEGER NOT NULL
totalPrice      DECIMAL(10,2) NOT NULL
savingsPercent  DECIMAL(5,2) NOT NULL
validity        INTEGER DEFAULT 90  -- dias
active          BOOLEAN DEFAULT true
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

## Permissões de Acesso

| Endpoint | CLIENT | EMPLOYEE | ADMIN |
|----------|--------|----------|-------|
| POST /promotions | ❌ | ❌ | ✅ |
| GET /promotions | ❌ | ✅ | ✅ |
| GET /promotions/:id | ❌ | ✅ | ✅ |
| PATCH /promotions/:id | ❌ | ❌ | ✅ |
| DELETE /promotions/:id | ❌ | ❌ | ✅ |
| POST /hours-packages | ❌ | ❌ | ✅ |
| GET /hours-packages | ✅ | ✅ | ✅ |
| GET /hours-packages/:id | ✅ | ✅ | ✅ |
| PATCH /hours-packages/:id | ❌ | ❌ | ✅ |
| DELETE /hours-packages/:id | ❌ | ❌ | ✅ |
| POST /promotion-application/check-best | ✅ | ✅ | ✅ |
| POST /promotion-application/calculate | ❌ | ✅ | ✅ |

## Considerações de Performance

1. **Índices**: Tabela possui índices em `active`, `type` para buscas rápidas
2. **Filtros em Memória**: Após busca no banco, filtros complexos (horário, dia) são aplicados em memória
3. **Cache**: Considerar cache de promoções ativas para reduzir queries
4. **Validação de Uso**: Verificar `usagePerClient` requer consulta de histórico do cliente

## Próximas Melhorias

- [ ] Histórico de uso de promoções por cliente
- [ ] Promoções específicas por quadra
- [ ] Códigos promocionais (cupons)
- [ ] Promoções em grupo (desconto para mais de X pessoas)
- [ ] Integração com sistema de fidelidade
- [ ] Dashboard de performance de promoções
- [ ] Notificações push quando novas promoções são criadas
- [ ] Compra e gestão de pacotes de horas pelo cliente
