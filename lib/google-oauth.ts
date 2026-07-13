import { OAuth2Client } from 'google-auth-library'
import { prisma } from './prisma'
import { setAuthCookie } from './auth'
import { JWTPayload } from './auth'
import { logger } from './logger'

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI
)

/**
 * Verify Google OAuth token and extract user info
 */
export async function verifyGoogleToken(token: string): Promise<any> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      throw new Error('No payload in Google token')
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    }
  } catch (error: any) {
    logger.error('Google token verification failed', error)
    throw new Error(`Google authentication failed: ${error.message}`)
  }
}

/**
 * Get Google OAuth URL for frontend redirect
 */
export function getGoogleOAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ]

  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  })
}

/**
 * Get access token from authorization code
 */
export async function getGoogleAccessToken(code: string): Promise<string> {
  try {
    const { tokens } = await googleClient.getToken(code)
    return tokens.id_token || ''
  } catch (error: any) {
    logger.error('Failed to get Google access token', error)
    throw new Error(`Failed to exchange code for token: ${error.message}`)
  }
}

/**
 * Handle Google OAuth callback - create or update user
 */
export async function handleGoogleOAuthCallback(
  googleId: string,
  email: string,
  name: string,
  picture?: string
): Promise<JWTPayload> {
  try {
    // Check if user exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
    })

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleEmail: email,
          avatar: picture,
          updatedAt: new Date(),
        },
      })

      logger.info('Google OAuth - Updated existing user', { userId: user.id })
    } else {
      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        // Link Google account to existing email user
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId,
            googleEmail: email,
            avatar: picture,
            updatedAt: new Date(),
          },
        })

        logger.info('Google OAuth - Linked to existing user', { userId: user.id })
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            googleId,
            email,
            googleEmail: email,
            name,
            avatar: picture,
            // Password hash not required for OAuth users
            passwordHash: '', // Empty string as placeholder
          },
        })

        logger.info('Google OAuth - Created new user', { userId: user.id })
      }
    }

    if (user.banned) {
      throw new Error('Sizning hisobingiz bloklangan')
    }

    // Return JWT payload
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }

    return payload
  } catch (error: any) {
    logger.error('Google OAuth callback failed', error)
    throw error
  }
}

/**
 * Validate Google OAuth configuration
 */
export function validateGoogleOAuthConfig(): void {
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_OAUTH_REDIRECT_URI',
  ]

  const missing = requiredEnvVars.filter((v) => !process.env[v])

  if (missing.length > 0) {
    throw new Error(
      `Google OAuth configuration incomplete. Missing: ${missing.join(', ')}`
    )
  }
}
