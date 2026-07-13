import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/chats - Get all chats of the authenticated user
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Tizimga kirilmagan' }, { status: 401 })
    }

    const chats = await prisma.chat.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, chats })
  } catch (error: any) {
    console.error('Fetch chats error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}

// POST /api/chats - Create a new chat
export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Tizimga kirilmagan' }, { status: 401 })
    }

    const { title } = await req.json().catch(() => ({ title: '' }))
    const chatTitle = title?.trim() || 'Yangi chat'

    const chat = await prisma.chat.create({
      data: {
        userId: user.userId,
        title: chatTitle,
      },
    })

    return NextResponse.json({ success: true, chat })
  } catch (error: any) {
    console.error('Create chat error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
