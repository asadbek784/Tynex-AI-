// FIX: checkAdmin() replaced with the shared requireAdminOrError() helper.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrError } from '@/lib/require-admin'

// GET /api/admin/settings - Get settings
export async function GET() {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const dbSettings = await prisma.settings.findMany()
    const settings: Record<string, string> = {
      rate_limit_count: '25',
      rate_limit_hours: '3',
      banner_message: '',
    }

    dbSettings.forEach((s: { key: string; value: string }) => {
      settings[s.key] = s.value
    })

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    // console.error('Fetch settings error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}

// POST /api/admin/settings - Update/Create settings
export async function POST(req: Request) {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const body = await req.json() // Expecting an object of key-values

    const updates = Object.entries(body).map(([key, value]) => {
      const valStr = String(value)
      return prisma.settings.upsert({
        where: { key },
        update: { value: valStr },
        create: { key, value: valStr },
      })
    })

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
