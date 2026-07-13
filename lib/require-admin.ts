import { NextResponse } from 'next/server'
import { getCurrentUserFresh } from './auth'
import { sendErrorResponse, AuthError, ErrorCode } from './errors'

type AdminUser = NonNullable<Awaited<ReturnType<typeof getCurrentUserFresh>>>

type RequireAdminResult =
  | { user: AdminUser; error: null }
  | { user: null; error: NextResponse }

/**
 * Production-grade admin authentication
 * Verifies user is authenticated, not banned, and has admin role
 * Throws structured errors for consistent error handling
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUserFresh()

  if (!user) {
    throw new AuthError('Tizimga kirilmagan', ErrorCode.AUTH_MISSING)
  }

  if (user.role !== 'admin') {
    throw new AuthError('Ruxsat berilmagan', ErrorCode.AUTH_INSUFFICIENT_ROLE)
  }

  return user
}

/**
 * Legacy helper for backward compatibility
 * Returns { user, error } tuple style
 */
export async function requireAdminOrError(): Promise<RequireAdminResult> {
  try {
    const user = await requireAdmin()
    return { user, error: null }
  } catch (error: any) {
    return {
      user: null,
      error: sendErrorResponse(error),
    }
  }
}
