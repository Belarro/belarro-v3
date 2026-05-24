# Belarro Admin — Sprint Breakdown

**Total Duration:** 4 weeks (May 27 - June 23, 2026)  
**Team:** 2 developers (1 backend, 1 frontend), 1 QA (you)  
**Goal:** Phase 1 MVP launched, 3-5 restaurants testing

---

## WEEK 1 (May 27 - May 31): Foundation & Backend Setup

### Goal
Backend foundation complete. Database schema live. Basic API endpoints working.

### Tasks (Backend Dev)

#### Task 1.1: Initialize Project & Database
**Owner:** Backend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] Node.js + Express + Prisma project initialized
- [ ] PostgreSQL database created
- [ ] Prisma schema written (all tables from spec)
- [ ] Database migrations working
- [ ] Seed script created (sample data for testing)

**Definition of Done:**
- `npm start` runs without errors
- Database connects successfully
- `npx prisma migrate dev` executes
- Sample crops/customers/orders in database

**Blockers:** None  
**Dependencies:** None

---

#### Task 1.2: Core API Endpoints (Crops, Variants)
**Owner:** Backend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] GET /crops (list + filter)
- [ ] GET /crops/{id} (detail)
- [ ] POST /crops (create)
- [ ] PUT /crops/{id} (update)
- [ ] DELETE /crops/{id} (with cascade)
- [ ] POST /variants (create)
- [ ] PUT /variants/{id} (update)
- [ ] DELETE /variants/{id} (with cascade)

**Definition of Done:**
- All endpoints tested with Postman/Thunder Client
- Error handling implemented (404, 400, 409)
- Response format matches spec
- Unit tests passing (>80% coverage)

**Blockers:** None  
**Dependencies:** Task 1.1

---

#### Task 1.3: Orders API Endpoints
**Owner:** Backend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] GET /orders (list + filter)
- [ ] GET /orders/{id} (detail)
- [ ] POST /orders (create with auto-calculation)
- [ ] PUT /orders/{id} (update)
- [ ] DELETE /orders/{id} (with cascade)

**Auto-Calculation Logic:**
- Seeding date based on crop schedule + today's date
- Harvest date = seeding date + growth days
- Delivery date = harvest date

**Definition of Done:**
- All endpoints tested
- Auto-calculations verified with test cases
- Order creation for 10-day crop + 28-day crop working correctly
- Unit tests passing

**Blockers:** None  
**Dependencies:** Task 1.1, 1.2

---

#### Task 1.4: Seeding & Harvest APIs
**Owner:** Backend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] GET /seeding/ready-today (show orders ready to seed)
- [ ] POST /seeding/batches (create with seed inventory deduction)
- [ ] GET /seeding/batches (list all)
- [ ] PUT /seeding/batches/{id} (update)
- [ ] DELETE /seeding/batches/{id} (reverse inventory)
- [ ] GET /harvest/ready-today (show batches ready)
- [ ] POST /harvest (log yield with auto-allocation)
- [ ] PUT /harvest/{id} (update)
- [ ] DELETE /harvest/{id} (reverse allocations)

**Critical Logic:**
- Seed inventory deduction (atomic transaction)
- Harvest allocation (IF actual >= ordered THEN samples, ELSE partial)
- Sample inventory update

**Definition of Done:**
- Seeding 3 trays deducts 180g from seed inventory
- Harvest allocates correctly in underproduction scenario
- Sample inventory updated after harvest
- All error cases handled (insufficient seeds, etc.)
- Unit tests passing

**Blockers:** None  
**Dependencies:** Task 1.1, 1.2, 1.3

---

#### Task 1.5: Customers & Follow-ups APIs
**Owner:** Backend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] GET /customers (list + filter)
- [ ] GET /customers/{id}
- [ ] POST /customers (create + auto-generate 5 follow-ups)
- [ ] PUT /customers/{id}
- [ ] DELETE /customers/{id} (cascade delete orders, visits, follow-ups)
- [ ] GET /follow-ups (list + filter)
- [ ] POST /follow-ups (manual create)
- [ ] PUT /follow-ups/{id} (mark sent, add notes)
- [ ] DELETE /follow-ups/{id}

**Auto-Generation Logic:**
- 1st follow-up: 0 days from first_contact_date
- 2nd: 2 days
- 3rd: 5 days
- 4th: 14 days
- 5th: 30 days

