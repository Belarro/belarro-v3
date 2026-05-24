# Belarro v3 End-to-End Test Plan

**Status:** Ready for Manual Testing  
**Date:** 2026-05-24  
**Tester:** [Your Name]

---

## Test Environment Setup

### Prerequisites
- Backend running: `http://localhost:3001/api`
- Frontend running: `http://localhost:3000`
- Database populated with test data
- Browser: Chrome/Firefox/Safari (latest)

---

## Golden Path Tests

### Test 1: Create Invoice for Customer
**Objective:** Generate monthly invoice from customer orders  
**Expected Result:** Invoice created with correct total and VAT

#### Steps:
1. Open http://localhost:3000/invoices
2. Click "+ Generate Invoice" button
3. Enter Customer ID: `cmpj4zsxo00033jsek3rfc4sp` (Restaurant Berlin)
4. Enter Invoice Month: `2026-05`
5. Click "Generate"
6. **Verify:** 
   - Success message appears
   - Invoice shows in list with status "draft"
   - Total amount is displayed
   - VAT (19%) calculated correctly

#### Manual Verification:
```bash
# Check invoice via API
curl -s "http://localhost:3001/api/invoices" | jq '.data[] | {month: .invoice_month, total: .total_amount_eur, vat: .vat_amount_eur}'
```

Expected output: 
```json
{
  "month": "2026-05",
  "total": 290.00,
  "vat": 55.10
}
```

---

### Test 2: Create Standing Order
**Objective:** Set up recurring order template  
**Expected Result:** Standing order created with active status

#### Steps:
1. Open http://localhost:3000/standing-orders
2. Click "+ New Standing Order" button
3. Enter Customer ID: `cmpj4zsxo00033jsek3rfc4sp`
4. Enter Notes: "Weekly Tuesday delivery for kitchen"
5. Select Status: "active"
6. Click "Create"
7. **Verify:**
   - Success message appears
   - Standing order shows in list
   - Status badge shows "Active" (green)
   - Customer name displays correctly

#### Manual Verification:
```bash
# Check standing order via API
curl -s "http://localhost:3001/api/standing-orders" | jq '.data[] | {id: .id, customer: .customer.name, status: .status}'
```

---

### Test 3: Update Invoice Status
**Objective:** Transition invoice from draft → sent → paid  
**Expected Result:** Status changes reflect in UI

#### Steps:
1. On Invoices page, find invoice created in Test 1
2. Click on invoice (if detail view exists)
3. Change status from "draft" to "sent"
4. **Verify:** Badge color changes to blue
5. Change status to "paid"
6. **Verify:** Badge color changes to green, all statuses have been transitioned

#### Manual Verification:
```bash
# Get invoice ID
INV_ID=$(curl -s "http://localhost:3001/api/invoices" | jq -r '.data[0].id')

# Update to sent
curl -s -X PATCH "http://localhost:3001/api/invoices/$INV_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"sent","sent_at":"2026-05-24T10:00:00Z"}' | jq '.data.status'

# Update to paid
curl -s -X PATCH "http://localhost:3001/api/invoices/$INV_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"paid","paid_at":"2026-05-24T14:00:00Z"}' | jq '.data.status'
```

---

### Test 4: Update Standing Order Status
**Objective:** Pause/resume recurring order  
**Expected Result:** Status changes applied

#### Steps:
1. On Standing Orders page, find standing order from Test 2
2. If available in UI, change status to "paused"
3. **Verify:** Status badge changes to yellow
4. Change back to "active"
5. **Verify:** Status badge returns to green

#### Manual Verification:
```bash
# Get standing order ID
SO_ID=$(curl -s "http://localhost:3001/api/standing-orders" | jq -r '.data[0].id')

# Pause
curl -s -X PATCH "http://localhost:3001/api/standing-orders/$SO_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"paused"}' | jq '.data.status'

# Resume
curl -s -X PATCH "http://localhost:3001/api/standing-orders/$SO_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}' | jq '.data.status'
```

---

## Edge Case Tests

### Test 5: Invalid Invoice Month (Negative Case)
**Objective:** Verify validation prevents invalid dates  
**Expected Result:** Error response with validation message

#### Steps:
1. Open http://localhost:3000/invoices
2. Click "+ Generate Invoice"
3. Enter Customer ID: `cmpj4zsxo00033jsek3rfc4sp`
4. Enter Invalid Month: `2026-13` (invalid month)
5. Click "Generate"
6. **Verify:** Error message appears: "Invalid month. Must be between 01 and 12"

