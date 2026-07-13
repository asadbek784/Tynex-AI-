import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, setAuthCookie } from '@/lib/auth'
import { isRateLimited } from '@/lib/totp'

export async function POST(req: Request) {
  try {
    // FIX: throttle login attempts per IP to prevent password brute-forcing.
    // Namespaced with "login:" so this counter never mixes with the
    // separate admin-code rate limiter in the register route.
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    // FIX: isRateLimited is now async (Postgres-backed) — await it.
    if (await isRateLimited(`login:${ip}`)) {
      return NextResponse.json(
        { error: 'Juda ko\'p urinish. Bir necha daqiqadan keyin qayta urinib ko\'ring.' },
        { status: 429 }
      )
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email va parol kiritilishi shart' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // FIX: always run the bcrypt comparison (against a dummy hash if the
    // user doesn't exist) so the response time is the same either way —
    // this removes the timing side-channel that let an attacker tell
    // valid emails apart from invalid ones just from how fast the API
    // responded.
    const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Nrik/4S4RIhdBM.SNPqNc7O2dh0Bm'
    const isMatch = await comparePassword(password, user?.passwordHash || DUMMY_HASH)

    if (!user || !isMatch) {
      return NextResponse.json(
        { error: 'Email yoki parol noto\'g\'ri' },
        { status: 401 }
      )
    }

    if (user.banned) {
      return NextResponse.json(
        { error: 'Sizning hisobingiz bloklangan. Admin bilan bog\'laning' },
        { status: 403 }
      )
    }

    // Set authentication session cookie
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }
    await setAuthCookie(payload)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Tizim xatoligi yuz berdi' },
      { status: 500 }
    )
  }
}
