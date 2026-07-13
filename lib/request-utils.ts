import { NextRequest, NextResponse } from 'next/server'
import { AppError, sendErrorResponse } from './errors'
import { generateRequestId } from './middleware'
import { logger } from './logger'

/**
 * Parse and validate JSON body from request
 */
export async function getJsonBody(request: Request): Promise<any> {
  try {
    const text = await request.text()
    if (!text) return {}
    return JSON.parse(text)
  } catch (error) {
    throw new AppError(
      'INVALID_INPUT' as any,
      'Noto\'g\'ri JSON format',
      400
    )
  }
}

/**
 * Get authenticated user from request
 */
export async function getAuthUserFromRequest() {
  const { getAuthUser } = await import('./auth')
  return getAuthUser()
}

/**
 * Create standardized API handler
 */
export function createApiHandler(
  handler: (req: NextRequest, requestId: string) => Promise<NextResponse | Response>
) {
  return async (req: NextRequest) => {
    const requestId = generateRequestId()
    const startTime = Date.now()

    try {
      const response = await handler(req, requestId)
      const duration = Date.now() - startTime

      // Ensure headers include request ID
      const headers = new Headers(response.headers)
      headers.set('X-Request-ID', requestId)

      logger.logRequest(req.method, req.nextUrl.pathname, response.status, duration)

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error: any) {
      const duration = Date.now() - startTime

      if (error instanceof AppError) {
        logger.warn(`API Error [${error.code}]`, {
          message: error.message,
          duration,
          requestId,
        })
      } else {
        logger.error('Unexpected API error', error, {
          duration,
          requestId,
          method: req.method,
          path: req.nextUrl.pathname,
        })
      }

      return sendErrorResponse(error, requestId)
    }
  }
}

/**
 * Extract authorization token from headers
 */
export function getAuthToken(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return null
  }
  return auth.slice(7)
}

/**
 * Create successful response
 */
export function successResponse<T>(data: T, status: number = 200): Response {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  status: number = 200
): Response {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    },
    { status }
  )
}

/**
 * Extract pagination params from query
 */
export function getPaginationParams(searchParams: URLSearchParams): {
  page: number
  limit: number
  skip: number
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Extract query search params
 */
export function getSearchParams(
  searchParams: URLSearchParams
): {
  query: string
  page: number
  limit: number
  skip: number
} {
  const query = searchParams.get('q') || searchParams.get('query') || ''
  const { page, limit, skip } = getPaginationParams(searchParams)

  return { query, page, limit, skip }
}

/**
 * Stream response helper for Server-Sent Events
 */
export function createStreamResponse(
  generator: AsyncGenerator<string, void, unknown>
): Response {
  const encoder = new TextEncoder()
  let isClosed = false

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          if (isClosed) break
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
        }
      } catch (error) {
        logger.error('Stream generator error', error as Error)
        controller.error(error)
      } finally {
        controller.close()
      }
    },
    cancel() {
      isClosed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

/**
 * Parse streaming response from provider
 */
export async function parseStreamingResponse(
  response: Response,
  onChunk?: (content: string) => void
): Promise<string> {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new AppError('INVALID_INPUT' as any, 'Response body not available', 500)
  }

  let accumulatedText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunkText = decoder.decode(value, { stream: true })
    buffer += chunkText

    const lines = buffer.split('\n')
    buffer = lines[lines.length - 1] // Keep incomplete line in buffer

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim()

      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6))
          const content = data.choices?.[0]?.delta?.content || ''

          if (content) {
            accumulatedText += content
            onChunk?.(content)
          }
        } catch (e) {
          // Ignore JSON parse errors for streaming chunks
        }
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim() && buffer.trim().startsWith('data: ')) {
    try {
      const data = JSON.parse(buffer.trim().slice(6))
      const content = data.choices?.[0]?.delta?.content || ''
      if (content) {
        accumulatedText += content
        onChunk?.(content)
      }
    } catch (e) {
      // Ignore final parse errors
    }
  }

  return accumulatedText
}
