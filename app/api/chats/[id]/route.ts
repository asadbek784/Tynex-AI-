import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type Params = {
  params: Promise<{
    id: string
  }>
}

// PUT /api/chats/[id] - Rename a chat
export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Tizimga kirilmagan' }, { status: 401 })
    }

    const { id } = await params
    const { title } = await req.json().catch(() => ({ title: '' }))

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Sarlavha bo\'sh bo\'lmasligi kerak' }, { status: 400 })
    }

    // Check ownership
    const chat = await prisma.chat.findUnique({
      where: { id },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat topilmadi' }, { status: 404 })
    }

    if (chat.userId !== user.userId) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
    }

    const updatedChat = await prisma.chat.update({
      where: { id },
      data: { title: title.trim() },
    })

    return NextResponse.json({ success: true, chat: updatedChat })
  } catch (error: any) {
    // console.error('Rename chat error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}

// DELETE /api/chats/[id] - Delete a chat
export async function DELETE(req: Request, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Tizimga kirilmagan' }, { status: 401 })
    }

    const { id } = await params

    // Check ownership
    const chat = await prisma.chat.findUnique({
      where: { id },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat topilmadi' }, { status: 404 })
    }

    if (chat.userId !== user.userId) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
    }

    await prisma.chat.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // console.error('Delete chat error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
