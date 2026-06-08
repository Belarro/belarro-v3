# Belarro V3 Deployment Guide

## Deployment Status

### ✅ Completed
- [x] GitHub repository: https://github.com/Belarro/belarro-v3
- [x] Frontend deployed to Vercel
- [x] Database: V2 Supabase (gcgscmtjesyiziebutzw.supabase.co)
- [x] All 25+ varieties loading from V2 Supabase

### Frontend Deployment
- **Current URL:** https://frontend-l5ru2eno9-ron-s-projects-0803a77d.vercel.app
- **Status:** ✅ Live and working

### Backend & Database
- **Backend:** Running on localhost:3002 (Express + TypeScript)
- **Database:** V2 Supabase (PostgreSQL)
- **Varieties:** 55 total, 25+ available
- **Status:** ✅ Connected and syncing data

## Next Steps for Production

1. **Set up custom domains in Vercel:**
   - Staging: `v3-staging.belarro.com` or similar
   - Production: `v3.belarro.com` or root domain

2. **Deploy backend:**
   - Option A: Vercel serverless functions
   - Option B: Railway/Fly.io for persistent API

3. **Configure Vercel environment variables:**
   - Add Supabase credentials
   - Set API URLs for staging vs production

4. **E2E testing on staging**

5. **Go live with production deployment**

## Tech Stack
- Frontend: Next.js 16 + React 19 (Vercel)
- Backend: Express + TypeScript (Node.js)
- Database: Supabase PostgreSQL
- All data from V2 Supabase in real-time
