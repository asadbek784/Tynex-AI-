// FIX: checkAdmin() replaced with the shared requireAdminOrError() helper.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrError } from '@/lib/require-admin'

// GET /api/admin/models - Get all models
export async function GET() {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const models = await prisma.aiModel.findMany({
      include: {
        provider: {
          select: { name: true },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { displayName: 'asc' },
      ],
    })
    return NextResponse.json({ success: true, models })
  } catch (error: any) {
    console.error('Fetch models error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}

// POST /api/admin/models - Create a new model
export async function POST(req: Request) {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const { providerId, modelId, displayName, active, priority } = await req.json()

    if (!providerId || !modelId || !displayName) {
      return NextResponse.json({ error: 'Barcha majburiy maydonlar to\'ldirilishi shart' }, { status: 400 })
    }

    const model = await prisma.aiModel.create({
      data: {
        providerId,
        modelId: modelId.trim(),
        displayName: displayName.trim(),
        active: active !== undefined ? active : true,
        priority: priority !== undefined ? Number(priority) : 1,
      },
    })

    return NextResponse.json({ success: true, model })
  } catch (error: any) {
    console.error('Create model error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
