// FIX: checkAdmin() replaced with the shared requireAdminOrError() helper,
// and PUT now rejects any "role" value other than "admin"/"user" instead
// of writing an arbitrary client-supplied string straight to the database.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrError } from '@/lib/require-admin'

// GET /api/admin/users - Get all users with optional search
export async function GET(req: Request) {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    // console.error('Fetch users error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}

// PUT /api/admin/users - Update user role or ban status
export async function PUT(req: Request) {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const { userId, role, banned } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Foydalanuvchi ID talab qilinadi' }, { status: 400 })
    }

    // FIX: role must be exactly "admin" or "user" — previously any string
    // was written straight to the database.
    if (role !== undefined && role !== 'admin' && role !== 'user') {
      return NextResponse.json({ error: 'Role qiymati noto\'g\'ri' }, { status: 400 })
    }

    // Check if modifying self
    if (userId === auth.user.id) {
      return NextResponse.json({ error: 'O\'zingizning profilingizni o\'zgartira olmaysiz' }, { status: 400 })
    }

    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })
    }

    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (banned !== undefined) updateData.banned = banned

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    // console.error('Update user status error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
