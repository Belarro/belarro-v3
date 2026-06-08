# Belarro V3 Deployment Guide

## 🎯 Deployment Status (June 8, 2026)

### ✅ Phase 1: Infrastructure Complete
- [x] GitHub: https://github.com/Belarro/belarro-v3
- [x] Frontend: Deployed to Vercel (Live)
- [x] Database: V2 Supabase (55 varieties, 25+ available)
- [x] API: Serverless functions configured
- [x] TypeScript build: ✅ Passing

### Frontend Deployment (Live)
- **URL:** https://frontend-l5ru2eno9-ron-s-projects-0803a77d.vercel.app
- **Status:** ✅ All 25+ crops displaying correctly
- **Admin Dashboard:** Full access to crops, orders, inventory, customers

### Backend Deployment (Ready)
- **Architecture:** Vercel serverless functions (api/handler.ts)
- **Routes:** All 36+ endpoints configured
  - `/api/crops` ✅
  - `/api/customers` ✅
  - `/api/orders` ✅
  - `/api/inventory` ✅
  - `/api/seeding` ✅
  - `/api/invoices` ✅
  - `/api/standing-orders` ✅
  - `/api/follow-ups` ✅
  - `/api/dashboard` ✅
- **Status:** Ready to deploy (no code changes needed)

### Database Integration
- **Primary:** V2 Supabase (gcgscmtjesyiziebutzw)
- **Schema:** Products table with 55 varieties
- **Data Sync:** Real-time REST API calls from backend
- **Status:** ✅ Connected and working

## 📋 Remaining for Go-Live

### Phase 2: Production Environment
1. **Environment Variables in Vercel:**
   - SUPABASE_URL (for production)
   - SUPABASE_ANON_KEY (for production)
   - NEXT_PUBLIC_API_URL (production API endpoint)
   - DATABASE_URL (if using Prisma PostgreSQL)

2. **Custom Domains:**
   - Add primary domain (e.g., belarro.com or app.belarro.com)
   - SSL/TLS automatically provisioned by Vercel

3. **Staging Environment (Optional):**
   - Create separate Vercel deployment for staging
   - Point to staging Supabase instance (if desired)

### Phase 3: Testing & Hardening
1. E2E testing on production-like environment
2. Security audit (auth, validation, rate limiting)
3. Performance testing (load, response times)
4. Backup & disaster recovery setup

### Phase 4: Parallel Projects
1. **Website (belarro.com)** — Marketing + product showcase
2. **Chef/Restaurant App** — Customer ordering system
3. **Mobile Apps** — iOS/Android

## 🚀 To Deploy Now

```bash
# Option 1: Push to main branch (auto-deploys to Vercel)
git push origin master

# Option 2: Manual deployment via Vercel CLI
vercel --prod

# Set environment variables in Vercel dashboard:
# Settings > Environment Variables
SUPABASE_URL: https://gcgscmtjesyiziebutzw.supabase.co
SUPABASE_ANON_KEY: [from V2 instance]
NEXT_PUBLIC_API_URL: https://your-domain.com
```

## 🏗️ Tech Stack
- **Frontend:** Next.js 16 + React 19 (Vercel)
- **Backend:** Express + TypeScript (Vercel Serverless)
- **Database:** Supabase PostgreSQL (V2 instance)
- **Hosting:** Vercel (unified frontend + backend)
- **Build:** TypeScript compilation verified ✅