#### Manual Verification:
```bash
curl -s -X POST "http://localhost:3001/api/invoices" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"cmpj4zsxo00033jsek3rfc4sp","invoice_month":"2026-13"}' | jq '.error, .message'
```

Expected: `"VALIDATION_ERROR"` and `"Invalid month"`

---

### Test 6: Duplicate Invoice (Negative Case)
**Objective:** Prevent creating same invoice twice  
**Expected Result:** Error on second attempt

#### Steps:
1. Create invoice for May 2026 (already done in Test 1)
2. Try creating same invoice again
3. **Verify:** Error message: "Invoice already exists for 2026-05"

#### Manual Verification:
```bash
# Try to create duplicate
curl -s -X POST "http://localhost:3001/api/invoices" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"cmpj4zsxo00033jsek3rfc4sp","invoice_month":"2026-05"}' | jq '.error'
```

Expected: `"VALIDATION_ERROR"`

---

### Test 7: Invalid Standing Order (No Items)
**Objective:** Verify standing order requires items  
**Expected Result:** Error on empty items array

#### Steps:
1. Attempt via API (no UI button for this):
```bash
curl -s -X POST "http://localhost:3001/api/standing-orders" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"cmpj4zsxo00033jsek3rfc4sp","items":[]}' | jq '.error'
```

**Verify:** Error message indicates items are required

---

### Test 8: Standing Order Item Validation
**Objective:** Verify item-level validation works  
**Expected Result:** Invalid quantities/prices rejected

#### Steps:
```bash
# Invalid quantity (0)
curl -s -X POST "http://localhost:3001/api/standing-orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id":"cmpj4zsxo00033jsek3rfc4sp",
    "items":[{"variant_id":"var1","size_name":"100g","quantity":0}]
  }' | jq '.message'

# Invalid price (over limit)
curl -s -X POST "http://localhost:3001/api/standing-orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id":"cmpj4zsxo00033jsek3rfc4sp",
    "items":[{"variant_id":"var1","size_name":"100g","quantity":5,"price_at_time_eur":20000}]
  }' | jq '.message'
```

**Verify:** Both return validation errors

---

## Data Integrity Tests

### Test 9: Cascade Delete Standing Order
**Objective:** Verify items deleted when standing order deleted  
**Expected Result:** All items removed with parent order

#### Steps:
1. Create standing order with 3 items (via API)
2. Count items: 
```bash
SO_ID=$(curl -s "http://localhost:3001/api/standing-orders?limit=1" | jq -r '.data[0].id')
ITEM_COUNT=$(curl -s "http://localhost:3001/api/standing-orders/$SO_ID" | jq '.data.items | length')
echo "Items before delete: $ITEM_COUNT"
```

3. Delete standing order:
```bash
curl -s -X DELETE "http://localhost:3001/api/standing-orders/$SO_ID"
```

4. Verify standing order is gone:
```bash
curl -s "http://localhost:3001/api/standing-orders/$SO_ID" | jq '.error'
```

**Verify:** Returns 404 NOT_FOUND

---

### Test 10: Invoice Calculation Accuracy
**Objective:** Verify correct total and VAT calculation  
**Expected Result:** 19% VAT applied correctly

#### Steps:
1. Create orders totaling €100 for customer
2. Generate invoice
3. **Verify:** 
   - Subtotal: €100.00
   - VAT (19%): €19.00
   - Total: €119.00

---

## Performance Tests

### Test 11: List Performance (Large Dataset)
**Objective:** Verify pagination works efficiently  
**Expected Result:** Response time <200ms, pagination controls visible

#### Steps:
1. Navigate to http://localhost:3000/invoices
2. Observe:
   - Page loads within 2 seconds
   - List shows first 20 items
   - Pagination controls visible (if >20 items)
3. Navigate through pages
4. **Verify:** Page changes quickly (<500ms)

#### Manual Verification:
```bash
# Time invoice list request
time curl -s "http://localhost:3001/api/invoices?page=1&limit=20" > /dev/null
```

Expected: <200ms

---

### Test 12: Create Performance (Standing Order)
**Objective:** Verify creation completes in reasonable time  
**Expected Result:** Response within 300ms with 100 items

