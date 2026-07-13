import pino from 'pino'

interface LogContext {
  userId?: string
  requestId?: string
  chatId?: string
  endpoint?: string
  modelName?: string
  [key: string]: any
}

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Structured logger using Pino for consistent, performant logging
 * Includes request tracing, error tracking, and audit logging
 */
const baseLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({
      level: label.toUpperCase(),
    }),
  },
})

export class Logger {
  private context: LogContext

  constructor(context: Partial<LogContext> = {}) {
    this.context = context as LogContext
  }

  /**
   * Create child logger with additional context
   */
  child(context: Partial<LogContext>): Logger {
    return new Logger({ ...this.context, ...context })
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any) {
    baseLogger.info({ ...this.context, ...data }, message)
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any) {
    baseLogger.debug({ ...this.context, ...data }, message)
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any) {
    baseLogger.warn({ ...this.context, ...data }, message)
  }

  /**
   * Error level logging with stack trace
   */
  error(message: string, error?: Error | any, data?: any) {
    const errorData = {
      error: {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        ...data,
      },
    }
    baseLogger.error({ ...this.context, ...errorData }, message)
  }

  /**
   * Audit logging for security-sensitive operations
   */
  audit(action: string, details?: any) {
    baseLogger.info(
      {
        ...this.context,
        type: 'AUDIT',
        action,
        timestamp: new Date().toISOString(),
        ...details,
      },
      `AUDIT: ${action}`
    )
  }

  /**
   * Log API request
   */
  logRequest(method: string, path: string, statusCode?: number, duration?: number) {
    const level = !statusCode || statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    baseLogger[level](
      {
        ...this.context,
        type: 'HTTP_REQUEST',
        method,
        path,
        statusCode,
        duration,
      },
      `${method} ${path} ${statusCode || 'pending'}`
    )
  }

  /**
   * Log AI provider call
   */
  logAICall(provider: string, model: string, duration: number, success: boolean, error?: string) {
    const level = success ? 'info' : 'error'
    baseLogger[level](
      {
        ...this.context,
        type: 'AI_CALL',
        provider,
        model,
        duration,
        success,
        error,
      },
      `AI Provider: ${provider}/${model} - ${success ? 'Success' : 'Failed'}`
    )
  }

  /**
   * Log rate limit hit
   */
  logRateLimit(limit: number, window: number, duration?: number) {
    baseLogger.warn(
      {
        ...this.context,
        type: 'RATE_LIMIT',
        limit,
        windowMinutes: window,
        duration,
      },
      `Rate limit exceeded: ${limit} requests in ${window} minutes`
    )
  }

  /**
   * Log database operation
   */
  logDatabaseOp(operation: string, table: string, duration: number, success: boolean, error?: string) {
    const level = success ? 'debug' : 'error'
    baseLogger[level](
      {
        ...this.context,
        type: 'DATABASE',
        operation,
        table,
        duration,
        success,
        error,
      },
      `DB ${operation} ${table}`
    )
  }

  /**
   * Log security event
   */
  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) {
    baseLogger.warn(
      {
        ...this.context,
        type: 'SECURITY',
        event,
        severity,
        timestamp: new Date().toISOString(),
        ...details,
      },
      `SECURITY [${severity.toUpperCase()}]: ${event}`
    )
  }
}

export const logger = new Logger()
