# Belarro Admin — Definition of Done

**Version:** 1.0  
**Created:** May 24, 2026  
**Owner:** Product (Ron), CTO (Backend Dev)

---

## Overview

"Done" means shipped to production. Not "code written." Not "tested locally." Shipped.

This document defines what "done" means for every artifact: features, bugfixes, documentation, infrastructure.

---

## 1. CODE TASK DEFINITION OF DONE

### Backend Feature (API Endpoint or Business Logic)

**Before you say "done":**

1. **Code Written**
   - [ ] Feature implemented according to spec
   - [ ] No console.log() statements (remove or replace with proper logging)
   - [ ] No TODO comments (fix or create explicit issue)
   - [ ] No temporary debugging code
   - [ ] Code follows project style (linting passes: `npm run lint`)
   - [ ] TypeScript strict mode: no `any` types, all types explicit

2. **Unit Tests**
   - [ ] Unit tests written for core logic
   - [ ] >80% line coverage for this feature
   - [ ] Tests pass locally: `npm test -- path/to/feature.test.ts`
   - [ ] Edge cases tested (empty input, null, boundary values)
   - [ ] Error cases tested (invalid input, exceptions)

3. **Database & Schema**
   - [ ] Database migrations created (if schema changes)
   - [ ] Migrations tested: `npx prisma migrate dev`
   - [ ] Rollback tested (can `npx prisma migrate resolve --rolled-back`)
   - [ ] Indexes created if needed (foreign keys, query columns)

4. **API Testing**
   - [ ] Endpoint tested with Postman/Thunder Client (all CRUD operations)
   - [ ] Success case (200/201) tested with valid input
   - [ ] Error cases tested (400, 404, 409 responses correct)
   - [ ] Request/response format matches spec exactly
   - [ ] Response includes all fields from spec

5. **Integration**
   - [ ] Feature integrates with existing code (no breaking changes)
   - [ ] Existing tests still pass: `npm test`
   - [ ] No new console errors

6. **Code Review**
   - [ ] You (product) or CTO reviewed the code
   - [ ] At least one approval from reviewer

7. **Documentation**
   - [ ] API endpoint documented in Technical Design Doc (if new endpoint)
   - [ ] Complex logic has inline comments (WHY, not WHAT)
   - [ ] Obvious logic needs NO comments

**When to merge:**
- All 7 criteria met
- Tests passing
- Code reviewed + approved
- Ready for staging/production

---

### Frontend Feature (Screen, Component, Form)

**Before you say "done":**

1. **Component Built**
   - [ ] Feature implemented according to spec
   - [ ] All CRUD operations working (create, read, update, delete)
   - [ ] Form validation working (required fields, correct types)
   - [ ] Error messages displayed (API errors, validation errors)
   - [ ] Loading states shown (spinners, disabled buttons while loading)
   - [ ] No console.log() or debugging code

2. **TypeScript**
   - [ ] TypeScript strict mode: no `any` types
   - [ ] All props typed
   - [ ] All state typed
   - [ ] No type errors: `npm run type-check`

3. **Styling**
   - [ ] Responsive design (desktop, tablet, mobile)
   - [ ] Tailwind classes used (not inline styles)
   - [ ] Dark mode friendly (if applicable)
   - [ ] Accessible (proper semantic HTML, labels on inputs, aria attributes if needed)

4. **Unit Tests (Components)**
   - [ ] Component renders without errors
   - [ ] User interactions work (click, type, submit)
   - [ ] Props update component correctly
   - [ ] Error states handled

5. **Integration Tests**
   - [ ] Form submits → API call made → response handled
   - [ ] List view → click item → detail view works
   - [ ] Edit form → submit → item updated → list updated
   - [ ] Delete button → confirmation → item deleted

6. **E2E Test (Manual)**
   - [ ] You manually tested the feature end-to-end
   - [ ] Tested in browser (Chrome, Firefox)
   - [ ] Network tab checked (no failed requests)
   - [ ] Data persists (refresh page, data still there)

7. **Accessibility**
   - [ ] Keyboard navigation works (Tab through form)
   - [ ] Screen reader friendly (labels, semantic HTML)
   - [ ] Color contrast sufficient (WCAG AA)

8. **Code Review**
   - [ ] Code reviewed by backend dev or CTO
   - [ ] At least one approval

9. **Linting**
   - [ ] ESLint passes: `npm run lint`
   - [ ] Prettier formatted: `npm run format`

**When to merge:**
- All 9 criteria met
- Manual E2E test passed
- Code reviewed + approved
- Ready for staging

---

## 2. BUG FIX DEFINITION OF DONE

