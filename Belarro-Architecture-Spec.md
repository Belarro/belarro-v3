# BELARRO ADMIN — COMPLETE ARCHITECTURE SPEC

**Status:** Phase 1 (Farm Operations)  
**Launch Target:** 4 weeks  
**Team:** 1-2 devs, 1 QA (you)

---

## 1. DATABASE SCHEMA

### Core Tables

#### `crops`
The master data for each microgreen variety.

```
id (PK)
name_en (string)
name_de (string)
photo_url (string, nullable)
seeds_per_tray (number) — grams
yield_per_tray (number) — grams
total_growth_days (number)
seeding_schedule (enum: "TUESDAY" | "FRIDAY")
growth_stages (JSON array)
  [
    { stage: "germination", days: 3 },
    { stage: "growth", days: 15 },
    { stage: "harvest-ready", days: 2 }
  ]
created_at
updated_at
is_active (boolean)
```

#### `product_variants`
Sizes and prices for each crop.

```
id (PK)
crop_id (FK → crops)
size_name (string) — "Container 30g", "100g", "225g", "450g"
size_grams (number)
price_eur (number)
container_qty (number, nullable) — if "5 containers" option exists
created_at
updated_at
```

#### `seed_inventory`
Real-time seed stock.

```
id (PK)
crop_id (FK → crops)
quantity_grams (number)
reorder_threshold_trays (number) — default 20 trays = alert
last_purchase_date (date, nullable)
last_purchase_qty_grams (number, nullable)
created_at
updated_at
```

#### `package_inventory`
Container/package stock.

```
id (PK)
variant_id (FK → product_variants)
quantity_available (number)
reorder_threshold (number)
created_at
updated_at
```

#### `customers`
Restaurant clients.

```
id (PK)
name (string)
address (string)
city (string)
email (string)
whatsapp (string)
phone (string, nullable)
status (enum: "prospect" | "active" | "inactive")
net_days (number) — default 30
first_contact_date (date)
created_at
updated_at
```

#### `visits`
Sales visit log.

```
id (PK)
customer_id (FK → customers)
visit_date (date)
notes (text, nullable)
created_at
updated_at
```

#### `follow_ups`
Follow-up task schedule.

```
id (PK)
customer_id (FK → customers)
follow_up_number (number) — 1, 2, 3, 4, 5
follow_up_days (number) — offset from first contact
  1st: 0 (same day/next day)
  2nd: 2 days
  3rd: 5 days
  4th: 14 days
  5th: 30 days
status (enum: "pending" | "sent" | "completed")
sent_via (enum: "whatsapp" | "email" | "call" | "visit")
sent_date (date, nullable)
notes (text, nullable)
created_at
updated_at
```

#### `orders`
Customer orders (recurring cycle).

```
id (PK)
customer_id (FK → customers)
product_variant_id (FK → product_variants)
quantity (number) — qty of variant (5 containers, 1x225g, etc.)
order_date (date) — when order was placed
next_delivery_date (date) — calculated based on crop growth cycle
status (enum: "pending_seed" | "growing" | "ready_harvest" | "packed" | "delivered" | "partial_delivery" | "cancelled")
recurring (boolean) — if true, repeats every cycle
created_at
updated_at
```

#### `seeding_batches`
Trays seeded on a specific date.

```
id (PK)
crop_id (FK → crops)
seeding_date (date)
quantity_trays (number)
batch_type (enum: "order" | "sample")
expected_harvest_date (date) — calculated
created_at
updated_at
```

#### `harvest_records`
What was actually harvested.

```
id (PK)
seeding_batch_id (FK → seeding_batches)
harvest_date (date)
actual_yield_grams (number)
yield_used_for_orders_grams (number)
yield_available_samples_grams (number)
notes (text, nullable)
created_at
updated_at
```

#### `order_fulfillment`
Which orders were fulfilled from which harvest.

```
id (PK)
order_id (FK → orders)
harvest_record_id (FK → harvest_records)
allocated_grams (number)
packed_date (date)
delivery_date (date)
delivered (boolean) — true if received, false if partial/failed
delivery_notes (text, nullable)
created_at
updated_at
```

#### `sample_inventory`
Available samples by crop.

```
id (PK)
crop_id (FK → crops)
available_grams (number)
last_updated (date)
created_at
updated_at
```

---

## 2. CORE WORKFLOWS

### Workflow 1: Order Placement
1. Restaurant texts/emails order anytime (Monday-Sunday)
2. You enter order into system: Customer + Crop + Qty + Variant
3. System calculates:
   - Today's date
   - Crop's seeding schedule (TUESDAY or FRIDAY)
   - Growth days
   - Expected harvest date
