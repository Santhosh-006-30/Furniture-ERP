# Deployment Checklist
**Shiv Furniture Works Mini ERP — Release Candidate 1 (RC1)**

Follow this checklist to deploy the Mini ERP to a staging or production instance.

---

## 1. Pre-Deployment Checks
- [ ] Set `NODE_ENV=production` inside environment configurations.
- [ ] Configure database connection string `DATABASE_URL="file:/path/to/persistent/prod.db"`.
- [ ] Populate JWT secret signature: `JWT_SECRET="YOUR_RANDOM_LONG_SECRET_KEY"`.
- [ ] Configure Razorpay integration credentials if using payment features.
- [ ] Set SMTP mail config parameters inside `.env` to enable email dispatch.

---

## 2. Docker Compose Deployment (Recommended)
1. Clone the project workspace.
2. Build and spin up the containers:
   ```bash
   docker-compose up -d --build
   ```
3. Run Prisma schema migration updates:
   ```bash
   docker-compose exec web npx prisma migrate deploy
   ```
4. Optionally seed basic product catalogs:
   ```bash
   docker-compose exec web npx prisma db seed
   ```

---

## 3. Standard PM2 Node Server Deployment
1. Install dependencies:
   ```bash
   npm install --production
   ```
2. Build Next.js project packages:
   ```bash
   npm run build
   ```
3. Apply database migration plans:
   ```bash
   npx prisma migrate deploy
   ```
4. Start server process using PM2 ecosystem profile:
   ```bash
   pm2 start ecosystem.config.js
   ```

---

## 4. Post-Deployment Smoke Tests
- [ ] Access the health API `/api/health` to confirm database connectivity status.
- [ ] Log in as admin (`admin@shivfurniture.com`) and navigate to `/admin/system` to verify real-time RAM statistics.
- [ ] Check background logs (`pm2 logs` or Docker container outputs) to confirm scheduler initialization.
