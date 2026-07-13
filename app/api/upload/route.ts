import { NextResponse } from 'next/server'
import { getCurrentUserFresh } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// FIX: files are no longer written to the local filesystem (which is
// ephemeral/unreliable on Vercel's serverless runtime and would silently
// lose uploaded images). They're uploaded to Supabase Storage instead,
// which is already part of this project's stack.
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY environment variable topilmadi'
    )
  }
  return createClient(url, serviceKey)
}

const BUCKET = 'uploads'
const MAX_SIZE = 8 * 1024 * 1024 // 8MB

// FIX: never trust the client-supplied `file.type`. Detect the real format
// from the file's first bytes ("magic numbers") instead. SVG is
// intentionally not supported — it can embed executable JavaScript and is
// a common stored-XSS vector when served back from the same origin.
function detectImageType(buffer: Buffer): 'png' | 'jpeg' | 'gif' | 'webp' | null {
  if (buffer.length < 12) return null

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png'
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg'
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'gif'
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp'
  }
  return null
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate user (fresh DB check so banned users are blocked immediately)
    const user = await getCurrentUserFresh()
    if (!user) {
      return NextResponse.json({ error: 'Tizimga kirilmagan' }, { status: 401 })
    }

    // 2. Parse Multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fayl hajmi 8MB dan katta bo\'lmasligi kerak' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 3. FIX: verify the real file type from its content, not the
    // client-supplied MIME string, and derive the saved extension from
    // that — never from the user's original filename.
    const detectedType = detectImageType(buffer)
    if (!detectedType) {
      return NextResponse.json(
        { error: 'Faqat PNG, JPEG, GIF yoki WEBP rasm fayllari ruxsat etiladi' },
        { status: 400 }
      )
    }

    const uniqueFileName = `${user.id}/${crypto.randomUUID()}.${detectedType}`

    const supabase = getSupabaseClient()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueFileName, buffer, {
        contentType: `image/${detectedType}`,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Fayl yuklashda xatolik yuz berdi' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(uniqueFileName)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    })
  } catch (error: any) {
    console.error('File upload api error:', error)
    return NextResponse.json({ error: 'Fayl yuklashda xatolik yuz berdi' }, { status: 500 })
  }
}
