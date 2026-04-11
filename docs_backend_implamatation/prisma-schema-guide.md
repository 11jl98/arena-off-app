# 📚 Prisma Schema Guide - Arena Off Beach

## 🎯 Overview

This schema was designed for **A SINGLE ARENA** (single-tenant), optimized for performance with PostgreSQL.

## 🏗️ System Architecture

### Main Modules

1. **Authentication and Users** (`User`, `ClientProfile`, `DevicePushToken`)
2. **Courts and Sports** (`Sport`, `Court`, `AvailabilitySlot`, `PricingRule`)
3. **Bookings** (`Booking`, `BookingParticipant`)
4. **Bar/Tabs** (`Product`, `ProductCategory`, `Tab`, `TabItem`)
5. **Cashback** (`CashbackWallet`, `CashbackTransaction`, `QrReceipt`)
6. **Payments** (`Payment`)
7. **Promotions** (`Promotion`, `HoursPackage`)
8. **Audit** (`Notification`, `AuditLog`)

---

## ⚡ Implemented Optimizations

### 1. Compound Indexes (Frequent Queries)

```prisma
// Search bookings for a court on a specific day
@@index([courtId, date])

// Don't allow duplicate bookings
@@unique([courtId, date, startTime])

// Search availability by court and day of week
@@index([courtId, dayOfWeek])
```

### 2. Unique Indexes (Integrity)

- `User.email` - Unique login
- `User.googleId` - Google integration
- `ClientProfile.cpf` - Unique CPF
- `Tab.number` - Unique tab number
- `QrReceipt.hash` - Unique receipt
- `Sport.name` - Unique sport name

### 3. Fast Lookup Indexes

```prisma
// Common queries
@@index([status])           // Filter by status
@@index([createdAt])        // Sort by date
@@index([clientId])         // Search by client
@@index([active])           // Filter active
```

### 4. Cascade Delete

When a user is deleted, automatically removes:
- ClientProfile
- DevicePushToken
- CashbackWallet
- Notifications

---

## 📊 Important Queries

### Check Court Availability

```typescript
const existingBookings = await prisma.booking.findMany({
  where: {
    courtId: 'court-uuid',
    date: new Date('2026-03-20'),
    status: {
      notIn: ['CANCELLED']
    }
  },
  select: {
    startTime: true,
    endTime: true
  }
});
```

### Calculate Price with Pricing Rules

```typescript
const pricingRules = await prisma.pricingRule.findMany({
  where: {
    active: true,
    OR: [
      { courtId: 'court-uuid' },
      { courtId: null } // global rules
    ],
    dayOfWeek: dayOfWeek, // 0-6
  },
  orderBy: {
    priority: 'desc' // higher priority first
  }
});
```

### Dashboard - Daily Summary

```typescript
const dailySummary = await prisma.$transaction([
  // Total bookings
  prisma.booking.count({
    where: {
      date: today,
      status: { notIn: ['CANCELLED'] }
    }
  }),
  
  // Open tabs
  prisma.tab.count({
    where: { status: 'OPEN' }
  }),
  
  // Daily revenue
  prisma.payment.aggregate({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(23, 59, 59, 999))
      },
      status: 'PAID'
    },
    _sum: { amount: true }
  })
]);
```

### Tabs with Cashback

```typescript
// When closing tab, calculate cashback
const tab = await prisma.tab.findUnique({
  where: { id: tabId },
  include: {
    items: {
      include: {
        product: {
          select: { cashbackPercent: true }
        }
      }
    }
  }
});

// Calculate total cashback
const totalCashback = tab.items.reduce((acc, item) => {
  const itemCashback = (item.subtotal * item.product.cashbackPercent) / 100;
  return acc + itemCashback;
}, 0);

// Add to wallet
await prisma.cashbackWallet.update({
  where: { clientId: tab.clientId },
  data: {
    balance: { increment: totalCashback },
    totalEarned: { increment: totalCashback }
  }
});

await prisma.cashbackTransaction.create({
  data: {
    walletId: wallet.id,
    type: 'EARNED_CONSUMPTION',
    amount: totalCashback,
    source: `Tab #${tab.number}`,
    tabId: tab.id
  }
});
```

### Booking with Split Payment

```typescript
const booking = await prisma.booking.create({
  data: {
    courtId,
    clientId, // who created the booking
    date,
    startTime,
    endTime,
    calculatedAmount: 150,
    finalAmount: 150,
    splitPayment: true,
    numberOfPeople: 3,
    participants: {
      create: [
        { userId: 'friend1-id', splitAmount: 50 },
        { userId: 'friend2-id', splitAmount: 50 },
        { userId: 'friend3-id', splitAmount: 50 }
      ]
    }
  }
});
```

### QR Code Scan (Receipt)

```typescript
// Validate receipt
const existing = await prisma.qrReceipt.findUnique({
  where: { hash: qrCodeHash }
});

