// FIX: this file's rate limiter is now backed by Postgres (see
// isRateLimited below) instead of an in-memory Map, so it survives across
// serverless instances/restarts.
import crypto from 'crypto'
import { prisma } from './prisma'

// Minimal, dependency-free TOTP (RFC 6238) implementation — compatible with
// Google Authenticator, Authy, and any standard authenticator app.
// Algorithm: HMAC-SHA1, 6 digits, 30-second time step (the universal default).

function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const clean = base32.toUpperCase().replace(/=+$/, '')
  let bits = ''
  for (const char of clean) {
    const val = alphabet.indexOf(char)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function generateCode(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigInt64BE(BigInt(counter))

  const hmac = crypto.createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return (code % 1_000_000).toString().padStart(6, '0')
}

/**
 * Verifies a 6-digit TOTP code against the admin setup secret.
 * Allows a +/-1 step tolerance (90s window) to account for clock drift.
 */
export function verifyAdminCode(code: string): boolean {
  const secret = process.env.ADMIN_TOTP_SECRET
  if (!secret) return false

  const cleaned = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(cleaned)) return false

  const step = Math.floor(Date.now() / 1000 / 30)
  for (const offset of [0, -1, 1]) {
    if (generateCode(secret, step + offset) === cleaned) return true
  }
  return false
}

// FIX: was an in-memory Map, which only works within a single warm
// serverless instance — every cold start (or a request landing on a
// different instance) silently reset the counter, making the limiter
// useless in production. Attempts are now counted in Postgres via the
// RateLimitHit model, so the limit holds across instances and restarts.
// Same 5-attempts-per-60-seconds behavior as before: the caller's namespaced
// "key" (e.g. "login:203.0.113.4") scopes each independent counter.
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60_000

export async function isRateLimited(key: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MS)

  const recentHits = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: windowStart } },
  })

  await prisma.rateLimitHit.create({ data: { key } })

  return recentHits >= MAX_ATTEMPTS
}
