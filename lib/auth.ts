import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const COOKIE_NAME = 'tynex_session'

// No insecure fallback: if AUTH_SECRET isn't set, every JWT operation fails
// loudly instead of silently signing tokens with a publicly-known default.
function getJwtSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET environment variable is missing or too short. Set it to a long random string before starting the app.'
    )
  }
  return secret
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  name: string
}

// Password operations
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT operations
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload
  } catch (error) {
    return null
  }
}

// Cookie operations for Route Handlers
export async function setAuthCookie(payload: JWTPayload) {
  const token = signToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get(COOKIE_NAME)
    if (!tokenCookie || !tokenCookie.value) {
      return null
    }
    return verifyToken(tokenCookie.value)
  } catch (error) {
    return null
  }
}

/**
 * Like getAuthUser, but re-reads role/banned status from the database on
 * every call instead of trusting the (up to 7-day-old) JWT payload. Use this
 * anywhere a ban or role change must take effect immediately — most
 * importantly for every /api/admin/* route.
 */
export async function getCurrentUserFresh() {
  const payload = await getAuthUser()
  if (!payload) return null

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || user.banned) return null

  return user
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

export async function requireAdminFresh() {
  const user = await getCurrentUserFresh()
  if (!user) throw new AuthError('Tizimga kirilmagan', 401)
  if (user.role !== 'admin') throw new AuthError('Ruxsat berilmagan', 403)
  return user
}
