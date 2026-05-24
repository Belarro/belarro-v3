# Belarro v3 - Professional Farm Management System

A complete vertical farming management platform for microgreens production, order fulfillment, and customer relationship management.

**Status:** ✅ Production-Ready | **Launch Date:** May 26, 2026

## 🎯 Overview

Belarro v3 is a full-stack web application designed for Berlin-based vertical farms managing microgreens production. It handles crop management, customer tracking, order fulfillment, inventory management, and harvest workflows with professional-grade reliability and performance.

**Built with:** Node.js + Express + TypeScript + PostgreSQL + Next.js + React + Tailwind CSS

## 📦 Features

### Backend (Node.js/Express)
- **Crop Management:** Create and manage crops with seeding schedules (Tuesday/Friday)
- **Product Variants:** Size-based product pricing and packaging
- **Orders:** Auto-calculated seeding and harvest dates based on crop schedule
- **Customers:** Contact management with 5-stage automated follow-up workflow
- **Inventory:** Seed, package, and sample inventory tracking with reorder alerts
- **Seeding & Harvest:** Batch creation with automatic seed deduction and yield allocation
- **Dashboard:** Real-time KPIs, crop performance metrics, customer funnel analysis

### Frontend (Next.js/React)
- **Responsive Dashboard:** KPI cards, operations overview, alert management
- **Crop Management:** Create, edit, view all crops with scheduling
- **Customer Portal:** Contact details, order history, follow-up tracking
- **Order Management:** Create recurring or one-time orders with auto-allocation
- **Inventory Tracking:** Real-time seed/package availability with reorder flags
- **Seeding Workflow:** Batch creation and harvest recording interface
- **Follow-up Management:** 5-stage follow-up tracking system

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repo> belarro-v3
cd belarro-v3

# Backend setup
npm install
cp .env.example .env
# Update DATABASE_URL in .env
npx prisma migrate dev
npx prisma generate

# Frontend setup
cd frontend
npm install
cp .env.example .env.local

# Run backend
cd .. && npm run dev

# Run frontend (in new terminal)
cd frontend && npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## 📋 API Documentation

### Crop Endpoints
- `GET /api/crops` - List crops with pagination and status filter
- `GET /api/crops/:id` - Get crop detail with variants and inventory
- `POST /api/crops` - Create crop with auto-generated inventory
- `PUT /api/crops/:id` - Update crop (seeding schedule, status, growth days)
- `DELETE /api/crops/:id` - Delete crop with cascade to variants

### Order Endpoints
- `GET /api/orders` - List orders with customer/variant details
- `GET /api/orders/:id` - Get order with fulfillment history
- `POST /api/orders` - Create order with auto-calculated dates
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Cancel order (prevents deletion if fulfilled)

### Customer Endpoints
- `GET /api/customers` - List customers with status filter
- `GET /api/customers/:id` - Get customer with orders and follow-ups
- `POST /api/customers` - Create customer with 5 auto-generated follow-ups
- `PUT /api/customers/:id` - Update customer details
- `DELETE /api/customers/:id` - Delete customer with cascade

### Inventory Endpoints
- `GET /api/inventory/seeds` - List seed inventory with reorder status
- `PUT /api/inventory/seeds/:crop_id` - Update seed quantity
- `GET /api/inventory/packages` - List package inventory
- `PUT /api/inventory/packages/:variant_id` - Update package quantity
- `GET /api/inventory/samples` - List sample inventory

### Dashboard Endpoints
- `GET /api/dashboard` - Main dashboard with KPIs and alerts
- `GET /api/dashboard/crops-performance` - Crop-level metrics
- `GET /api/dashboard/customer-metrics` - Customer engagement metrics
- `GET /api/dashboard/order-trends` - Order analysis by crop/status

See full API documentation in `01-Technical-Design-Doc.md`

## 🏗️ Architecture

