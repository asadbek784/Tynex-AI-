import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { logger } from './logger'
import { AppError, ErrorCode, sendErrorResponse } from './errors'
import { getAuthUser, getCurrentUserFresh } from './auth'

/**
 * Generate unique request ID for tracking and logging
 */
export function generateRequestId(): string {
  return `req_${uuidv4()}`
}

/**
 * Middleware to add request ID and timing to all requests
 */
export async function withRequestId(request: NextRequest, handler: (req: NextRequest, requestId: string) => Promise<Response>) {
  const requestId = generateRequestId()
  const startTime = Date.now()

  try {
    const response = await handler(request, requestId)
    const duration = Date.now() - startTime

    // Log successful request
    const status = response.status
    logger.logRequest(request.method, request.nextUrl.pathname, status, duration)

    return response
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Request error', error as Error, {
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      duration,
    })

    throw error
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request?: NextRequest): Promise<{ userId: string; email: string; role: string; name: string }> {
  const user = await getAuthUser()

  if (!user) {
    throw new AppError(ErrorCode.AUTH_MISSING, 'Tizimga kirilmagan', 401)
  }

  return user
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(): Promise<any> {
  const user = await getCurrentUserFresh()

  if (!user) {
    throw new AppError(ErrorCode.AUTH_MISSING, 'Tizimga kirilmagan', 401)
  }

  if (user.role !== 'admin') {
    throw new AppError(ErrorCode.AUTH_INSUFFICIENT_ROLE, 'Ruxsat berilmagan', 403)
  }

  return user
}

/**
 * Middleware to require super admin role
 */
export async function requireSuperAdmin(): Promise<any> {
  const user = await getCurrentUserFresh()

  if (!user) {
    throw new AppError(ErrorCode.AUTH_MISSING, 'Tizimga kirilmagan', 401)
  }

  // Super admin check (can be expanded with database flag if needed)
  if (user.role !== 'admin') {
    throw new AppError(ErrorCode.AUTH_INSUFFICIENT_ROLE, 'Super admin ruxsati talab qilinadi', 403)
  }

  return user
}

/**
 * Wrap async route handler with error catching
 */
export function withErrorHandler(handler: (req: NextRequest, requestId: string) => Promise<Response>) {
  return async (req: NextRequest) => {
    const requestId = generateRequestId()
    const startTime = Date.now()

    try {
      const response = await handler(req, requestId)
      const duration = Date.now() - startTime

      // Extract status from response
      const status = response.status
      logger.logRequest(req.method, req.nextUrl.pathname, status, duration)

      // Add request ID to response headers if not already present
      const responseHeaders = new Headers(response.headers)
      responseHeaders.set('X-Request-ID', requestId)

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    } catch (error: any) {
      const duration = Date.now() - startTime

      if (error instanceof AppError) {
        logger.warn(`API Error: ${error.code}`, {
          requestId,
          code: error.code,
          message: error.message,
          duration,
        })
        return sendErrorResponse(error, requestId)
      }

      // Log unexpected errors
      logger.error('Unexpected error in API handler', error, {
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        duration,
      })

      return sendErrorResponse(new AppError(ErrorCode.INTERNAL_ERROR, 'Tizim xatoligi yuz berdi', 500), requestId)
    }
  }
}

/**
 * Validate JSON body with Zod schema
 */
export async function parseAndValidate<T>(
  request: Request,
  schema: any
): Promise<T> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.errors.forEach((err: any) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Kiritilgan ma\'lumot noto\'g\'ri', 400, errors)
    }

    return result.data
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(ErrorCode.INVALID_INPUT, 'Noto\'g\'ri JSON format', 400)
  }
}

/**
 * CORS middleware for allowing cross-origin requests
 */
export function withCORS(request: NextRequest, response: Response, allowedOrigins: string[] = ['localhost:3000']) {
  const origin = request.headers.get('origin') || ''
  const isAllowedOrigin = allowedOrigins.some((allowed) => origin.includes(allowed))

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  return response
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

/**
 * Rate limit checker using database-backed RateLimitHit
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  prisma: any
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - windowMs)

  // Count requests in window
  const count = await prisma.rateLimitHit.count({
    where: {
      key,
      createdAt: { gte: windowStart },
    },
  })

  const allowed = count < maxRequests
  const remaining = Math.max(0, maxRequests - count - 1)
  const oldestHit = await prisma.rateLimitHit.findFirst({
    where: {
      key,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: 'asc' },
  })

  const resetAt = oldestHit ? new Date(oldestHit.createdAt.getTime() + windowMs) : new Date(Date.now() + windowMs)

  // Record this hit if still under limit
  if (allowed) {
    await prisma.rateLimitHit.create({
      data: { key },
    })
  }

  return { allowed, remaining, resetAt }
}

/**
 * Clean up old rate limit records (background task)
 */
export async function cleanupRateLimitRecords(prisma: any, olderThanMs: number = 24 * 60 * 60 * 1000) {
  const cutoffDate = new Date(Date.now() - olderThanMs)

  const deleted = await prisma.rateLimitHit.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  })

  logger.info('Rate limit cleanup', { recordsDeleted: deleted.count })
}