**Before you say "done":**

1. **Bug Reproduced**
   - [ ] Bug reproduced locally (can see it happening)
   - [ ] Root cause identified
   - [ ] Severity assessed (critical, major, minor)

2. **Fix Implemented**
   - [ ] Code changed to fix the bug
   - [ ] Fix is minimal (don't refactor while fixing)
   - [ ] Related code reviewed (could same bug exist elsewhere?)

3. **Tests**
   - [ ] Unit test added (prevents regression)
   - [ ] Test fails before fix, passes after fix
   - [ ] All existing tests still pass

4. **Verified Fixed**
   - [ ] Bug no longer reproduces locally
   - [ ] Manual test done (you confirm it's fixed)
   - [ ] Related features tested (ensure no side effects)

5. **Code Review**
   - [ ] Code reviewed
   - [ ] Approved by someone who didn't write it

**Critical Bugs (<24 hours to fix + deploy):**
- Customer impact
- Data loss risk
- Security issue

**Major Bugs (<1 week):**
- Broken workflow
- Confusing UI

**Minor Bugs (<next release):**
- Cosmetic
- Non-blocking

---

## 3. TEST DEFINITION OF DONE

### Unit Tests

**What counts as done:**
- [ ] Test file exists: `src/features/crops.test.ts`
- [ ] Test cases written (positive + negative cases)
- [ ] Tests pass: `npm test`
- [ ] Coverage >80% for this module: `npm test -- --coverage`
- [ ] Edge cases tested (empty, null, boundary, error)

**Example:**
```typescript
describe("seedingDateCalculation", () => {
  it("returns Friday if crop.seeding_schedule=FRIDAY and today < Friday", () => {
    // Arrange
    const crop = { seeding_schedule: "FRIDAY", growth_days: 10 };
    const today = "2026-05-21"; // Wednesday
    
    // Act
    const result = seedingDateCalculation(crop, today);
    
    // Assert
    expect(result).toBe("2026-05-23"); // Friday
  });

  it("returns next Friday if crop.seeding_schedule=FRIDAY and today >= Friday", () => {
    const crop = { seeding_schedule: "FRIDAY", growth_days: 10 };
    const today = "2026-05-24"; // Saturday
    const result = seedingDateCalculation(crop, today);
    expect(result).toBe("2026-05-30"); // Next Friday
  });

  it("throws error if invalid seeding_schedule", () => {
    const crop = { seeding_schedule: "INVALID" };
    expect(() => seedingDateCalculation(crop, "2026-05-24")).toThrow();
  });
});
```

---

### Integration Tests

**What counts as done:**
- [ ] Test file exists: `tests/integration/orders.test.ts`
- [ ] Tests use real database (or test database)
- [ ] Setup/teardown cleans up data
- [ ] Tests pass: `npm run test:integration`
- [ ] API endpoint + business logic tested together

**Example:**
```typescript
describe("POST /orders", () => {
  beforeEach(async () => {
    await seedTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it("creates order and calculates seeding date correctly", async () => {
    // Arrange
    const customer = await createTestCustomer();
    const variant = await createTestVariant({ crop_id: "crop-friday" });
    const today = "2026-05-24"; // Friday
    
    // Act
    const response = await POST("/orders", {
      customer_id: customer.id,
      product_variant_id: variant.id,
      quantity: 5,
      order_date: today
    });
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.data.expected_seeding_date).toBe("2026-05-24"); // Today (Friday)
    
    // Verify in database
    const order = await Order.findById(response.data.id);
    expect(order.status).toBe("pending_seed");
  });

  it("fails if customer does not exist", async () => {
    const response = await POST("/orders", {
      customer_id: "nonexistent",
      product_variant_id: "var-001",
      quantity: 5
    });
    expect(response.status).toBe(404);
  });
});
```

---

### E2E Tests (Manual + Playwright)

**What counts as done (Manual):**
- [ ] You manually tested the feature in browser
- [ ] Full workflow tested (not just one step)
- [ ] Data persists (refresh page)
- [ ] No JavaScript errors (console clean)
- [ ] Mobile tested (if applicable)
- [ ] Screenshots/video captured (proof)

**Example (Manual):**
```
Test: Order → Seed → Harvest → Deliver Workflow

1. Create customer "Test Restaurant"
   → Expected: Customer created, status = "prospect"
   → Actual: ✓ Verified in customer list

2. Create order: broccoli, 5 containers
   → Expected: Status = "pending_seed", seeding_date = next Friday
   → Actual: ✓ Dashboard shows "Ready to seed 1 batch"

3. Seed batch on Friday
   → Expected: Seed inventory deducted, order status = "growing"
   → Actual: ✓ Seed inventory: 940g → 880g

4. Harvest on Friday + 10 days
   → Expected: Order status = "ready_harvest", sample inventory updated
   → Actual: ✓ Packing screen shows "Ready to pack: Test Restaurant"

5. Mark as delivered
   → Expected: Order status = "delivered", date logged
   → Actual: ✓ Customer list shows last delivery date

RESULT: PASS ✓
```

**What counts as done (Automated with Playwright):**
- [ ] E2E test file exists: `e2e/order-workflow.spec.ts`
- [ ] Test uses real app (localhost:3000)
- [ ] Tests pass: `npm run test:e2e`
- [ ] Critical workflows covered (order → seed → harvest → deliver)

**Example (Playwright):**
```typescript
test("Full order workflow: place → seed → harvest → deliver", async ({ page }) => {
  // Navigate to app
  await page.goto("http://localhost:3000");
  
  // Create customer
  await page.click("button:has-text('Add Customer')");
  await page.fill("input[name='name']", "Test Restaurant");
  await page.fill("input[name='email']", "test@restaurant.de");
  await page.click("button:has-text('Create')");
  
  // Verify customer created
  await expect(page.locator("text=Test Restaurant")).toBeVisible();
  
  // Create order
  await page.click("button:has-text('Add Order')");
  await page.selectOption("select[name='customer_id']", "Test Restaurant");
  await page.selectOption("select[name='crop_id']", "Broccoli");
  await page.fill("input[name='quantity']", "5");
  await page.click("button:has-text('Create')");
  
  // Verify seeding date calculated
  await expect(page.locator("text=Will seed on")).toBeVisible();
  
  // Seed batch
  await page.goto("http://localhost:3000/seeding");
  await page.click("button:has-text('Confirm seeding')");
  
  // Verify inventory deducted
  await page.goto("http://localhost:3000/inventory/seeds");
  const inventory = await page.locator("text=Broccoli").textContent();
  expect(inventory).toContain("880g");
  
  // And so on...
});
```

---

## 4. DOCUMENTATION DEFINITION OF DONE

### Technical Documentation

**What counts as done:**
- [ ] Document created/updated
- [ ] Accurate (matches code)
- [ ] Complete (all sections filled)
- [ ] Examples provided (if applicable)
- [ ] Reviewed by CTO

**Examples:**
- API endpoint documented in Technical Design Doc
- Database schema documented
- Error codes documented
- Setup instructions documented

---

### User Documentation

**What counts as done:**
- [ ] User guide written (how to use feature)
- [ ] Screenshots or video provided
- [ ] Step-by-step instructions clear
- [ ] Common issues/troubleshooting included

**Example:**
```
# How to Create an Order

1. Go to **Orders** page
2. Click **Add Order** button
3. Select **Customer** from dropdown
4. Select **Crop** from dropdown
5. Enter **Quantity** (number of containers)
6. System shows: "Will seed on Friday, harvest on Friday"
7. Click **Create Order**
8. Order appears in list with status "pending_seed"

**Next Step:** On seeding day, go to **Seeding** screen and confirm batch.
```

---

## 5. DEPLOYMENT DEFINITION OF DONE

### Staging Deployment

**Before deploying to production:**
- [ ] All code changes merged to main branch
- [ ] Tests passing on main: `npm test`
- [ ] Build successful: `npm run build`
- [ ] Staging deployment successful (Railway/Vercel staging env)
- [ ] You manually tested on staging (critical workflows)
- [ ] No errors in staging logs (Sentry)
- [ ] Database migrations successful on staging

---

### Production Deployment

**Before shipping to customers:**
- [ ] Staging deployment successful + tested
- [ ] Backup taken (database backup before deploy)
- [ ] Rollback plan documented (how to revert if needed)
- [ ] Monitoring configured (error tracking, logs)
- [ ] Deployment script runs successfully
- [ ] You manually tested on production (critical workflows)
- [ ] Health check passing (API responds, database connects)
- [ ] You sign off "ready for customers"

---

## 6. QUALITY GATES

### Code Quality (Must Pass Before Merge)

| Gate | Tool | Threshold | Command |
|------|------|-----------|---------|
| Linting | ESLint | 0 errors | `npm run lint` |
| Type Checking | TypeScript | 0 errors | `npm run type-check` |
| Unit Tests | Jest | >80% coverage, all pass | `npm test -- --coverage` |
| Formatting | Prettier | 0 diff | `npm run format` |

### Integration Quality (Must Pass Before Staging)

| Gate | Method | Threshold | Notes |
|------|--------|-----------|-------|
| Integration Tests | Jest | All pass | `npm run test:integration` |
| Security Scan | npm audit | 0 critical/high | `npm audit` |
| E2E Tests | Playwright | All pass | `npm run test:e2e` |

### Production Quality (Must Pass Before Launch)

| Gate | Method | Threshold | Notes |
|------|--------|-----------|-------|
| Load Test | k6 | <500ms P95 latency | Simulate 100 concurrent users |
| Security Audit | Manual + tools | 0 critical issues | Check auth, injection, secrets |
| Uptime Monitor | Production | 99%+ uptime | First week of production |

---

## 7. CHECKLIST FOR MERGING (Developer)

Before you request code review:

```
[ ] Feature/bugfix complete and working locally
[ ] Tests written and passing
[ ] Linting: `npm run lint` (0 errors)
[ ] Type check: `npm run type-check` (0 errors)
[ ] Format: `npm run format` (no changes needed)
[ ] Git: committed with clear message
[ ] Code review requested from [person]
[ ] Documentation updated (if applicable)
```

---

## 8. CHECKLIST FOR APPROVING (Reviewer)

Before you approve a merge:

```
[ ] Code solves the stated problem
[ ] No breaking changes to existing code
[ ] Tests are comprehensive (happy path + errors)
[ ] No console.log() or debugging code
[ ] TypeScript strict: no `any` types
[ ] Error handling appropriate
[ ] Performance acceptable (no N+1 queries, etc.)
[ ] Documentation clear
[ ] Approved: by signing off
```

---

## 9. CHECKLIST FOR DEPLOYING TO STAGING (CTO)

Before deploying:

```
[ ] All PRs merged and tests passing on main
[ ] Build successful: `npm run build`
[ ] No security vulnerabilities: `npm audit`
[ ] Database migrations tested locally
[ ] Environment variables set for staging
[ ] Backup taken (if production data used)
[ ] Deploy command: `npm run deploy:staging`
[ ] Health check passing (API responds)
[ ] Logs clean (no errors)
[ ] Approved for staging
```

---

## 10. CHECKLIST FOR DEPLOYING TO PRODUCTION (CTO + You)

Before shipping:

```
[ ] Staging tested and working
[ ] All manual E2E tests passed on staging
[ ] Critical workflows verified by you
[ ] Database migrations tested on staging
[ ] Backup taken (production data)
[ ] Rollback plan documented
[ ] Monitoring configured (Sentry, logs, health checks)
[ ] Deployment scheduled (non-peak hours if possible)
[ ] Team notified (in case issues arise)
[ ] Deploy command: `npm run deploy:production`
[ ] Post-deploy health check passed
[ ] You monitor first hour (no errors in logs)
[ ] Approved for production
```

---

## 11. DEFINITION OF "DONE DONE"

**"Done Done" = Deployed to Production + User Can Use It**

Not done:
- ❌ Code written (not deployed)
- ❌ Tests passing locally (not deployed)
- ❌ Deployed to staging (not in production)
- ❌ In production but not tested with real customers

Done Done:
- ✅ Code written + tested
- ✅ Merged to main branch
- ✅ Tested on staging
- ✅ Deployed to production
- ✅ You manually tested on production
- ✅ Customers are using it (or ready to use it)
- ✅ Monitoring shows no errors
- ✅ You signed off ✓

---

## 12. ESCALATION PATHS

**If something blocks "done":**

### Bug Found During Testing
1. Open GitHub issue (or Jira, whatever you use)
2. Assign to developer
3. Mark as blocker (if critical)
4. Don't merge until fixed

### Performance Issues
1. Profile the code (identify bottleneck)
2. Recommend fix (add index, optimize query, etc.)
3. Developer implements
4. Test again
5. If still slow, escalate to CTO

### Merge Conflicts
1. Developer resolves conflicts
2. Re-run tests after resolving
3. Code review again
4. Merge

### Security Findings
1. Open security issue (private)
2. Assign to CTO
3. Fix before production deployment
4. Security review + approval before shipping

---

## 13. METRICS TO TRACK

**Per Task:**
- Time spent (estimate vs. actual)
- Tests written (count)
- Test coverage (%)
- Code review feedback (count)
- Revisions needed (count)

**Per Sprint:**
- Tasks completed on time (%)
- Average review feedback count
- Test coverage trend (%)
- Bugs found post-deployment (count)

**Overall:**
- Velocity (tasks/sprint)
- Quality (bugs per 1000 LOC)
- Deployment frequency (deploys/week)
- Lead time (commit → production, days)
- Uptime (99%+ target)

---

**End of Definition of Done**

This is your quality bar. Don't ship without hitting it.
