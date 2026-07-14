# Release Notes
**Shiv Furniture Works Mini ERP — Release Candidate 1 (RC1)**

This document outlines key feature sets, design choices, and deployment details.

---

## 1. Feature Index
- **Customer Portal**: Catalog searches, multi-product compare drawer, wishlists, dynamic steppers checkout.
- **ERP Workflows**: Sales invoices, procurement strategies (MTO/MTS), multi-tier BOM, work order schedules.
- **Enterprise Ops**: Admin diagnostics grid `/admin/system`, database backup crons, JSON diff log explorer.

---

## 2. Shared Component Library
Modernized user interface matching: **40% Minimalism**, **25% Glassmorphism**, **20% Bento Grid**, **10% Soft Neumorphism**, **5% Micro Animations**.
- Reusable UI tools under `src/components/ui/` (`AppCard`, `GlassCard`, `PageHeader`, `DataTable`, etc.).

---

## 3. Server Requirements
- **Prisma SQLite**: Persistent database storage.
- **NextJS dev engine**: Turbopack bundling support.
- **PM2 / Docker**: Production container configurations.
