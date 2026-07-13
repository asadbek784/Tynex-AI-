/**
 * Usage Analytics - Tracks and calculates costs for API usage
 * Supports per-provider and per-model pricing models
 */

export interface PricingModel {
  provider: string
  model: string
  costPerInputToken: number // Cost per 1M input tokens
  costPerOutputToken: number // Cost per 1M output tokens
  costPerRequest?: number // Optional fixed cost per request
}

// Default pricing models (can be updated from database/config)
const DEFAULT_PRICING: PricingModel[] = [
  // OpenAI
  {
    provider: 'openai',
    model: 'gpt-4o',
    costPerInputToken: 0.005,
    costPerOutputToken: 0.015,
  },
  {
    provider: 'openai',
    model: 'gpt-4-turbo',
    costPerInputToken: 0.01,
    costPerOutputToken: 0.03,
  },
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    costPerInputToken: 0.0005,
    costPerOutputToken: 0.0015,
  },
  // Anthropic Claude
  {
    provider: 'anthropic',
    model: 'claude-3-opus',
    costPerInputToken: 0.015,
    costPerOutputToken: 0.075,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    costPerInputToken: 0.003,
    costPerOutputToken: 0.015,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-haiku',
    costPerInputToken: 0.00025,
    costPerOutputToken: 0.00125,
  },
  // Google Gemini
  {
    provider: 'google',
    model: 'gemini-pro',
    costPerInputToken: 0.0005,
    costPerOutputToken: 0.0015,
  },
  {
    provider: 'google',
    model: 'gemini-1.5-pro',
    costPerInputToken: 0.0035,
    costPerOutputToken: 0.0105,
  },
  // DeepSeek
  {
    provider: 'deepseek',
    model: 'deepseek-chat',
    costPerInputToken: 0.00014,
    costPerOutputToken: 0.00028,
  },
  // Groq (very fast, lower cost)
  {
    provider: 'groq',
    model: 'mixtral-8x7b-32768',
    costPerInputToken: 0.00024,
    costPerOutputToken: 0.00024,
  },
  {
    provider: 'groq',
    model: 'llama2-70b-4096',
    costPerInputToken: 0.0007,
    costPerOutputToken: 0.0009,
  },
]

export class UsageAnalytics {
  private pricingModels: Map<string, PricingModel> = new Map()

  constructor() {
    this.initializePricing()
  }

  /**
   * Initialize pricing models
   */
  private initializePricing(): void {
    DEFAULT_PRICING.forEach((model) => {
      const key = `${model.provider}/${model.model}`.toLowerCase()
      this.pricingModels.set(key, model)
    })
  }

  /**
   * Add or update pricing for a model
   */
  setPricing(pricing: PricingModel): void {
    const key = `${pricing.provider}/${pricing.model}`.toLowerCase()
    this.pricingModels.set(key, pricing)
  }

  /**
   * Get pricing for a specific model
   */
  getPricing(provider: string, model: string): PricingModel | undefined {
    const key = `${provider}/${model}`.toLowerCase()
    return this.pricingModels.get(key)
  }

  /**
   * Calculate cost for a single API call
   */
  calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): {
    inputCost: number
    outputCost: number
    totalCost: number
  } {
    const pricing = this.getPricing(provider, model)

    if (!pricing) {
      // Return estimate based on OpenAI GPT-4o as default
      return this.calculateCostWithRate(0.005, 0.015, inputTokens, outputTokens)
    }

    return this.calculateCostWithRate(
      pricing.costPerInputToken,
      pricing.costPerOutputToken,
      inputTokens,
      outputTokens,
      pricing.costPerRequest
    )
  }

  /**
   * Calculate cost with specific rates
   */
  private calculateCostWithRate(
    inputRate: number,
    outputRate: number,
    inputTokens: number,
    outputTokens: number,
    requestCost: number = 0
  ): {
    inputCost: number
    outputCost: number
    totalCost: number
  } {
    // Rates are per 1M tokens, so divide by 1,000,000
    const inputCost = (inputTokens / 1_000_000) * inputRate
    const outputCost = (outputTokens / 1_000_000) * outputRate
    const totalCost = inputCost + outputCost + requestCost

    return {
      inputCost: parseFloat(inputCost.toFixed(6)),
      outputCost: parseFloat(outputCost.toFixed(6)),
      totalCost: parseFloat(totalCost.toFixed(6)),
    }
  }

  /**
   * Calculate batch costs for usage logs
   */
  calculateBatchCosts(
    logs: Array<{
      provider: string
      model: string
      inputTokens: number
      outputTokens: number
    }>
  ): {
    logs: Array<any>
    totalCost: number
    costByProvider: Record<string, number>
  } {
    const costByProvider: Record<string, number> = {}
    let totalCost = 0

    const enrichedLogs = logs.map((log) => {
      const cost = this.calculateCost(log.provider, log.model, log.inputTokens, log.outputTokens)

      costByProvider[log.provider] = (costByProvider[log.provider] || 0) + cost.totalCost
      totalCost += cost.totalCost

      return {
        ...log,
        cost,
      }
    })

    return {
      logs: enrichedLogs,
      totalCost: parseFloat(totalCost.toFixed(6)),
      costByProvider,
    }
  }

  /**
   * Estimate cost for a message (without actually calling the API)
   * Based on character count to token approximation
   */
  estimateCost(provider: string, model: string, inputText: string, estimatedOutputTokens: number = 500): number {
    // Rough estimation: 4 chars = 1 token (OpenAI's approximation)
    const estimatedInputTokens = Math.ceil(inputText.length / 4)

    const cost = this.calculateCost(provider, model, estimatedInputTokens, estimatedOutputTokens)
    return cost.totalCost
  }

  /**
   * Get all available pricing models
   */
  getAllPricing(): PricingModel[] {
    return Array.from(this.pricingModels.values())
  }

  /**
   * Group pricing by provider
   */
  getPricingByProvider(provider: string): PricingModel[] {
    return Array.from(this.pricingModels.values()).filter((p) => p.provider.toLowerCase() === provider.toLowerCase())
  }

  /**
   * Calculate monthly cost projection based on current usage
   */
  projectMonthlyCost(dailyTokens: number, dailyCost: number): {
    projectedDailyCost: number
    projectedMonthlyCost: number
    projectedYearlyCost: number
  } {
    const projectedMonthlyCost = dailyCost * 30
    const projectedYearlyCost = dailyCost * 365

    return {
      projectedDailyCost: parseFloat(dailyCost.toFixed(6)),
      projectedMonthlyCost: parseFloat(projectedMonthlyCost.toFixed(2)),
      projectedYearlyCost: parseFloat(projectedYearlyCost.toFixed(2)),
    }
  }
}

// Export singleton instance
export const usageAnalytics = new UsageAnalytics()
