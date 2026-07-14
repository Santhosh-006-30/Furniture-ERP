# API Reference Documentation
**Shiv Furniture Works ERP API Interface Specifications**

All requests must set `Content-Type: application/json`. Non-public endpoints require headers containing JWT credentials:
`Authorization: Bearer <token_signature>`

---

## 1. Authentication & Security Endpoints

### POST `/api/auth/login` (ERP Users)
*   **Request Payload**:
    ```json
    { "email": "admin@example.com", "password": "securepassword" }
    ```
*   **Response Payload**:
    ```json
    {
      "token": "eyJhbGciOi...",
      "user": { "id": "uuid", "email": "admin@example.com", "role": "ADMIN", "name": "System Administrator" }
    }
    ```

### POST `/api/customer/login` (Customer Accounts)
*   **Request Payload**: Identical to admin portal.
*   **Response Payload**: Standard token payload with user role set to `CUSTOMER`.

---

## 2. System Operations & Monitoring (Admin Only)

### GET `/api/admin/system`
*   **Response Payload**:
    ```json
    {
      "server": { "uptimeFormatted": "2d 4h 30m", "environment": "production" },
      "memory": { "heapUsedMB": 42.5 },
      "database": { "status": "ok", "latencyMs": 4, "sizeMB": 12.4 }
    }
    ```

### GET `/api/admin/jobs`
*   **Response Payload**: Lists scheduled backup, cleanup, and report aggregation jobs with run histories.

---

## 3. Custom Modules & Interfaces

### POST `/api/customer/coupons/validate`
*   **Request Payload**:
    ```json
    { "code": "SAVE20", "orderValue": 1500 }
    ```
*   **Response Payload**:
    ```json
    {
      "valid": true,
      "discount": 300,
      "discountType": "PERCENT",
      "discountValue": 20
    }
    ```

### GET `/api/api-monitor`
*   **Response Payload**: Aggregated traffic statistics including avg latency histogram, total requests count, and slowest routes.
