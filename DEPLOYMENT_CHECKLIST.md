# Belarro v3 Deployment Checklist

**Version:** 1.0  
**Last Updated:** 2026-05-24  
**Environment:** Production (localhost:3001, frontend localhost:3000)

---

## Pre-Deployment Verification

### Code Quality
- [x] TypeScript compilation succeeds (`npm run build`)
- [x] No linting errors (`npm run lint` or ESLint)
- [x] Tests pass (`npm test`)
  - Invoice calculations verified
  - Standing order CRUD works
  - Integration workflows tested
- [x] No hardcoded secrets in code
- [x] No debug logs left in codebase

### Security
- [x] Authentication enabled (`requireAdmin` middleware)
- [x] Authorization enforced (role-based access control)
- [x] Input validation present on all endpoints
- [x] No SQL injection vulnerabilities (Prisma ORM used)
- [ ] CORS restricted to allowed domains
- [ ] Rate limiting configured
- [ ] Security headers configured
- [ ] HTTPS enabled (if public-facing)

### Database
- [ ] Database schema migrated (`npx prisma migrate deploy`)
- [ ] Backups enabled with automatic snapshots
- [ ] Connection pooling configured for production load
- [ ] Indexes created on frequently-queried columns
- [ ] Database encryption at rest enabled

### Infrastructure
- [ ] Server resources adequate (CPU, RAM, disk)
- [ ] Environment variables configured:
  - `NODE_ENV=production`
  - `DATABASE_URL` set to production database
  - `PORT` set to 3001
  - `ALLOWED_ORIGINS` set for CORS
- [ ] Logging configured (stdout/file/centralized)
- [ ] Monitoring agent installed (CloudWatch, Datadog, etc.)
- [ ] Health check accessible at `/health`

---

## Deployment Steps

### 1. Prepare Environment
```bash
# Set production environment
export NODE_ENV=production

# Verify environment variables
echo "NODE_ENV=$NODE_ENV"
echo "DATABASE_URL=***" (don't print actual value)
echo "PORT=$PORT"
```

### 2. Build Application
```bash
# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Verify build succeeded
ls -la dist/
```

### 3. Database Migration
```bash
# Run Prisma migrations
npx prisma migrate deploy

# Verify migration succeeded
npx prisma db seed  # if seed script exists
```

### 4. Start Application
```bash
# Option A: Direct start
npm start

# Option B: PM2 process manager (recommended)
pm2 start dist/index.js --name "belarro-api"
pm2 save
pm2 startup

# Verify application is running
curl http://localhost:3001/health
```

### 5. Smoke Tests
```bash
# Test basic endpoints
curl http://localhost:3001/api/invoices
curl http://localhost:3001/api/standing-orders
curl http://localhost:3001/api/customers

# Verify responses are valid JSON
curl -H "Authorization: Bearer testuser:admin" \
  http://localhost:3001/api/invoices | jq .
```

### 6. Frontend Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy built files (next.js exports to .next/)
# Use Next.js deployment (Vercel) or serve with `next start`
npm start
```

---

## Post-Deployment Verification

### Smoke Tests (First 30 Minutes)
- [ ] Health check endpoint responds
- [ ] Invoice API responds to GET /invoices
- [ ] Standing Orders API responds to GET /standing-orders
- [ ] POST /invoices creates invoice successfully
- [ ] POST /standing-orders creates standing order successfully
- [ ] Authentication enforcement verified (401 on missing header)
- [ ] Authorization enforcement verified (403 on insufficient permissions)
- [ ] Database connectivity verified (no connection errors)

### Monitoring
- [ ] Error rate < 1%
- [ ] Response time P99 < 500ms
- [ ] No database connection errors
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] Disk usage < 90%

### Application Logs
- [ ] Server started successfully
- [ ] Database connection successful
- [ ] No error-level logs in first 5 minutes
- [ ] Request logging shows normal traffic patterns

---

## Rollback Procedure

If deployment fails or critical issues discovered:

### Immediate Rollback
```bash
# Stop current version
pm2 stop belarro-api
# or
killall node

# Revert database (if migrations failed)
npx prisma migrate resolve --rolled-back 001_latest_migration_name

# Redeploy previous version
git checkout previous-stable-commit
npm run build
npm start
```

### Database Rollback
```bash
# Revert to previous snapshot
# (if using managed database like AWS RDS)
# Use AWS RDS snapshot restore in console

# or restore from backup
psql -U postgres < backup_2026-05-24_pre-deployment.sql
```

### Frontend Rollback
```bash
# Revert to previous deployment
# (if using Vercel): git revert, redeploy
# (if self-hosted): restore previous build folder
```

---

## Performance Baselines

After successful deployment, establish performance baselines:

### API Performance Targets
| Endpoint | P50 Latency | P99 Latency | Throughput |
|----------|-------------|-------------|-----------|
| GET /invoices | 50ms | 200ms | 100 req/s |
| POST /invoices | 75ms | 300ms | 50 req/s |
| GET /standing-orders | 50ms | 200ms | 100 req/s |
| POST /standing-orders | 100ms | 400ms | 30 req/s |

### Database Performance
- Query execution time < 100ms for standard queries
- Connection pool utilization < 70%
- Replication lag < 1s (if using replicas)

---

## Ongoing Operations

### Daily Tasks
- [ ] Check error logs (should be <0.1% of traffic)
- [ ] Verify backups completed successfully
- [ ] Monitor disk space (alert if >80%)

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check for any failed health checks
- [ ] Validate audit logs (invoice generation, access)

### Monthly Tasks
- [ ] Review and rotate access logs
- [ ] Audit user permissions
- [ ] Test disaster recovery (restore backup to staging)
- [ ] Security scan for known vulnerabilities (`npm audit`)

### Quarterly Tasks
- [ ] Security audit (see SECURITY_CHECKLIST.md)
- [ ] Capacity planning (do we need more resources?)
- [ ] Database optimization (analyze slow queries)
- [ ] Penetration testing

---

## Deployment Runbook (Quick Reference)

```bash
# 1. Prepare
export NODE_ENV=production

# 2. Build
npm ci --production && npm run build

# 3. Database
npx prisma migrate deploy

# 4. Deploy
pm2 start dist/index.js --name "belarro-api"

# 5. Verify
curl http://localhost:3001/health
curl -H "Authorization: Bearer admin:admin" http://localhost:3001/api/invoices | jq .

# 6. Rollback (if needed)
pm2 stop belarro-api
git checkout previous-version
npm run build && pm2 start dist/index.js
```

---

## Communication

### Pre-Deployment
- [ ] Notify stakeholders of deployment window
- [ ] Schedule maintenance window (if downtime expected)
- [ ] Prepare rollback communication

### During Deployment
- [ ] Monitor all metrics in real-time
- [ ] Keep stakeholders updated every 5 minutes
- [ ] Have rollback team on standby

### Post-Deployment
- [ ] Send success notification with metrics
- [ ] Document any issues encountered
- [ ] Update deployment log

---

## Checklist Sign-Off

**Deployment Date:** [TBD]  
**Deployed By:** [Name]  
**Approved By:** [Name]  
**Start Time:** [Time]  
**End Time:** [Time]  
**Rollback Required:** [ ] Yes [ ] No  

**Notes:**
```
[Add any issues encountered, workarounds applied, etc.]
```
