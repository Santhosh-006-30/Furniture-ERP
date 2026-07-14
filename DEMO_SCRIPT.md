# Demo Script
**Shiv Furniture Works Mini ERP — E2E Demonstration Scenarios**

Use this script to guide a walkthrough of the Shiv Furniture Works Mini ERP.

---

## Scenario A: Customer Portal Experience & Order Checkout

1. **Access Portal**: Open the customer login page (`/customer/login`).
2. **Log In**: Input email `customer@abcinteriors.com` and password `password123`.
3. **Explore Dashboard**: Point out the clean Bento Grid metrics representing order statuses and loyalty points balance.
4. **Browse Products**: Navigate to `/customer/products`. Use the search bar to search for `"divider"`. Click **Quick View** on the `3-Panel Carved Wood Room Divider` to open the modal specification sheet.
5. **Compare**: Add items to comparison list, showing category specifications side-by-side.
6. **Checkout**: Add the `3-Panel Carved Wood Room Divider` to the cart, click the Cart icon, and proceed to checkout.
7. **Submit**: Select **Standard Shipping** and **Cash on Delivery**. Complete the form inputs and submit the order. Note Sales Order ID `SO-0001` on the success landing page.

---

## Scenario B: Admin Management & System Observability

1. **Log In**: Log in to the administrator workspace (`/login`) using credentials `admin@shivfurniture.com` / `password123`.
2. **Review Dashboard**: Show the Bento dashboard featuring real-time Sales summaries, active work logs, and audit trails.
3. **Confirm Order**: Go to Sales Order list (`/sales`), locate `SO-0001`, and click **Confirm**. Note the automated inventory stock reservation.
4. **Dispatch Order**: Click **Deliver** to complete shipping, updating the order to `FULLY_DELIVERED` and deducting stock.
5. **System Metrics**: Navigate to `/admin/system`. Present the server memory limits, database status indicators, and hourly API charts.
6. **Audit Exploration**: Go to `/admin/audit` to view the E2E audit ledger and details modal.
