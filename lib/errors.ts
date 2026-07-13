import { NextResponse } from 'next/server'

/**
 * Standard Error Codes for consistent API error handling across all endpoints
 */
export enum ErrorCode {
  // Authentication
  AUTH_MISSING = 'AUTH_MISSING',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INSUFFICIENT_ROLE = 'AUTH_INSUFFICIENT_ROLE',

  // User Errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_BANNED = 'USER_BANNED',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_EMAIL_TAKEN = 'USER_EMAIL_TAKEN',

  // Input Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_BANNED = 'RATE_LIMIT_BANNED',

  // AI Provider Errors
  NO_ACTIVE_MODELS = 'NO_ACTIVE_MODELS',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  AI_TIMEOUT = 'AI_TIMEOUT',
  AI_ALL_PROVIDERS_FAILED = 'AI_ALL_PROVIDERS_FAILED',

  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CHAT_NOT_FOUND = 'CHAT_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',

  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // File Upload
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
}

export interface ErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: Record<string, any>
    requestId?: string
    timestamp?: string
  }
}

/**
 * Custom Error class for all application errors
 * Provides error codes, HTTP status codes, and structured error responses
 */
export class AppError extends Error {
  code: ErrorCode
  statusCode: number
  details?: Record<string, any>

  constructor(code: ErrorCode, message: string, statusCode: number = 500, details?: Record<string, any>) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.name = 'AppError'

    // Maintain prototype chain in TypeScript
    Object.setPrototypeOf(this, AppError.prototype)
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

/**
 * Specific error subclasses for common scenarios
 */
export class AuthError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.AUTH_INVALID, details?: Record<string, any>) {
    super(code, message, 401, details)
    this.name = 'AuthError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND) {
    super(code, message, 404)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Ruxsat berilmagan') {
    super(ErrorCode.FORBIDDEN, message, 403)
    this.name = 'ForbiddenError'
  }
}

export class RateLimitError extends AppError {
  resetAt?: Date
  remaining?: number

  constructor(message: string, resetAt?: Date, remaining?: number) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429)
    this.resetAt = resetAt
    this.remaining = remaining
    this.name = 'RateLimitError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.DATABASE_ERROR, message, 500, details)
    this.name = 'DatabaseError'
  }
}

/**
 * Converts any error to an AppError for consistent handling
 */
export function normalizeError(error: any, defaultCode: ErrorCode = ErrorCode.INTERNAL_ERROR): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(defaultCode, error.message, 500, { originalError: error.name })
  }

  return new AppError(defaultCode, String(error), 500)
}

/**
 * Creates a structured error response for API endpoints
 */
export function createErrorResponse(
  error: AppError | Error | any,
  requestId?: string
): [body: ErrorResponse, status: number] {
  const appError = error instanceof AppError ? error : normalizeError(error)

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details && { details: appError.details }),
      ...(requestId && { requestId }),
      timestamp: new Date().toISOString(),
    },
  }

  return [errorResponse, appError.statusCode]
}

/**
 * Sends a standardized error response using NextResponse
 */
export function sendErrorResponse(error: AppError | Error | any, requestId?: string) {
  const [body, status] = createErrorResponse(error, requestId)
  return NextResponse.json(body, { status })
}
