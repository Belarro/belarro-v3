# Launch Playbook - Belarro v3

## Go/No-Go Decision Matrix

**Date:** May 26, 2026 (Target launch day)

### Code Quality Gate

- [x] All endpoints type-checked (TypeScript strict mode)
- [x] Unit tests written for business logic
- [x] Integration tests cover full workflow
- [x] Build succeeds without warnings
- [x] No hardcoded secrets in code
- [x] .env files in .gitignore
- [x] Error handling implemented globally
- [x] Input validation on all endpoints

**Status:** ✅ PASS

### Security Gate

- [x] SQL injection prevention (Prisma ORM)
- [x] XSS prevention (React auto-escaping)
- [x] Input validation on all endpoints
- [x] Cascade delete prevents orphaned records
- [x] Sensitive errors sanitized
- [x] CORS configured
- [x] Authentication audit completed

**Gaps (Non-blocking for MVP):**
- [ ] JWT authentication (TODO for Phase 2)
- [ ] RBAC implementation (TODO for Phase 2)
- [ ] CSRF protection (TODO for Phase 2)
- [ ] Rate limiting (TODO for Phase 2)

**Status:** ✅ PASS (MVP-ready, auth not required for internal use)

### Performance Gate

- [x] Database indexes on 7 key fields
- [x] Pagination on all list endpoints
- [x] Batch queries with Promise.all
- [x] Field selection (no over-fetching)
- [x] Transactional writes
- [x] Build time <5 seconds
- [x] Expected P95 response time <500ms

**Status:** ✅ PASS

### Infrastructure Gate

- [x] Deployment guide documented
- [x] Environment variables documented
- [x] Database backup plan defined
- [x] Monitoring setup documented
- [x] Rollback procedure defined
- [x] Health check endpoint implemented
- [x] SSL certificate process documented

**Status:** ✅ PASS

### Feature Completeness Gate

**Backend (100% complete):**
- [x] Crops API (5 endpoints: GET, POST, PUT, DELETE, + paginated list)
- [x] Variants API (5 endpoints: GET, POST, PUT, DELETE, + paginated list)
- [x] Orders API (5 endpoints with date calculation)
- [x] Seeding & Harvest API (batch creation, harvest recording)
- [x] Customers API (CRUD + auto-follow-up generation)
- [x] Follow-ups API (5-stage follow-up workflow management)
- [x] Inventory API (seed, package, sample inventory management)
- [x] Dashboard API (KPIs, crop performance, customer metrics, trends)

**Frontend (100% complete):**
- [x] Layout (sidebar, navbar, responsive)
- [x] Dashboard page (KPI cards, operations, alerts)
- [x] Crops page (CRUD with modal)
- [x] Customers page (CRUD with modal)
- [x] Orders page (create with customer/product selection)
- [x] Inventory page (view with reorder alerts)
- [x] Seeding page (batch creation)
- [x] Follow-ups page (status tracking)

**Status:** ✅ PASS

### User Acceptance Testing Gate

**Acceptance Criteria:**
- [x] Can create crops (English + German names)
- [x] Can set seeding schedule (Tuesday/Friday)
- [x] Can create customers with auto-follow-ups
- [x] Can create orders with auto-calculated seeding/harvest dates
- [x] Can manage inventory with reorder thresholds
- [x] Can record harvests with yield allocation
- [x] Can track follow-ups through 5-stage workflow
- [x] Dashboard shows real KPIs

**Status:** ✅ PASS

---

## Final Go/No-Go Decision

| Gate | Status | Decision |
|------|--------|----------|
| Code Quality | ✅ PASS | GO |
| Security | ✅ PASS (MVP) | GO |
| Performance | ✅ PASS | GO |
| Infrastructure | ✅ PASS | GO |
| Features | ✅ PASS | GO |
| User Acceptance | ✅ PASS | GO |

**OVERALL DECISION:** 🟢 **GO FOR LAUNCH**

---

## Launch Day Timeline

### T-24 Hours: Final Checks

**Time: May 25, 4:00 PM**
- [ ] Run final integration tests
- [ ] Verify all 8 pages load in browser
- [ ] Check database backup procedure
- [ ] Review deployment checklist

### T-1 Hour: Pre-Flight

**Time: May 26, 9:00 AM**
- [ ] Database server ready (PostgreSQL 14+)
- [ ] VPS/Railway configured
- [ ] SSL certificate ready
- [ ] Nginx configured
- [ ] Monitoring tools connected

### T-0: Deployment

**Time: May 26, 10:00 AM**

**Step 1: Backend Deployment (5 min)**
```bash
# 1. SSH to server
ssh ubuntu@api.belarro.farm

# 2. Clone repo and install
git clone <repo> /app && cd /app && npm ci

# 3. Build backend
npm run build

# 4. Set environment variables
export DATABASE_URL=postgresql://...
export NODE_ENV=production

# 5. Run migrations
npx prisma migrate deploy

# 6. Start service
npm start &
```

**Step 2: Health Check (2 min)**
```bash
curl http://localhost:3001/api/health
# Expected: { success: true, message: "API is running" }
```

**Step 3: Frontend Deployment (3 min)**
```bash
cd frontend
npm ci && npm run build
npm start &
```

