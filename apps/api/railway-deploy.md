# Railway Deployment

## Setup Steps

1. **Create Project**
   - Go to railway.app → New Project
   - Deploy from GitHub repo `oddsifylabs/Abyssal`

2. **Service Config**
   - Root directory: `apps/api`
   - Build command: `npm run build`
   - Start command: `npm run start`

3. **Environment Variables**
   Add in Railway → Variables:
   ```
   NODE_ENV=production
   PORT=4000
   CORS_ORIGIN=https://abyssal.oddsifylabs.com
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=eyJ...
   CLERK_SECRET_KEY=sk_test_...
   DAILY_SEED_SECRET=your-daily-seed-secret-min-32-chars
   ```

4. **Custom Domain**
   - Railway → Settings → Domains
   - Add custom domain: `api.abyssal.oddsifylabs.com`
   - Verify DNS and SSL

5. **Health Check**
   Railway uses `/health` endpoint for zero-downtime deploys.
