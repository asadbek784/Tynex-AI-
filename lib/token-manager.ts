import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { logger } from './logger'
import { AppError, ErrorCode } from './errors'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'
const REFRESH_TOKEN_DB_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface JWTPayload {
  userId: string
  email: string
  role: string
  name: string
  type: 'access' | 'refresh'
}

/**
 * Token Manager - Handles JWT token generation, validation, and refresh
 * Implements access token + refresh token pattern for security
 */
export class TokenManager {
  private jwtSecret: string

  constructor() {
    const secret = process.env.AUTH_SECRET
    if (!secret || secret.length < 16) {
      throw new Error(
        'AUTH_SECRET environment variable is missing or too short. Set it to a long random string before starting the app.'
      )
    }
    this.jwtSecret = secret
  }

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    const tokenPayload = { ...payload, type: 'access' as const }
    return jwt.sign(tokenPayload, this.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY })
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    const tokenPayload = { ...payload, type: 'refresh' as const }
    return jwt.sign(tokenPayload, this.jwtSecret, { expiresIn: REFRESH_TOKEN_EXPIRY })
  }

  /**
   * Verify and decode token
   */
  verifyToken(token: string, type?: 'access' | 'refresh'): JWTPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JWTPayload

      if (type && payload.type !== type) {
        return null
      }

      return payload
    } catch (error) {
      return null
    }
  }

  /**
   * Create new refresh token record in database
   * Useful for token revocation and device tracking
   */
  async storeRefreshToken(userId: string, token: string, deviceId?: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token')
      }

      const expiresAt = new Date(decoded.exp * 1000)

      // Store in database (optional: for revocation/tracking)
      await prisma.refreshToken.create({
        data: {
          userId,
          token: this.hashToken(token),
          deviceId: deviceId || 'unknown',
          expiresAt,
        },
      })

      logger.debug('Refresh token stored', { userId, expiresAt })
    } catch (error) {
      logger.error('Failed to store refresh token', error as Error, { userId })
      // Don't throw - refresh token storage failure shouldn't break auth
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string, userId: string): Promise<void> {
    try {
      const tokenHash = this.hashToken(token)

      await prisma.refreshToken.deleteMany({
        where: {
          token: tokenHash,
          userId,
        },
      })

      logger.audit('Token revoked', { userId })
    } catch (error) {
      logger.error('Failed to revoke refresh token', error as Error, { userId })
    }
  }

  /**
   * Revoke all user refresh tokens (logout all devices)
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    try {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      })

      logger.audit('All user tokens revoked', { userId })
    } catch (error) {
      logger.error('Failed to revoke all tokens', error as Error, { userId })
    }
  }

  /**
   * Verify stored refresh token
   */
  async verifyStoredRefreshToken(token: string, userId: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token)

      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: tokenHash,
          userId,
          expiresAt: { gt: new Date() },
        },
      })

      return !!storedToken
    } catch (error) {
      logger.error('Failed to verify stored refresh token', error as Error, { userId })
      return false
    }
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      })

      logger.info('Expired tokens cleaned up', { count: result.count })
      return result.count
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', error as Error)
      return 0
    }
  }

  /**
   * Hash token for storage (simple SHA256)
   */
  private hashToken(token: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.slice(7)
  }
}

export const tokenManager = new TokenManager()
