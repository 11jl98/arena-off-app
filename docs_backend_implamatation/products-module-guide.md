# Products Module - Complete Guide

## Overview

This module provides comprehensive product management functionality for the Arena Off Beach bar system, including products, categories, stock control, and batch tracking. The module implements clean architecture patterns with separation of concerns through controllers, services, and repositories.

## Features

- ✅ Product CRUD operations
- ✅ Category management
- ✅ Stock control and tracking
- ✅ Batch management with expiry dates
- ✅ Low stock alerts
- ✅ Expired/expiring batch tracking
- ✅ ADMIN-only access control
- ✅ Public read endpoints for products
- ✅ Clean architecture with DTOs, interfaces, and repositories
- ✅ Decimal to number conversion for API responses

## Architecture

```
src/app/modules/products/
├── products.module.ts
├── controllers/
│   ├── product.controller.ts
│   └── product-category.controller.ts
├── dtos/
│   ├── request/
│   │   ├── create-product.dto.ts
│   │   ├── update-product.dto.ts
│   │   ├── create-product-batch.dto.ts
│   │   ├── create-product-category.dto.ts
│   │   └── update-product-category.dto.ts
│   └── response/
│       └── product-response.dto.ts
├── services/
│   ├── product.service.interface.ts
│   ├── product.service.ts
│   ├── product-category.service.interface.ts
│   └── product-category.service.ts
└── repositories/
    ├── product.repository.interface.ts
    ├── product.repository.ts
    ├── product-category.repository.interface.ts
    └── product-category.repository.ts
```

## Database Schema

### ProductCategory Model
```prisma
model ProductCategory {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  icon        String?
  displayOrder Int     @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  products Product[]
}
```

### Product Model
```prisma
model Product {
  id              String   @id @default(uuid())
  categoryId      String
  name            String
  description     String?
  price           Decimal  @db.Decimal(10, 2)
  image           String?
  stock           Int?     @default(0)
  manageStock     Boolean  @default(false)
  cashbackPercent Decimal  @default(5) @db.Decimal(5, 2)
  active          Boolean  @default(true)
  displayOrder    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  category    ProductCategory @relation(fields: [categoryId], references: [id])
  batches     ProductBatch[]
  tabItems    TabItem[]
}
```

### ProductBatch Model
```prisma
model ProductBatch {
  id           String    @id @default(uuid())
  productId    String
  batchNumber  String
  quantity     Int
  remainingQty Int
  costPrice    Decimal   @db.Decimal(10, 2)
  expiryDate   DateTime? @db.Date
  receivedDate DateTime  @default(now()) @db.Date
  supplier     String?
  notes        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Product Categories

#### GET /product-categories
**Access**: Public  
**Description**: Get all product categories

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Bebidas",
    "description": "Todas as bebidas",
    "icon": "drink-icon.png",
    "displayOrder": 0,
    "active": true,
    "createdAt": "2026-03-18T10:00:00Z"
  }
]
```

#### GET /product-categories/active
**Access**: Public  
**Description**: Get only active categories

#### GET /product-categories/:id
**Access**: Public  
**Description**: Get category by ID

#### POST /product-categories
**Access**: ADMIN only  
**Description**: Create new category

**Request Body**:
```json
{
  "name": "Bebidas",
  "description": "Todas as bebidas",
  "icon": "drink-icon.png",
  "displayOrder": 0,
  "active": true
}
```

#### PUT /product-categories/:id
**Access**: ADMIN only  
**Description**: Update category

**Request Body**: Same as POST (all fields optional)

#### DELETE /product-categories/:id
**Access**: ADMIN only  
**Description**: Delete category  
**Returns**: HTTP 204 No Content

---

### Products

#### GET /products
**Access**: Public  
**Query Parameters**:
- `includeInactive`: boolean (optional) - Include inactive products

**Response**:
```json
[
  {
    "id": "uuid",
    "categoryId": "uuid",
    "name": "Água Mineral",
    "description": "Água mineral 500ml",
    "price": 5.00,
    "image": "water.jpg",
    "stock": 100,
    "manageStock": true,
    "cashbackPercent": 5,
    "active": true,
    "displayOrder": 0,
    "createdAt": "2026-03-18T10:00:00Z",
    "updatedAt": "2026-03-18T10:00:00Z",
    "category": {
      "id": "uuid",
      "name": "Bebidas"
    }
  }
]
```

#### GET /products/active
**Access**: Public  
**Description**: Get only active products

#### GET /products/low-stock
**Access**: ADMIN only  
**Query Parameters**:
- `threshold`: number (optional, default: 10)