if (!existing) {
  const cashbackPercent = 10; // 10% cashback
  const cashbackGenerated = (receiptAmount * cashbackPercent) / 100;
  
  await prisma.$transaction([
    // Create receipt record
    prisma.qrReceipt.create({
      data: {
        clientId,
        hash: qrCodeHash,
        amount: receiptAmount,
        cnpj,
        issueDate,
        used: false,
        processed: true,
        cashbackGenerated
      }
    }),
    
    // Add cashback
    prisma.cashbackWallet.update({
      where: { clientId },
      data: {
        balance: { increment: cashbackGenerated },
        totalEarned: { increment: cashbackGenerated }
      }
    }),
    
    // Register transaction
    prisma.cashbackTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'EARNED_BONUS',
        amount: cashbackGenerated,
        source: 'Receipt scan',
        qrReceiptId: receipt.id
      }
    })
  ]);
}
```

---

## 🔐 Access Levels (Roles)

### CLIENT
- View and create own bookings
- Participate in friends' bookings
- Scan QR codes
- View cashback balance
- View own tabs

### EMPLOYEE
- All client permissions
- Create/edit tabs
- Confirm payments
- View all daily bookings
- Register customer check-ins

### ADMIN
- All permissions
- Create/edit courts
- Create/edit products
- Define pricing rules
- Create promotions
- View reports and audit
- Manage users

---

## 📈 Useful Reports

### Top 10 Clients (Loyalty)

```typescript
const topClients = await prisma.user.findMany({
  where: { role: 'CLIENT' },
  include: {
    _count: {
      select: { bookings: true }
    },
    cashbackWallet: {
      select: { totalEarned: true }
    }
  },
  orderBy: {
    bookings: { _count: 'desc' }
  },
  take: 10
});
```

### Best-Selling Products

```typescript
const bestSellers = await prisma.tabItem.groupBy({
  by: ['productId'],
  where: {
    cancelled: false,
    tab: {
      status: { in: ['CLOSED', 'PAID'] }
    }
  },
  _sum: { quantity: true },
  _count: true,
  orderBy: {
    _sum: { quantity: 'desc' }
  },
  take: 10
});
```

### Court Occupancy Rate

```typescript
const monthDays = 30;
const hoursPerDay = 12; // operating hours
const totalAvailableHours = monthDays * hoursPerDay;

const monthBookings = await prisma.booking.findMany({
  where: {
    date: {
      gte: monthStart,
      lte: monthEnd
    },
    status: { notIn: ['CANCELLED'] }
  },
  select: {
    courtId: true,
    startTime: true,
    endTime: true
  }
});

// Calculate hours booked per court
const hoursByCourt = {};
monthBookings.forEach(b => {
  const hours = calculateHoursDifference(b.startTime, b.endTime);
  hoursByCourt[b.courtId] = (hoursByCourt[b.courtId] || 0) + hours;
});

// Occupancy rate
const occupancyRate = (hoursByCourt[courtId] / totalAvailableHours) * 100;
```

---

## 🚀 Next Steps

1. **Migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Generate Client:**
   ```bash
   npx prisma generate
   ```

3. **Seed (initial data):**
   - Create default admin
   - Create sports (Soccer, Volleyball, Footvolley, etc)
   - Create product categories
   - Arena settings

4. **Prisma Studio (UI for testing):**
   ```bash
   npx prisma studio
   ```

---

## 🛡️ Best Practices

### 1. Transactions
Always use `$transaction` for atomic operations:
- Create booking + participants
- Close tab + generate cashback
- Process payment + update status

### 2. Soft Delete
For audit purposes, consider adding `deletedAt` instead of deleting:
```prisma
deletedAt DateTime?
@@index([deletedAt])
```

### 3. Timestamps
Always use `createdAt` and `updatedAt` for traceability.

### 4. Enums
Use Prisma enums to ensure data consistency.

### 5. Validations
Implement validations at application level (NestJS DTOs) before persisting.

---

## 📞 Common Questions

**Q: How to add more courts?**
A: Just create new records in the `Court` table with different sports.

**Q: How does split payment work?**
A: Use `splitPayment: true` and create records in `BookingParticipant` for each friend.

**Q: Does cashback expire?**
A: Not implemented, but you can create a daily job that checks `CashbackTransaction` and expires old cashback (type: 'EXPIRATION').

**Q: How to calculate final booking amount?**
A: `finalAmount = calculatedAmount - cashbackUsed`

**Q: Can I have multiple arenas?**
A: This schema is for **ONE ARENA**. For multi-tenant, add `arenaId` to all main tables.

---

## 🎨 Recommended Settings

```typescript
// prisma/seed.ts - Initial settings
await prisma.arenaSettings.createMany({
  data: [
    { key: 'ARENA_NAME', value: 'Arena Off Beach', type: 'STRING' },
    { key: 'CNPJ', value: '00.000.000/0000-00', type: 'STRING' },
    { key: 'PHONE', value: '(00) 0000-0000', type: 'STRING' },
    { key: 'EMAIL', value: 'contact@arenaoffbeach.com', type: 'STRING' },
    { key: 'DEFAULT_CASHBACK_PERCENT', value: '5', type: 'NUMBER' },
    { key: 'MIN_CASHBACK_USAGE', value: '10', type: 'NUMBER' },
    { key: 'OPENING_TIME', value: '06:00', type: 'STRING' },
    { key: 'CLOSING_TIME', value: '23:00', type: 'STRING' },
    { key: 'MIN_BOOKING_ADVANCE_HOURS', value: '2', type: 'NUMBER' },
    { key: 'MAX_CANCELLATION_HOURS', value: '24', type: 'NUMBER' },
  ]
});
```

---

**Developed with ❤️ for Arena Off Beach**
