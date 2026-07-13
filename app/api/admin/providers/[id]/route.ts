// FIX: apiKey is now encrypted at rest (AES-256-GCM) before being written,
// the PUT response now masks apiKey the same way GET does (it used to leak
// the full key back to the client), and checkAdmin() was replaced with the
// shared requireAdminOrError() helper.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrError } from '@/lib/require-admin'
import { encryptSecret, decryptSecret } from '@/lib/crypto'
import { maskKey } from '@/lib/admin-helpers'

type Params = {
  params: Promise<{
    id: string
  }>
}

// PUT /api/admin/providers/[id] - Update provider
export async function PUT(req: Request, { params }: Params) {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const { name, baseUrl, apiKey } = await req.json()

    if (!name || !baseUrl || !apiKey) {
      return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 })
    }

    const trimmedKey = apiKey.trim()

    // FIX (bug): the admin panel's edit form pre-fills the apiKey input with
    // the masked preview from GET (e.g. "sk-a********"). If the admin saves
    // without touching that field, this used to overwrite the real stored
    // key with the unusable masked string. A masked preview always contains
    // '*' (real API keys never do), so treat that as "leave unchanged" and
    // keep the existing encrypted key instead of re-encrypting garbage.
    const isUnchangedMaskedValue = trimmedKey.includes('*')

    const provider = await prisma.aiProvider.update({
      where: { id },
      data: {
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        ...(isUnchangedMaskedValue ? {} : { apiKey: encryptSecret(trimmedKey) }),
      },
    })

    // If the key wasn't changed, mask the newly-read (still real) stored
    // key for the response instead of the placeholder that was submitted.
    let responseKeyPreview: string
    if (isUnchangedMaskedValue) {
      try {
        responseKeyPreview = maskKey(decryptSecret(provider.apiKey))
      } catch {
        responseKeyPreview = maskKey(provider.apiKey)
      }
    } else {
      responseKeyPreview = maskKey(trimmedKey)
    }

    return NextResponse.json({
      success: true,
      provider: { ...provider, apiKey: responseKeyPreview },
    })
  } catch (error: any) {
    // console.error('Update provider error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}

// DELETE /api/admin/providers/[id] - Delete provider
export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const { id } = await params

    await prisma.aiProvider.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // console.error('Delete provider error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
