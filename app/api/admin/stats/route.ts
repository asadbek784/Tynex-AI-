// FIX: checkAdmin() replaced with the shared requireAdminOrError() helper.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrError } from '@/lib/require-admin'

export async function GET() {
  const auth = await requireAdminOrError()
  if (auth.error) return auth.error

  try {
    const userCount = await prisma.user.count()
    const chatCount = await prisma.chat.count()
    const messageCount = await prisma.message.count()

    // Calculate total input and output tokens from UsageLog
    const tokensAgg = await prisma.usageLog.aggregate({
      _sum: {
        inputTokens: true,
        outputTokens: true,
      },
    })

    const totalInputTokens = tokensAgg._sum.inputTokens || 0
    const totalOutputTokens = tokensAgg._sum.outputTokens || 0
    const totalTokens = totalInputTokens + totalOutputTokens

    // Fetch breakdown of models usage
    const logs = await prisma.usageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Fetch recent logs for activity
    })

    // Fetch error/failure logs
    const errorLogs = await prisma.usageLog.findMany({
      where: { success: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Create chart data: daily requests for the last 7 days
    const dailyRequests: Record<string, number> = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      dailyRequests[dateStr] = 0
    }

    // Query usage logs for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    const recentLogs = await prisma.usageLog.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    recentLogs.forEach((log: { createdAt: Date }) => {
      const dateStr = log.createdAt.toISOString().split('T')[0]
      if (dailyRequests[dateStr] !== undefined) {
        dailyRequests[dateStr]++
      }
    })

    const chartData = Object.entries(dailyRequests).map(([date, count]) => ({
      date,
      count,
    }))

    // Calculate model-by-model summary
    const modelStatsMap: Record<string, { count: number; tokens: number }> = {}
    const allLogsForStats = await prisma.usageLog.findMany({
      select: {
        modelName: true,
        inputTokens: true,
        outputTokens: true,
      },
    })

    allLogsForStats.forEach((log: { modelName: string; inputTokens: number; outputTokens: number }) => {
      const model = log.modelName || 'Noma\'lum'
      if (!modelStatsMap[model]) {
        modelStatsMap[model] = { count: 0, tokens: 0 }
      }
      modelStatsMap[model].count++
      modelStatsMap[model].tokens += (log.inputTokens || 0) + (log.outputTokens || 0)
    })

    const modelStats = Object.entries(modelStatsMap).map(([modelName, stats]) => ({
      modelName,
      count: stats.count,
      tokens: stats.tokens,
    }))

    return NextResponse.json({
      success: true,
      stats: {
        userCount,
        chatCount,
        messageCount,
        totalTokens,
        chartData,
        modelStats,
        recentLogs: logs.slice(0, 10),
        errorLogs,
      },
    })
  } catch (error: any) {
    console.error('Fetch stats error:', error)
    return NextResponse.json({ error: 'Tizim xatoligi yuz berdi' }, { status: 500 })
  }
}
