import axios, { AxiosError } from 'axios'
import axiosRetry from 'axios-retry'
import { logger } from './logger'
import { AppError, ErrorCode } from './errors'

/**
 * Supported AI Providers
 */
export type ProviderType = 'openai' | 'gemini' | 'openrouter' | 'groq' | 'anthropic' | 'deepseek' | 'mistral'

export interface AIModel {
  id: string
  providerId: string
  modelId: string
  displayName: string
  priority: number
  active: boolean
  provider: {
    name: string
    baseUrl: string
    apiKey: string
  }
}

export interface AIProviderConfig {
  baseUrl: string
  apiKey: string
  timeout: number
  retries: number
}

export interface AICallOptions {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string | any[] }>
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  timeout?: number
}

export interface AICallResult {
  success: boolean
  content?: string
  model: string
  provider: string
  inputTokens?: number
  outputTokens?: number
  latencyMs: number
  error?: string
}

/**
 * AI Provider Manager - Universal interface for multiple AI providers
 * Handles provider abstraction, automatic fallback, retries, and health checks
 */
export class AIProviderManager {
  private models: Map<string, AIModel> = new Map()
  private healthStatus: Map<string, { healthy: boolean; lastCheck: Date; failureCount: number }> = new Map()
  private callHistory: Array<{ timestamp: Date; provider: string; success: boolean; latencyMs: number }> = []
  private readonly MAX_HISTORY_SIZE = 1000

