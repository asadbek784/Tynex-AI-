import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Tizimga kirilmagan' }, { status: 401 })
    }

    const models = await prisma.aiModel.findMany({
      where: { active: true },
      // FIX: `modelId` (the real technical model name, e.g.
      // "llama-3.3-70b-versatile" or "gpt-4o") must never reach the
      // client — only the TYNEX-branded `displayName` is safe to expose.
      select: {
        id: true,
        displayName: true,
        priority: true,
      },
      orderBy: { priority: 'asc' },
    })

    return NextResponse.json({ success: true, models })
  } catch (error: any) {
    console.error('Fetch active models error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
