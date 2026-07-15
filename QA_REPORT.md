# QA Report
**Shiv Furniture Works Mini ERP — Release Candidate 1 (RC1)**

This report covers E2E test environments, security evaluations, UAT validation scenarios, and overall coverage indices.

---

## 1. Test Setup & Specifications
- **Host Engine**: NextJS Dev Server running on port `3000`.
- **Database Engine**: Prisma SQLite loaded with standard baseline seeds.
- **Auditing Tool**: Chrome devtools consoles and background next logger.

---

## 2. Test Execution & Coverage
The following modules were audited using dynamic E2E browser validations:
- **Authentication & RBAC**: Evaluated redirection logic for Owner, Admin, Sales, Purchase, Manufacturing, Inventory, and Customer classes. Checked unauthorized route requests (e.g. standard buyer trying to view system audit logs) to ensure a standard `403 Forbidden` response.
- **Purchasing & Sales Flows**: Walked through customer registrations, login profiles, cart allocations, and Cash on Delivery order processing. Checked status transitions in Sales Order `SO-0001` (Draft → Confirmed → Dispatched → Fully Delivered).
- **Manufacturing & Inventory Ledger**: verified MTS inventory allocation reservations, BOM calculations, and finished inventory balance reconciliation updates.
- **Enterprise Logs & Observability**: Tested diagnostics grids (`/admin/system`), JSON delta comparisons (`/admin/audit`), scheduler logs (`/admin/jobs`), and health status (`/api/health`).

---

## 3. Core QA Verdict
All tested workflows succeeded cleanly with zero hydration issues, console exceptions, or unresolved database states. The layout defect on `/customers` page (sidebar/navigation missing) was successfully identified, resolved, and verified.
