import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware'
import { aiProviderManager } from '@/lib/ai-provider-manager'
import { successResponse } from '@/lib/request-utils'

/**
 * GET /api/health - System health check endpoint
 * Returns overall system status and provider health
 */
async function handleHealthCheck(req: NextRequest, requestId: string): Promise<Response> {
  const startTime = Date.now()

  try {
    // Check database connection
    const dbHealthy = await checkDatabase()

    // Get provider health status
    const providers = await aiProviderManager.getActiveModels()
    const providerHealth = aiProviderManager.getHealthStatus()
    const analytics = aiProviderManager.getAnalytics(100)

    // Calculate overall system health
    const systemHealthy = dbHealthy && providers.length > 0

    const health = {
      status: systemHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          healthy: dbHealthy,
          status: dbHealthy ? 'connected' : 'disconnected',
        },
        providers: {
          count: providers.length,
          healthy: Object.values(providerHealth).filter((p: any) => p.healthy).length,
          details: providerHealth,
        },
        models: {
          active: providers.length,
          status: providers.length > 0 ? 'available' : 'no_active_models',
        },
      },
      performance: {
        responseTime: Date.now() - startTime,
        analytics,
      },
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
      },
    }

    const statusCode = systemHealthy ? 200 : 503
    logger.debug('Health check', { healthy: systemHealthy, duration: Date.now() - startTime })

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    logger.error('Health check failed', error as Error, { requestId })

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      },
      { status: 503 }
    )
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export const GET = withErrorHandler(handleHealthCheck)
