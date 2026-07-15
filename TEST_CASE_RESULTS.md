# Test Case Results
**Shiv Furniture Works Mini ERP — Release Candidate 1 (RC1)**

This document details results from the test suite runs.

---

## 1. Test Matrix & Output Actions

| Test ID | Test Category | Target Actions | Result |
| :--- | :--- | :--- | :--- |
| **TC-001** | Authentication | Login customer portal (`customer@abcinteriors.com` / `password123`). | **PASS** |
| **TC-002** | Catalog | Search for product `"divider"` and open Quick View modal. | **PASS** |
| **TC-003** | Checkout | Add room divider to cart, navigate to stepper form, select COD, and submit order. | **PASS** |
| **TC-004** | Order Creation | Sales Order `SO-0001` recorded in database and allocated draft status. | **PASS** |
| **TC-005** | Order Confirm | Log in as admin (`admin@shivfurniture.com`), click Confirm, and check stock reservations. | **PASS** |
| **TC-006** | Dispatch | Click Deliver, verify order transitions to `FULLY_DELIVERED` and decreases free stock. | **PASS** |
| **TC-007** | RBAC | Attempt unauthorized route accesses (Sales operator requesting Audit dashboard). | **PASS (403)** |
| **TC-008** | Observability | Review `/admin/system` CPU metrics and Recharts activity tooltips. | **PASS** |
| **TC-009** | Build Checks | Run `npx tsc --noEmit` and `npm run build` to verify bundles compiles. | **PASS** |
| **TC-010** | Layout Wrapper | Verify `/customers` admin page displays standard left sidebar and topbar headers. | **PASS** |

---

## 2. Dynamic Browser Console Logs
Verified console output streams during catalog browsing and form submissions:
- Hydration mismatch flags: **0**
- Failed network requests (4xx / 5xx): **0**
- JavaScript exceptions: **0**
