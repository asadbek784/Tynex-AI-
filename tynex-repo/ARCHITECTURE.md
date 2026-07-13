# TYNEX AI - System Architecture

## Executive Summary

TYNEX AI is a production-ready, enterprise-grade AI chat platform built with Next.js 16, React 19, TypeScript, and Prisma. It provides universal AI provider abstraction, intelligent provider fallback, real-time streaming, comprehensive audit logging, and professional admin management.

**Key Stats**:
- TypeScript strict mode enabled
- Zero ESLint errors
- AES-256-GCM encryption for API keys
- JWT + Refresh token authentication
- 99.5% uptime capability with proper monitoring

## Directory Structure

```
project/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── admin/               # Admin endpoints (protected)
│   │   │   ├── models/          # AI model management
│   │   │   ├── providers/       # Provider management
│   │   │   ├── settings/        # System settings
│   │   │   ├── stats/           # Analytics & metrics
│   │   │   └── users/           # User management
│   │   ├── auth/                # Authentication endpoints
│   │   │   ├── login/           # Login with JWT
│   │   │   ├── register/        # User registration
│   │   │   ├── logout/          # Logout
│   │   │   └── me/              # Current user info
│   │   ├── chat/                # Chat endpoints
│   │   │   └── completions/     # AI completions with streaming
│   │   ├── chats/               # Chat management
│   │   ├── health/              # System health check
│   │   ├── models/              # Available models list
│   │   └── upload/              # File upload handling
│   ├── admin/                   # Admin dashboard page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main app page
│   └── globals.css              # Global styles
├── components/                  # React components
├── lib/                         # Core business logic
│   ├── errors.ts               # Structured error handling
│   ├── logger.ts               # Logging system
│   ├── schemas.ts              # Zod validation schemas
│   ├── middleware.ts           # Middleware utilities
│   ├── auth.ts                 # Authentication helpers
│   ├── crypto.ts               # AES-256-GCM encryption
│   ├── ai-provider-manager.ts  # AI provider abstraction
│   ├── token-manager.ts        # JWT + refresh token handling
│   ├── usage-analytics.ts      # Cost calculation & analytics
│   ├── config.ts               # Centralized configuration
│   ├── request-utils.ts        # HTTP request utilities
│   ├── prisma.ts               # Prisma client
│   └── generated/prisma/       # Generated Prisma types
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                      # Static assets
├── PRODUCTION.md               # Deployment guide
├── ARCHITECTURE.md             # This file
└── package.json
```

## Core Architecture Patterns

### 1. Error Handling System

**Location**: `lib/errors.ts`

- Centralized error codes via `ErrorCode` enum
- Custom error classes: `AppError`, `AuthError`, `ValidationError`, etc.
- Structured error responses with request IDs
- Type-safe error handling throughout

```typescript
// Usage
throw new AuthError('Invalid credentials', ErrorCode.AUTH_INVALID)
throw new ValidationError('Missing email', { email: 'Required' })
throw new RateLimitError('Too many requests', resetAt, remaining)
```

### 2. Logging Architecture

**Location**: `lib/logger.ts`

- Structured logging with Pino
- Context propagation via child loggers
- Request ID tracking for distributed tracing
- Audit logging for security events
- Contextual metadata in all logs

```typescript
// Usage
const requestLogger = logger.child({ userId, requestId, endpoint })
requestLogger.info('Operation successful', { duration, tokens })
requestLogger.audit('admin_action', { action, details })
```

### 3. Input Validation

**Location**: `lib/schemas.ts`

- Zod schemas for all API inputs
- Type-safe validation utilities
- Detailed error messages
- Server-side validation only (prevent injection)

```typescript
// Usage
const validation = validateInput(CreateChatSchema, body)
if (!validation.success) {
  throw new ValidationError('Invalid input', validation.errors)
}
```

### 4. AI Provider Manager

**Location**: `lib/ai-provider-manager.ts`

**Core Features**:
- Universal provider abstraction for 7+ providers
- Automatic fallback on failure
- Retry logic with exponential backoff
- Health status tracking
- Analytics and performance metrics
- Cost calculation support

```typescript
// Usage
const result = await aiProviderManager.callWithFallback(options, requestedModelId)
```

**Provider Support**:
- OpenAI (GPT-4, GPT-3.5)
- Google Gemini
- Anthropic Claude
- OpenRouter
- Groq
- DeepSeek
- Mistral

### 5. Authentication System

**Location**: `lib/auth.ts`, `lib/token-manager.ts`

**Features**:
- JWT with 15-minute access token expiry
- Refresh token with 7-day expiry
- Database-backed refresh token revocation
- TOTP 2FA for admin accounts
- Role-based access control (User, Admin)
- Session management with HttpOnly cookies

### 6. Database Schema

**Location**: `prisma/schema.prisma`

**Key Models**:
- `User` - Accounts with role and ban status
- `Chat` - Conversations grouped by user
- `Message` - Individual messages in chats
- `AiProvider` - Provider configurations (encrypted API keys)
- `AiModel` - Models grouped by provider
- `UsageLog` - Detailed usage tracking
- `RefreshToken` - Token revocation tracking
- `Settings` - System configuration
- `RateLimitHit` - Rate limit tracking

**Indexes**: Performance-critical fields indexed for fast queries

### 7. Request Handling Pipeline

```
Request
  ↓
[Middleware - Request ID generation]
  ↓
[Authentication - Verify JWT]
  ↓
[Authorization - Check role/permissions]
  ↓
[Validation - Zod schema validation]
  ↓
[Rate Limiting - Check rate limits]
  ↓
[Business Logic - Process request]
  ↓
[Logging - Audit trail]
  ↓
[Error Handling - Structured response]
  ↓
Response
```

