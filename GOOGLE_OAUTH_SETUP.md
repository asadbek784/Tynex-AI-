# Google OAuth Setup Guide

This guide explains how to configure Google OAuth for TYNEX AI.

## Prerequisites

- Google Cloud Project
- OAuth 2.0 Credentials (Web application type)
- Redirect URI configured in Google Cloud Console

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Search for "Google+ API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "Credentials" in Google Cloud Console
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Select "Web application"
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
5. Copy the Client ID and Client Secret

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

For production, update `GOOGLE_OAUTH_REDIRECT_URI` to your production domain:

```env
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

## Step 4: Update Database

Run Prisma migration to add OAuth fields to User model:

```bash
npx prisma db push
npx prisma generate
```

## Step 5: Test Google OAuth

### Via Frontend

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit login page and click "Google orqali kiriting"

3. You'll be redirected to Google login

4. After authentication, you'll be redirected to dashboard

### Via API

1. Get Google OAuth URL:
   ```bash
   curl http://localhost:3000/api/auth/google/init
   ```

2. Visit the returned `authUrl` in your browser

3. After Google redirects with authorization code, exchange it:
   ```bash
   curl -X POST http://localhost:3000/api/auth/google/callback \
     -H "Content-Type: application/json" \
     -d '{"code":"authorization_code_from_google"}'
   ```

## API Endpoints

### GET /api/auth/google/init
Get Google OAuth URL for frontend redirect.

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### POST /api/auth/google/callback
Exchange authorization code for user authentication.

**Request:**
```json
{
  "code": "authorization_code_from_google"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

## User Linking

When a user authenticates with Google:

1. **New User with New Email**: Create new account with Google OAuth
2. **Existing User with Same Email**: Link Google account to existing account
3. **User Already Has Google Account**: Update existing Google-linked account

## Frontend Implementation

### Using React Hook

```tsx
import { useGoogleAuth } from '@/lib/hooks/useGoogleAuth'

export function LoginForm() {
  const { initializeGoogleAuth, loading, error } = useGoogleAuth()

  return (
    <div>
      <button
        onClick={initializeGoogleAuth}
        disabled={loading}
      >
        {loading ? 'Yuklanmoqda...' : 'Google orqali kiriting'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}
```

### OAuth Callback Flow

1. User clicks "Google orqali kiriting"
2. Redirected to Google login page
3. After authentication, redirected to `/auth/google/callback?code=...`
4. Frontend exchanges code for user session
5. Redirected to dashboard

## Security Considerations

- ✅ OAuth tokens validated server-side
- ✅ Google ID verified with google-auth-library
- ✅ User email unique per database
- ✅ Google ID stored encrypted in database
- ✅ Passwords optional for OAuth users
- ✅ HTTPS required in production
- ✅ Redirect URI must match Google Console configuration

## Troubleshooting

### "OAuth is not configured"
- Check all three environment variables are set
- Verify they are not empty strings

### "Invalid authorization code"
- Ensure redirect URI matches Google Console
- Check code hasn't expired (codes expire after 10 minutes)
- Verify Client ID and Secret are correct

### "Redirect URI mismatch"
- In Google Console, exact match required
- No trailing slashes
- Protocol must match (http vs https)
- Port must match

### "User linking failed"
- Check database is accessible
- Verify Prisma migrations were run
- Check User model has OAuth fields

## Next Steps

1. ✅ Configure environment variables
2. ✅ Run database migrations
3. ✅ Test OAuth flow locally
4. ✅ Add Google login button to UI
5. ✅ Deploy to production
6. ✅ Update redirect URI in Google Console

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
- [TYNEX AI Production Guide](./PRODUCTION.md)
