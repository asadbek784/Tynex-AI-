# TYNEX AI - Production Deployment Guide

## Overview

This document provides comprehensive guidance for deploying TYNEX AI to production with enterprise-grade security, performance, and reliability.

## System Architecture

### Core Components

1. **AI Provider Manager** - Universal provider abstraction with automatic fallback and retry logic
2. **Chat Streaming** - Real-time WebSocket-like streaming via Server-Sent Events (SSE)
3. **Conversation Memory** - Persistent chat history with full-text search
4. **Authentication** - JWT + Refresh Token pattern with role-based access control
5. **Admin Dashboard** - Comprehensive monitoring, user management, and analytics
6. **Cost Analytics** - Per-model and per-provider cost tracking

### Security Architecture

- AES-256-GCM encryption for API keys at rest
- JWT with secure HttpOnly cookies
- CORS protection with configurable origins
- XSS protection with Content-Security-Policy headers
- SQL injection prevention via Prisma ORM + parameterized queries
- Rate limiting with database-backed tracking
- Request ID tracking for audit trails

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
AUTH_SECRET="$(openssl rand -base64 48)"  # Generate with: openssl rand -base64 48

# Admin TOTP (Optional, for enhanced admin protection)
ADMIN_TOTP_SECRET="$(openssl rand -base32 32)"  # Generate with: openssl rand -base32 32

# API Key Encryption
API_KEY_ENCRYPTION_SECRET="$(openssl rand -base64 32)"  # Generate with: openssl rand -base64 32

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_client_secret"
GOOGLE_OAUTH_REDIRECT_URI="https://yourdomain.com/auth/google/callback"

# Environment
NODE_ENV="production"
LOG_LEVEL="info"

# Optional: Provider API Keys (if using direct integration)
OPENAI_API_KEY="sk-..."
```

### Generate Secure Secrets

```bash
# Generate AUTH_SECRET
openssl rand -base64 48

# Generate API_KEY_ENCRYPTION_SECRET
openssl rand -base64 32

# Generate ADMIN_TOTP_SECRET
openssl rand -base32 32
```

## Database Setup

### Initial Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: Run migrations
npx prisma migrate deploy
```

### Create Initial Admin

1. Register a new user at `/`
2. Get the ADMIN_TOTP_SECRET from environment
3. Add code to Google Authenticator/Authy
4. Register with the 6-digit code to become admin

### Google OAuth Setup (Optional)

For complete instructions, see [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md).

Quick setup:
1. Create OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Add authorized redirect URI: `https://yourdomain.com/auth/google/callback`
3. Set environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`
4. Run migrations: `npx prisma db push`
5. Users can now register/login with Google

### Database Optimization

```sql
-- Add indexes for performance (Postgres)
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_chat_user_id ON "Chat"("userId");
CREATE INDEX idx_message_chat_id ON "Message"("chatId");
CREATE INDEX idx_usage_log_user ON "UsageLog"("userId", "createdAt");
CREATE INDEX idx_usage_log_success ON "UsageLog"(success, "createdAt");
```

## AI Provider Configuration

### Setup First Provider

Via Admin Dashboard (`/admin`):

1. Navigate to "AI Providers"
2. Click "Add Provider"
3. Enter provider details:
   - Name: e.g., "OpenAI"
   - Base URL: `https://api.openai.com/v1`
   - API Key: Your provider's API key

### Add Models

For each provider:

1. Go to "AI Models"
2. Click "Add Model"
3. Configure:
   - Provider: Select from dropdown
   - Model ID: `gpt-4o`, `claude-3-opus`, etc.
   - Display Name: User-visible name
   - Priority: 1 (highest), 2, 3... (lower is higher priority)
   - Active: Toggle to enable/disable

### Provider Fallback Strategy

Models are tried in priority order. If a model fails:
1. Automatic retry with exponential backoff
2. Fall through to next priority level
3. Continue until success or all models exhausted

## Deployment

### Vercel Deployment (Recommended)

```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to vercel.com and connect repository
# 3. Configure environment variables in Vercel dashboard
# 4. Set Build Command: npm run build
# 5. Set Output Directory: .next
# 6. Deploy
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t tynex-ai .
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e AUTH_SECRET="..." \
  -e API_KEY_ENCRYPTION_SECRET="..." \
  tynex-ai
```

