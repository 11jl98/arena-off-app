# Sistema de Quadras - Arena Off Beach

## Visão Geral

O módulo de Quadras (Courts) gerencia o cadastro e configuração das quadras esportivas disponíveis para reserva. Permite criar esportes, cadastrar quadras com todas suas características, preços, capacidade e disponibilidade.

## Estrutura do Módulo

### Esportes (Sports)

Cadastro dos tipos de esportes oferecidos na arena.

**Características:**
- Nome único do esporte
- Descrição opcional
- Ícone para interface
- Status ativo/inativo
- Contador de quadras associadas

### Quadras (Courts)

Cadastro completo das quadras disponíveis para reserva.

**Características:**
- **Nome da Quadra**: Identificação única
- **Esporte**: Vinculado a um esporte cadastrado
- **Preço/hora**: Valor base por hora de uso
- **Capacidade**: Número máximo de pessoas
- **Cobertura**: Indica se a quadra é coberta
- **Iluminação**: Indica se possui iluminação
- **Imagens**: Array de URLs de fotos da quadra
- **Ordem de Exibição**: Para ordenação na interface
- **Status**: Ativo/inativo

## Endpoints da API

### Esportes

#### POST /sports
Criar novo esporte (ADMIN apenas)

**Body:**
```json
{
  "name": "Beach Tennis",
  "description": "Esporte praticado na areia com raquetes",
  "icon": "https://cdn.example.com/icons/beach-tennis.svg",
  "active": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Beach Tennis",
  "description": "Esporte praticado na areia com raquetes",
  "icon": "https://cdn.example.com/icons/beach-tennis.svg",
  "active": true,
  "createdAt": "2026-03-18T10:00:00.000Z",
  "courtsCount": 0
}
```

**Validações:**
- ✅ Nome é obrigatório e único
- ✅ Não permite criar esportes duplicados

#### GET /sports
Listar todos os esportes (Todos os usuários autenticados)

**Query Parameters:**
- `activeOnly`: true/false - padrão true

**Exemplo:**
```
GET /sports?activeOnly=true
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Beach Tennis",
    "description": "Esporte praticado na areia com raquetes",
    "icon": "https://cdn.example.com/icons/beach-tennis.svg",
    "active": true,
    "createdAt": "2026-03-18T10:00:00.000Z",
    "courtsCount": 3
  },
  {
    "id": "uuid",
    "name": "Vôlei de Praia",
    "description": "Vôlei praticado na areia",
    "icon": "https://cdn.example.com/icons/volei.svg",
    "active": true,
    "createdAt": "2026-03-15T10:00:00.000Z",
    "courtsCount": 2
  }
]
```

#### GET /sports/:id
Obter detalhes de um esporte (Todos os usuários autenticados)

**Response:**
```json
{
  "id": "uuid",
  "name": "Beach Tennis",
  "description": "Esporte praticado na areia com raquetes",
  "icon": "https://cdn.example.com/icons/beach-tennis.svg",
  "active": true,
  "createdAt": "2026-03-18T10:00:00.000Z",
  "courtsCount": 3
}
```

#### PATCH /sports/:id
Atualizar esporte (ADMIN apenas)

**Body (todos campos opcionais):**
```json
{
  "name": "Beach Tennis Pro",
  "description": "Descrição atualizada",
  "active": false
}
```

**Validações:**
- ✅ Se alterar nome, verifica se não existe outro esporte com mesmo nome

#### DELETE /sports/:id
Deletar esporte (ADMIN apenas)

**Validações:**
- ❌ Não permite deletar se existem quadras associadas

**Response:**
```json
{
  "message": "Sport deleted successfully"
}
```

### Quadras

#### POST /courts
Criar nova quadra (ADMIN apenas)

**Body:**
```json
{
  "sportId": "uuid-do-esporte",
  "name": "Quadra Central 1",
  "description": "Quadra principal com iluminação LED",
  "pricePerHour": 80.00,
  "maxCapacity": 4,
  "covered": false,
  "lighting": true,
  "images": [
    "https://cdn.example.com/courts/quadra1-1.jpg",
    "https://cdn.example.com/courts/quadra1-2.jpg"
  ],
  "active": true,
  "displayOrder": 1
}
```

