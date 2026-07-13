import { NextRequest, NextResponse } from 'next/server'
import { getGoogleOAuthUrl, validateGoogleOAuthConfig } from '@/lib/google-oauth'
import { logger } from '@/lib/logger'
import { AppError, ErrorCode } from '@/lib/errors'
import { withErrorHandler } from '@/lib/middleware'

/**
 * GET /api/auth/google/init
 * Get Google OAuth URL for frontend redirect
 */
async function handleInit(req: NextRequest, requestId: string): Promise<Response> {
  try {
    // Validate Google OAuth is properly configured
    validateGoogleOAuthConfig()

    const authUrl = getGoogleOAuthUrl()

    return NextResponse.json(
      {
        success: true,
        authUrl,
      },
      { status: 200 }
    )
  } catch (error: any) {
    logger.error('Failed to initialize Google OAuth', error)

    // Return user-friendly error
    if (error.message.includes('configuration')) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Google OAuth is not configured on this server',
        500
      )
    }

    throw error
  }
}

export const GET = withErrorHandler(handleInit)