  constructor() {
    // Initialize axios with retry strategy
    axiosRetry(axios, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        // Retry on network errors and 5xx errors
        return (
          !error.response ||
          (error.response.status >= 500 && error.response.status < 600) ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ENOTFOUND'
        )
      },
    })
  }

  /**
   * Register AI models for use
   */
  registerModels(models: AIModel[]): void {
    models.forEach((model) => {
      this.models.set(model.id, model)
      if (!this.healthStatus.has(model.provider.name)) {
        this.healthStatus.set(model.provider.name, {
          healthy: true,
          lastCheck: new Date(),
          failureCount: 0,
        })
      }
    })
    logger.info('AI Models registered', { count: models.length })
  }

  /**
   * Update model list from database
   */
  async syncModels(prisma: any): Promise<void> {
    try {
      const dbModels = await prisma.aiModel.findMany({
        where: { active: true },
        include: { provider: true },
        orderBy: { priority: 'asc' },
      })

      this.models.clear()
      dbModels.forEach((model: any) => {
        this.models.set(model.id, model)
      })

      logger.debug('Models synced from database', { count: dbModels.length })
    } catch (error) {
      logger.error('Failed to sync models from database', error as Error)
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Modellar yuklab bolib bo\'lmadi', 500)
    }
  }

  /**
   * Get active models sorted by priority
   */
  getActiveModels(): AIModel[] {
    return Array.from(this.models.values())
      .filter((m) => m.active)
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * Get specific model by ID
   */
  getModel(modelId: string): AIModel | undefined {
    return this.models.get(modelId)
  }

  /**
   * Call AI provider with automatic fallback
   */
  async callWithFallback(options: AICallOptions, requestedModelId?: string): Promise<AICallResult> {
    let models = this.getActiveModels()

    // Prioritize requested model if specified
    if (requestedModelId) {
      const requested = models.find((m) => m.id === requestedModelId || m.modelId === requestedModelId)
      if (requested) {
        models = [requested, ...models.filter((m) => m.id !== requested.id)]
      }
    }

    if (models.length === 0) {
      throw new AppError(ErrorCode.NO_ACTIVE_MODELS, 'Tizimda faol AI modellari topilmadi', 500)
    }

    let lastError: Error | null = null

    for (const model of models) {
      try {
        // Check health status
        const health = this.healthStatus.get(model.provider.name)
        if (health && !health.healthy && health.failureCount > 5) {
          logger.debug('Skipping unhealthy provider', {
            provider: model.provider.name,
            failureCount: health.failureCount,
          })
          continue
        }

        const result = await this.callProvider(model, options)

        // Update health status on success
        if (health) {
          health.healthy = true
          health.lastCheck = new Date()
          health.failureCount = 0
        }

        // Record successful call
        this.recordCall(model.provider.name, true, result.latencyMs)

        return result
      } catch (error) {
        lastError = error as Error
        logger.warn(`Provider call failed, trying next fallback`, {
          provider: model.provider.name,
          model: model.modelId,
          error: (error as Error).message,
        })

        // Update health status on failure
        const health = this.healthStatus.get(model.provider.name)
        if (health) {
          health.failureCount++
          health.lastCheck = new Date()
          if (health.failureCount > 3) {
            health.healthy = false
          }
        }

        // Record failed call
        this.recordCall(model.provider.name, false, 0)

        continue
      }
    }

    logger.error('All providers failed', lastError as Error, {
      modelsCount: models.length,
    })

    throw new AppError(
      ErrorCode.AI_ALL_PROVIDERS_FAILED,
      `Barcha AI provayderlar xatolik berdi. Oxirgi xato: ${lastError?.message || 'Noma\'lum'}`,
      500
    )
  }

  /**
   * Call individual provider
   */
  private async callProvider(model: AIModel, options: AICallOptions): Promise<AICallResult> {
    const startTime = Date.now()
    const timeout = options.timeout || 30000

    try {
      const response = await axios.post(`${model.provider.baseUrl}/chat/completions`, this.formatRequest(model, options), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${model.provider.apiKey}`,
        },
        timeout,
      })

      const latencyMs = Date.now() - startTime
      const result = this.parseResponse(response.data, model)

      logger.logAICall(model.provider.name, model.modelId, latencyMs, true)

      return {
        success: true,
        content: result.content,
        model: model.modelId,
        provider: model.provider.name,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs,
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime

      let errorMessage = 'Unknown error'

      if (error.code === 'ECONNABORTED') {
        errorMessage = `Timeout: ${timeout}ms ichida javob bermadi`
        logger.logAICall(model.provider.name, model.modelId, latencyMs, false, 'TIMEOUT')
        throw new AppError(ErrorCode.AI_TIMEOUT, errorMessage, 500)
      } else if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 100)}`
        logger.logAICall(model.provider.name, model.modelId, latencyMs, false, errorMessage)
      } else if (error.message) {
        errorMessage = error.message
        logger.logAICall(model.provider.name, model.modelId, latencyMs, false, errorMessage)
      }

      throw new AppError(ErrorCode.AI_PROVIDER_ERROR, errorMessage, 500)
    }
  }

  /**
   * Format request for provider's API
   */
  private formatRequest(model: AIModel, options: AICallOptions): Record<string, any> {
    return {
      model: model.modelId,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      top_p: options.topP ?? 0.9,
      stream: options.stream ?? false,
    }
  }

  /**
   * Parse provider response (handles different response formats)
   */
  private parseResponse(
    data: any,
    model: AIModel
  ): {
    content: string
    inputTokens: number
    outputTokens: number
  } {
    // Standard OpenAI format
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message?.content || data.choices[0].text || ''
      const usage = data.usage || {}

      return {
        content,
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
      }
    }

    throw new AppError(ErrorCode.AI_PROVIDER_ERROR, 'Provayder javobini tahlil qilish mumkin bo\'lmadi', 500)
  }

  /**
   * Perform health check on provider
   */
  async healthCheck(model: AIModel): Promise<boolean> {
    try {
      const response = await axios.post(
        `${model.provider.baseUrl}/chat/completions`,
        this.formatRequest(model, {
          messages: [{ role: 'user', content: 'test' }],
          model: model.modelId,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${model.provider.apiKey}`,
          },
          timeout: 5000,
        }
      )

      const health = this.healthStatus.get(model.provider.name)
      if (health) {
        health.healthy = response.status === 200
        health.lastCheck = new Date()
      }

      logger.debug('Health check result', {
        provider: model.provider.name,
        healthy: response.status === 200,
      })

      return response.status === 200
    } catch (error) {
      const health = this.healthStatus.get(model.provider.name)
      if (health) {
        health.healthy = false
        health.failureCount++
        health.lastCheck = new Date()
      }

      logger.warn('Health check failed', {
        provider: model.provider.name,
        error: (error as Error).message,
      })

      return false
    }
  }

  /**
   * Get provider health status
   */
  getHealthStatus(): Record<string, any> {
    const status: Record<string, any> = {}

    this.healthStatus.forEach((health, provider) => {
      status[provider] = {
        healthy: health.healthy,
        lastCheck: health.lastCheck.toISOString(),
        failureCount: health.failureCount,
      }
    })

    return status
  }

  /**
   * Get performance analytics
   */
  getAnalytics(lastN: number = 100): Record<string, any> {
    const recent = this.callHistory.slice(-lastN)
    const byProvider: Record<string, any> = {}

    recent.forEach((call) => {
      if (!byProvider[call.provider]) {
        byProvider[call.provider] = { total: 0, success: 0, avgLatency: 0, totalLatency: 0 }
      }

      byProvider[call.provider].total++
      if (call.success) byProvider[call.provider].success++
      byProvider[call.provider].totalLatency += call.latencyMs
    })

    // Calculate averages
    Object.values(byProvider).forEach((stats: any) => {
      stats.avgLatency = stats.total > 0 ? Math.round(stats.totalLatency / stats.total) : 0
      stats.successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) + '%' : 'N/A'
      delete stats.totalLatency
    })

    return byProvider
  }

  /**
   * Record API call for analytics
   */
  private recordCall(provider: string, success: boolean, latencyMs: number): void {
    this.callHistory.push({
      timestamp: new Date(),
      provider,
      success,
      latencyMs,
    })

    // Keep history size manageable
    if (this.callHistory.length > this.MAX_HISTORY_SIZE) {
      this.callHistory = this.callHistory.slice(-this.MAX_HISTORY_SIZE)
    }
  }

  /**
   * Reset health status (useful for debugging)
   */
  resetHealthStatus(): void {
    this.healthStatus.forEach((health) => {
      health.healthy = true
      health.failureCount = 0
      health.lastCheck = new Date()
    })
    logger.info('Health status reset for all providers')
  }
}

// Export singleton instance
export const aiProviderManager = new AIProviderManager()
