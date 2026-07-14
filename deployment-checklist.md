# Deployment Checklist
**Pre-flight checklist before launching Shiv Furniture Works ERP to production**

---

## Pre-Deployment Verification
- [ ] TypeScript Type-safety validation check succeeds: `npx tsc --noEmit`.
- [ ] Next.js standalone compiler output check succeeds: `npm run build`.
- [ ] Prisma client generated: `npx prisma generate`.
- [ ] Live Razorpay credentials generated and verified.
- [ ] SMTP service coordinates validated (send a test email).

---

## Infrastructure Setup
- [ ] Target server running Node.js 20 LTS or Docker Engine.
- [ ] Reverse proxy (e.g. Nginx) configured with SSL/TLS termination.
- [ ] SSL certificates (Let's Encrypt / Certbot) configured with auto-renewals.
- [ ] Port forwarding mapped: Nginx `80/443` -> Node Application `3000`.
- [ ] Firewall rules configured: Open only ports 80, 443, and SSH (with key auth).

---

## Database Initialization
- [ ] Production SQLite path configured in `.env`.
- [ ] Apply migrations without development dependencies: `npx prisma migrate deploy`.
- [ ] Verify WAL mode is enabled: `PRAGMA journal_mode=WAL;`.
- [ ] Create initial administrative (ADMIN) account.

---

## Process Management & Maintenance
- [ ] App started using PM2 cluster mode: `pm2 start ecosystem.config.js`.
- [ ] PM2 startup script active: `pm2 startup && pm2 save`.
- [ ] Daily backup task added to crontab:
  ```bash
  0 2 * * * cd /opt/shiv-erp && node scripts/backup-db.cjs >> /var/log/erp-backup.log 2>&1
  ```
- [ ] Verification endpoint `/api/health` returns status: `ok`.