**Definition of Done:**
- Create customer → 5 follow-ups auto-generated
- Follow-up due dates calculated correctly
- Cascade delete working (customer delete = orders/visits/follow-ups gone)
- Unit tests passing

**Blockers:** None  
**Dependencies:** Task 1.1

---

#### Task 1.6: Inventory & Dashboard APIs
**Owner:** Backend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] GET /inventory/seeds (list with alerts)
- [ ] POST /inventory/seeds/{crop_id}/add (purchase seeds)
- [ ] GET /inventory/samples (list available)
- [ ] PUT /inventory/samples/{crop_id} (manual adjust)
- [ ] GET /dashboard/summary (KPIs)

**Dashboard KPIs:**
- Total trays grown (all-time)
- Total kg harvested (all-time)
- Active crops count + list
- Active customers count
- Tasks this week (seeding, harvest, follow-ups due)
- Seed alerts (low inventory)
- Recent deliveries (last 7 days)

**Definition of Done:**
- Seed inventory alerts triggered correctly (<threshold)
- Dashboard loads in <2 seconds
- KPI calculations accurate
- Unit tests passing

**Blockers:** None  
**Dependencies:** Task 1.1, 1.2, 1.3, 1.4, 1.5

---

### Week 1 Acceptance Criteria
- [ ] All 6 API task groups complete + tested
- [ ] Database has sample data
- [ ] Backend runs on localhost:3000
- [ ] All responses match spec format
- [ ] Error handling working (404, 400, 409, etc.)
- [ ] Unit tests passing (>80% coverage)
- [ ] Postman collection created + documented

### Week 1 Demo (Friday EOD)
**Attendees:** You (product), Backend Dev, Frontend Dev  
**Duration:** 30 min  
**What to Show:**
- Postman: create crop → create order → seed batch → harvest → delivery flow
- Database: verify data integrity
- Errors: demonstrate 404, 400 error handling
- Questions & feedback for Week 2

---

## WEEK 2 (June 3 - June 7): Frontend Build

### Goal
Frontend UI built. All 11 screens created. Connected to backend (integration).

### Tasks (Frontend Dev)

#### Task 2.1: Project Setup & Components
**Owner:** Frontend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] React + TypeScript + Tailwind project initialized
- [ ] Folder structure set up (components, pages, hooks, utils)
- [ ] Base layout component (sidebar, header, footer)
- [ ] Common UI components (button, input, form, modal, table, loading state)
- [ ] React Router configured (routes for all 11 screens)

**Definition of Done:**
- `npm start` runs without errors
- Routes working (navigate between screens)
- UI components match design spec (Tailwind + consistent styling)
- TypeScript strict mode on, no `any` types

**Blockers:** None  
**Dependencies:** None

---

#### Task 2.2: Dashboard Screen
**Owner:** Frontend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] Dashboard layout (grid of KPI cards)
- [ ] KPI cards: total trays, total kg, active crops, customers, tasks due
- [ ] Upcoming harvests (next 7 days) section
- [ ] Recent deliveries section
- [ ] Alerts section (seed low, packages low)
- [ ] API integration: GET /dashboard/summary

**Definition of Done:**
- Screen loads correctly
- KPI values update when data changes
- Responsive on mobile/tablet
- No console errors
- E2E test: dashboard loads in <2s

**Blockers:** None  
**Dependencies:** Task 2.1

---

#### Task 2.3: Crops Master Screen
**Owner:** Frontend Dev  
**Effort:** 1.5 days  
**Deliverables:**
- [ ] Crops list (table: name, photo, growth days, seeding schedule, status)
- [ ] Add crop button → modal form (all fields from spec)
- [ ] Edit crop → inline or modal form
- [ ] Delete crop button → confirmation dialog
- [ ] Quick price variant edit (expand crop row)
- [ ] Pagination (20 per page)
- [ ] Filters (active/paused/inactive)
- [ ] API integration: GET /crops, POST /crops, PUT /crops/{id}, DELETE /crops/{id}

**Definition of Done:**
- CRUD for crops working end-to-end
- Form validation (required fields, valid numbers)
- Photo upload working (or URL input)
- Error messages displayed (duplicate name, etc.)
- No console errors

**Blockers:** None  
**Dependencies:** Task 2.1

---

#### Task 2.4: Orders Screen
**Owner:** Frontend Dev  
**Effort:** 1.5 days  
**Deliverables:**
- [ ] Orders list (table: customer, crop, qty, variant, status, seeding date, harvest date)
- [ ] Add order button → form (select customer, crop, variant, qty)
- [ ] System shows: "Will seed on X, harvest on Y"
- [ ] Edit order → update qty, customer, variant, status
- [ ] Delete order button → confirmation
- [ ] Filters (status, customer, crop)
- [ ] API integration: GET /orders, POST /orders, PUT /orders/{id}, DELETE /orders/{id}

