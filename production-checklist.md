# Production Checklist
**Shiv Furniture Works Mini ERP — Release Candidate 1 (RC1)**

Deploy staging or production instances using this checklist.

---

## 1. Environment Configurations
- [ ] Set `NODE_ENV=production` inside environment files.
- [ ] Populate connections `DATABASE_URL="file:/path/to/persistent/prod.db"`.
- [ ] Set dynamic keys: `JWT_SECRET` and Razorpay APIs keys.
- [ ] Set up SMTP credentials to enable automated status email delivery.

---

## 2. Docker Deployments
1. Spin up containers:
   ```bash
   docker-compose up -d --build
   ```
2. Deploy db structure:
   ```bash
   docker-compose exec web npx prisma migrate deploy
   ```
3. Run master seed:
   ```bash
   docker-compose exec web npx prisma db seed
   ```

---

## 3. PM2 Deployments
1. Install prod packages:
   ```bash
   npm install --production
   ```
2. Build files:
   ```bash
   npm run build
   ```
3. Deploy DB schema:
   ```bash
   npx prisma migrate deploy
   ```
4. Start process manager:
   ```bash
   pm2 start ecosystem.config.js
   ```