**Description**: Get products with low stock

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Cerveja",
    "stock": 5,
    "availableStock": 5,
    "totalBatches": 2,
    "batches": [
      {
        "id": "uuid",
        "batchNumber": "BATCH001",
        "remainingQty": 3,
        "expiryDate": "2026-06-30"
      }
    ]
  }
]
```

#### GET /products/category/:categoryId
**Access**: Public  
**Description**: Get products by category

#### GET /products/:id
**Access**: Public  
**Description**: Get product by ID with category and batches

#### POST /products
**Access**: ADMIN only  
**Description**: Create new product

**Request Body**:
```json
{
  "categoryId": "uuid",
  "name": "Água Mineral",
  "description": "Água mineral 500ml",
  "price": 5.00,
  "image": "water.jpg",
  "manageStock": true,
  "stock": 100,
  "cashbackPercent": 5,
  "active": true,
  "displayOrder": 0
}
```

**Validation Rules**:
- `categoryId`: Required, must be valid UUID
- `name`: Required, max 200 characters
- `description`: Optional, max 1000 characters
- `price`: Required, must be >= 0
- `manageStock`: Optional, default false
- `stock`: Required if manageStock is true
- `cashbackPercent`: Optional, must be >= 0
- `active`: Optional, default true

#### PUT /products/:id
**Access**: ADMIN only  
**Description**: Update product

**Request Body**: Same as POST (all fields optional)

#### DELETE /products/:id
**Access**: ADMIN only  
**Description**: Delete product  
**Returns**: HTTP 204 No Content

---

### Product Batches

#### POST /products/:id/batches
**Access**: ADMIN only  
**Description**: Add new batch to product

**Request Body**:
```json
{
  "batchNumber": "BATCH001",
  "quantity": 50,
  "costPrice": 3.50,
  "expiryDate": "2026-12-31",
  "receivedDate": "2026-03-18",
  "supplier": "Fornecedor ABC",
  "notes": "Lote recebido em bom estado"
}
```

**Response**:
```json
{
  "id": "uuid",
  "productId": "uuid",
  "batchNumber": "BATCH001",
  "quantity": 50,
  "remainingQty": 50,
  "costPrice": 3.50,
  "expiryDate": "2026-12-31",
  "receivedDate": "2026-03-18",
  "supplier": "Fornecedor ABC",
  "notes": "Lote recebido em bom estado",
  "createdAt": "2026-03-18T10:00:00Z",
  "updatedAt": "2026-03-18T10:00:00Z"
}
```

**Notes**:
- Automatically increments product stock
- Product must have `manageStock: true`

#### GET /products/:id/batches
**Access**: ADMIN only  
**Description**: Get all batches for a product

#### GET /products/batches/expired
**Access**: ADMIN only  
**Description**: Get all expired batches with remaining quantity

#### GET /products/batches/expiring
**Access**: ADMIN only  
**Query Parameters**:
- `days`: number (optional, default: 30)

**Description**: Get batches expiring within specified days

#### PUT /products/:id/stock
**Access**: ADMIN only  
**Description**: Manually adjust stock

**Request Body**:
```json
{
  "quantity": -5
}
```

**Notes**:
- Use positive number to add stock
- Use negative number to remove stock
- Product must have `manageStock: true`
- Cannot result in negative stock

---

## Security & Access Control

### Public Endpoints
All GET endpoints for products and categories are public, allowing customers to browse the product catalog.

### ADMIN-only Endpoints
All create, update, delete operations require ADMIN role:
- POST /product-categories
- PUT /product-categories/:id
- DELETE /product-categories/:id
- POST /products
- PUT /products/:id
- DELETE /products/:id
- All batch management endpoints
- Low stock endpoint

### Role Check Implementation
```typescript
@Post()
@Roles(Role.ADMIN)
async create(@Body() data: CreateProductDto) {
  return this.productService.create(data);
}
```

---

## Business Logic

### Stock Management

#### When Stock Management is Enabled (`manageStock: true`):
1. Stock field is required and tracked
2. Can add batches to product
3. Adding a batch automatically increments stock
4. Can manually adjust stock with PUT /products/:id/stock
5. Cannot reduce stock below 0

#### When Stock Management is Disabled (`manageStock: false`):
1. Stock field is ignored
2. Cannot add batches
3. Product is always considered available

### Batch Tracking

#### Purpose:
- Track product lots/batches
- Monitor expiration dates
- Control cost prices per batch
- FIFO (First In, First Out) management

#### Key Features:
- **Expiry Alerts**: Get batches expiring soon
- **Expired Tracking**: Monitor expired products with remaining stock
- **Cost Control**: Track cost price per batch
- **Supplier Tracking**: Record supplier information

### Cashback System

Products include a `cashbackPercent` field (default: 5%) that determines how much cashback customers earn when purchasing the product through tabs.

---

## Migration Guide

### Apply Database Changes

```bash
npx prisma migrate dev --name add_product_batch_model
```

### Seed Sample Data

```typescript
// prisma/seed.ts
const beverages = await prisma.productCategory.create({
  data: {
    name: 'Bebidas',
    description: 'Todas as bebidas',
    icon: 'drink-icon.png',
    displayOrder: 1,
  },
});

const water = await prisma.product.create({
  data: {
    categoryId: beverages.id,
    name: 'Água Mineral',
    description: 'Água mineral sem gás 500ml',
    price: 5.00,
    manageStock: true,
    stock: 100,
    cashbackPercent: 5,
    active: true,
  },
});

