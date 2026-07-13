# TYNEX AI - Complete API Reference

## Overview

TYNEX AI provides a comprehensive REST API for chat, user management, and admin operations. All endpoints return structured JSON responses with consistent error handling.

**Base URL**: `https://your-domain.com/api`

**Authentication**: JWT token in `Authorization: Bearer {token}` header (except health and auth endpoints)

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "requestId": "req_...",
    "timestamp": "2024-01-01T00:00:00Z",
    "details": { /* optional validation errors */ }
  }
}
```

## Authentication Endpoints

### Register
Create a new user account.

```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "adminCode": "123456"  // Optional: TOTP code for admin
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "role": "user" },
    "token": "jwt_token"
  }
}
```

**Error Codes**:
- `USER_EMAIL_TAKEN` - Email already exists
- `VALIDATION_ERROR` - Invalid input
- `INVALID_INPUT` - Password too short

---

### Login
Authenticate and get JWT token.

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "adminCode": "123456"  // Optional: for admin access
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "role": "user" },
    "token": "jwt_token"
  }
}
```

**Error Codes**:
- `AUTH_INVALID` - Wrong email or password
- `USER_NOT_FOUND` - User doesn't exist
- `USER_BANNED` - Account is banned

---

### Logout
Invalidate current session.

```
POST /auth/logout
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": { "message": "Muvaffaqiyatli chiqildi" }
}
```

---

### Get Current User
Retrieve authenticated user information.

```
GET /auth/me
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "banned": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## Chat Endpoints

### Create Chat
Start a new conversation.

```
POST /chats
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My First Chat"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My First Chat",
    "messages": [],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### List Chats
Get all chats for current user with pagination.

```
GET /chats?page=1&limit=20
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [ /* chat objects */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3,
    "hasMore": true
  }
}
```

---

### Get Chat
Retrieve single chat with all messages.

```
GET /chats/{chatId}
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Chat",
    "messages": [
      {
        "id": "msg_uuid",
        "role": "user",
        "content": "Hello",
        "createdAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "msg_uuid",
        "role": "assistant",
        "content": "Hi there!",
        "createdAt": "2024-01-01T00:00:01Z"
      }
    ]
  }
}
```

---

### Update Chat
Rename a chat.

```
PUT /chats/{chatId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Chat Title"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": { /* updated chat */ }
}
```

---

### Delete Chat
Permanently delete a chat and all messages.

```
DELETE /chats/{chatId}
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": { "message": "Chat o'chirildi" }
}
```

---

### Chat Completion (Streaming)
Send message and get AI response via Server-Sent Events.

```
POST /chat/completions
Authorization: Bearer {token}
Content-Type: application/json

{
  "chatId": "uuid",
  "messages": [
    { "role": "user", "content": "What is AI?" }
  ],
  "modelId": "optional-model-id"
}
```

**Streaming Response**:
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
X-Request-ID: req_...

data: Artificial

data: Intelligence

data: is

data: technology...
```

**Response JSON** (after streaming ends):
```json
{
  "success": true,
  "data": {
    "content": "Artificial Intelligence is technology...",
    "model": "gpt-4o",
    "provider": "openai",
    "tokens": {
      "input": 10,
      "output": 100
    },
    "latencyMs": 1500
  }
}
```

**Error Codes**:
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `NO_ACTIVE_MODELS` - No models configured
- `AI_TIMEOUT` - Provider timeout
- `CHAT_NOT_FOUND` - Chat doesn't exist

---

### Get Chat Messages
Retrieve messages with pagination.

```
GET /chats/{chatId}/messages?page=1&limit=50
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [ /* message objects */ ],
  "pagination": { /* pagination data */ }
}
```

---

## Admin Endpoints

All admin endpoints require `role: "admin"` and are protected with rate limiting.

### Get System Statistics
Comprehensive system analytics and metrics.

```
GET /admin/stats
Authorization: Bearer {admin_token}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 100,
      "bannedUsers": 5,
      "activeUsers": 75,
      "totalChats": 500,
      "totalMessages": 5000
    },
    "tokens": {
      "inputTokens": 1000000,
      "outputTokens": 500000,
      "total": 1500000
    },
    "requests": {
      "total": 1000,
      "successful": 990,
      "failed": 10,
      "successRate": "99.0"
    },
    "performance": {
      "chartData": [ /* daily requests */ ],
      "modelStats": [ /* model performance */ ],
      "providers": { /* provider health */ }
    },
    "errors": {
      "topErrors": [ /* error breakdown */ ],
      "recentErrors": [ /* recent failures */ ]
    }
  }
}
```

---

### List AI Providers
Get all configured AI providers.

```
GET /admin/providers
Authorization: Bearer {admin_token}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "id": "uuid",
        "name": "OpenAI",
        "baseUrl": "https://api.openai.com/v1",
        "apiKey": "sk-****...****",
        "models": [ /* models for this provider */ ],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### Create AI Provider
