# Administrative ERP Manual
**Shiv Furniture Works Management Cockpit User Guide**

This manual outlines system management tools, background jobs, audit logging, and analytical reports for administration and managers.

---

## 1. System Maintenance & Settings
*   **System Diagnostics Dashboard**: Access `/admin/system` to verify server status, memory footprint, active user profiles, database metrics, and error rates.
*   **Background Scheduler Control**: Manage, audit, and trigger system actions at `/admin/jobs`. Click **Run Now** next to any job (such as Database Backups or Old Notification Cleanup) to run it immediately.

---

## 2. Security Audits & Activity Logs
*   **Audit Explorer**: Navigate to `/admin/audit` to browse the system audit trail. Use filters to query changes by date range, user profile, action types, or modified entities.
*   **Change Comparison Viewer**: Click the magnifying glass icon on any log to inspect exact before-and-after JSON modifications.
*   **Traffic Logs**: View REST API performance at `/api-monitor`. Keep track of latency bottlenecks, error frequencies, and query rates.

---

## 3. Operations & Analytical Dashboards

### Inventory Intelligence
Provides analysis on stock holdings, turnover, and ordering priorities:
*   **ABC Analysis**: Items ranked by revenue contributions. Focus resource allocation on Class A inventory.
*   **Dead Stock Alerts**: Highlights items with no transactional activity in over 180 days.
*   **Reorder Forecast**: Lists items below safe margins and calculates procurement replenishment costs.

### Manufacturing Analytics
*   Monitor machine throughput, work center loads, and completed work orders.
*   Audit average build times and scrap rates to optimize shop floor execution.

### Sales & Purchase Intelligence
*   **Sales**: Real-time KPI dashboard tracking revenue projections, average transaction values, and monthly distributions.
*   **Purchase**: Rate vendors based on delivery timelines and average procurement expenses.