**Definition of Done:**
- Create order → system calculates seeding/harvest dates correctly
- Edit order → dates recalculate
- Delete order → cascade checked (no orphaned records)
- Form validation working
- No console errors

**Blockers:** Task 2.3 (need crops/customers loaded)  
**Dependencies:** Task 2.1

---

#### Task 2.5: Seeding & Harvest Screens
**Owner:** Frontend Dev  
**Effort:** 2 days  
**Deliverables:**

**Seeding Screen:**
- [ ] "Ready to seed TODAY" section
- [ ] List: crop name, order trays needed, sample trays recommendation, current seed inventory
- [ ] Input fields: "Add X trays of crop Y (order)" and "Add X trays of crop Y (sample)"
- [ ] "Confirm seeding" button
- [ ] System shows: "Will deduct Xg from inventory, Y trays remaining after"
- [ ] API: GET /seeding/ready-today, POST /seeding/batches

**Harvest Screen:**
- [ ] "Ready to harvest TODAY" section (Tuesday only)
- [ ] List: crop name, quantity trays, expected yield, orders waiting
- [ ] Input: "Harvested X grams"
- [ ] System shows: "Expected Xg, you got Yg. Will allocate Zg to orders, Wg to samples"
- [ ] API: GET /harvest/ready-today, POST /harvest

**Definition of Done:**
- Seeding: create batch → seed inventory deducted
- Harvest: record yield → orders marked "ready_harvest", samples added
- Both screens show alerts (underproduction, low seed)
- Forms validated (positive numbers, required fields)
- No console errors

**Blockers:** None  
**Dependencies:** Task 2.1, 2.3, 2.4

---

#### Task 2.6: Packing & Delivery Screen
**Owner:** Frontend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] "Ready to pack & deliver TODAY (Tuesday)" section
- [ ] List grouped by customer: orders, qty, items
- [ ] For each order: "Mark as packed", "Mark as delivered", or "Partial delivery"
- [ ] Partial delivery modal: which items missing, qty
- [ ] API: GET /fulfillment/ready-to-pack, PUT /fulfillment/{id}

**Definition of Done:**
- Mark packed → order status updates
- Mark delivered → order status updates, date logged
- Partial delivery → marked for invoice deduction
- No console errors

**Blockers:** None  
**Dependencies:** Task 2.1, 2.5

---

#### Task 2.7: Inventory Screens (Seeds, Samples, Packages)
**Owner:** Frontend Dev  
**Effort:** 1.5 days  
**Deliverables:**

**Seed Inventory:**
- [ ] Table: crop, current qty (grams), trays remaining, threshold, alert status
- [ ] "Add seeds" button → modal (qty purchased, purchase date)
- [ ] API: GET /inventory/seeds, POST /inventory/seeds/{crop_id}/add

**Sample Inventory:**
- [ ] Table: crop, available grams, last updated
- [ ] "Adjust" button → modal (manual adjust if needed)
- [ ] API: GET /inventory/samples, PUT /inventory/samples/{crop_id}

**Definition of Done:**
- Create purchase → inventory updated
- Alerts shown correctly (red if low)
- Tables load quickly
- No console errors

**Blockers:** None  
**Dependencies:** Task 2.1

---

#### Task 2.8: Customers & Follow-ups Screens
**Owner:** Frontend Dev  
**Effort:** 1.5 days  
**Deliverables:**

**Customers:**
- [ ] Table: name, status, last contact, next follow-up due, total orders
- [ ] Add customer button → form (name, email, whatsapp, address, net_days)
- [ ] Edit customer → update fields, status (prospect/active/paused/inactive)
- [ ] Delete customer → confirmation
- [ ] Click customer → detail view (visits, follow-ups, order history)
- [ ] API: GET /customers, POST /customers, PUT /customers/{id}, DELETE /customers/{id}

**Follow-ups:**
- [ ] "Follow-ups due this week" dashboard widget
- [ ] Follow-up detail: customer name, #1-5 status (pending/sent), sent date, method (WhatsApp/email/call/visit)
- [ ] "Mark as sent" button → populate sent_date, method, optional notes
- [ ] API: GET /follow-ups, PUT /follow-ups/{id}

