import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'
import { encryptSecret, decryptSecret } from '@/lib/crypto'
import { maskKey } from '@/lib/admin-helpers'
import { withErrorHandler } from '@/lib/middleware'
import { logger } from '@/lib/logger'
import { sendErrorResponse, AppError, ValidationError, ErrorCode } from '@/lib/errors'
import { CreateProviderSchema, validateInput } from '@/lib/schemas'
import { successResponse } from '@/lib/request-utils'
import { aiProviderManager } from '@/lib/ai-provider-manager'

/**
 * GET /api/admin/providers - List all providers with masked API keys
 */
async function handleGET(req: NextRequest, requestId: string): Promise<Response> {
  const admin = await requireAdmin()
  const requestLogger = logger.child({ userId: admin.id, requestId, endpoint: '/api/admin/providers', method: 'GET' })

  try {
    const providers = await prisma.aiProvider.findMany({
      select: {
        id: true,
        name: true,
        baseUrl: true,
        apiKey: true,
        createdAt: true,
        models: {
          select: {
            id: true,
            modelId: true,
            displayName: true,
            active: true,
            priority: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Mask API keys for security
    const masked = providers.map((p) => {
      let preview: string
      let needsMigration: boolean
      try {
        preview = maskKey(decryptSecret(p.apiKey))
        needsMigration = false
      } catch {
        // Legacy row not yet migrated
        preview = maskKey(p.apiKey)
        needsMigration = true
      }
      return { ...p, apiKey: preview, needsMigration }
    })

    requestLogger.info('Listed providers', { count: masked.length })
    return successResponse({ providers: masked })
  } catch (error) {
    requestLogger.error('Failed to list providers', error as Error)
    throw error
  }
}

/**
 * POST /api/admin/providers - Create new provider
 */
async function handlePOST(req: NextRequest, requestId: string): Promise<Response> {
  const admin = await requireAdmin()
  const requestLogger = logger.child({ userId: admin.id, requestId, endpoint: '/api/admin/providers', method: 'POST' })

  try {
    // Parse and validate input
    let body: any
    try {
      body = await req.json()
    } catch {
      throw new ValidationError('Noto\'g\'ri JSON format')
    }

    const validation = validateInput(CreateProviderSchema, body)
    if (!validation.success) {
      throw new ValidationError('Kiritilgan ma\'lumot noto\'g\'ri', validation.errors)
    }

    const { name, baseUrl, apiKey } = validation.data

    // Check if provider already exists
    const existing = await prisma.aiProvider.findUnique({
      where: { name },
    })

    if (existing) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Bunday nomli provayder allaqachon mavjud', 400)
    }

    // Create provider with encrypted API key
    const provider = await prisma.aiProvider.create({
      data: {
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        apiKey: encryptSecret(apiKey.trim()),
      },
      include: {
        models: true,
      },
    })

    requestLogger.audit('create_provider', {
      providerId: provider.id,
      name: provider.name,
    })

    return successResponse(
      {
        provider: {
          ...provider,
          apiKey: maskKey(apiKey),
        },
      },
      201
    )
  } catch (error) {
    requestLogger.error('Failed to create provider', error as Error)
    throw error
  }
}

export const GET = withErrorHandler(handleGET)
export const POST = withErrorHandler(handlePOST)
