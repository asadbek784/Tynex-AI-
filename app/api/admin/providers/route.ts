// FIX: apiKey is now encrypted at rest (AES-256-GCM) before being written,
// decrypted only server-side to build the masked preview, and checkAdmin()
// was replaced with the shared requireAdminOrError() helper.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrError } from '@/lib/require-admin'
import { encryptSecret, decryptSecret } from '@/lib/crypto'
import { maskKey } from '@/lib/admin-helpers'

// GET /api/admin/providers - List all providers
export async function GET() {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const providers = await prisma.aiProvider.findMany({
      select: {
        id: true,
        name: true,
        baseUrl: true,
        apiKey: true,
        createdAt: true,
        models: true,
      },
      orderBy: { name: 'asc' },
    })

    // FIX: never send the full API key to the client. Decrypt server-side
    // only long enough to build a short masked preview; the real value
    // never leaves the server.
    const masked = providers.map((p) => {
      let preview: string
      let needsMigration = false
      try {
        preview = maskKey(decryptSecret(p.apiKey))
      } catch {
        // Legacy row not yet migrated by scripts/encrypt-existing-keys.ts —
        // fall back to masking the raw stored value so the admin panel
        // doesn't break, and flag it so the UI can warn the admin.
        preview = maskKey(p.apiKey)
        needsMigration = true
      }
      return { ...p, apiKey: preview, needsMigration }
    })

    return NextResponse.json({ success: true, providers: masked })
  } catch (error: any) {
    console.error('Fetch providers error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}

// POST /api/admin/providers - Create a new provider
export async function POST(req: Request) {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const { name, baseUrl, apiKey } = await req.json()

    if (!name || !baseUrl || !apiKey) {
      return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 })
    }

    const trimmedKey = apiKey.trim()

    const provider = await prisma.aiProvider.create({
      data: {
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        apiKey: encryptSecret(trimmedKey),
      },
    })

    return NextResponse.json({
      success: true,
      provider: { ...provider, apiKey: maskKey(trimmedKey) },
    })
  } catch (error: any) {
    console.error('Create provider error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Bunday nomli provayder allaqachon mavjud' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