4. Order status = "pending_seed"
5. On next seeding day (Tuesday or Friday), system flags this order for seeding

### Workflow 2: Seeding (Automatic)
1. Every Tuesday and Friday, system generates:
   - "Orders to seed TODAY (Tuesday)" — all orders needing 10+ days growth
   - "Orders to seed TODAY (Friday)" — all orders needing <10 days growth
2. You manually confirm: "Yes, I'm seeding X trays of broccoli, Y trays of pea, Z sample trays"
3. System creates `seeding_batches` record
4. System auto-deducts from `seed_inventory`
5. System sets expected_harvest_date = seeding_date + growth_days
6. Order status = "growing"

### Workflow 3: Harvest (Tuesday only)
1. Every Tuesday, system shows: "Ready to harvest TODAY"
   - All seeding batches with expected_harvest_date = TODAY
   - Grouped by crop
2. You enter actual harvest yield: "Broccoli: 650g actual (expected 600g)"
3. System creates `harvest_records`
4. System auto-calculates:
   - Yield for orders (based on pending orders needing this harvest)
   - Yield for samples (remainder)
5. System updates `sample_inventory`
6. System updates `order_fulfillment` (links harvest to orders)
7. Order status = "ready_harvest"

### Workflow 4: Packing & Delivery (Tuesday)
1. On delivery day (Tuesday), system shows: "Ready to pack and deliver TODAY"
   - All fulfilled orders (with allocated grams)
   - Grouped by customer
2. You pack orders, mark as "packed"
3. You deliver, mark as "delivered" (or "partial_delivery" if some items missing)
4. If partial: system flags for invoice deduction
5. Order status = "delivered"

### Workflow 5: Monthly Invoicing (1st of month)
1. System generates summary per customer:
   - All deliveries from previous month
   - Qty, date, price
   - Subtract any partial deliveries
   - Net 30 total due
2. You review and export to accounting system
3. Manual: you create actual invoice in separate tool

### Workflow 6: Follow-ups (Automatic)
1. When you add a new customer (prospect), system creates 5 follow-up tasks:
   - #1: Due same day (or next day)
   - #2: Due 2 days later
   - #3: Due 5 days later
   - #4: Due 14 days later
   - #5: Due 30 days later
2. Dashboard alerts: "Follow-ups due this week: 3"
3. You mark as "sent" with date and method (WhatsApp, email, call, visit)
4. System tracks which follow-up stage each prospect is in

---

## 3. API ENDPOINTS

### Crops
- `GET /crops` — list all crops
- `GET /crops/{id}` — crop detail + growth stages
- `POST /crops` — create new crop
- `PUT /crops/{id}` — update crop
- `POST /crops/{id}/variants` — add size variant

### Orders
- `POST /orders` — create order (customer + crop + qty)
- `GET /orders` — list all orders (filtered by status)
- `GET /orders?status=pending_seed` — orders ready to seed
- `GET /orders?status=growing` — orders currently growing
- `PUT /orders/{id}` — update order (qty, cancel, etc.)

### Seeding
- `GET /seeding/ready-today` — orders/trays ready to seed today
- `POST /seeding/create-batch` — log trays seeded (qty, crop, batch_type)
- `GET /seeding/batches` — list all seeding batches

### Harvest
- `GET /harvest/ready-today` — batches ready to harvest
- `POST /harvest/record` — log actual yield
- `GET /harvest/history` — past harvests

### Fulfillment
- `GET /fulfillment/ready-to-pack` — orders ready to pack for Tuesday delivery
- `POST /fulfillment/{id}/packed` — mark as packed
- `POST /fulfillment/{id}/delivered` — mark as delivered (full or partial)

### Inventory
- `GET /inventory/seeds` — seed stock + alerts
- `POST /inventory/seeds/{crop_id}/add` — add seeds (purchase)
- `GET /inventory/samples` — sample availability by crop
- `GET /inventory/packages` — package/container stock

### Customers
- `GET /customers` — list all customers
- `POST /customers` — create new customer (prospect)
- `PUT /customers/{id}` — update customer
- `GET /customers/{id}/orders` — customer's order history
- `GET /customers/{id}/visits` — customer's visit log

### Follow-ups
- `GET /follow-ups?status=pending` — follow-ups due soon
- `POST /follow-ups/{id}/mark-sent` — log that follow-up was sent
- `GET /customers/{id}/follow-ups` — all follow-ups for a customer

