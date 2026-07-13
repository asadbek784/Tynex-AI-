import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'
import { withErrorHandler } from '@/lib/middleware'
import { logger } from '@/lib/logger'
import { successResponse } from '@/lib/request-utils'
import { aiProviderManager } from '@/lib/ai-provider-manager'

/**
 * GET /api/admin/stats - Comprehensive system analytics and performance metrics
 */
async function handleStats(req: NextRequest, requestId: string): Promise<Response> {
  const admin = await requireAdmin()
  const requestLogger = logger.child({ userId: admin.id, requestId, endpoint: '/api/admin/stats' })

  try {
    // 1. Basic counts
    const userCount = await prisma.user.count()
    const activeBannedCount = await prisma.user.count({ where: { banned: true } })
    const chatCount = await prisma.chat.count()
    const messageCount = await prisma.message.count()

    // 2. Token aggregation
    const tokensAgg = await prisma.usageLog.aggregate({
      _sum: {
        inputTokens: true,
        outputTokens: true,
      },
      _count: true,
    })

    const totalInputTokens = tokensAgg._sum.inputTokens || 0
    const totalOutputTokens = tokensAgg._sum.outputTokens || 0
    const totalTokens = totalInputTokens + totalOutputTokens
    const totalRequests = tokensAgg._count

    // 3. Success/failure rates
    const successCount = await prisma.usageLog.count({ where: { success: true } })
    const failureCount = await prisma.usageLog.count({ where: { success: false } })
    const successRate = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(1) : 'N/A'

    // 4. Recent activity
    const recentLogs = await prisma.usageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { email: true } } },
    })

    // 5. Error analysis
    const errorLogs = await prisma.usageLog.findMany({
      where: { success: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const errorsByMessage: Record<string, number> = {}
    errorLogs.forEach((log: any) => {
      const msg = log.errorMessage || 'Unknown error'
      errorsByMessage[msg] = (errorsByMessage[msg] || 0) + 1
    })

    // 6. Daily request chart (last 30 days)
    const dailyRequests: Record<string, { success: number; failed: number }> = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      dailyRequests[dateStr] = { success: 0, failed: 0 }
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const monthLogs = await prisma.usageLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, success: true },
    })

    monthLogs.forEach((log: any) => {
      const dateStr = log.createdAt.toISOString().split('T')[0]
      if (dailyRequests[dateStr]) {
        if (log.success) {
          dailyRequests[dateStr].success++
        } else {
          dailyRequests[dateStr].failed++
        }
      }
    })

    const chartData = Object.entries(dailyRequests).map(([date, data]) => ({
      date,
      success: data.success,
      failed: data.failed,
      total: data.success + data.failed,
    }))

    // 7. Model performance stats
    const modelStats: Record<string, any> = {}
    const modelLogsForStats = await prisma.usageLog.findMany({
      select: {
        modelName: true,
        providerName: true,
        inputTokens: true,
        outputTokens: true,
        latencyMs: true,
        success: true,
      },
    })

    modelLogsForStats.forEach((log: any) => {
      const key = `${log.providerName}/${log.modelName}`
      if (!modelStats[key]) {
        modelStats[key] = {
          provider: log.providerName,
          model: log.modelName,
          calls: 0,
          successCalls: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          avgLatency: 0,
          totalLatency: 0,
        }
      }
      modelStats[key].calls++
      if (log.success) modelStats[key].successCalls++
      modelStats[key].totalInputTokens += log.inputTokens || 0
      modelStats[key].totalOutputTokens += log.outputTokens || 0
      modelStats[key].totalLatency += log.latencyMs || 0
    })

    // Calculate averages
    const modelStatsArray = Object.values(modelStats).map((stat: any) => ({
      ...stat,
      avgLatency: stat.calls > 0 ? Math.round(stat.totalLatency / stat.calls) : 0,
      successRate: stat.calls > 0 ? ((stat.successCalls / stat.calls) * 100).toFixed(1) : '0',
    }))

    // 8. Provider health
    const providerHealth = aiProviderManager.getHealthStatus()
    const providerAnalytics = aiProviderManager.getAnalytics(1000)

    // 9. User activity
    const activeUsers = await prisma.usageLog.groupBy({
      by: ['userId'],
      _count: true,
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    })

    const topUsers = await prisma.usageLog.groupBy({
      by: ['userId'],
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    })

    requestLogger.info('Stats retrieved successfully', {
      userCount,
      chatCount,
      messageCount,
      successRate,
    })

    return successResponse({
      overview: {
        totalUsers: userCount,
        bannedUsers: activeBannedCount,
        activeUsers: activeUsers.length,
        totalChats: chatCount,
        totalMessages: messageCount,
      },
      tokens: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        total: totalTokens,
      },
      requests: {
        total: totalRequests,
        successful: successCount,
        failed: failureCount,
        successRate,
      },
      performance: {
        chartData,
        modelStats: modelStatsArray.sort((a: any, b: any) => b.calls - a.calls),
        providers: {
          health: providerHealth,
          analytics: providerAnalytics,
        },
      },
      errors: {
        topErrors: Object.entries(errorsByMessage)
          .map(([message, count]) => ({ message, count }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 10),
        recentErrors: errorLogs.slice(0, 20),
      },
      activity: {
        recentLogs,
        topUsers,
      },
    })
  } catch (error) {
    requestLogger.error('Failed to retrieve stats', error as Error)
    throw error
  }
}

export const GET = withErrorHandler(handleStats)
