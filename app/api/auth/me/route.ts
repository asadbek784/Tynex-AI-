import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const userPayload = await getAuthUser()
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Tizimga kirilmagan' },
        { status: 401 }
      )
    }

    // Double check user status in DB (e.g. if banned or role changed)
    const dbUser = await prisma.user.findUnique({
      where: { id: userPayload.userId },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Foydalanuvchi topilmadi' },
        { status: 404 }
      )
    }

    if (dbUser.banned) {
      return NextResponse.json(
        { error: 'Sizning hisobingiz bloklangan' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      },
    })
  } catch (error: any) {
    // console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Tizim xatoligi yuz berdi' },
      { status: 500 }
    )
  }
}
