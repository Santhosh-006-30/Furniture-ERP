# Production Readiness Review
**Shiv Furniture Works Mini ERP — Release Candidate 1 (RC1)**

This document evaluates the system environment configuration, safety middleware, backup triggers, and service configurations.

---

## 1. Environment & Database Configurations
- **Database File**: Dev DB path points to local SQLite file `prisma/dev.db`. In production, this can be configured to point to any mounted persistent volume using `DATABASE_URL`.
- **Secret Keys**: JWT keys and Razorpay secrets are loaded via environment variables (`JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).

---

## 2. API Security Policies
Production-grade security headers are configured inside Next.js server middlewares:
- **Rate Limiting**: Rate limits APIs dynamically.
- **Helmet Headers**: Configured Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options, and X-Content-Type-Options to block clickjacking and scripting threats.
- **CSRF Protection**: Token evaluations added to form paths.
- **XSS Sanitization**: Input sanitization rules parse body fields to prevent injection.

---

## 3. Background Job Scheduler
The task scheduler bootstrap is integrated into the database connection pool bootstrap to trigger cron actions exactly once:
- **Backups**: Runs database exports backup script using dynamic child process executables.
- **Purge Tasks**: Rotates logs, cleans expired coupon codes, and updates order metrics.

---

## 4. Container & Docker Specifications
A multi-stage `Dockerfile` and `docker-compose.yml` config are configured to spin up the application:
- Includes node dependencies installation, compilation builds, and runtime execution blocks.
- SQLite files are mounted as local volumes to prevent state losses on container redeployments.