```
belarro-v3/
├── src/
│   ├── index.ts              # Express app setup, middleware, error handling
│   ├── routes/
│   │   ├── crops.ts          # Crop CRUD (5 endpoints)
│   │   ├── variants.ts       # Product variant CRUD (3 endpoints)
│   │   ├── orders.ts         # Order management (5 endpoints)
│   │   ├── customers.ts      # Customer CRUD (5 endpoints)
│   │   ├── follow-ups.ts     # Follow-up workflow (6 endpoints)
│   │   ├── seeding-harvest.ts # Seeding batches & harvest (6 endpoints)
│   │   ├── inventory.ts      # Inventory management (6 endpoints)
│   │   ├── dashboard.ts      # KPIs & analytics (4 endpoints)
│   │   └── integration.test.ts # End-to-end test suite
│   └── utils/
│       └── seeding-logic.test.ts # Business logic unit tests
├── prisma/
│   ├── schema.prisma         # Complete database schema (12 tables)
│   └── seed.ts               # Seed script for demo data
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages (7 routes)
│   │   ├── components/       # Reusable UI components
│   │   └── services/         # API client
│   └── package.json
├── OPERATIONS_STANDARD.md    # Team operations, git workflow, quality gates
├── 01-Technical-Design-Doc.md # API contracts, request/response examples
├── 02-Sprint-Breakdown.md    # 4-week sprint plan with tasks
├── 03-Definition-of-Done.md  # Quality criteria for each task
├── SECURITY_AUDIT.md         # Security analysis and checklist
├── PERFORMANCE_OPTIMIZATION.md # Scaling strategy and benchmarks
├── DEPLOYMENT.md             # Production deployment guide
└── LAUNCH_PLAYBOOK.md        # Launch timeline and go/no-go criteria
```

## 🗄️ Database Schema

**12 Tables with Relations:**
- `Crop` - Core crop definition with growth parameters
- `ProductVariant` - Size/price variants of crops
- `Customer` - Restaurant/customer contacts
- `Order` - Customer orders with date calculations
- `SeedingBatch` - Production batches with expected harvest
- `HarvestRecord` - Actual yield and allocation
- `SeedInventory` - Seed stock with reorder thresholds
- `PackageInventory` - Packaged product inventory
- `SampleInventory` - Available samples
- `Visit` - Customer visit history
- `FollowUp` - 5-stage automated follow-up sequence
- `OrderFulfillment` - Order to harvest allocation

See full schema in `prisma/schema.prisma`

## 📊 Key Workflows

### 1. Create Crop
```
POST /crops → Creates crop with TUESDAY/FRIDAY schedule
Auto-generates SeedInventory and SampleInventory records
```

### 2. Create Order
```
POST /orders → Auto-calculates seeding date based on crop schedule
Auto-calculates harvest date from total_growth_days
Auto-calculates next delivery date (Saturday after harvest)
```

### 3. Seeding Batch
```
POST /seeding/batches → Deducts seeds from inventory (transactional)
Creates SeedingBatch with expected_harvest_date
```

### 4. Record Harvest
```
POST /seeding/harvest → Records actual yield
Allocates to orders vs. samples
Updates SampleInventory if batch_type='sample'
```

### 5. Customer Follow-ups
```
POST /customers → Creates 5 auto-generated follow-ups:
  - Follow-up 1: Day 0 (same day)
  - Follow-up 2: Day 3
  - Follow-up 3: Day 7
  - Follow-up 4: Day 14
  - Follow-up 5: Day 30
PUT /follow-ups/:id → Mark as sent/completed with via channel
```

## ✅ Quality Standards

### Code Quality
- **TypeScript:** Strict mode enabled
- **Linting:** ESLint configured
- **Formatting:** Prettier enforced
- **Type Coverage:** 100%

### Testing
- **Unit Tests:** Seeding logic and business rules
- **Integration Tests:** End-to-end workflows
- **Test Coverage:** >70% threshold (Jest)

### Security
- **Input Validation:** All endpoints validate required fields and types
- **SQL Injection:** Prevented via Prisma ORM
- **XSS:** React auto-escaping
- **Cascade Deletes:** Prevent orphaned records
- **Error Handling:** Sanitized error messages