**Response:**
```json
{
  "id": "uuid",
  "sportId": "uuid-do-esporte",
  "name": "Quadra Central 1",
  "description": "Quadra principal com iluminação LED",
  "pricePerHour": 80,
  "maxCapacity": 4,
  "covered": false,
  "lighting": true,
  "images": [
    "https://cdn.example.com/courts/quadra1-1.jpg",
    "https://cdn.example.com/courts/quadra1-2.jpg"
  ],
  "active": true,
  "displayOrder": 1,
  "createdAt": "2026-03-18T10:00:00.000Z",
  "updatedAt": "2026-03-18T10:00:00.000Z",
  "sport": {
    "id": "uuid-do-esporte",
    "name": "Beach Tennis",
    "icon": "https://cdn.example.com/icons/beach-tennis.svg"
  }
}
```

**Validações:**
- ✅ Esporte deve existir e estar ativo
- ✅ Nome é obrigatório
- ✅ Preço deve ser maior ou igual a 0
- ✅ Capacidade deve ser no mínimo 1

#### GET /courts
Listar todas as quadras (Todos os usuários autenticados)

**Query Parameters:**
- `sportId`: Filtrar por esporte específico
- `active`: true/false - filtrar por status

**Exemplos:**
```
GET /courts
GET /courts?active=true
GET /courts?sportId=uuid-do-esporte
GET /courts?sportId=uuid-do-esporte&active=true
```

**Response:**
```json
[
  {
    "id": "uuid",
    "sportId": "uuid-do-esporte",
    "name": "Quadra Central 1",
    "description": "Quadra principal com iluminação LED",
    "pricePerHour": 80,
    "maxCapacity": 4,
    "covered": false,
    "lighting": true,
    "images": [
      "https://cdn.example.com/courts/quadra1-1.jpg"
    ],
    "active": true,
    "displayOrder": 1,
    "createdAt": "2026-03-18T10:00:00.000Z",
    "updatedAt": "2026-03-18T10:00:00.000Z",
    "sport": {
      "id": "uuid-do-esporte",
      "name": "Beach Tennis",
      "icon": "https://cdn.example.com/icons/beach-tennis.svg"
    }
  }
]
```

**Ordenação:**
- Primeiro por `displayOrder` (ascendente)
- Depois por `name` (ordem alfabética)

#### GET /courts/:id
Obter detalhes de uma quadra (Todos os usuários autenticados)

**Response:**
```json
{
  "id": "uuid",
  "sportId": "uuid-do-esporte",
  "name": "Quadra Central 1",
  "description": "Quadra principal com iluminação LED",
  "pricePerHour": 80,
  "maxCapacity": 4,
  "covered": false,
  "lighting": true,
  "images": [
    "https://cdn.example.com/courts/quadra1-1.jpg",
    "https://cdn.example.com/courts/quadra1-2.jpg"
  ],
  "active": true,
  "displayOrder": 1,
  "createdAt": "2026-03-18T10:00:00.000Z",
  "updatedAt": "2026-03-18T10:00:00.000Z",
  "sport": {
    "id": "uuid-do-esporte",
    "name": "Beach Tennis",
    "icon": "https://cdn.example.com/icons/beach-tennis.svg"
  }
}
```

#### PATCH /courts/:id
Atualizar quadra (ADMIN apenas)

**Body (todos campos opcionais):**
```json
{
  "name": "Quadra Central 1 - Renovada",
  "pricePerHour": 90.00,
  "description": "Quadra reformada com novo piso",
  "covered": true,
  "active": true,
  "displayOrder": 0
}
```

**Validações:**
- ✅ Se alterar sportId, valida que o novo esporte existe e está ativo

**Response:**
```json
{
  "id": "uuid",
  "sportId": "uuid-do-esporte",
  "name": "Quadra Central 1 - Renovada",
  "pricePerHour": 90,
  "covered": true,
  "active": true,
  "displayOrder": 0,
  ...
}
```

#### DELETE /courts/:id
Deletar quadra (ADMIN apenas)

**Response:**
```json
{
  "message": "Court deleted successfully"
}
```

## Exemplos de Casos de Uso

### Exemplo 1: Cadastrar um Novo Esporte

```bash
# Passo 1: Criar o esporte
POST /sports
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Futevôlei",
  "description": "Combinação de futebol e vôlei na areia",
  "icon": "https://cdn.example.com/icons/futevolei.svg",
  "active": true
}

# Response:
{
  "id": "futebolei-uuid",
  "name": "Futevôlei",
  "description": "Combinação de futebol e vôlei na areia",
  "icon": "https://cdn.example.com/icons/futevolei.svg",
  "active": true,
  "createdAt": "2026-03-18T10:00:00.000Z",
  "courtsCount": 0
}
```

