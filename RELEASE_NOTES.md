# Release Notes
**Shiv Furniture Works Mini ERP — Release Candidate 1 (RC1)**

We are pleased to announce the first Release Candidate (RC1) of the **Shiv Furniture Works Mini ERP**, a modern, high-performance web application designed for custom wood furniture manufacturing and business operations.

---

## 1. Key Feature Sets

### Customer Portal
- User registration and login flow.
- Product catalog browsing with advanced category filters and text search.
- Product comparison matrices and user wishlists.
- Standard and Express shipping delivery checkouts with Cash on Delivery (COD) and Razorpay integration.
- Dynamic order history tracking, invoices, and returns requests.

### Manufacturing & BOM
- Multi-tier Bill of Materials (BOM) for finished items.
- Work centers and machine throughput capacities scheduling.
- Manufacturing order transitions (Draft → Confirmed → Progress → Complete).
- Automated raw materials reservation and stock updates.

### Procurement & Scheduler
- Dynamic Make-to-Stock (MTS) and Make-to-Order (MTO) stock allocation engines.
- Automatic low-stock margin evaluations and purchase order drafts creation.
- 7 background cron tasks (DB backups, Notification rotations, low-stock warnings, sales summaries).

###観察とダッシュボード
- **Admin System Dashboard**: Observes active memory limits, db status logs, OS uptime, and hourly API rates.
- **Audit Log Explorer**: Records user database modifications with JSON before/after state diff comparisons.
- **Analytics Charts**: ABC inventory classification, dead stock items, reorder margin forecasting, and sales regressions.

---

## 2. Shared Design System Upgrade
- Modernized UI layout adhering to standard ratios: **40% Minimalism**, **25% Glassmorphism**, **20% Bento Grid**, **10% Soft Neumorphism**, **5% Micro Animations**.
- 14 reusable components: `AppCard`, `GlassCard`, `PageHeader`, `SearchBar`, `DataTable`, `StatusBadge`, `PrimaryButton`, `GlassInput`, `ModernModal`, `LoadingSkeleton`, `EmptyState`, `Pagination`, `Timeline`, and `Stepper`.

---

## 3. Deployment Specifications
- **Build Engine**: Next.js 15 (Turbopack compiler).
- **Database**: Prisma SQLite.
- **Process Manager**: PM2.
- **Containerization**: Docker Compose configured.