**Definition of Done:**
- Create customer → 5 follow-ups auto-generated
- Mark follow-up as sent → status updates
- Customer list shows next follow-up due date
- No console errors

**Blockers:** None  
**Dependencies:** Task 2.1

---

#### Task 2.9: Monthly Invoice Summary Screen
**Owner:** Frontend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] Manual trigger: "Generate invoice summary for [month]"
- [ ] Table per customer: date, crop, qty, unit price, total, partial deduction
- [ ] Net 30 due date calculated
- [ ] "Export CSV" button
- [ ] Manual creation: you export, create invoice in accounting tool

**Definition of Done:**
- Generate summary for May 2026 → shows all deliveries
- CSV export readable (no corruption)
- Calculations correct (qty × price)
- Partial deliveries deducted
- No console errors

**Blockers:** None  
**Dependencies:** Task 2.1

---

### Week 2 Acceptance Criteria
- [ ] All 9 screens built + functional
- [ ] Frontend runs on localhost:3000
- [ ] All screens connected to backend (API calls working)
- [ ] Form validation working
- [ ] Error messages displayed
- [ ] Responsive design (desktop, tablet, mobile)
- [ ] No console errors
- [ ] TypeScript strict mode, no `any` types

### Week 2 Demo (Friday EOD)
**Attendees:** You, Backend Dev, Frontend Dev  
**Duration:** 1 hour  
**What to Show:**
- Create order → auto-calculates seeding/harvest dates
- Seed batch → inventory deducted
- Harvest → allocation works, samples added
- Customer created → 5 follow-ups auto-generated
- Dashboard KPIs update
- Questions & feedback for Week 3

---

## WEEK 3 (June 10 - June 14): Integration & Testing

### Goal
Full integration tested. All workflows working end-to-end. Security audit done. Performance verified.

### Tasks (Backend + Frontend + QA)

#### Task 3.1: End-to-End Testing (Full Workflows)
**Owner:** QA (you)  
**Effort:** 2 days  
**Test Cases:**

1. **Order Placement → Delivery Workflow**
   - Create customer (prospect)
   - 5 follow-ups auto-generated ✓
   - Place order for 10-day crop on Friday
   - System calculates: seed Friday, harvest Friday+10
   - On seeding Friday: create batch, verify seed inventory deducted
   - On harvest Friday: log yield, verify allocation, verify sample inventory updated
   - On delivery Tuesday: mark packed → delivered
   - Verify order_fulfillment record created
   - Verify customer can be billed (invoice summary shows delivery)

2. **Underproduction Scenario**
   - Place 3 orders for same crop (30g total needed)
   - Seed 1 tray (expected 25g)
   - Harvest: only got 15g (underproduction)
   - System alerts: "Cannot fully fulfill all orders"
   - Manually deliver 5g to each of 3 customers (partial)
   - Mark as "partial_delivery"
   - Verify invoice shows deduction for partial

3. **Sample Inventory Tracking**
   - Seed 1 order tray (expected 100g) + 1 sample tray
   - Harvest: 200g from both (120g for order, 80g for samples)
   - Verify sample inventory increased by 80g
   - Later: mark samples as used → manual adjust inventory

4. **Multi-Variety Orders**
   - Create orders for 3 different crops (10, 15, 28-day growth)
   - Verify seeding dates calculated correctly (Tuesday order = next Tuesday or Friday based on crop)
   - All harvest on same day (Tuesday)
   - Verify all packed together

5. **Customer Status Changes**
   - Customer starts as "prospect"
   - First delivery → change status to "active"
   - No more orders for 2 months → change to "paused"
   - Later: change to "inactive" (not a customer anymore)
   - Verify follow-ups don't show for inactive customers

6. **Follow-up Tracking**
   - New prospect added
   - 1st follow-up due today: mark as "sent via WhatsApp"
   - Dashboard shows "Prospect in follow-up #1"
   - 3 days later: 2nd follow-up due: mark as "sent via email"
   - Dashboard shows "Prospect in follow-up #2"
   - 30 days later: 5th follow-up due

**Definition of Done:**
- All 6 test cases pass (manually tested)
- Screenshots/video proof for critical paths
- No data corruption or orphaned records
- All orders complete successfully

**Blockers:** Tasks 2.1-2.9 complete  
**Dependencies:** All frontend + backend tasks

---

