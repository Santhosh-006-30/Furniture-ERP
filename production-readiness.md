# Production Readiness Documentation
**Shiv Furniture Works ERP**

This document details the configuration and checks required to transition the Mini ERP system from development/staging environments to a production-ready deployment state.

---

## 1. Environment Configurations
Verify that all properties in the production environment `.env` file are set correctly and securely:

*   **NODE_ENV**: Must be set to `production`.
*   **DATABASE_URL**: Set to the persistent production database file path or connection string.
*   **JWT_SECRET**: Use a high-entropy string (at least 64 characters) generated cryptographically:
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
*   **EMAIL_* Settings**: Valid SMTP host, TLS port, secure user, and authentication password.
*   **RAZORPAY_* API Keys**: Live mode API credentials.
*   **LOG_LEVEL**: Set to `info` or `warn` to minimize log storage overhead.

---

## 2. System Settings & Resource Limits
*   **PM2 Memory Limits**: Ecosystem configurations should use `max_memory_restart: "1G"` or lower based on target VPS specs.
*   **Rate Limits**: Configured via `src/middleware.ts` to block brute-force vectors:
    *   Auth APIs: Max 10 requests per minute.
    *   Standard APIs: Max 120 requests per minute.
*   **Upload Limitations**: Ensure directory permissions only allow write access to system users.

---

## 3. SQLite Concurrency & Scaling Considerations
*   **WAL Mode**: Ensure SQLite is executing in Write-Ahead Logging mode to support high read concurrency:
    ```sql
    PRAGMA journal_mode=WAL;
    ```
*   **Busy Timeout**: Set `busy_timeout = 5000` inside connection parameters to prevent transaction lock issues.
*   **Migration to PostgreSQL**: If the system surpasses 50 concurrent active users or database write frequency exceeds 10 writes per second, transition the connection provider from SQLite to PostgreSQL.

---

## 4. Backups and Disaster Recovery
*   **Automated Scheduling**: Backups are run daily at 2:00 AM using `scripts/backup-db.cjs`.
*   **Retention Policy**: Rotate backups to keep only the last 30 days of data.
*   **Offsite Syncing**: Integrate backups directory with an external S3-compatible service or secure remote VPS.
