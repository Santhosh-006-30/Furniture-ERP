# System Architecture Documentation
**Shiv Furniture Works ERP**

This document details the software architecture, design patterns, security layers, and data flow pipelines of the Mini ERP system.

---

## 1. Architectural Overview

The application utilizes a classic **Layered Architecture** within the Next.js App Router framework. It is structured to decouple HTTP/API routing, business workflows, database access, and UI rendering:

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                     │
│         React Client Components (Tailwind CSS)          │
└───────────────────────────┬─────────────────────────────┘
                            │ (HTTP REST APIs / JWT)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  API Routing Layer                      │
│      Route Handlers (src/app/api/*) + Middleware       │
│      - Rate Limiter, Security Headers, Auth Guards      │
└───────────────────────────┬─────────────────────────────┘
                            │ (Controller Delegation)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Controller Layer                     │
│        Dynamic Proxies (src/lib/api-monitor)            │
│        - Captures request/response latency metrics      │
└───────────────────────────┬─────────────────────────────┘
                            │ (Business Operations)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                        │
│        Business Services (src/modules/*)                │
│        - Core workflows: Sales, Procurement, BOM        │
└───────────────────────────┬─────────────────────────────┘
                            │ (Prisma Client)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Database Layer                      │
│        SQLite database file (Prisma ORM engine)          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules & Subsystems

*   **System Administration & Observability**: Real-time server diagnostics dashboard `/admin/system` and api health metrics engine `/api-monitor`.
*   **Job Scheduler**: In-process background runner using interval registers preventing double execution via global locks.
*   **Auditing Engine**: Structured JSON-based audit logger capturing client IP, user agent strings, and change sets (before/after payloads).
*   **Customer Portal**: E-commerce interface supporting wishlist caches, product comparisons, coupons, reviews, and Razorpay payment callbacks.

---

## 3. Data Flows & Execution Pipelines

### Sales Order Execution
1. Customer initiates checkout on `/customer/checkout`.
2. `CustomerOrderService` validates coupon limits and calculates loyalty point redemptions.
3. System hits Razorpay API to generate transaction identifiers.
4. Customer completes payment; signature verify hook creates `SalesOrder` and reserves stock.
5. In-process event triggers automated email generation using `EmailService` (Nodemailer).
