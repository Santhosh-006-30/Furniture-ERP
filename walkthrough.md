# Customer Orders Walkthrough

## Scope
The customer orders module now extends the existing SalesOrder-based workflow instead of introducing a parallel data model.

## What changed
- Added a customer order list page at /customer/orders with search, status filter, date range, sort, and pagination.
- Added a customer order detail page at /customer/orders/[id] with summary, customer information, delivery details, payment context, a customer-friendly timeline, and line items.
- Added customer-only API endpoints for listing, retrieving, and cancelling draft orders.
- Reused the existing ERP sales order, audit log, manufacturing order, procurement request, and purchase order data to build the customer experience.

## User flows
1. Customer logs in and opens My Orders.
2. The list fetches only the authenticated customer's orders.
3. Filters and pagination operate on the server-side data.
4. Order detail shows the mapped customer timeline and item breakdown.
5. Draft orders can be cancelled from the list with confirmation.
