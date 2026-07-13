import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { decryptSecret } from '@/lib/crypto'
import { sanitizeChatMessages } from '@/lib/sanitize-messages'

const PROVIDER_TIMEOUT_MS = 30_000

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Tizimga kirilmagan' }, { status: 401 })
    }

    // Double check user in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })
    }

    if (dbUser.banned) {
      return NextResponse.json({ error: 'Sizning hisobingiz bloklangan' }, { status: 403 })
    }

    // 2. Parse request body
    const { chatId, messages: rawMessages, modelId, imageUrl } = await req.json()

    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: 'Xabarlar tarixi talab qilinadi' }, { status: 400 })
    }

    // Cap payload size to prevent abuse (large forged history / cost bombs)
    if (rawMessages.length > 100) {
      return NextResponse.json({ error: 'Xabarlar soni juda ko\'p' }, { status: 400 })
    }

    // FIX (prompt injection): client-supplied message roles are restricted
    // to "user"/"assistant" and content is validated/length-capped — see
    // lib/sanitize-messages.ts. Without this, a client could pass
    // role:"system" and inject arbitrary instructions into the model call.
    const messages = sanitizeChatMessages(rawMessages)
    if (messages.length === 0) {
      return NextResponse.json({ error: 'Xabarlar tarixi talab qilinadi' }, { status: 400 })
    }

    // 2b. FIX (IDOR): if a chatId was supplied, verify it actually belongs
    // to the authenticated user before writing anything to it. Without this,
    // any logged-in user could pass someone else's chatId and inject
    // messages into their conversation.
    if (chatId) {
      const chat = await prisma.chat.findUnique({ where: { id: chatId } })
      if (!chat) {
        return NextResponse.json({ error: 'Chat topilmadi' }, { status: 404 })
      }
      if (chat.userId !== user.userId) {
        return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
      }
    }

    // 3. Rate limiting check
    const rateLimitCountSetting = await prisma.settings.findUnique({ where: { key: 'rate_limit_count' } })
    const rateLimitHoursSetting = await prisma.settings.findUnique({ where: { key: 'rate_limit_hours' } })

    const limitCount = Number(rateLimitCountSetting?.value || '25')
    const limitHours = Number(rateLimitHoursSetting?.value || '3')

    const windowStart = new Date(Date.now() - limitHours * 60 * 60 * 1000)

    const usageCount = await prisma.usageLog.count({
      where: {
        userId: user.userId,
        success: true,
        createdAt: { gte: windowStart },
      },
    })

    if (usageCount >= limitCount) {
      const oldestLog = await prisma.usageLog.findFirst({
        where: {
          userId: user.userId,
          success: true,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'asc' },
      })

      const nextResetTime = oldestLog
        ? new Date(oldestLog.createdAt.getTime() + limitHours * 60 * 60 * 1000)
        : new Date(Date.now() + limitHours * 60 * 60 * 1000)

      return NextResponse.json(
        {
          error: 'Rate limitga yetdingiz',
          limit: limitCount,
          hours: limitHours,
          resetAt: nextResetTime.toISOString(),
        },
        { status: 429 }
      )
    }

    // 4. Build Fallback sequence
    const activeModels = await prisma.aiModel.findMany({
      where: { active: true },
      include: { provider: true },
      orderBy: { priority: 'asc' },
    })

    if (activeModels.length === 0) {
      return NextResponse.json({ error: 'Tizimda faol AI modellari topilmadi' }, { status: 500 })
    }

    let tryList = [...activeModels]
    if (modelId) {
      const selectedModel = activeModels.find(
        (m: { id: string; modelId: string; displayName: string }) =>
          m.id === modelId || m.modelId === modelId || m.displayName === modelId
      )
      if (selectedModel) {
        tryList = [
          selectedModel,
          ...activeModels.filter((m: { id: string }) => m.id !== selectedModel.id),
        ]
      }
    }

    // 5. Format messages (Vision support if imageUrl is provided)
    const formattedMessages = messages.map((m: any, idx: number) => {
      // Vision model payload formatting for the last user message
      if (idx === messages.length - 1 && m.role === 'user' && imageUrl) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: m.content },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        }
      }
      return { role: m.role, content: m.content }
    })

    // FIX: prepend a system instruction so the underlying model never
    // reveals which provider/company actually powers it. TYNEX AI is
    // presented as a self-contained product, not a wrapper.
    const brandingSystemMessage = {
      role: 'system',
      content:
        "Sen TYNEX AI'san, TYNEX kompaniyasi tomonidan yaratilgan mustaqil AI yordamchisan. " +
        "Agar kimdir seni kim yaratgani, qaysi kompaniya yoki texnologiya asosida ishlashing, " +
        "qaysi model ekanligingni so'rasa, faqat 'Men TYNEX AI'man' deb javob ber. " +
        "Hech qachon OpenAI, Google, Gemini, GPT, Claude, Anthropic, Meta, Llama, DeepSeek, " +
        "Groq kabi tashqi provayder yoki model nomlarini aytma yoki tasdiqlama.",
    }
    formattedMessages.unshift(brandingSystemMessage)

    // 6. Sequential API attempt loop
    let successResponse: Response | null = null
    let selectedModelInstance: typeof tryList[0] | null = null
    let apiErrorMsg = ''
    let startTime = Date.now()

    for (const model of tryList) {
      try {
        startTime = Date.now()
        const payload = {
          model: model.modelId,
          messages: formattedMessages,
          stream: true,
        }

        // FIX: bound provider requests to 30s so a hung upstream provider
        // can't stall the whole request — on timeout, treat it like any
        // other failure and fall through to the next model in tryList.
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

        let res: Response
        try {
          res = await fetch(`${model.provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // FIX: provider.apiKey is now stored encrypted (AES-256-GCM);
              // decrypt it here, server-side, right before use.
              Authorization: `Bearer ${decryptSecret(model.provider.apiKey)}`,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timeoutId)
        }

        if (res.ok) {
          successResponse = res
          selectedModelInstance = model
          break
        } else {
          const errText = await res.text().catch(() => '')
          apiErrorMsg = `HTTP ${res.status}: ${errText || res.statusText}`
          console.error(`Model ${model.displayName} failed:`, apiErrorMsg)

          // Log failure
          await prisma.usageLog.create({
            data: {
              userId: user.userId,
              modelName: model.displayName,
              providerName: model.provider.name,
              success: false,
              errorMessage: apiErrorMsg,
              latencyMs: Date.now() - startTime,
            },
          })
        }
      } catch (err: any) {
        apiErrorMsg =
          err.name === 'AbortError'
            ? `Timeout: provayder ${PROVIDER_TIMEOUT_MS / 1000}s ichida javob bermadi`
            : err.message || 'Connection error'
        console.error(`Model ${model.displayName} request thrown:`, err)

        // Log failure
        await prisma.usageLog.create({
          data: {
            userId: user.userId,
            modelName: model.displayName,
            providerName: model.provider.name,
            success: false,
            errorMessage: apiErrorMsg,
            latencyMs: Date.now() - startTime,
          },
        })
      }
    }

    if (!successResponse || !selectedModelInstance) {
      return NextResponse.json(
        { error: `Barcha ulangan modellar xatolik berdi. Oxirgi xato: ${apiErrorMsg}` },
        { status: 500 }
      )
    }

    const finalModel = selectedModelInstance
    const start = startTime

    // 7. Streaming using Web ReadableStream
    const reader = successResponse.body?.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    if (!reader) {
      return NextResponse.json({ error: 'Streaming body topilmadi' }, { status: 500 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        let accumulatedText = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunkText = decoder.decode(value, { stream: true })
            controller.enqueue(encoder.encode(chunkText))

            // Parse chunk lines to accumulate text
            const lines = chunkText.split('\n')
            for (const line of lines) {
              const cleanLine = line.trim()
              if (cleanLine.startsWith('data: ') && cleanLine !== 'data: [DONE]') {
                try {
                  const parsed = JSON.parse(cleanLine.slice(6))
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  accumulatedText += content
                } catch (e) {
                  // Ignore JSON chunk parsing errors
                }
              }
            }
          }

          // Complete streaming successfully! Log usage & save message to DB.
          const end = Date.now()
          const latencyMs = end - start
          const inputCharCount = JSON.stringify(formattedMessages).length
          const outputCharCount = accumulatedText.length
          const inputTokens = Math.ceil(inputCharCount / 4)
          const outputTokens = Math.ceil(outputCharCount / 4)

          if (chatId) {
            // FIX: removed the broken "duplicate check" that used to skip
            // saving the user's message whenever identical text had been
            // sent before anywhere in the chat. The frontend only calls
            // this endpoint once per send, so we always persist it.
            const userMsgContent = messages[messages.length - 1]?.content || ''

            if (userMsgContent) {
              await prisma.message.create({
                data: {
                  chatId,
                  role: 'user',
                  content: userMsgContent,
                  imageUrl: imageUrl || null,
                },
              })
            }

            await prisma.message.create({
              data: {
                chatId,
                role: 'assistant',
                content: accumulatedText,
                hasCode: accumulatedText.includes('```'),
              },
            })

            // Update chat timestamp
            await prisma.chat.update({
              where: { id: chatId },
              data: { updatedAt: new Date() },
            })
          }

          // Log Usage Success
          await prisma.usageLog.create({
            data: {
              userId: user.userId,
              modelName: finalModel.displayName,
              providerName: finalModel.provider.name,
              inputTokens,
              outputTokens,
              latencyMs,
              success: true,
            },
          })
        } catch (err: any) {
          console.error('Error in streamer parsing loop:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('AI Gateway top-level error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
