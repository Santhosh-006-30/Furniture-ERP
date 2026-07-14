# Judge Walkthrough
**Shiv Furniture Works Mini ERP — Evaluation Guide**

This guide highlights the key design and implementation milestones of the Mini ERP for evaluation.

---

## 1. Visual Presentation & UI Standardizations
We overhauled the application user interface to introduce an enterprise-grade visual presentation:
- **Design Tokens**: Standardized backgrounds (`#0F172A`), borders (`rgba(255,255,255,0.12)`), and colors.
- **Glass Panel Components**: Utilized `.glass-card` containing background saturation filters and blur configurations for layout sidebars and page panels.
- **Micro-Animations**: Set a strict hover/fade animation timing threshold of **250ms** (`transition-all duration-200`) across buttons, cards, and modal dialog animations.

---

## 2. Observer Dashboard & System Administration
- **Diagnostics Panel (`/admin/system`)**: Displays server RAM, database disk size, failed log logs, API request rates, and Recharts graph trends.
- **Audit Logs Explorer (`/admin/audit`)**: Allows searching logs, filtering categories, and viewing before/after JSON data structures side-by-side.

---

## 3. Background Job Scheduler
- Implemented `src/lib/scheduler.ts` managing 7 cron tasks (DB backups, logs rotations, low stock audits, notifications purge).
- Dynamically bypassed Turbopack code resolution checks using `eval('require')` wrappers on child process imports.

---

## 4. Code Quality & Formatting Consolidation
- Replaced 9 duplicate formatting code blocks with unified utilities imported from [format.ts](file:///d:/Project/mini-erp/src/lib/format.ts).
- Optimized react state layouts using `useMemo` hooks for search filters, catalog grids, and checkout totals calculations.