### Exemplo 2: Cadastrar Quadra Completa

```bash
# Passo 1: Obter ID do esporte
GET /sports
Authorization: Bearer {admin_token}

# Passo 2: Criar a quadra
POST /courts
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "sportId": "beach-tennis-uuid",
  "name": "Quadra Premium A",
  "description": "Quadra coberta com ar condicionado e iluminação profissional",
  "pricePerHour": 120.00,
  "maxCapacity": 4,
  "covered": true,
  "lighting": true,
  "images": [
    "https://cdn.example.com/courts/premium-a-1.jpg",
    "https://cdn.example.com/courts/premium-a-2.jpg",
    "https://cdn.example.com/courts/premium-a-3.jpg"
  ],
  "active": true,
  "displayOrder": 1
}

# Response:
{
  "id": "quadra-premium-a-uuid",
  "sportId": "beach-tennis-uuid",
  "name": "Quadra Premium A",
  "pricePerHour": 120,
  "maxCapacity": 4,
  "covered": true,
  "lighting": true,
  "images": [...],
  "active": true,
  "displayOrder": 1,
  "sport": {
    "id": "beach-tennis-uuid",
    "name": "Beach Tennis",
    "icon": "https://cdn.example.com/icons/beach-tennis.svg"
  },
  ...
}
```

### Exemplo 3: Listar Quadras por Esporte para Cliente

```bash
# Cliente visualiza quadras de Beach Tennis disponíveis
GET /courts?sportId=beach-tennis-uuid&active=true
Authorization: Bearer {client_token}

# Response:
[
  {
    "id": "quadra-1-uuid",
    "name": "Quadra Central 1",
    "pricePerHour": 80,
    "maxCapacity": 4,
    "covered": false,
    "lighting": true,
    "images": ["url1.jpg"],
    "sport": {
      "name": "Beach Tennis",
      "icon": "icon.svg"
    }
  },
  {
    "id": "quadra-premium-a-uuid",
    "name": "Quadra Premium A",
    "pricePerHour": 120,
    "maxCapacity": 4,
    "covered": true,
    "lighting": true,
    "images": ["url2.jpg"],
    "sport": {
      "name": "Beach Tennis",
      "icon": "icon.svg"
    }
  }
]
```

### Exemplo 4: Atualizar Preço de Quadra

```bash
# Admin aumenta preço da quadra
PATCH /courts/quadra-1-uuid
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "pricePerHour": 85.00
}

# Response:
{
  "id": "quadra-1-uuid",
  "name": "Quadra Central 1",
  "pricePerHour": 85,
  ...
}
```

### Exemplo 5: Desativar Quadra para Manutenção

```bash
# Admin desativa temporariamente quadra
PATCH /courts/quadra-1-uuid
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "active": false,
  "description": "Quadra em manutenção - previsão de retorno em 5 dias"
}

# Response:
{
  "id": "quadra-1-uuid",
  "name": "Quadra Central 1",
  "description": "Quadra em manutenção - previsão de retorno em 5 dias",
  "active": false,
  ...
}
```

## Regras de Negócio

### Esportes

1. **Nome Único**: Nome do esporte deve ser único no sistema
2. **Proteção de Exclusão**: Não permite deletar esporte que possui quadras associadas
3. **Validação em Uso**: Só permite criar quadras para esportes ativos

### Quadras

1. **Validação de Esporte**: 
   - Esporte deve existir no sistema
   - Esporte deve estar ativo
2. **Preço Mínimo**: Preço por hora deve ser >= 0
3. **Capacidade Mínima**: Se informada, capacidade deve ser >= 1
4. **Status Padrão**:
   - `covered`: false (descoberta por padrão)
   - `lighting`: true (com iluminação por padrão)
   - `active`: true (ativa por padrão)
   - `displayOrder`: 0
   - `images`: [] (array vazio se não informado)

### Ordenação e Exibição

1. **Ordem de Listagem**:
   - Primeiro: `displayOrder` (ascendente)
   - Segundo: `name` (alfabética)
2. **Filtros Disponíveis**:
   - Por esporte específico
   - Por status ativo/inativo
   - Combinações de filtros

## Integração com Outros Módulos