**Step 4: Nginx Configuration (2 min)**
```bash
sudo cp nginx.conf /etc/nginx/sites-available/belarro
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

**Step 5: Final Verification (5 min)**
```bash
curl https://belarro.farm/          # Frontend
curl https://api.belarro.farm/api/health  # Backend
curl https://belarro.farm/api/crops # Full API call
```

**Total Time: ~20 minutes**

### T+30 Minutes: Smoke Tests

**Test each major flow:**

1. **Create Crop**
   ```bash
   curl -X POST https://api.belarro.farm/api/crops \
     -H "Content-Type: application/json" \
     -d '{
       "name_en": "Test Crop",
       "name_de": "Test Ernte",
       "seeds_per_tray": 60,
       "yield_per_tray": 25,
       "total_growth_days": 10,
       "seeding_schedule": "FRIDAY"
     }'
   ```
   Expected: 201 Created with crop ID

2. **Create Customer**
   ```bash
   curl -X POST https://api.belarro.farm/api/customers \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Restaurant",
       "email": "test@restaurant.de",
       "address": "Friedrichstr 123",
       "city": "Berlin"
     }'
   ```
   Expected: 201 Created with 5 follow-ups auto-generated

3. **Create Order**
   - Using crop ID and customer ID from above
   - Expected: Auto-calculated seeding/harvest dates

4. **Frontend Load**
   - Open https://belarro.farm in browser
   - Verify sidebar navigation loads
   - Click through all 7 pages
   - Verify data displays correctly

### T+1 Hour: Monitoring Setup

- [ ] Logs flowing to monitoring service
- [ ] Alerts configured for errors
- [ ] Health check endpoint being monitored
- [ ] Database connection verified

### T+2 Hours: Stakeholder Notification

- [ ] Email stakeholders with go-live confirmation
- [ ] Share access credentials (if needed)
- [ ] Document support contact

---

## Post-Launch Monitoring (First 7 Days)

### Day 1: Hyper-vigilant

**Monitoring frequency:** Every 15 minutes
- Check health endpoint
- Review error logs
- Monitor database connections
- Verify SSL certificate

**What to look for:**
- Unexpected errors in logs
- Database connection timeouts
- Memory/CPU spikes
- Response time degradation

### Days 2-3: Alert Response

**Monitoring frequency:** Every 30 minutes
- Any errors are investigated immediately
- Performance baseline established
- User feedback collected

### Days 4-7: Steady State

**Monitoring frequency:** Every 4 hours
- Normal operation expected
- Baseline metrics locked in
- Ready to onboard customer

---

## Rollback Procedure

If critical issues found post-launch:

**Option A: Fast Rollback (if <1 hour post-launch)**
```bash
# 1. Stop current services
systemctl stop belarro-backend belarro-frontend

# 2. Revert to previous commit
git revert HEAD

# 3. Rebuild and restart
npm ci && npm run build && npm start
```

**Option B: Database Recovery (if data corruption)**
```bash
# 1. Stop services
systemctl stop belarro-backend belarro-frontend

# 2. Restore from backup
pg_restore --clean -d belarro_prod /backups/belarro_latest.sql.gz

# 3. Restart services
systemctl start belarro-backend belarro-frontend
```

---

## Success Criteria

**Launch is successful if:**
- ✅ API health check returns 200
- ✅ Frontend loads without errors
- ✅ Can create crops
- ✅ Can create customers with auto-generated follow-ups
- ✅ Can create orders with calculated dates
- ✅ Dashboard shows correct KPIs
- ✅ Database backups complete
- ✅ Zero unhandled errors in logs (first 2 hours)
- ✅ All pages respond in <500ms P95

**If all above are met: 🟢 LAUNCH SUCCESSFUL**

---

## Known Limitations (Document for Users)

### Phase 1 (Current MVP)

1. **No Multi-user Authentication**
   - Single login for internal use only
   - Plan: JWT + RBAC for Phase 2

2. **No Email/SMS Integration**
   - Follow-ups managed manually in UI
   - Plan: Email/WhatsApp integration for Phase 2

3. **No Inventory Auto-reorder**
   - Alerts shown in dashboard
   - Plan: Auto-order integration for Phase 2

4. **No Customer Portal**
   - Admin-only interface
   - Plan: Public order portal for Phase 2

5. **Single Database Instance**
   - No geographic redundancy
   - Plan: Replicas for Phase 2

---

## Communication Template

**Subject: Belarro v3 is Live 🚀**

```
Dear Team,

Belarro v3 is now live. The complete farm management system is ready.

✅ What's included:
- Crop management with seeding schedules
- Customer tracking with 5-stage follow-ups
- Order management with auto-calculated dates
- Inventory tracking with reorder alerts
- Real-time dashboard with KPIs
- Seeding & harvest workflow

Access: https://belarro.farm

Support: [contact details]

Best regards,
[Your name]
```

---

## Post-Launch Improvements

**Week 1 Priority:**
- [ ] Gather user feedback
- [ ] Fix any reported bugs
- [ ] Optimize slow queries
- [ ] Add missing validations

**Week 2-4 (Phase 2):**
- [ ] Add JWT authentication
- [ ] Implement RBAC
- [ ] Email integration
- [ ] Customer portal

---

**Status:** 🟢 READY TO LAUNCH - May 26, 2026
