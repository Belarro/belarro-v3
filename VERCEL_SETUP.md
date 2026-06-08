# Vercel Deployment Setup Checklist

## Step 1: Add Environment Variables

Go to **Vercel Dashboard → Select belarro-v3 project → Settings → Environment Variables**

Add these variables for **Production**:

```
SUPABASE_URL=https://gcgscmtjesyiziebutzw.supabase.co
SUPABASE_ANON_KEY=[Copy from V2 Supabase]
DATABASE_URL=[Optional: if using Prisma]
NEXT_PUBLIC_API_URL=https://your-production-domain.com
```

### How to get SUPABASE_ANON_KEY:
1. Go to https://app.supabase.com
2. Select project: `gcgscmtjesyiziebutzw`
3. Settings → API → Anon public key (copy this)

## Step 2: Configure Custom Domain

Go to **Vercel Dashboard → Domains**

Options:
- **A) Use existing domain:** Add your belarro.com or app.belarro.com
- **B) Use Vercel subdomain:** auto-assigned at https://belarro-v3.vercel.app

### To add custom domain:
1. Add domain in Vercel
2. Update DNS records at your registrar (Vercel will show instructions)
3. SSL/TLS is automatic

## Step 3: Verify Deployment

After environment variables are set, Vercel will automatically:
1. ✅ Rebuild the project
2. ✅ Compile TypeScript
3. ✅ Deploy frontend + backend serverless functions
4. ✅ Provision SSL/TLS certificates

Check deployment status: **Vercel Dashboard → Deployments**

## Step 4: Test Production API

Once deployed, test the API endpoints:

```bash
# Test crops endpoint
curl https://your-domain.com/api/crops

# Should return JSON with 25+ varieties from V2 Supabase
```

## Step 5 (Optional): Set Up Staging

If you want a staging environment:

1. Create another Vercel project from same GitHub repo
2. Create a `staging` branch in GitHub
3. Configure staging project to deploy from `staging` branch
4. Use different environment variables (different Supabase credentials if desired)

## Current Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Deployed | https://frontend-l5ru2eno9-ron-s-projects-0803a77d.vercel.app |
| Backend API | 🔄 Ready (awaiting env vars) | Will be at same domain |
| Database | ✅ Connected | V2 Supabase (55 varieties) |
| TypeScript Build | ✅ Passing | No errors |

## After Setting Environment Variables

Vercel will:
- Detect changes
- Automatically rebuild
- Deploy new version (takes ~5-10 minutes)
- Show ✅ green checkmark when complete

**No additional code changes needed.** Just set the environment variables and push to GitHub.

## Troubleshooting

If deployment fails:
1. Check **Vercel Dashboard → Deployments → Build Logs**
2. Look for error messages
3. Common issues:
   - Missing environment variables → Add them to Settings → Environment Variables
   - TypeScript errors → Check build logs for exact error
   - API route not found → Ensure api/[...route].ts exists (it does ✅)

## Support

GitHub: https://github.com/Belarro/belarro-v3
Vercel Docs: https://vercel.com/docs