#### Steps:
```bash
# Create standing order with 10 items and time it
time curl -s -X POST "http://localhost:3001/api/standing-orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id":"cmpj4zsxo00033jsek3rfc4sp",
    "items":[
      {"variant_id":"var1","size_name":"100g","quantity":1,"price_at_time_eur":10},
      {"variant_id":"var2","size_name":"225g","quantity":2,"price_at_time_eur":20},
      {"variant_id":"var3","size_name":"100g","quantity":3,"price_at_time_eur":15},
      {"variant_id":"var4","size_name":"225g","quantity":4,"price_at_time_eur":25},
      {"variant_id":"var5","size_name":"100g","quantity":5,"price_at_time_eur":12},
      {"variant_id":"var6","size_name":"225g","quantity":6,"price_at_time_eur":28},
      {"variant_id":"var7","size_name":"100g","quantity":7,"price_at_time_eur":11},
      {"variant_id":"var8","size_name":"225g","quantity":8,"price_at_time_eur":30},
      {"variant_id":"var9","size_name":"100g","quantity":9,"price_at_time_eur":13},
      {"variant_id":"var10","size_name":"225g","quantity":10,"price_at_time_eur":32}
    ]
  }' > /dev/null
```

Expected: <400ms for 10 items

---

## Security Tests

### Test 13: Authentication Not Required (Dev Mode)
**Objective:** Verify endpoints accessible without auth in development  
**Expected Result:** All endpoints respond (no 401 errors)

#### Steps:
```bash
# No Authorization header
curl -s http://localhost:3001/api/invoices | jq '.success'
curl -s http://localhost:3001/api/standing-orders | jq '.success'
```

Expected: Both return `true`

---

### Test 14: Authorization Enforced (Admin Only)
**Objective:** Verify admin-only endpoints reject non-admin  
**Expected Result:** 403 error for non-admin roles

#### Steps:
```bash
# Try to create invoice as customer role
curl -s -X POST "http://localhost:3001/api/invoices" \
  -H "Authorization: Bearer customer123:customer" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"cmpj4zsxo00033jsek3rfc4sp","invoice_month":"2026-06"}' | jq '.error'
```

Expected: `"FORBIDDEN"` error (in production mode)

Note: In dev mode, this may be allowed for testing

---

### Test 15: Invalid Token Rejected
**Objective:** Verify invalid token format causes error  
**Expected Result:** 401 error

#### Steps:
```bash
# Invalid token format (missing role)
curl -s -H "Authorization: Bearer onlyuserid" \
  http://localhost:3001/api/invoices | jq '.error'

# Invalid role
curl -s -H "Authorization: Bearer user123:superuser" \
  http://localhost:3001/api/invoices | jq '.error'
```

Expected: `"INVALID_TOKEN"` or `"INVALID_ROLE"`

---

## Accessibility & UX Tests

### Test 16: Sidebar Navigation
**Objective:** Verify all menu items present and functional  
**Expected Result:** Invoices and Standing Orders links visible and clickable

#### Steps:
1. Open http://localhost:3000
2. Observe sidebar (left panel)
3. **Verify:**
   - "💰 Invoices" link present
   - "🔄 Standing Orders" link present
   - Links highlight when active
   - Clicking navigates correctly

---

### Test 17: Responsive Design
**Objective:** Verify UI works on different screen sizes  
**Expected Result:** Layout adapts appropriately

#### Steps:
1. Open http://localhost:3000/invoices
2. Open browser dev tools (F12)
3. Toggle device emulation:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
4. **Verify:**
   - Tables remain readable
   - Buttons remain clickable
   - No horizontal scrolling needed
   - Forms are usable on all sizes

---

## Test Results Template

```
Test #: [Number]
Title: [Title]
Status: [ ] PASSED [ ] FAILED [ ] BLOCKED
Duration: [Time taken]
Browser: [Chrome/Firefox/Safari, version]
Notes: [Any observations]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshots:
[Paste screenshots if failed]
```

---

## Go/No-Go Decision Criteria

**GO** if:
- ✅ All golden path tests pass
- ✅ No critical bugs found
- ✅ Performance targets met (P99 <500ms)
- ✅ Security tests pass
- ✅ Data integrity verified

**NO-GO** if:
- ❌ Any golden path test fails
- ❌ Critical bugs preventing core functionality
- ❌ Performance > 1000ms for basic operations
- ❌ Security vulnerabilities found
- ❌ Data loss or corruption observed

---

## Sign-Off

**Tested By:** [Name]  
**Test Date:** [Date]  
**Overall Status:** [ ] READY FOR PRODUCTION [ ] NEEDS FIXES

**Issues Found:**
1. [Issue]
2. [Issue]

**Blockers:**
- [Blocker]

**Recommendation:** [Ready to deploy / Hold for fixes / Needs investigation]
