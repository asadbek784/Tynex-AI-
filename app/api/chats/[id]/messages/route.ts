import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type Params = {
  params: Promise<{
    id: string
  }>
}

// GET /api/chats/[id]/messages - Get all messages of a chat
export async function GET(req: Request, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Tizimga kirilmagan' }, { status: 401 })
    }

    const { id: chatId } = await params

    // Check ownership of the chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat topilmadi' }, { status: 404 })
    }

    if (chat.userId !== user.userId) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ success: true, messages })
  } catch (error: any) {
    // console.error('Fetch messages error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