See `SECURITY_AUDIT.md` for details.

### Performance
- **Database Indexes:** 7 strategic indexes on key fields
- **Pagination:** All list endpoints support page/limit
- **Query Optimization:** Field selection, batch queries, transactional writes
- **Expected Capacity:** 100-500 concurrent users, 1000+ req/s

See `PERFORMANCE_OPTIMIZATION.md` for details.

## 📚 Documentation

- **OPERATIONS_STANDARD.md** - How the team operates (daily standups, git workflow, code review process, quality gates)
- **01-Technical-Design-Doc.md** - Complete API specification with request/response examples
- **02-Sprint-Breakdown.md** - 4-week sprint plan with acceptance criteria
- **03-Definition-of-Done.md** - Quality checklist for each task
- **SECURITY_AUDIT.md** - Security analysis, gaps, and production checklist
- **PERFORMANCE_OPTIMIZATION.md** - Performance baseline, bottlenecks, scaling strategy
- **DEPLOYMENT.md** - Production deployment guide with multiple hosting options
- **LAUNCH_PLAYBOOK.md** - Launch day timeline, go/no-go criteria, success metrics

## 🚢 Deployment

### Development
```bash
npm run dev          # Backend on port 3001
cd frontend && npm run dev  # Frontend on port 3000
```

### Production
See `DEPLOYMENT.md` for:
- Railway deployment (easiest)
- VPS deployment (EC2/Linode)
- Docker containerization
- Nginx reverse proxy configuration
- SSL certificate setup
- Database backup procedures

### Launch Status
**Decision:** 🟢 GO FOR LAUNCH - May 26, 2026

All gates passing:
- ✅ Code quality
- ✅ Security (MVP-ready, auth Phase 2)
- ✅ Performance
- ✅ Infrastructure
- ✅ Features (100% complete)
- ✅ User acceptance

See `LAUNCH_PLAYBOOK.md` for launch timeline and success criteria.

## 🔄 Sprint Structure

**Week 1:** API Endpoints (6 tasks)
- Task 1.1: Crop & Variant APIs ✅
- Task 1.2: Orders API ✅
- Task 1.3: Seeding & Harvest APIs ✅
- Task 1.4: Customers & Follow-ups ✅
- Task 1.5: Inventory APIs ✅
- Task 1.6: Dashboard APIs ✅

**Week 2:** Frontend (7 pages)
- Dashboard, Crops, Customers, Orders, Inventory, Seeding, Follow-ups ✅

**Week 3:** Testing & Audit
- Integration tests ✅
- Security audit ✅
- Performance analysis ✅

**Week 4:** Deployment & Launch
- Deployment guide ✅
- Launch playbook ✅
- Go/no-go decision ✅

## 👥 Team Operations

See `OPERATIONS_STANDARD.md` for:
- Daily standup format
- Git workflow (main/develop/feature branches)
- Code review process
- Definition of Done checklist
- Deployment process
- Incident response procedures

## 🐛 Known Limitations (Phase 2)

- No multi-user authentication (internal use only for MVP)
- No email/SMS integration (manual follow-up management)
- No inventory auto-reorder (alerts only)
- No customer-facing portal (admin-only)
- Single database instance (no geographic redundancy)

## 🛣️ Roadmap

**Phase 1 (Current MVP):** ✅ Complete
- Core CRUD operations
- Basic workflow automation
- Real-time dashboard
- Admin-only interface

**Phase 2 (Q3 2026):** 📋 Planned
- JWT authentication + RBAC
- Email/WhatsApp integration
- Customer self-service portal
- Inventory auto-reorder integration

**Phase 3 (Q4 2026):** 🔮 Future
- Database replication for scaling
- Global CDN for assets
- Advanced analytics/reporting
- Mobile native apps

## 📞 Support

**Issues:** Create a GitHub issue with clear description and steps to reproduce
**Questions:** Contact development team
**Security:** Report security issues to security@belarro.farm

## 📄 License

Proprietary - Belarro Farm Management System

---

**Built with professional team standards. Ready for production. Let's grow.**