### Dashboard
- `GET /dashboard/summary` — KPIs for dashboard

---

## 4. UI SCREENS (What You See)

### Screen 1: Dashboard
**What you see at a glance:**
- Total trays grown (all-time)
- Total kg harvested (all-time)
- Active crops (growing right now)
- Customers (active count)
- Tasks due this week (follow-ups + seeding prep)
- Upcoming harvests (next 7 days)

### Screen 2: Crops Master
**List view:**
- Crop name (EN/DE)
- Photo
- Growth days
- Seeding schedule (Tuesday/Friday)
- Price variants (quick edit)
- Active/inactive toggle

**Add/Edit crop:**
- Name EN/DE
- Photo upload
- Seeds per tray
- Yield per tray
- Growth stages (table: stage name, days, notes)
- Seeding schedule (dropdown: Tuesday or Friday)
- Product variants (sizes + prices)

### Screen 3: Orders
**List view:**
- Customer name
- Crop + qty + variant
- Order date
- Status (pending_seed / growing / ready_harvest / packed / delivered)
- Next delivery date
- Recurring (yes/no)

**Add order:**
- Select customer
- Select crop
- Select variant (size)
- Qty
- Delivery frequency (recurring or one-time)
- System shows: "Will seed on [Friday], harvest on [Monday]"

### Screen 4: Seeding Calendar
**What needs to be seeded (Today or upcoming):**
- Grouped by seeding date (Tuesday / Friday)
- For each crop:
  - Qty of order trays needed
  - Qty of sample trays to add (you decide)
  - Seed inventory left after seeding
  - Alert if not enough seeds

**Actions:**
- "Add X trays of crop Y" (order trays)
- "Add X trays of crop Y" (sample trays)
- "Confirm seeding" — locks in, auto-deducts seed inventory

### Screen 5: Harvest Calendar
**What's ready to harvest (Tuesday):**
- Grouped by crop
- For each:
  - Expected yield
  - Qty trays
  - Orders waiting for this harvest
  - Associated orders

**Actions:**
- "Harvested X grams" (enter actual)
- System auto-allocates to orders
- Remainder goes to sample inventory

### Screen 6: Packing & Delivery (Tuesday)
**Ready to pack and deliver:**
- Grouped by customer
- For each customer:
  - All orders harvested today
  - Qty per item
  - Packed? Delivered?

**Actions:**
- "Mark as packed"
- "Mark as delivered" (or "partial — missing X")

### Screen 7: Seed Inventory
**Seed stock:**
- Crop name
- Current qty (grams)
- Trays remaining (qty ÷ seeds_per_tray)
- Reorder threshold
- Last purchase date
- Alert if below threshold

**Actions:**
- "Add seeds" (enter qty purchased + date)
- Set reorder threshold

### Screen 8: Sample Inventory
**Available samples:**
- Crop name
- Available grams
- Last updated

### Screen 9: Customers
**List view:**
- Name
- Status (prospect / active / inactive)
- Last contact
- Next follow-up due
- Total orders (all-time)

