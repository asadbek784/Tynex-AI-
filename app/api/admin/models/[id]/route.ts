// FIX: checkAdmin() replaced with the shared requireAdminOrError() helper.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrError } from '@/lib/require-admin'

type Params = {
  params: Promise<{
    id: string
  }>
}

// PUT /api/admin/models/[id] - Update model details
export async function PUT(req: Request, { params }: Params) {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const { modelId, displayName, active, priority } = await req.json()

    if (!modelId || !displayName) {
      return NextResponse.json({ error: 'Model ID va Ko\'rinadigan Nom talab qilinadi' }, { status: 400 })
    }

    const model = await prisma.aiModel.update({
      where: { id },
      data: {
        modelId: modelId.trim(),
        displayName: displayName.trim(),
        active: active !== undefined ? active : true,
        priority: priority !== undefined ? Number(priority) : 1,
      },
    })

    return NextResponse.json({ success: true, model })
  } catch (error: any) {
    console.error('Update model error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}

// DELETE /api/admin/models/[id] - Delete model
export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const { id } = await params

    await prisma.aiModel.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete model error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