### Com Módulo de Reservas (Bookings)

Ao criar uma reserva, o sistema:
1. Busca a quadra por ID
2. Obtém o `pricePerHour` base
3. Verifica disponibilidade da quadra
4. Calcula preço total (preço/hora × horas)
5. Aplica promoções se disponíveis

```javascript
// Exemplo de integração
const court = await getCourtById(courtId);
const basePrice = court.pricePerHour * hours;

// Verifica promoções disponíveis
const promotion = await checkBestPromotion({
  date,
  startTime,
  endTime,
  basePrice,
  hours
});

const finalPrice = promotion ? promotion.finalPrice : basePrice;
```

### Com Módulo de Promoções

Quadras são referenciadas em:
- Promoções específicas por horário
- Cálculo de descontos baseado em `pricePerHour`
- Regras de precificação dinâmica

### Com Módulo de Tabs (Comandas)

- Quadras podem ser associadas a comandas
- Consumo no bar pode ser vinculado à quadra reservada
- Facilita controle de ocupação

## Estrutura do Banco de Dados

### Tabela: sports

```sql
id          UUID PRIMARY KEY
name        VARCHAR UNIQUE NOT NULL
description TEXT
icon        VARCHAR
active      BOOLEAN DEFAULT true
createdAt   TIMESTAMP DEFAULT now()
```

**Índices:**
- `name` (unique)
- `active`

### Tabela: courts

```sql
id           UUID PRIMARY KEY
sportId      UUID NOT NULL REFERENCES sports(id)
name         VARCHAR NOT NULL
description  TEXT
pricePerHour DECIMAL(10,2) NOT NULL
maxCapacity  INTEGER
covered      BOOLEAN DEFAULT false
lighting     BOOLEAN DEFAULT true
images       TEXT[] -- array de URLs
active       BOOLEAN DEFAULT true
displayOrder INTEGER DEFAULT 0
createdAt    TIMESTAMP DEFAULT now()
updatedAt    TIMESTAMP DEFAULT now()
```

**Índices:**
- `sportId`
- `active`
- Índice composto: `(sportId, active)`

**Relações:**
- `sport`: Muitos-para-Um com Sports
- `bookings`: Um-para-Muitos com Bookings
- `tabs`: Um-para-Muitos com Tabs
- `pricingRules`: Um-para-Muitos com PricingRules
- `availabilitySlots`: Um-para-Muitos com AvailabilitySlots

## Permissões de Acesso

| Endpoint | CLIENT | EMPLOYEE | ADMIN |
|----------|--------|----------|-------|
| POST /sports | ❌ | ❌ | ✅ |
| GET /sports | ✅ | ✅ | ✅ |
| GET /sports/:id | ✅ | ✅ | ✅ |
| PATCH /sports/:id | ❌ | ❌ | ✅ |
| DELETE /sports/:id | ❌ | ❌ | ✅ |
| POST /courts | ❌ | ❌ | ✅ |
| GET /courts | ✅ | ✅ | ✅ |
| GET /courts/:id | ✅ | ✅ | ✅ |
| PATCH /courts/:id | ❌ | ❌ | ✅ |
| DELETE /courts/:id | ❌ | ❌ | ✅ |

## Considerações de Performance

1. **Índices Estratégicos**: 
   - `sportId` para joins rápidos
   - `active` para filtros frequentes
   - Índice composto para queries combinadas

2. **Include Seletivo**:
   - Sport incluído por padrão nas queries de courts
   - Select específico (`id, name, icon`) para reduzir payload
   - Count de quadras calculado via `_count`

3. **Ordenação Otimizada**:
   - `displayOrder` permite controle manual da ordem
   - Fallback para ordem alfabética

4. **Caching Recomendado**:
   - Lista de esportes (muda raramente)
   - Lista de quadras ativas (cache curto, 5-10min)
   - Detalhes de quadras específicas

## Próximas Melhorias

- [ ] Upload de imagens direto no backend
- [ ] Validação de URLs de imagens
- [ ] Histórico de alterações de preços
- [ ] Regras de precificação por período (PricingRules)
- [ ] Disponibilidade por horário (AvailabilitySlots)
- [ ] Sistema de favoritos para clientes
- [ ] Avaliações e comentários sobre quadras
- [ ] Estatísticas de uso por quadra
- [ ] Mapa de calor de reservas
- [ ] Gestão de manutenção programada
