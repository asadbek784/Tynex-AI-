import crypto from 'crypto'

// FIX: AiProvider.apiKey used to be stored in plaintext in the database.
// These helpers encrypt/decrypt it with AES-256-GCM so a database leak
// alone is no longer enough to obtain usable provider credentials.

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV, the recommended size for GCM

// No insecure fallback: if API_KEY_ENCRYPTION_SECRET isn't set (or isn't a
// valid 32-byte base64 key), every encrypt/decrypt call fails loudly instead
// of silently doing something insecure — same style as auth.ts's
// getJwtSecret().
function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!secret) {
    throw new Error(
      'API_KEY_ENCRYPTION_SECRET environment variable is missing. Generate one with: openssl rand -base64 32'
    )
  }

  let key: Buffer
  try {
    key = Buffer.from(secret, 'base64')
  } catch {
    throw new Error(
      'API_KEY_ENCRYPTION_SECRET must be valid base64. Generate one with: openssl rand -base64 32'
    )
  }

  if (key.length !== 32) {
    throw new Error(
      'API_KEY_ENCRYPTION_SECRET must decode to exactly 32 bytes. Generate one with: openssl rand -base64 32'
    )
  }

  return key
}

/**
 * Encrypts a plaintext secret (e.g. a provider API key) for storage.
 * Output format: "iv:authTag:cipherText", all three parts base64-encoded
 * and joined with ':'.
 */
export function encryptSecret(plain: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

/**
 * Decrypts a value previously produced by encryptSecret. Throws if the
 * format doesn't match or if the auth tag fails to verify (tampering or
 * wrong key).
 */
export function decryptSecret(cipherText: string): string {
  const key = getEncryptionKey()
  const parts = cipherText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format, expected "iv:authTag:cipherText"')
  }

  const [ivB64, authTagB64, dataB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Best-effort check for whether a stored value is already in
 * encryptSecret's "iv:authTag:cipherText" shape. Used by the one-off
 * migration script to avoid double-encrypting rows that were already
 * migrated.
 */
export function looksEncrypted(value: string): boolean {
  const parts = value.split(':')
  if (parts.length !== 3) return false
  const base64Re = /^[A-Za-z0-9+/]+=*$/
  return parts.every((p) => p.length > 0 && base64Re.test(p))
}
