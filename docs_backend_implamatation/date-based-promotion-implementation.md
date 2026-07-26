# Implementação: Promoção por Data / Período (DATE_BASED)

## Resumo

Foi adicionado ao sistema um novo tipo de promoção chamado `DATE_BASED`. Ele permite criar promoções válidas em uma **data específica** (ex: feriado de 07 de setembro) ou em um **período contínuo de datas** (ex: 20/12 a 31/12). O desconto segue o mesmo padrão dos tipos existentes: percentual ou valor fixo.

---

## O que mudou

### 1. Banco de dados

#### Enum `PromotionType`
- Adicionado o valor `DATE_BASED` ao enum em [prisma/schema.prisma](prisma/schema.prisma).
- Criada migration [prisma/migrations/20260714140000_add_date_based_promotion_type/migration.sql](prisma/migrations/20260714140000_add_date_based_promotion_type/migration.sql) que recria o enum no PostgreSQL com o novo valor.

```sql
BEGIN;
CREATE TYPE "PromotionType_new" AS ENUM ('SPECIAL_HOURS', 'HOURS_COMBO', 'FIRST_BOOKING', 'DATE_BASED');
ALTER TABLE "promotions" ALTER COLUMN "type" TYPE "PromotionType_new" USING ("type"::text::"PromotionType_new");
ALTER TYPE "PromotionType" RENAME TO "PromotionType_old";
ALTER TYPE "PromotionType_new" RENAME TO "PromotionType";
DROP TYPE "PromotionType_old";
COMMIT;
```

> Nenhuma alteração de schema nas colunas `startDate`/`endDate` foi necessária, pois elas já existiam no modelo `Promotion`.

---

### 2. Cálculo do desconto

#### [src/app/modules/promotions/services/promotion-application.service.ts](src/app/modules/promotions/services/promotion-application.service.ts)
Adicionado case `PromotionType.DATE_BASED` no switch de `applyPromotion()`. O cálculo é idêntico ao de `SPECIAL_HOURS` e `FIRST_BOOKING`:

```typescript
case PromotionType.DATE_BASED:
  if (promotion.discountPercent) {
    discountAmount =
      params.basePrice * (Number(promotion.discountPercent) / 100);
  } else if (promotion.discountFixed) {
    discountAmount = Number(promotion.discountFixed);
  }
  finalPrice = Math.max(0, params.basePrice - discountAmount);
  break;
```

---

### 3. Elegibilidade

#### [src/app/modules/promotions/repositories/promotion.repository.ts](src/app/modules/promotions/repositories/promotion.repository.ts)
Ajustado o filtro de promoções aplicáveis para que `DATE_BASED` seja elegível **puramente por data**:

- O filtro de `startDate`/`endDate` continua sendo aplicado no banco (já existia).
- Para promoções do tipo `DATE_BASED`, os filtros de `daysOfWeek`, `startTime` e `endTime` são **ignorados**, mesmo que preenchidos.

```typescript
if (promo.type === PromotionType.DATE_BASED) {
  return true;
}
```

---

### 4. Validação de criação

#### [src/app/modules/promotions/dtos/request/create-promotion.dto.ts](src/app/modules/promotions/dtos/request/create-promotion.dto.ts)
Os campos `startDate` e `endDate` tornaram-se obrigatórios quando `type === DATE_BASED`:

```typescript
@IsDateString()
@ValidateIf((o) => o.type === PromotionType.DATE_BASED)
@IsOptional({ message: 'startDate is required when type is DATE_BASED' })
startDate?: string;

@IsDateString()
@ValidateIf((o) => o.type === PromotionType.DATE_BASED)
@IsOptional({ message: 'endDate is required when type is DATE_BASED' })
endDate?: string;
```

---

### 5. Seed

#### [prisma/seed.ts](prisma/seed.ts)
Adicionado exemplo de promoção `DATE_BASED` para o feriado de 07 de setembro:

```typescript
await prisma.promotion.upsert({
  where: { id: '00000000-0000-0000-0000-000000000020' },
  update: {},
  create: {
    id: '00000000-0000-0000-0000-000000000020',
    name: 'Feriado 7 de Setembro',
    description: '30% de desconto no feriado de Independência',
    type: PromotionType.DATE_BASED,
    discountPercent: 30,
    startDate: new Date('2026-09-07'),
    endDate: new Date('2026-09-07'),
    maxUsage: 100,
    usagePerClient: 1,
    active: true,
  },
});
```

---

### 6. Documentação

#### [docs/promotions-system.md](docs/promotions-system.md)
- Adicionada seção explicando o tipo `DATE_BASED`.
- Incluídos exemplos de promoção por data única (feriado) e por período (dezembro).
- Atualizadas as regras de negócio para refletir obrigatoriedade de `startDate`/`endDate` para `DATE_BASED`.
- Atualizada a tabela SQL de `promotions` com o novo enum.

#### [docs/promotion-selection.md](docs/promotion-selection.md)
- Adicionado exemplo de response de `POST /promotion-application/check-all` para uma promoção `DATE_BASED`.
- Explicado que a elegibilidade é puramente por data.

---

### 7. Geração do Prisma Client e build

- Executado `npx prisma generate` para atualizar `src/generated/prisma`.
- Executado `npm run build` com sucesso (após limpar `dist` bloqueado).

---

## Como usar

### Criar uma promoção por data única

```bash
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

### Criar uma promoção por período

```bash
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

### Verificar promoções aplicáveis

```bash
POST /promotion-application/check-all
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "date": "2026-09-07",
  "startTime": "14:00",
  "endTime": "16:00",
  "basePrice": 200,
  "hours": 2,
  "clientId": "uuid-do-cliente"
}
```

**Response:**
```json
[
  {
    "promotion": {
      "id": "uuid-promocao-feriado",
      "name": "Feriado 7 de Setembro",
      "type": "DATE_BASED",
      "discountPercent": 30,
      "startDate": "2026-09-07",
      "endDate": "2026-09-07"
    },
    "originalPrice": 200,
    "discountAmount": 60,
    "finalPrice": 140
  }
]
```

---

## Escopo mantido

- Persistência de `promotionId` no `Booking` e retorno no response **não foram alterados** (mantido o padrão atual do projeto).
- Nenhuma alteração de frontend foi feita.
- Nenhum teste automatizado foi adicionado (o projeto atual não possui testes).

---

## Próximos passos recomendados

1. Aplicar a migration no ambiente de desenvolvimento/homologação:
   ```bash
   npx prisma migrate dev
   ```
2. Executar o seed para criar o exemplo:
   ```bash
   npm run db:seed
   ```
3. Testar manualmente os endpoints `POST /promotions` e `POST /promotion-application/check-all`.
4. Em produção (Railway/Supabase/PostgreSQL gerenciado), verificar se a migration de recriação de enum pode ser executada automaticamente ou se precisa ser aplicada manualmente.
5. Atualizar o frontend para exibir promoções `DATE_BASED` nas telas de agendamento e admin.