**Customer detail:**
- Name, address, contact info
- Visit log (dates + notes)
- Follow-up status (which stage they're in)
- Order history (all orders placed)
- Monthly total (for invoicing reference)

### Screen 10: Follow-ups
**Due this week:**
- Customer name
- Follow-up #1, #2, #3, #4, or #5
- Status (pending / sent)
- Method (WhatsApp / email / call / visit)
- Actions: "Mark as sent" + method + date

**Customer follow-up history:**
- Timeline of all 5 follow-ups
- Status of each
- Dates sent
- Notes

### Screen 11: Monthly Invoice Summary
**At start of each month:**
- Customer name
- All deliveries from previous month
- Qty + price per line
- Total
- Adjustments (partial deliveries)
- Net 30 due date
- Export button (to CSV for your accounting system)

---

## 5. BUSINESS LOGIC & AUTOMATION

### Auto-Calculation Rules

**Order → Seeding Date:**
```
IF crop.seeding_schedule = "TUESDAY":
  IF order_placed_date <= Monday:
    seeding_date = this coming Tuesday
  ELSE:
    seeding_date = next Tuesday
    
IF crop.seeding_schedule = "FRIDAY":
  IF order_placed_date <= Thursday:
    seeding_date = this coming Friday
  ELSE:
    seeding_date = next Friday
```

**Seeding → Harvest Date:**
```
harvest_date = seeding_date + crop.total_growth_days
```

**Seed Deduction (Automatic):**
```
WHEN seeding_batch created:
  seed_inventory[crop_id].quantity_grams -= (quantity_trays * crop.seeds_per_tray)
  IF seed_inventory[crop_id].quantity_grams < (reorder_threshold_trays * crop.seeds_per_tray):
    ALERT: "Order seeds for {crop_name}. Current: {X} trays remaining."
```

**Harvest Allocation (Automatic):**
```
WHEN harvest_record created:
  actual_yield = entered_yield
  orders_needing_this_harvest = [orders where harvest_record matches]
  
  total_ordered = SUM(orders.qty in grams)
  IF actual_yield >= total_ordered:
    yield_for_orders = total_ordered
    yield_for_samples = actual_yield - total_ordered
  ELSE:
    yield_for_orders = actual_yield
    yield_for_samples = 0
    ALERT: "Underproduction. Can only partially fulfill {X} orders."
    
  sample_inventory[crop_id].available_grams += yield_for_samples
```

**Package Deduction (Automatic):**
```
WHEN order_fulfillment marked as "packed":
  package_inventory[variant_id].quantity_available -= order.qty
```

**Follow-up Generation (Automatic):**
```
WHEN customer created or status = "prospect":
  CREATE 5 follow_up records:
    #1: due_date = today or tomorrow
    #2: due_date = today + 2 days
    #3: due_date = today + 5 days
    #4: due_date = today + 14 days
    #5: due_date = today + 30 days
```

### Alerts & Notifications

1. **Seed Running Low:** "Order {crop_name}. {X} trays remaining."
2. **Follow-ups Due This Week:** "{N} follow-ups pending. Click to see list."
3. **Seeding Day:** "Ready to seed {N} batches today (Tuesday/Friday)."
4. **Harvest Day:** "Ready to harvest {N} crops today (Tuesday)."
5. **Underproduction:** "Broccoli yielded 500g, but {X} orders need 600g. Partial fulfillment."
6. **Package Running Low:** "Order {variant_name} containers."

---

## 6. DASHBOARD KPIs

### Summary Cards (Top of Dashboard)
- **Total Trays Grown (All-Time):** {number}
- **Total kg Harvested (All-Time):** {number}
- **Active Customers:** {count}
- **Crops Currently Growing:** {list}
- **Upcoming Harvests (Next 7 Days):** {count}

### Tasks This Week
- Seeding due: {N} batches
- Harvests due: {N} batches
- Follow-ups due: {N} tasks

### Recent Deliveries (Last 7 Days)
- Customer | Crop | Qty | Date | Status

### Inventory Alerts
- Seeds running low: {list}
- Packages running low: {list}

---

## 7. TECH STACK

**Frontend:** React + TypeScript + Tailwind CSS  
**Backend:** Node.js + Express + Prisma ORM  
**Database:** PostgreSQL  
**Hosting:** Vercel (frontend) + Railway (backend)  
**Testing:** Jest (unit) + Playwright (E2E)

---

## 8. SCOPE: PHASE 1 vs PHASE 2

### Phase 1 (This Build)
✅ Crop master data + variants  
✅ Order management (recurring cycle)  
✅ Seeding automation + batch tracking  
✅ Harvest recording + auto-allocation  
✅ Packing & delivery tracking  
✅ Seed & package inventory  
✅ Sample inventory  
✅ Customer management  
✅ Follow-up automation + tracking  
✅ Monthly invoice summary (export for your accounting tool)  
✅ Dashboard with KPIs  

### Phase 2 (Later)
❌ Restaurant portal (customers can see/change orders)  
❌ SMS/WhatsApp integration (auto-send follow-ups)  
❌ Mushroom/other crops  
❌ Multi-user roles (farm manager, sales, etc.)  
❌ Advanced reporting (profit margin, efficiency, etc.)  

---

## 9. LAUNCH CHECKLIST

Before ship:
- [ ] All 11 screens built and working
- [ ] Seeding automation tested with real orders
- [ ] Harvest allocation tested with underproduction scenario
- [ ] Seed inventory deduction verified
- [ ] Sample inventory tracking verified
- [ ] Follow-ups auto-create + dashboard shows pending
- [ ] Invoice summary accurate (manual export tested)
- [ ] Dashboard KPIs accurate
- [ ] E2E test: full order cycle (place order → seed → harvest → pack → deliver)
- [ ] Security: no SQL injection, no data leaks between customers
- [ ] Performance: dashboard loads < 2s, seeding screen < 1s

---

**End of Spec**

This is what we build. No changes mid-sprint. You agree = we execute.

Thoughts?