Add new AI provider configuration.

```
POST /admin/providers
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "OpenAI",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-..."
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "provider": {
      "id": "uuid",
      "name": "OpenAI",
      "baseUrl": "https://api.openai.com/v1",
      "apiKey": "sk-****...****"
    }
  }
}
```

---

### Update AI Provider
Modify provider configuration.

```
PUT /admin/providers/{providerId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "apiKey": "sk-..."
}
```

---

### Delete AI Provider
Remove provider and all associated models.

```
DELETE /admin/providers/{providerId}
Authorization: Bearer {admin_token}
```

---

### List AI Models
Get all available AI models.

```
GET /admin/models
Authorization: Bearer {admin_token}
```

---

### Create AI Model
Add model to a provider.

```
POST /admin/models
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "providerId": "uuid",
  "modelId": "gpt-4o",
  "displayName": "GPT-4o",
  "priority": 1,
  "active": true
}
```

---

### Update AI Model
Modify model configuration.

```
PUT /admin/models/{modelId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "priority": 2,
  "active": true
}
```

---

### Delete AI Model
Remove model from service.

```
DELETE /admin/models/{modelId}
Authorization: Bearer {admin_token}
```

---

### List Users
Get all users with search and pagination.

```
GET /admin/users?page=1&limit=20&search=john
Authorization: Bearer {admin_token}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user",
      "banned": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": { /* pagination data */ }
}
```

---

### Ban/Unban User
Lock or unlock user account.

```
POST /admin/users/{userId}/ban
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "banned": true
}
```

---

### Change User Role
Update user role (user → admin).

```
POST /admin/users/{userId}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "admin"
}
```

---

### Update Settings
Configure system settings.

```
PUT /admin/settings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "rateLimitCount": 25,
  "rateLimitHours": 3,
  "bannerMessage": "System maintenance in progress"
}
```

---

## System Endpoints

### Health Check
Check system status (no authentication required).

```
GET /health
```

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": { "healthy": true, "status": "connected" },
    "providers": {
      "count": 3,
      "healthy": 3,
      "details": { /* provider health */ }
    },
    "models": { "active": 10, "status": "available" }
  },
  "performance": {
    "responseTime": 45,
    "analytics": { /* provider stats */ }
  },
  "memory": {
    "used": 256,
    "total": 512
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_MISSING` | 401 | No authentication token provided |
| `AUTH_INVALID` | 401 | Invalid or expired token |
| `AUTH_INSUFFICIENT_ROLE` | 403 | User doesn't have required role |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `USER_BANNED` | 403 | User account is banned |
| `USER_EMAIL_TAKEN` | 400 | Email already registered |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `CHAT_NOT_FOUND` | 404 | Chat doesn't exist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `NO_ACTIVE_MODELS` | 500 | No AI models configured |
| `AI_PROVIDER_ERROR` | 500 | AI provider error |
| `AI_TIMEOUT` | 500 | Provider request timeout |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

Default: 25 requests per 3 hours per user

```
429 Too Many Requests

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limitga yetdingiz",
    "details": {
      "limit": 25,
      "hours": 3,
      "resetAt": "2024-01-01T03:00:00Z"
    }
  }
}
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response**:
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

---

## Timestamps

All timestamps in ISO 8601 format with UTC timezone:
`2024-01-01T12:00:00Z`

---

## Examples

### Example: Complete Chat Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John"
  }'

# Save token from response

# 2. Create chat
curl -X POST http://localhost:3000/api/chats \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat"}'

# Save chatId from response

# 3. Send message (streaming)
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "{chatId}",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 4. Get chat
curl -X GET "http://localhost:3000/api/chats/{chatId}" \
  -H "Authorization: Bearer {token}"
```

---

## Webhooks (Future)

Webhooks for chat completions, user registrations, and usage events coming soon.

---

**API Version**: 1.0  
**Last Updated**: January 2024  
**Status**: Production Ready
