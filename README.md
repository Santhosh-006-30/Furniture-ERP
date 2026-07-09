# 🪑 Shiv Furniture Works — Mini ERP System

> A full-stack, production-grade Enterprise Resource Planning system built for the furniture manufacturing industry. Covers the complete order-to-delivery lifecycle including procurement, manufacturing, inventory, customer portal, payments, returns, loyalty, and analytics.

---

## 📑 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start (Development)](#quick-start-development)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Backup & Restore](#backup--restore)
- [API Documentation](#api-documentation)
- [Folder Structure](#folder-structure)
- [User Manual](#user-manual)
- [Admin Manual](#admin-manual)
- [CI/CD](#cicd)
- [Security](#security)
- [License](#license)

---

## ✨ Features

### ERP Modules
| Module | Description |
|--------|-------------|
| 🔐 **Authentication** | JWT-based auth with role-based access control (ADMIN, SALES, PURCHASE, MANUFACTURING, INVENTORY, OWNER, CUSTOMER) |
| 👥 **Users** | User management with approval workflow |
| 📦 **Products** | Product catalog with MTS/MTO procurement strategy |
| 🧱 **Bill of Materials** | Multi-level BOM management |
| 🛒 **Sales** | Complete sales order lifecycle (DRAFT → CONFIRMED → DELIVERED) |
| 🏭 **Manufacturing** | Work order management with work center routing |
| 🚚 **Procurement** | Purchase order lifecycle with vendor management |
| 📦 **Inventory** | Stock management with ledger and reservations |
| 👤 **Customers** | CRM with loyalty points and purchase history |
| 🎟️ **Coupons** | Promo code management (PERCENT/FIXED discounts) |
| 🔄 **Returns** | RMA workflow with refund processing |
| 📊 **Analytics** | 12+ KPIs with Recharts visualizations |
| 📋 **Reports** | 7 report types with CSV/Excel/PDF export |
| 🔔 **Notifications** | Real-time in-app notifications |
| 📜 **Audit Logs** | Immutable audit trail with IP and user agent |

### Customer Portal
| Feature | Description |
|---------|-------------|
| 🛍️ **Product Catalog** | Grid/list view, ratings, stock badges, lead time |
| 🛒 **Cart & Checkout** | Multi-step checkout with coupon + loyalty redemption |
| 💳 **Razorpay Payment** | Real payment gateway integration |
| 📦 **Order Tracking** | Real-time order status with delivery timeline |
| 🧾 **Invoices** | Downloadable invoice PDFs |
| ❤️ **Wishlist** | Save products for later |
| ⚖️ **Product Compare** | Side-by-side comparison of up to 4 products |
| ⭐ **Reviews** | Verified purchase reviews with ratings |
| 🔄 **Returns** | Self-service return request with status tracking |
| 🏆 **Loyalty Program** | Earn 1 point per ₹100 spent, redeem at checkout |
| 📧 **Email Notifications** | Order confirmation, shipping, and delivery emails |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Database** | SQLite (Prisma ORM) — upgradeable to PostgreSQL |
| **Styling** | Vanilla CSS + Tailwind-compatible utility classes |
| **Charts** | Recharts |
| **Authentication** | JWT (jose library) |
| **Email** | Nodemailer |
| **Payment** | Razorpay |
| **Logging** | Pino |
| **Process Manager** | PM2 (production) |
| **Container** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js App Router              │
│  ┌────────────────┬────────────────────────┐ │
│  │  ERP Pages     │  Customer Portal Pages │ │
│  │  /dashboard    │  /customer/dashboard   │ │
│  │  /sales        │  /customer/products    │ │
│  │  /manufacturing│  /customer/checkout    │ │
│  │  /reports      │  /customer/returns     │ │
│  └────────────────┴────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │           API Routes (/api/*)            │ │
│  │  JWT Auth Middleware → Role Guards       │ │
│  │  Rate Limiting → Input Sanitization      │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │        Business Logic Services          │ │
│  │  SalesWorkflowService                   │ │
│  │  CustomerOrderService                   │ │
│  │  ManufacturingService                   │ │
│  │  EmailService / AuditLogger             │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │     Prisma ORM → SQLite / PostgreSQL     │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## ✅ Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- **Git**

---

## 🚀 Quick Start (Development)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/mini-erp.git
cd mini-erp

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .production.env.example .env
# Edit .env with your values (JWT_SECRET, EMAIL_, RAZORPAY_)

# 4. Initialize the database
npx prisma migrate dev --name init
npx prisma generate

# 5. Seed initial data (optional)
node scripts/seed-50-products.cjs

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default Admin:** Create via `/register`, then manually set `role = 'ADMIN'` in the database or use the seed script.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Prisma database connection string |
| `JWT_SECRET` | ✅ | Min 32-char random secret for JWT signing |
| `NEXTAUTH_SECRET` | ✅ | Next.js session secret |
| `NEXTAUTH_URL` | ✅ | Full URL of your deployment |
| `EMAIL_HOST` | ✅ | SMTP host (e.g., smtp.gmail.com) |
| `EMAIL_PORT` | ✅ | SMTP port (587 for TLS) |
| `EMAIL_USER` | ✅ | SMTP username |
| `EMAIL_PASSWORD` | ✅ | SMTP app password |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay API secret |

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄 Database Setup

### Development (SQLite)
```bash
# Create/migrate database
npx prisma migrate dev

# View database in browser
npx prisma studio
```

### Production (SQLite)
```bash
npx prisma migrate deploy
npx prisma generate
```

### Upgrade to PostgreSQL
1. Update `DATABASE_URL` in `.env` to PostgreSQL connection string
2. Update `prisma/schema.prisma` provider from `sqlite` to `postgresql`
3. Run `npx prisma migrate dev`

---

## 🚢 Production Deployment

### Option 1: PM2 (Recommended for VPS)

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Run database migrations
npx prisma migrate deploy

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save
pm2 startup
```

### Option 2: Systemd Service

```bash
# Build
npm run build

# Create service file at /etc/systemd/system/shiv-erp.service
# Then:
systemctl enable shiv-erp
systemctl start shiv-erp
```

---

## 🐳 Docker Deployment

```bash
# Copy and configure environment
cp .production.env.example .env
# Edit .env with production values

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Run migrations (first time)
docker-compose exec app npx prisma migrate deploy

# Stop
docker-compose down
```

**With Nginx reverse proxy:**
```bash
docker-compose --profile nginx up -d
```

---

## 💾 Backup & Restore

### Create Backup
```bash
node scripts/backup-db.cjs
# Output: backups/erp-backup-2026-07-09_10-30-00.db
```

### List Backups
```bash
node scripts/backup-db.cjs --list
```

### Restore from Backup
```bash
node scripts/backup-db.cjs --restore erp-backup-2026-07-09_10-30-00.db
# Creates a safety backup of current DB before restoring
```

### Clean Old Backups
```bash
node scripts/backup-db.cjs --clean 30   # Delete backups older than 30 days
```

### Automated Backups (Cron)
```bash
# Daily at 2 AM
0 2 * * * cd /opt/shiv-erp && node scripts/backup-db.cjs >> /var/log/erp-backup.log 2>&1
```

---

## 📡 API Documentation

### Authentication
All API routes (except `/api/auth/*` and `/api/customer/login`) require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

### Core API Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | ERP user login |
| POST | `/api/auth/register` | ERP user registration |
| POST | `/api/customer/login` | Customer login |
| POST | `/api/customer/register` | Customer registration |

#### ERP — Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | List all sales orders |
| POST | `/api/sales` | Create sales order |
| PUT | `/api/sales/[id]/confirm` | Confirm order |
| PUT | `/api/sales/[id]/deliver` | Deliver items |
| PUT | `/api/sales/[id]/cancel` | Cancel order |

#### Customer Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer/products` | Browse products |
| GET | `/api/customer/orders` | My orders |
| POST | `/api/customer/checkout` | Place order |
| POST | `/api/customer/coupons/validate` | Validate coupon |
| GET/POST | `/api/customer/returns` | Return requests |
| GET | `/api/customer/loyalty` | Loyalty points |
| GET/POST | `/api/customer/wishlist` | Wishlist |
| GET/POST | `/api/customer/reviews` | Product reviews |

#### Analytics & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | KPI dashboard data |
| GET | `/api/reports?type=sales&format=csv` | Generate report |

#### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |

---

## 📁 Folder Structure

```
mini-erp/
├── .github/workflows/      # CI/CD pipelines
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── public/                 # Static assets
├── scripts/
│   ├── backup-db.cjs       # Database backup/restore
│   └── seed-*.cjs          # Database seeders
├── src/
│   ├── app/
│   │   ├── api/            # Next.js API routes
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── customer/   # Customer portal APIs
│   │   │   ├── sales/      # Sales order APIs
│   │   │   ├── analytics/  # Analytics APIs
│   │   │   └── health/     # Health check
│   │   ├── customer/       # Customer portal pages
│   │   ├── dashboard/      # ERP dashboard
│   │   ├── sales/          # Sales pages
│   │   ├── analytics/      # Analytics dashboard
│   │   ├── reports/        # Reports page
│   │   ├── coupons/        # Coupon management
│   │   ├── returns/        # Returns management
│   │   ├── not-found.tsx   # 404 page
│   │   ├── global-error.tsx # 500 page
│   │   └── maintenance/    # Maintenance page
│   ├── components/
│   │   └── LayoutWrapper.tsx # ERP shell layout
│   ├── lib/
│   │   ├── db.ts           # Prisma client singleton
│   │   ├── jwt.ts          # JWT utilities
│   │   ├── email.ts        # Email service (Nodemailer)
│   │   ├── sanitize.ts     # Input sanitization
│   │   ├── audit-logger.ts # Audit logging
│   │   └── auth-middleware.ts # API authentication
│   ├── modules/
│   │   ├── auth/           # Auth service
│   │   ├── sales/          # Sales workflow service
│   │   ├── manufacturing/  # Manufacturing service
│   │   ├── procurement/    # Procurement service
│   │   └── customer/       # Customer order service
│   └── middleware.ts       # Rate limiting + security headers
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.js     # PM2 config
├── next.config.ts
└── .production.env.example
```

---

## 👤 User Manual

### Customer Portal

1. **Register** at `/customer/register`
2. **Browse Products** at `/customer/products`
3. **Add to Cart** — select items and quantities
4. **Checkout** — enter shipping address, apply coupon or loyalty points
5. **Payment** — pay via Razorpay or COD
6. **Track Orders** at `/customer/orders`
7. **View Invoices** at `/customer/invoices`
8. **Request Returns** at `/customer/returns` (for delivered orders)
9. **Earn Loyalty Points** — 1 point per ₹100 spent
10. **Redeem Points** at checkout (1 point = ₹1 discount)

---

## 🛡 Admin Manual

### ERP Access Roles
| Role | Permissions |
|------|-------------|
| OWNER | Full access to all modules |
| ADMIN | Full access + user management |
| SALES | Products, Customers, Sales orders |
| PURCHASE | Purchase orders, Vendors |
| MANUFACTURING | Work orders, BOM, Work centers |
| INVENTORY | Stock management, Ledger |

### Common Workflows

**Process a Customer Order:**
1. Customer places order → appears in `/sales` as DRAFT
2. Admin confirms → CONFIRMED (inventory reserved)
3. Admin delivers → DELIVERED (stock deducted)

**Returns Processing:**
1. Customer requests return → appears in `/returns` as REQUESTED
2. Admin approves or rejects
3. Once approved → mark as PICKED_UP when item received
4. Set refund amount → mark as REFUNDED

**Coupon Creation:**
1. Go to `/coupons` → click Add Coupon
2. Set code, discount type, value, limits, expiry
3. Share code with customers

---

## 🔒 Security

- **Rate Limiting**: 120 req/min (API), 10 req/min (auth endpoints)
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-XSS-Protection
- **JWT Authentication**: Short-lived tokens with role-based access control
- **Input Sanitization**: XSS and injection protection on all inputs
- **Password Hashing**: bcrypt with salt rounds
- **Secure Cookies**: HTTPOnly, SameSite, Secure flags
- **SQL Safety**: Prisma ORM prevents raw SQL injection

---

## 🔄 CI/CD

The GitHub Actions pipeline (`.github/workflows/ci.yml`) automatically:

1. **On every push/PR**: TypeScript type check → build
2. **Security**: npm audit for high-severity vulnerabilities
3. **On merge to main**: Deploy via SSH to production server

---

## 📄 License

MIT License — Shiv Furniture Works © 2026
