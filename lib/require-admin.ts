import { NextResponse } from 'next/server'
import { getCurrentUserFresh } from './auth'

type AdminUser = NonNullable<Awaited<ReturnType<typeof getCurrentUserFresh>>>

type RequireAdminResult =
  | { user: AdminUser; error: null }
  | { user: null; error: NextResponse }

// FIX: every app/api/admin/* route used to redefine an identical local
// checkAdmin() helper. Centralized here — behavior is unchanged: no
// session -> 401 "Tizimga kirilmagan", non-admin -> 403 "Ruxsat berilmagan".
export async function requireAdminOrError(): Promise<RequireAdminResult> {
  const user = await getCurrentUserFresh()

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Tizimga kirilmagan' }, { status: 401 }),
    }
  }

  if (user.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 }),
    }
  }

  return { user, error: null }
}
