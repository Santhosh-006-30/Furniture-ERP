# Bug Report
**Shiv Furniture Works Mini ERP — Release Candidate 1 (RC1)**

This report documents all defects discovered, analyzed, and resolved during the final validation audits.

---

## 1. Summary of Bug Inspections
- **Bugs Found**: 1
- **Bugs Resolved**: 1
- **Remaining Open Defects**: 0

---

## 2. Bug Registry

### Bug ID: BUG-001
- **Severity**: High (UI/Navigation Block)
- **Steps to Reproduce**:
  1. Log in to the Admin ERP dashboard as `admin@shivfurniture.com`.
  2. Navigate to the Customers list page (`/customers`).
  3. Observe that the left sidebar navigation drawer and top header navigation bar are missing, leaving the page with no way to navigate back to the dashboard.
- **Root Cause**: In `LayoutWrapper.tsx`, the route check `isCustomerRoute = pathname.startsWith('/customer')` matched `/customers` because `/customers` starts with `/customer`. This mistakenly categorized the admin customers page as a customer portal route, causing LayoutWrapper to return only the raw page children without the sidebar and header.
- **Files Modified**: 
  - [src/components/LayoutWrapper.tsx](file:///d:/Project/mini-erp/src/components/LayoutWrapper.tsx)
- **Resolution**: Updated `isCustomerRoute` to verify exact route equality or subroute nesting:
  ```typescript
  const isCustomerRoute = pathname === '/customer' || pathname.startsWith('/customer/');
  ```
  This prevents false matching on the `/customers` path.
- **Verification**: Verified that the Customers management page now displays the left sidebar, top header, breadcrumbs, and profile controls, rendering consistently with other dashboard pages (e.g. `/products`, `/sales`).
