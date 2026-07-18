# TYNEX AI - DEPLOYMENT GUIDE

## Quick Start

This guide will help you deploy TYNEX AI to Vercel with a PostgreSQL database (Supabase recommended).

---

## Prerequisites

1. **GitHub Account** - Repository is already at https://github.com/asadbek784/Tynex-AI-
2. **Vercel Account** - https://vercel.com
3. **Supabase Account** - https://supabase.com (for PostgreSQL database)
4. **Google OAuth Credentials** - https://console.cloud.google.com

---

## Step 1: Set Up PostgreSQL Database (Supabase)

### Create a Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Select your organization and region
4. Create project (wait ~2 minutes for setup)

### Get Database Credentials
1. Go to Project Settings → Database
2. Copy the connection string (you'll need this in Step 4)
3. Connection string format: `postgresql://[user]:[password]@[host]/[database]`

### Initialize Database with Migrations
```bash
# In your local repository
npm install

# Apply migrations to initialize database
npx prisma migrate deploy
# OR
npx prisma db push
```

---

## Step 2: Set Up Google OAuth

### Create Google OAuth Credentials
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
4. Application type: "Web Application"
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for local testing)
   - `https://your-domain.com/api/auth/google/callback` (for production)
6. Copy Client ID and Client Secret

---

## Step 3: Deploy to Vercel

### Option A: Connect GitHub Repository (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select "Import Git Repository"
4. Search for and select `asadbek784/Tynex-AI-`
5. Click "Import"

### Option B: Deploy from GitHub

1. Visit https://vercel.com/new
2. Connect your GitHub account
3. Select the repository
4. Click "Deploy"

---

## Step 4: Configure Environment Variables

In Vercel project settings, go to "Settings" → "Environment Variables" and add:

### Database Configuration
```
DATABASE_URL = postgresql://[user]:[password]@[host]/[database]
DIRECT_URL = postgresql://[user]:[password]@[host]/[database]
```

**Where to find:**
- From Supabase → Project Settings → Database → Connection string
- Replace `[user]`, `[password]`, `[host]`, `[database]` with actual values

### Google OAuth
```
GOOGLE_CLIENT_ID = your-client-id
GOOGLE_CLIENT_SECRET = your-client-secret
GOOGLE_OAUTH_REDIRECT_URI = https://your-domain.com/api/auth/google/callback
```

**Where to find:**
- From Google Cloud Console → Credentials

### Authentication
```
JWT_SECRET = (Generate a random 32+ character string)
ADMIN_TOTP_SECRET = (Generate a random 32+ character string)
```

**How to generate secrets:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use online generator: https://www.random.org/strings/
```

### Environment
```
NODE_ENV = production
```

---

## Step 5: Verify Deployment

### Check Build Logs
1. Go to your Vercel project
2. Click on the latest deployment
3. Verify build completed successfully
4. Look for "✓ Compiled successfully"

### Test Endpoints
```bash
# Test health
curl https://your-domain.com/

# Test registration
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "name": "Test User"
  }'

# Test login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### Test Google OAuth
1. Visit `https://your-domain.com/auth/login`
2. Click "Sign in with Google"
3. Verify authentication works

---

## Step 6: Set Up Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain (e.g., `tynex.your-domain.com`)
3. Update DNS records according to Vercel's instructions
4. Update `GOOGLE_OAUTH_REDIRECT_URI` if using new domain

---

## Troubleshooting

### Build Fails: "DATABASE_URL is not set"
**Solution:** Add DATABASE_URL to Vercel environment variables

### Error: "Prisma Client is not generated"
**Solution:** Vercel should auto-generate on build, but verify:
1. Check that `package.json` has correct build script
2. Verify `prisma/schema.prisma` exists and is valid

### Error: "User.googleId column does not exist"
**Solution:** Database hasn't been initialized with migrations
1. Run locally: `npx prisma migrate deploy`
2. Or set DATABASE_URL in Vercel and redeploy

### Google OAuth Redirect Error
**Solution:** Verify redirect URI matches exactly:
1. In Google Cloud Console credentials
2. In Vercel environment variable `GOOGLE_OAUTH_REDIRECT_URI`
3. Must match: `https://your-domain.com/api/auth/google/callback`

### CORS Errors
**Solution:** Already configured in the app, but verify:
1. CSP headers are set in `next.config.mjs`
2. CORS middleware is applied to API routes

---

## Local Development

### Setup for Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with your database
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
DATABASE_URL=postgresql://[user]:[password]@localhost:5432/tynex
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
JWT_SECRET=your-secret-key
ADMIN_TOTP_SECRET=your-totp-secret

# 3. Initialize database
npx prisma migrate dev

# 4. Start development server
npm run dev

# 5. Visit http://localhost:3000
```

### Run Tests Locally

```bash
# Regenerate Prisma client
npx prisma generate

# Build for production
npm run build

# Start production server (local)
npm start
```

---

## Monitoring & Maintenance

### View Logs
1. Vercel Dashboard → Project → Deployments
2. Click any deployment to see logs
3. Check for errors in "Build" and "Runtime" sections

### Monitor Database
1. Supabase → SQL Editor
2. Check for slow queries or errors
3. Monitor connections

### Common Tasks

```bash
# Add a migration
npx prisma migrate dev --name add_feature

# Reset database (caution!)
npx prisma migrate reset

# Seed database with initial data
npm run db:seed

# Update dependencies
npm update
```

---

## Production Checklist

- [ ] Database configured in Supabase
- [ ] All environment variables set in Vercel
- [ ] Google OAuth credentials created and configured
- [ ] Database migrations applied successfully
- [ ] Build completes without errors
- [ ] Registration endpoint works
- [ ] Login endpoint works
- [ ] Google OAuth works
- [ ] Chat functionality works
- [ ] No errors in production logs
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate installed
- [ ] Backups enabled in Supabase

---

## Support & Documentation

- **Prisma Docs:** https://www.prisma.io/docs/
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## Rollback

If something goes wrong after deployment:

### In Vercel
1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

### Database Rollback
1. In Supabase, use Point-in-Time Recovery (if enabled)
2. Or restore from backup

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all authentication flows
3. ✅ Configure custom domain
4. ✅ Set up monitoring
5. ✅ Create admin user (if needed)
6. ✅ Configure AI providers
7. ✅ Enable usage logging
8. ✅ Set up backups

---

**Ready to deploy? Start with Step 1 above!**
