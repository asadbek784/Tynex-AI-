import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, setAuthCookie } from '@/lib/auth'
import { verifyAdminCode, isRateLimited } from '@/lib/totp'

export async function POST(req: Request) {
  try {
    const { email, password, name, adminCode } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, parol va ism kiritilishi shart' },
        { status: 400 }
      )
    }

    // FIX: minimal server-side validation — previously any string was
    // accepted as an "email" and any 1-character string as a "password".
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email formati noto\'g\'ri' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Parol kamida 8 belgidan iborat bo\'lishi shart' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bunday email bilan foydalanuvchi allaqachon mavjud' },
        { status: 400 }
      )
    }

    // Admin access is granted ONLY via a valid, time-based 6-digit code
    // generated from ADMIN_TOTP_SECRET (e.g. in Google Authenticator).
    // Being "the first user" no longer grants admin — a stray or malicious
    // sign-up can never accidentally become an administrator.
    let role: 'admin' | 'user' = 'user'
    if (adminCode) {
      const ip = req.headers.get('x-forwarded-for') || 'unknown'
      // FIX: isRateLimited is now async (Postgres-backed) — await it.
      if (await isRateLimited(ip)) {
        return NextResponse.json(
          { error: 'Juda ko\'p urinish. Bir necha daqiqadan keyin qayta urinib ko\'ring.' },
          { status: 429 }
        )
      }
      if (verifyAdminCode(adminCode)) {
        role = 'admin'
      } else {
        return NextResponse.json({ error: 'Admin kod noto\'g\'ri' }, { status: 403 })
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role,
        banned: false,
      },
    })

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
    // console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Tizim xatoligi yuz berdi' },
      { status: 500 }
    )
  }
}
