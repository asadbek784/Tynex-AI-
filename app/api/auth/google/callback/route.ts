import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken, verifyGoogleToken, handleGoogleOAuthCallback } from '@/lib/google-oauth'
import { setAuthCookie } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { AppError, ErrorCode, ValidationError } from '@/lib/errors'
import { withErrorHandler } from '@/lib/middleware'

/**
 * POST /api/auth/google/callback
 * Exchange authorization code for user authentication
 */
async function handleCallback(req: NextRequest, requestId: string): Promise<Response> {
  try {
    const body = await req.json()
    const { code } = body

    if (!code) {
      throw new ValidationError('Authorization code is required')
    }

    const requestLogger = logger.child({ requestId, endpoint: '/api/auth/google/callback' })

    // Exchange code for ID token
    const idToken = await getGoogleAccessToken(code)

    // Verify token and get user info
    const googleUser = await verifyGoogleToken(idToken)

    // Create or update user in database
    const jwtPayload = await handleGoogleOAuthCallback(
      googleUser.googleId,
      googleUser.email,
      googleUser.name,
      googleUser.picture
    )

    // Set auth cookie
    await setAuthCookie(jwtPayload)

    requestLogger.info('Google OAuth authentication successful', {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: jwtPayload.userId,
          email: jwtPayload.email,
          name: jwtPayload.name,
          role: jwtPayload.role,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    logger.error('Google OAuth callback failed', error)
    throw error
  }
}

export const POST = withErrorHandler(handleCallback)