await prisma.productBatch.create({
  data: {
    productId: water.id,
    batchNumber: 'BATCH001',
    quantity: 100,
    remainingQty: 100,
    costPrice: 2.50,
    expiryDate: new Date('2026-12-31'),
    supplier: 'Distribuidora ABC',
  },
});
```

---

## Error Handling

### Common Errors

#### 404 Not Found
- Product not found
- Category not found

#### 409 Conflict
- Category name already exists

#### 400 Bad Request
- Price cannot be negative
- Stock must be provided when managing stock
- Product does not have stock management enabled
- Quantity must be greater than zero
- Insufficient stock
- Days must be greater than zero

---

## Usage Examples

### Frontend Integration

```typescript
// Create category (ADMIN only)
const createCategory = async () => {
  const response = await fetch('/api/product-categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Petiscos',
      description: 'Porções e petiscos variados',
      displayOrder: 2,
      active: true,
    }),
  });
  return response.json();
};

// Get products (Public)
const getProducts = async () => {
  const response = await fetch('/api/products/active');
  return response.json();
};

// Create product (ADMIN only)
const createProduct = async () => {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      categoryId: 'uuid-here',
      name: 'Cerveja Heineken',
      description: 'Cerveja Heineken Long Neck 330ml',
      price: 12.00,
      manageStock: true,
      stock: 200,
      cashbackPercent: 10,
      active: true,
    }),
  });
  return response.json();
};

// Add batch (ADMIN only)
const addBatch = async (productId: string) => {
  const response = await fetch(`/api/products/${productId}/batches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      batchNumber: 'LOT2026-03',
      quantity: 100,
      costPrice: 7.50,
      expiryDate: '2026-12-31',
      supplier: 'Distribuidora Heineken',
    }),
  });
  return response.json();
};

// Check low stock (ADMIN only)
const checkLowStock = async () => {
  const response = await fetch('/api/products/low-stock?threshold=20', {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  return response.json();
};

// Check expiring batches (ADMIN only)
const checkExpiringBatches = async () => {
  const response = await fetch('/api/products/batches/expiring?days=30', {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  return response.json();
};
```

---

## Testing

### Unit Tests Example

```typescript
describe('ProductService', () => {
  let service: ProductService;
  let repository: IProductRepository;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;
    
    service = new ProductService(repository, categoryRepository);
  });

  it('should create product with valid data', async () => {
    const dto = {
      categoryId: 'uuid',
      name: 'Test Product',
      price: 10.00,
      manageStock: true,
      stock: 50,
    };

    repository.create = jest.fn().mockResolvedValue({
      id: 'uuid',
      ...dto,
      price: new Prisma.Decimal(10.00),
    });

    const result = await service.create(dto);

    expect(result.price).toBe(10.00);
    expect(typeof result.price).toBe('number');
  });

  it('should throw error for negative price', async () => {
    const dto = {
      categoryId: 'uuid',
      name: 'Test',
      price: -10.00,
    };

    await expect(service.create(dto)).rejects.toThrow(
      'Price cannot be negative'
    );
  });
});
```

---

## Performance Considerations

### Database Indexes
The schema includes indexes on:
- `Product.categoryId` - Fast category filtering
- `Product.active` - Fast active product queries
- `ProductBatch.productId` - Fast batch lookup
- `ProductBatch.expiryDate` - Fast expiry queries

### Optimizations
1. **Eager Loading**: Include category and batches when needed
2. **Selective Fields**: Only load required data
3. **Caching**: Consider caching active products list
4. **Pagination**: Add pagination for large product lists (future enhancement)

---

## Future Enhancements

- [ ] Product variants (sizes, colors)
- [ ] Bulk operations (import/export CSV)
- [ ] Product images upload to cloud storage
- [ ] Automatic low stock notifications
- [ ] Batch consumption tracking (FIFO logic)
- [ ] Product search and filters
- [ ] Pagination for product lists
- [ ] Product history/audit log
- [ ] Price history tracking
- [ ] Promotions and discounts

---

## Integration with Other Modules

### Tab Module
Products are used in the Tab module for creating tab items:
```typescript
// When adding item to tab
const tabItem = await prisma.tabItem.create({
  data: {
    tabId: tab.id,
    productId: product.id,
    quantity: 2,
    unitPrice: product.price,
    subtotal: product.price * 2,
  },
});

// Optionally reduce stock
if (product.manageStock) {
  await productService.updateStock(product.id, -2);
}
```

### Cashback Module
Product's `cashbackPercent` determines cashback earned:
```typescript
const cashbackAmount = (product.price * quantity) * (product.cashbackPercent / 100);
```

---

## Troubleshooting

### Issue: Decimal type errors
**Solution**: Service layer automatically converts Prisma Decimal to number

### Issue: Cannot add batch to product
**Check**: Product must have `manageStock: true`

### Issue: Cannot reduce stock below 0
**Solution**: This is by design. Check current stock before attempting reduction

### Issue: Category delete fails
**Check**: Category might have associated products. Delete products first or implement cascade delete

---

## Support

For questions or issues with the products module, contact the development team or create an issue in the project repository.