### Environment-Specific Configuration

**Development**:
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

**Staging**:
```bash
NODE_ENV=production
LOG_LEVEL=info
# Use staging database
```

**Production**:
```bash
NODE_ENV=production
LOG_LEVEL=info
# Use production database with backups
```

## Monitoring

### Health Check Endpoint

```bash
curl https://your-domain.com/api/health
```

Response includes:
- Database connection status
- Provider health status
- Active models count
- System uptime and memory usage

### Logging

- Application logs: Sent to stdout/stderr
- Structured logging with Pino logger
- Request IDs tracked through requests
- Audit logs for admin actions

### Key Metrics to Monitor

1. **API Performance**: Average response latency per model
2. **Error Rate**: % of failed AI provider calls
3. **Cost**: Projected daily/monthly costs
4. **Usage**: Requests per hour, tokens per day
5. **Availability**: Provider health status

## Performance Optimization

### Database Optimization

```bash
# Run query analysis
npx prisma studio

# Check slow queries
```

### Caching Strategy

- Model list cached in memory (AIProviderManager)
- User data cached per request (getCurrentUserFresh)
- Database queries use efficient selects (only needed fields)

### Rate Limiting

- Default: 25 requests per 3 hours per user
- Configurable via admin Settings
- Uses database-backed rate limit tracking
- Respects HTTP 429 status codes

## Security Checklist

- [ ] All secrets are 32+ characters
- [ ] HTTPS is enabled in production
- [ ] Database backups are automated
- [ ] Secrets are rotated quarterly
- [ ] Admin TOTP is enabled
- [ ] CORS origins are restricted
- [ ] API key encryption is verified
- [ ] Rate limiting is enforced
- [ ] Audit logs are monitored
- [ ] Database is not publicly accessible

## Backup & Recovery

### Database Backup

```bash
# Backup (Postgres)
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Automated Backups (Vercel + Supabase)

Supabase provides daily backups. Check dashboard for recovery options.

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

### Provider API Failures

1. Check provider health: `GET /api/health`
2. Verify API key is not expired/rotated
3. Check rate limits on provider side
4. Review error logs in admin dashboard

### High Latency

1. Check database query performance
2. Monitor provider response times
3. Review network latency to provider
4. Check model complexity (gpt-4 vs gpt-3.5)

## Cost Management

### Monitor Costs

Admin Dashboard `/admin` → "Stats" shows:
- Cost per provider
- Cost per model
- Projected monthly costs
- Cost trends over time

### Optimization Tips

1. Use cheaper models where possible (fallback strategy)
2. Set rate limits to prevent runaway costs
3. Monitor top users for anomalies
4. Use regional endpoints for lower latency
5. Implement request batching where possible

## Maintenance

### Regular Tasks

**Daily**:
- Monitor error rates via admin dashboard
- Check provider health status
- Review recent error logs

**Weekly**:
- Analyze usage trends
- Review cost projections
- Clean up old logs

**Monthly**:
- Rotate secrets if compromised
- Review user access patterns
- Update AI model availability

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Security audit
npm audit

# Fix vulnerabilities
npm audit fix
```

## API Documentation

### Authentication

All endpoints except `/api/health` and auth endpoints require JWT token in header:

```bash
Authorization: Bearer {jwt_token}
```

### Key Endpoints

#### Chat Completions
```
POST /api/chat/completions
Content-Type: application/json

{
  "chatId": "uuid",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "modelId": "optional-model-id"
}
```

#### Admin Stats
```
GET /api/admin/stats
Authorization: Bearer {admin_token}
```

Returns: Comprehensive system analytics

#### Health Check
```
GET /api/health
```

No authentication required.

## Support

For issues or questions:
1. Check `/api/health` endpoint
2. Review error logs in admin dashboard
3. Check documentation in this file
4. Contact support team

## Compliance & Security

- GDPR: Implement data retention policies
- Privacy: Do not log sensitive user data
- Security: Run regular security audits
- Compliance: Keep audit logs for 90+ days

## Performance Targets

- API Response Time: < 2 seconds (p95)
- Chat Streaming: First token in < 500ms
- Availability: 99.5% uptime
- Error Rate: < 1%
- Cost per Request: Varies by model

---

**Last Updated**: 2024
**Version**: 1.0
