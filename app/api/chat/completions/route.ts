import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, getCurrentUserFresh } from '@/lib/auth'
import { decryptSecret } from '@/lib/crypto'
import { sanitizeChatMessages } from '@/lib/sanitize-messages'
import { createApiHandler, parseStreamingResponse } from '@/lib/request-utils'
import { generateRequestId, withErrorHandler, checkRateLimit } from '@/lib/middleware'
import { logger } from '@/lib/logger'
import { AppError, ErrorCode, AuthError, ValidationError, RateLimitError, NotFoundError, ForbiddenError, sendErrorResponse } from '@/lib/errors'
import { ChatCompletionSchema, validateInput } from '@/lib/schemas'
import { aiProviderManager } from '@/lib/ai-provider-manager'

const PROVIDER_TIMEOUT_MS = 30_000

async function handleChatCompletion(req: NextRequest, requestId: string): Promise<Response> {
  // 1. Authentication
  const user = await getAuthUser()
  if (!user) {
    throw new AuthError('Tizimga kirilmagan')
  }

  const dbUser = await getCurrentUserFresh()
  if (!dbUser) {
    throw new NotFoundError('Foydalanuvchi topilmadi')
  }

  if (dbUser.banned) {
    throw new ForbiddenError('Sizning hisobingiz bloklangan')
  }

  const requestLogger = logger.child({ userId: user.userId, requestId, endpoint: '/api/chat/completions' })

  // 2. Parse and validate input
  let body: any
  try {
    body = await req.json()
  } catch (error) {
    throw new ValidationError('Noto\'g\'ri JSON format')
  }

  const validation = validateInput(ChatCompletionSchema, body)
  if (!validation.success) {
    throw new ValidationError('Kiritilgan ma\'lumot noto\'g\'ri', validation.errors)
  }

  const { chatId, messages: rawMessages, modelId, imageUrl } = validation.data

  // Sanitize messages (prevent prompt injection)
  const messages = sanitizeChatMessages(rawMessages)
  if (messages.length === 0) {
    throw new ValidationError('Xabarlar tarixi talab qilinadi')
  }

  // 3. Verify IDOR - ensure chat belongs to user
  if (chatId) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } })
    if (!chat) {
      throw new NotFoundError('Chat topilmadi', ErrorCode.CHAT_NOT_FOUND)
    }
    if (chat.userId !== user.userId) {
      throw new ForbiddenError()
    }
  }

  // 4. Rate limiting check
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

    const resetAt = oldestLog
      ? new Date(oldestLog.createdAt.getTime() + limitHours * 60 * 60 * 1000)
      : new Date(Date.now() + limitHours * 60 * 60 * 1000)

    requestLogger.logRateLimit(limitCount, limitHours)
    throw new RateLimitError('Rate limitga yetdingiz', resetAt, 0)
  }

  // 5. Sync models and prepare for AI call
  await aiProviderManager.syncModels(prisma)

  // 6. Format messages for AI call
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

  // 7. Call AI provider with automatic fallback
  const startTime = Date.now()
  let accumulatedText = ''
  let selectedModel: any = null

  try {
    // Build the options for AI provider manager
    const aiOptions = {
      messages: formattedMessages,
      model: modelId || 'default',
      stream: true,
      timeout: PROVIDER_TIMEOUT_MS,
    }

    // Get the list of models from AI provider manager
    const models = aiProviderManager.getActiveModels()
    if (models.length === 0) {
      throw new AppError(ErrorCode.NO_ACTIVE_MODELS, 'Tizimda faol AI modellari topilmadi', 500)
    }

    // Prioritize requested model if specified
    let prioritizedModels = [...models]
    if (modelId) {
      const requested = models.find((m) => m.id === modelId || m.modelId === modelId)
      if (requested) {
        prioritizedModels = [requested, ...models.filter((m) => m.id !== requested.id)]
      }
    }

    // Try models in priority order
    let lastError: any = null
    for (const model of prioritizedModels) {
      try {
        const payload = {
          model: model.modelId,
          messages: formattedMessages,
          stream: true,
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

        let res: Response
        try {
          res = await fetch(`${model.provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${decryptSecret(model.provider.apiKey)}`,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timeoutId)
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => '')
          const errorMsg = `HTTP ${res.status}: ${errText || res.statusText}`
          throw new Error(errorMsg)
        }

        // Stream response
        accumulatedText = await parseStreamingResponse(res)
        selectedModel = model
        break
      } catch (err: any) {
        lastError = err
        const errorMsg =
          err.name === 'AbortError'
            ? `Timeout: ${PROVIDER_TIMEOUT_MS / 1000}s ichida javob bermadi`
            : err.message || 'Connection error'

        requestLogger.warn(`Model call failed, trying fallback`, {
          model: model.modelId,
          provider: model.provider.name,
          error: errorMsg,
        })

        // Log failure
        await prisma.usageLog.create({
          data: {
            userId: user.userId,
            modelName: model.displayName,
            providerName: model.provider.name,
            success: false,
            errorMessage: errorMsg,
            latencyMs: Date.now() - startTime,
          },
        })

        continue
      }
    }

    if (!selectedModel) {
      throw new AppError(
        ErrorCode.AI_ALL_PROVIDERS_FAILED,
        `Barcha AI modellari xatolik berdi. Oxirgi xato: ${lastError?.message || 'Noma\'lum'}`,
        500
      )
    }

    // 8. Save messages to database
    const latencyMs = Date.now() - startTime
    const inputCharCount = JSON.stringify(formattedMessages).length
    const outputCharCount = accumulatedText.length
    const inputTokens = Math.ceil(inputCharCount / 4)
    const outputTokens = Math.ceil(outputCharCount / 4)

    if (chatId) {
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

    // Log success
    await prisma.usageLog.create({
      data: {
        userId: user.userId,
        modelName: selectedModel.displayName,
        providerName: selectedModel.provider.name,
        inputTokens,
        outputTokens,
        latencyMs,
        success: true,
      },
    })

    requestLogger.info('Chat completion successful', {
      inputTokens,
      outputTokens,
      latencyMs,
      model: selectedModel.modelId,
    })

    return NextResponse.json({
      success: true,
      data: {
        content: accumulatedText,
        model: selectedModel.modelId,
        provider: selectedModel.provider.name,
        tokens: { input: inputTokens, output: outputTokens },
        latencyMs,
      },
    })
  } catch (error: any) {
    requestLogger.error('Chat completion failed', error)
    throw error
  }
}

export const POST = withErrorHandler(handleChatCompletion)