#### Task 3.2: Security Audit
**Owner:** Backend Dev  
**Effort:** 1 day  
**Checklist:**
- [ ] No SQL injection (all queries use Prisma, parameterized)
- [ ] No hardcoded API keys or secrets in code
- [ ] No sensitive data logged (passwords, tokens, customer data)
- [ ] CORS configured correctly (only localhost for dev, API domain for prod)
- [ ] HTTPS ready for production
- [ ] Input validation on all endpoints (numbers, strings, dates)
- [ ] No direct object references (use IDs, not indices)
- [ ] Error messages don't leak system info

**Definition of Done:**
- [ ] Security checklist passed
- [ ] Code review by you (quick scan for obvious issues)
- [ ] No vulnerabilities found

**Blockers:** None  
**Dependencies:** All backend tasks complete

---

#### Task 3.3: Performance Optimization
**Owner:** Backend Dev  
**Effort:** 1 day  
**Checklist:**
- [ ] Database indexes on frequently queried columns (customer_id, crop_id, status)
- [ ] No N+1 queries (use Prisma eager loading)
- [ ] Dashboard query optimized (<2s load time)
- [ ] API responses <500ms
- [ ] Frontend bundle optimized (code splitting, lazy loading)

**Performance Testing:**
- Simulate 100 crops, 50 customers, 500 orders
- Verify dashboard still loads <2s
- Verify list endpoints handle large datasets

**Definition of Done:**
- Performance targets met
- Database indexes created
- No N+1 queries in application code
- Load testing passed (100 orders, 50 customers)

**Blockers:** None  
**Dependencies:** All backend + frontend tasks complete

---

#### Task 3.4: Data Backup & Recovery
**Owner:** Backend Dev  
**Effort:** 0.5 days  
**Deliverables:**
- [ ] PostgreSQL backup script (daily automated backup to S3 or similar)
- [ ] Restore procedure tested (can restore from backup)
- [ ] Documentation for you (how to restore if needed)

**Definition of Done:**
- Backup script runs automatically daily
- Restore tested (backup → restore → verify data integrity)
- You know how to restore if production fails

**Blockers:** None  
**Dependencies:** Database tasks complete

---

### Week 3 Acceptance Criteria
- [ ] All 6 E2E test cases pass
- [ ] Security audit passed
- [ ] Performance targets met
- [ ] Backup script working
- [ ] Code quality high (no console errors, clean logs)
- [ ] Ready for Week 4 (deployment + launch)

### Week 3 Demo (Friday EOD)
**Attendees:** You, Backend Dev, Frontend Dev  
**Duration:** 1.5 hours  
**What to Show:**
- Walk through all 6 E2E test scenarios (live or video)
- Security audit results (checklist passed)
- Performance metrics (dashboard <2s, API <500ms)
- Questions & feedback for Week 4 (launch prep)

---

## WEEK 4 (June 17 - June 23): Deployment & Launch

### Goal
MVP deployed to production. 3-5 customers testing. Feedback collected. Iterate based on real usage.

### Tasks (Backend + Frontend + QA)

#### Task 4.1: Deployment Setup
**Owner:** Backend Dev  
**Effort:** 1 day  
**Deliverables:**
- [ ] Production environment set up (Railway backend, Vercel frontend)
- [ ] Environment variables configured (.env.production)
- [ ] Database migrations running on production
- [ ] Domain configured (api.belarro.farm or temporary)
- [ ] SSL/HTTPS enabled
- [ ] Monitoring configured (Sentry for errors, basic logs)

**Definition of Done:**
- Frontend running on production URL
- Backend API accessible from production domain
- HTTPS working
- Database connected and migrations passed

**Blockers:** None  
**Dependencies:** All code tasks complete

---

#### Task 4.2: Pre-Launch Checklist
**Owner:** QA (you)  
**Effort:** 0.5 days  
**Checklist:**
- [ ] Create 5 test customers (restaurants)
- [ ] Place 10 test orders (various crops, dates)
- [ ] Run full workflow in production (seed → harvest → delivery)
- [ ] Verify invoicing works
- [ ] Verify emails/notifications (if any)
- [ ] Check dashboard on production
- [ ] Test on mobile (responsive)
- [ ] Sign off "ready to launch"

**Definition of Done:**
- All checklist items done
- No errors in production logs
- You've tested all critical paths
- You're confident to show to customers

**Blockers:** Task 4.1 complete  
**Dependencies:** Deployment complete

---