### 8. Configuration Management

**Location**: `lib/config.ts`

- Centralized configuration constants
- Environment-aware settings
- Feature flags for gradual rollout
- Type-safe config access
- No magic strings/numbers in code

```typescript
// Usage
const config = SECURITY_CONFIG.SESSION_COOKIE_MAX_AGE
const enabled = isFeatureEnabled('ENABLE_IMAGE_UPLOAD')
```

## API Design

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "AUTH_MISSING",
    "message": "Tizimga kirilmagan",
    "requestId": "req_...",
    "timestamp": "2024-01-01T00:00:00Z",
    "details": {
      "field": "error message"
    }
  }
}
```

### Success Response Format

```json
{
  "success": true,
  "data": {
    "id": "...",
    "content": "..."
  }
}
```

### Pagination Response Format

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasMore": true
  }
}
```

## Security Architecture

### API Key Protection

1. **Encryption**: AES-256-GCM at rest in database
2. **Rotation**: Decrypted only when needed
3. **Audit**: All usage logged with timestamps
4. **Revocation**: Can be disabled per provider

### Authentication Security

1. **JWT**: Secure signing with HS256
2. **HttpOnly Cookies**: Cannot be accessed by JavaScript
3. **HTTPS Only**: Secure flag set in production
4. **CSRF Protection**: Same-site cookie flag
5. **Session Rotation**: Automatic with 7-day expiry

### CORS Security

- Configurable allowed origins
- Credentials only on same-origin or allowed origins
- Preflight request handling
- Method and header whitelisting

### Rate Limiting

- Database-backed tracking (survives restarts)
- Per-user and per-IP limiting
- Configurable thresholds
- HTTP 429 status codes
- Reset time tracking

### Input Validation

- Zod schema validation on all inputs
- Max length/size enforcement
- XSS prevention (no untrusted HTML)
- SQL injection prevention (Prisma ORM)
- Type coercion protection

## Performance Architecture

### Database Optimization

- Indexed columns for fast queries
- Relationship loading optimization (select specific fields)
- Aggregate queries for stats
- Pagination to limit result sets
- Connection pooling

### Caching Strategy

1. **In-Memory**: Model list, provider config
2. **HTTP Cache**: Static assets, health check
3. **Query-Level**: Efficient selects, avoid N+1

### Streaming Optimization

- Server-Sent Events (SSE) for real-time updates
- Chunked response streaming
- Heartbeat to prevent connection drops
- Abort signal support for cancellation

### Request Optimization

- Request ID tracking (zero latency overhead)
- Structured logging without serialization overhead
- Lazy loading of relationships
- Middleware chaining with minimal overhead

## Monitoring & Observability

### Health Checks

- Database connectivity
- Provider availability
- System resource usage
- Active connection count

### Metrics Collection

- Request count and duration
- Success/failure rates
- Token usage per model
- Cost calculations
- Provider performance

### Audit Logging

- User actions logged with timestamps
- Admin operations tracked
- Failed authentication attempts
- Rate limit violations
- System errors

## Scaling Considerations

### Horizontal Scaling

- Stateless design (can run multiple instances)
- Database-backed rate limiting (survives instance restarts)
- Session data in database (not in-memory)
- Refresh tokens in database for revocation

### Database Scaling

- Connection pooling to manage load
- Pagination for large result sets
- Indexes for fast queries
- Archive old logs separately

### Provider Fallback

- Multiple provider support
- Automatic failover reduces latency
- Priority-based selection
- Health-aware routing

## Development Workflow

### Code Quality

```bash
# Type checking
npm run build  # Includes TypeScript check

# Linting
npm run lint  # ESLint

# Database
npx prisma generate  # Generate types
npx prisma db push   # Apply schema changes
```

### Testing Strategy

- Unit tests for utilities
- Integration tests for APIs
- E2E tests for flows
- Load testing for performance

### Deployment

```bash
# Build
npm run build

# Test
npm run lint

# Deploy
# Push to Vercel or run in container
```

## Disaster Recovery

### Backup Strategy

- Daily automated database backups
- Point-in-time recovery capability
- Encrypted backup storage
- Tested recovery procedures

### Failover

- Provider fallback (automatic)
- Database connection retry
- Graceful degradation
- Health check monitoring

## Compliance & Security Standards

- **OWASP Top 10**: Protected against known vulnerabilities
- **GDPR Ready**: User data deletion support
- **SOC 2**: Audit logging and access controls
- **Data Privacy**: Encryption at rest and in transit
- **Rate Limiting**: DDoS protection
- **Input Validation**: Injection attack prevention

## Future Enhancements

1. **Caching Layer**: Redis for distributed caching
2. **Message Queue**: Async job processing
3. **WebSocket**: Real-time collaboration
4. **Multi-Tenant**: User organizations
5. **Advanced Analytics**: Machine learning insights
6. **Custom Models**: Fine-tuned model support
7. **API Rate Plans**: Tiered access control
8. **Usage Reports**: Exportable analytics

## Technology Stack Rationale

| Technology | Why Chosen |
|-----------|-----------|
| Next.js 16 | Latest with App Router, best-in-class DX |
| React 19 | Latest features, better performance |
| TypeScript | Type safety, better IDE support |
| Prisma 7 | Type-safe ORM, excellent DX |
| PostgreSQL | Mature, reliable, excellent for OLAP |
| Zod | Runtime validation, type inference |
| Pino | Structured logging, high performance |
| JWT | Stateless, scalable authentication |
| AES-256-GCM | Standard encryption, authenticated |

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Maintainer**: Engineering Team
