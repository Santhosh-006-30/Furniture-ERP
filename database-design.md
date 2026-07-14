# Database Design & Relational ER Diagram
**Shiv Furniture Works ERP**

This document describes the schema architecture, column details, indices, and structural relationships of the SQLite/PostgreSQL database.

---

## 1. Entity Relationships (Core Models)

```
  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
  │     User     │◄─────────┤   Customer   │◄─────────┤ ReturnRequest│
  │  (System)    │          │  (Loyalty)   │          │ (RMA status) │
  └──────┬───────┘          └──────┬───────┘          └──────┬───────┘
         │ 1                       │ 1                       │ *
         ▼ *                       ▼ *                       ▼ 1
  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
  │   AuditLog   │          │  SalesOrder  │◄─────────┤  SalesOrder  │
  │ (Diff track) │          │  (Payments)  │          │    Item      │
  └──────────────┘          └──────┬───────┘          └──────┬───────┘
                                   │ *                       │ *
                                   ▼                         ▼
                            ┌──────────────┐          ┌──────────────┐
                            │StockReservat.│          │   Product    │
                            │ (Allocation) │          │  (Stock, re) │
                            └──────────────┘          └──────────────┘
```

---

## 2. Table Specifications

### `users`
*   `id`: Primary Key (UUID)
*   `email`: String (Unique)
*   `passwordHash`: String
*   `role`: String (ADMIN, SALES, PURCHASE, MANUFACTURING, INVENTORY, OWNER, CUSTOMER)
*   `isActive`: Boolean (Deactivation lock)

### `api_logs`
*   `id`: Primary Key (UUID)
*   `endpoint`: String
*   `method`: String (GET, POST, etc.)
*   `statusCode`: Integer
*   `responseTime`: Float (latency tracking in ms)
*   `ip`: String
*   `userAgent`: String
*   `timestamp`: DateTime (default: now)

### `job_logs`
*   `id`: Primary Key (UUID)
*   `jobName`: String (Unique index)
*   `status`: String (IDLE, RUNNING, SUCCESS, FAILED)
*   `durationMs`: Float
*   `errorMessage`: String

---

## 3. Performance & Index Optimizations
To support real-time aggregates and fast searching, the following indexes are generated automatically by Prisma:

*   **Product Index**: Unique index on `sku` (product catalog lookup).
*   **Customer Index**: Unique index on `email`, `userId`, and `customerCode`.
*   **SalesOrder Index**: Unique index on `orderNumber` for shipment lookup.
*   **Coupon Index**: Unique index on `code` to enable instant code validation.
