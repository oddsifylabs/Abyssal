# Cloudflare Pages Deployment

## Setup Steps

1. **Create Project**
   - Go to Cloudflare Dashboard → Pages
   - Create project → Connect to Git
   - Select `oddsifylabs/Abyssal` repo

2. **Build Settings**
   - Framework preset: None
   - Build command: `npm run build --workspace=@abyssal/web`
   - Build output directory: `apps/web/dist`
   - Root directory: `/`

3. **Environment Variables**
   Add in Pages → Settings → Environment variables:
   ```
   VITE_API_URL=https://api.abyssal.oddsifylabs.com
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

4. **Custom Domain**
   - Pages → Custom domains → Add
   - Domain: `abyssal.oddsifylabs.com`
   - Cloudflare will auto-provision SSL

5. **DNS (if needed)**
   Ensure `abyssal.oddsifylabs.com` CNAME points to your Pages domain.
