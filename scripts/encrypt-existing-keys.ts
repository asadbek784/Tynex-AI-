// FIX: one-off migration for existing AiProvider rows that still hold a
// plaintext apiKey from before AES-256-GCM encryption was introduced
// (see lib/crypto.ts). Safe to run multiple times — rows that already
// look encrypted are left untouched.
//
// Usage:
//   pnpm migrate:encrypt-keys
// (make sure DATABASE_URL and API_KEY_ENCRYPTION_SECRET are set in .env first)

// FIX (bug): standalone scripts don't get .env auto-loaded by Next.js like
// route handlers do — without this, DATABASE_URL / API_KEY_ENCRYPTION_SECRET
// would be undefined even though they're correctly set in .env.
import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { encryptSecret, looksEncrypted } from '../lib/crypto'

async function main() {
  const providers = await prisma.aiProvider.findMany({
    select: { id: true, name: true, apiKey: true },
  })

  let migrated = 0
  let skipped = 0

  for (const provider of providers) {
    if (looksEncrypted(provider.apiKey)) {
      skipped++
      continue
    }

    const encrypted = encryptSecret(provider.apiKey)
    await prisma.aiProvider.update({
      where: { id: provider.id },
      data: { apiKey: encrypted },
    })
    migrated++
    console.log(`Encrypted apiKey for provider "${provider.name}" (${provider.id})`)
  }

  console.log(`Done. Encrypted: ${migrated}, already encrypted (skipped): ${skipped}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
