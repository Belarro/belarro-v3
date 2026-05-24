# Belarro v2 → v3 Feature Port Plan

## Overview
Belarro v2 (existing production system) has significantly more features than v3 (MVP). This document identifies what to port.

---

## Database Schema Enhancements

### NEW ENTITIES IN V2
1. **Varieties** (currently "Crops" in v3)
   - Multi-size pricing: 100g, 225g, 450g, container
   - Price points: restaurant, retail, wholesale
   - Category field
   - Grams per tray calculation

2. **Restaurants** (v2's "customers")
   - Chef contact info (name, position, email, phone)
   - Full address structure (address, city, country)
   - Standing orders (recurring orders, not one-offs)

3. **Prospects** (sales pipeline)
   - Sample sent tracking
   - Follow-up phase tracking (0-5)
   - Status enum: prospect → active → converted
   - Notes field

4. **Sales Visits** (sales intelligence)
   - Track when sales team visits prospects
   - Link to prospects
   - Outcomes and notes

5. **Standing Orders** (recurring orders)
   - Unlike v3 one-off orders
   - Linked to restaurants with auto-recurring items
   - Order items with size variants (100g, 225g, 450g, container)

6. **Invoices**
   - Monthly invoicing by restaurant
   - Status: draft → sent → paid
   - VAT calculation

7. **Seed Usage Log**
   - Tracks seed consumption per variety
   - Links to seeding batches
   - Quantity in kg (not just grams)

8. **Seed Inventory**
   - Per-variety inventory
   - Supplier tracking
   - Cost per kg
   - Low stock threshold alerts

9. **Messages** (team communication)
   - Chef ↔ Admin messages
   - Read tracking
   - Associated with orders

---

## NEW MODULES & PAGES IN V2

### 1. **Sales Module**
- Prospect management (CRM-style)
- Sales visit tracking
- Follow-up scheduling
- Conversion funnel

### 2. **Chef Portal**
- View today's orders
- Request modifications
- Send messages to admin
- Mark items ready

### 3. **Admin Dashboard** (more granular than v3)
- **Analytics Page**
  - Trays this week / month / YTD
  - Kilos harvested
  - Active customers / conversion rate
  - Top varieties by sales
  - Monthly revenue

- **Orders Page**
  - Standing orders management
  - Order item CRUD
  - Bulk order operations

- **Prospects Page**
  - Full CRM pipeline
  - Follow-up phase tracking
  - Sample send tracking
  - Conversion funnel metrics

- **Sales Visits Page**
  - Log sales visits
  - Outcome tracking
  - Prospect conversion

- **Prices Page**
  - Manage pricing for all size tiers
  - Restaurant vs retail vs wholesale
  - Bulk pricing updates

- **Farm Tasks Page**
  - Daily seeding schedule
  - Harvest schedule
  - Production checklist
  - Task assignments

- **Production Page**
  - Production schedule calculation
  - Load balancing
  - Capacity planning
  - Auto-schedule seed → harvest → delivery

- **Seeds Page**
  - Inventory management
  - Supplier management
  - Reorder alerts
  - Cost tracking

---

## NEW API ENDPOINTS IN V2

### Invoicing
- `POST /api/invoices` - Generate monthly invoice
- `GET /api/invoices` - List invoices by restaurant/month
- `PATCH /api/invoices/{id}` - Mark sent/paid

### Prospects & Sales
- `GET /api/prospects` - List all prospects
- `POST /api/prospects` - Add new prospect
- `PATCH /api/prospects/{id}` - Update prospect status/phase
- `GET /api/sales-visits` - List visits
- `POST /api/sales-visits` - Log sales visit

### Chef Portal
- `GET /api/chef/order` - Get today's order for kitchen
- `POST /api/chef/order/change` - Request modification
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

### Production Scheduling
- `GET /api/production/schedule` - Auto-calculated production schedule
- `GET /api/production` - Production batch status
- `POST /api/production-batches` - Create batch with auto-calculation

### Analytics
- `GET /api/analytics` - Weekly/monthly/YTD stats

### Farm Tasks
- `GET /api/farm-tasks/today` - Daily seeding/harvest schedule
- `GET /api/farm-tasks/{id}` - Task details
- `PATCH /api/farm-tasks/{id}` - Mark task complete

---

## KEY FEATURE DIFFERENCES

### V3 (Current MVP)
- Single generic "Crop" with one seeding schedule
- Single "Customer" with 5 auto-follow-ups
- One-off orders
- Basic dashboard KPIs
- No invoicing
- No sales pipeline
- No chef interface
- No production scheduling

### V2 (Existing)
- Multiple "Varieties" with tiered pricing (100g/225g/450g/container)
- "Restaurants" with chef contact info
- Recurring "Standing Orders" with order items
- Comprehensive "Prospects" CRM with sales visits
- **Monthly invoicing with VAT**
- **Chef portal** for kitchen operations
- **Sales team dashboard** with CRM
- **Auto-production scheduling** (load balancing)
- **Seed supplier tracking** with cost management
- **Team messaging** (admin ↔ chef)
- Advanced analytics (trays, kilos, conversion rates, YTD metrics)
- Farm tasks workflow with daily schedule

---

## PRIORITY PORTS (Business Impact)

### TIER 1: Revenue & Billing (Highest Priority)
1. **Invoicing System**
   - Monthly invoicing endpoint
   - VAT calculation
   - Payment tracking
   - Billing history

2. **Standing Orders**
   - Recurring orders (not one-off)
   - Order items with size variants
   - Pricing tiers

3. **Multi-Size Pricing**
   - 100g, 225g, 450g, container sizes
   - Different pricing: restaurant vs retail vs wholesale

### TIER 2: Operations (High Priority)
4. **Production Scheduling**
   - Auto-calculate seed → harvest → delivery dates
   - Load balancing across varieties
   - Capacity planning

5. **Seed Inventory**
   - Per-variety tracking
   - Supplier management
   - Cost tracking
   - Reorder alerts

6. **Chef Portal**
   - Today's orders view
   - Modification requests
   - Ready/complete tracking

### TIER 3: Sales & CRM (Medium Priority)
7. **Prospects Module**
   - Full CRM pipeline
   - Follow-up phase tracking
   - Sales visit logging
   - Conversion funnel

8. **Analytics**
   - Weekly/monthly/YTD metrics
   - Top varieties
   - Conversion rates

### TIER 4: Nice-to-Have (Lower Priority)
9. Farm Tasks workflow
10. Team messaging
11. Sales team dashboard

---

## IMPLEMENTATION STRATEGY

### Phase 1: Database (1-2 days)
- Extend Prisma schema with v2 entities
- Create migrations for new tables
- Set up relationships

### Phase 2: Invoicing (1 day) — CRITICAL
- Invoice generation endpoint
- Monthly aggregation
- VAT calculation
- Payment tracking

### Phase 3: Standing Orders (1 day) — CRITICAL
- Replace one-off orders with recurring orders
- Order items management
- Size variant pricing

### Phase 4: Production Scheduling (1 day)
- Auto-schedule calculation
- Load balancing
- Capacity planning

### Phase 5: Chef Portal (0.5 days)
- New /chef route
- Today's orders view
- Modification request flow

### Phase 6: Prospects/Sales (1 day)
- CRM module
- Sales visit tracking
- Conversion funnel

### Phase 7: Analytics (0.5 days)
- Aggregate stats endpoint
- Weekly/monthly/YTD calculations

---

## Migration Notes

1. **Crops → Varieties**: Rename + add sizing/pricing
2. **Customers → Restaurants**: Add chef info, standing orders
3. **Orders → Standing Orders**: Change model, add recurring logic
4. **Customers.follow_ups → Prospects system**: New CRM workflow
5. Keep transactional safety and cascade deletes

---

## Risk Assessment

**Low Risk:**
- Invoicing (new endpoint, doesn't break existing)
- Analytics (new endpoint)
- Prospects (new module)

**Medium Risk:**
- Standing Orders (changes order model)
- Chef Portal (new interface)

**High Risk:**
- Production Scheduling (auto-calculation logic)

---

## Success Criteria

- [ ] All v2 entities in v3 database
- [ ] Invoicing working end-to-end
- [ ] Standing orders recurring properly
- [ ] Chef portal functional
- [ ] Production schedule auto-calculating
- [ ] Backward compatibility with existing v3 data
- [ ] All tests passing