#### Task 4.3: Customer Onboarding (Phase 1)
**Owner:** You  
**Effort:** 2 days  
**Plan:**
- Select 3-5 restaurants willing to test
- Quick walkthrough (30 min): place order, see seeding/harvest dates, delivery
- Daily check-in (5 min): any issues?
- Friday: collect NPS feedback (1-10 scale)

**Success Metrics:**
- NPS > 50 (likely to recommend)
- Zero critical bugs reported
- Customers can place orders without help
- Customers understand seeding/harvest cycle

**Definition of Done:**
- 3-5 customers actively using system
- Feedback collected
- NPS score tracked

**Blockers:** Task 4.2 complete  
**Dependencies:** Deployment complete

---

#### Task 4.4: Bug Fixes & Iteration
**Owner:** Backend + Frontend  
**Effort:** Variable (2-3 days buffer)  
**Plan:**
- Monitor production logs daily
- Fix any bugs reported by you or customers (prioritize critical)
- Iterate on UI/UX based on feedback (e.g., "orders screen confusing")
- Deploy hotfixes as needed

**Definition of Done:**
- Critical bugs fixed within 24 hours
- UI improvements deployed
- Production stable (99%+ uptime)

**Blockers:** None  
**Dependencies:** Deployment + customers testing

---

#### Task 4.5: Post-Launch Retrospective
**Owner:** You + Backend Dev + Frontend Dev  
**Effort:** 0.5 days  
**Agenda:**
- What went well?
- What was hard?
- What should we do differently next time?
- Customer feedback summary
- Phase 2 priorities (restaurant portal, SMS integration, etc.)

**Output:**
- Retro notes (shared doc)
- Phase 2 roadmap (preliminary)

**Definition of Done:**
- Retro documented
- Phase 2 priorities identified

**Blockers:** None  
**Dependencies:** Week 3-4 complete

---

### Week 4 Acceptance Criteria
- [ ] MVP deployed to production
- [ ] 3-5 customers actively using
- [ ] NPS > 50
- [ ] Zero critical bugs
- [ ] 99%+ uptime
- [ ] Monitoring configured
- [ ] Retro completed
- [ ] Phase 2 priorities documented

### Week 4 Demo (Friday EOD)
**Attendees:** You, customers (via demo), Backend Dev, Frontend Dev  
**Duration:** 30 min  
**What to Show:**
- Live production demo (place order, seed, harvest, deliver)
- Customer testimonials (1-2 restaurants)
- NPS results
- Lessons learned + Phase 2 roadmap
- Celebration (you shipped! 🎉)

---

## DEPENDENCIES & CRITICAL PATH

```
Week 1 Backend (1.1-1.6) → Week 2 Frontend (2.1-2.9) → Week 3 Integration (3.1-3.4) → Week 4 Deployment (4.1-4.5)
```

**Critical Path:**
1. Database schema (Task 1.1) — blocks all backend
2. Core APIs (Tasks 1.2-1.6) — backend foundation
3. Frontend build (Tasks 2.1-2.9) — integration testing
4. E2E testing (Task 3.1) — launch readiness
5. Deployment (Task 4.1) — production launch

**Parallel Work:**
- Week 1: Backend dev builds all APIs (1.1-1.6 can overlap)
- Week 2: Frontend dev builds screens (2.2-2.9 can overlap, 2.1 is blocking)
- Week 3-4: Both teams work on bugs, optimization, deployment

---

## RESOURCE ALLOCATION

| Week | Backend Dev | Frontend Dev | QA (You) | Notes |
|------|-------------|--------------|----------|-------|
| 1 | 5 days | 0 days (wait for API) | 0 days | Backend foundation |
| 2 | 0.5 days (support) | 5 days | 0 days (on demand) | Frontend build + integration |
| 3 | 2 days (bugs, perf) | 2 days (bugs, UI) | 2-3 days (testing) | Integration + security |
| 4 | 1 day (deploy) | 0.5 days (hotfix) | 3 days (launch, feedback) | Production + customers |

**Total Effort:**
- Backend Dev: ~13.5 days
- Frontend Dev: ~10.5 days
- QA (You): ~5-6 days

---

## RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| API takes longer than 1 week | Medium | High | Parallel: frontend builds with mock API |
| Database schema changes mid-project | Low | High | Lock schema by end of Day 1 |
| Performance issues discovered late | Medium | Medium | Load test Week 3, not Week 4 |
| Customer onboarding issues | Medium | Low | Prepare walkthrough script Week 3 |
| Production deployment fails | Low | Critical | Test deployment on staging Week 3 |

---

**End of Sprint Breakdown**
