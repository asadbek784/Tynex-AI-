/**
 * Centralized configuration and constants for production-ready application
 * All configurable values in one place for easy management
 */

// ============================================================================
// SECURITY CONFIG
// ============================================================================

export const SECURITY_CONFIG = {
  // Session management
  SESSION_COOKIE_NAME: 'tynex_session',
  SESSION_COOKIE_MAX_AGE: 7 * 24 * 60 * 60, // 7 days in seconds
  SESSION_COOKIE_SECURE: process.env.NODE_ENV === 'production',
  SESSION_COOKIE_SAME_SITE: 'strict' as const,
  SESSION_COOKIE_HTTP_ONLY: true,

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),

  // Rate limiting
  RATE_LIMIT_DEFAULT: {
    maxRequests: 25,
    windowMs: 3 * 60 * 60 * 1000, // 3 hours
  },

  // JWT
  JWT_ACCESS_TOKEN_EXPIRY: '15m',
  JWT_REFRESH_TOKEN_EXPIRY: '7d',

  // Password
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
}

// ============================================================================
// API CONFIG
// ============================================================================

export const API_CONFIG = {
  // Timeouts
  PROVIDER_TIMEOUT_MS: 30_000,
  DB_QUERY_TIMEOUT_MS: 10_000,

  // Limits
  MAX_MESSAGE_HISTORY: 100,
  MAX_MESSAGE_LENGTH: 50_000,
  MAX_CHAT_TITLE_LENGTH: 255,
  MAX_REQUEST_BODY_SIZE: '10mb',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,

  // File uploads
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  UPLOAD_DIRECTORY: 'public/uploads',

  // Streaming
  STREAM_CHUNK_SIZE: 64 * 1024, // 64KB chunks
  STREAM_HEARTBEAT_MS: 30_000, // Send heartbeat every 30s
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  // Authentication
  ENABLE_EMAIL_VERIFICATION: false,
  ENABLE_2FA: true,
  ENABLE_OAUTH: false,

  // Chat
  ENABLE_VOICE_INPUT: true,
  ENABLE_IMAGE_UPLOAD: true,
  ENABLE_FILE_UPLOAD: false,
  ENABLE_CONVERSATION_SEARCH: true,

  // Admin
  ENABLE_USER_MANAGEMENT: true,
  ENABLE_PROVIDER_MANAGEMENT: true,
  ENABLE_COST_TRACKING: true,
  ENABLE_AUDIT_LOGGING: true,

  // Performance
  ENABLE_RESPONSE_CACHING: true,
  ENABLE_REQUEST_LOGGING: true,
  ENABLE_PERFORMANCE_MONITORING: true,
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Auth errors
  AUTH_MISSING: 'Tizimga kirilmagan',
  AUTH_INVALID: 'Noto\'g\'ri email yoki parol',
  AUTH_EXPIRED: 'Sessiya muddati tugadi',
  AUTH_INSUFFICIENT_ROLE: 'Ruxsat berilmagan',

  // Validation errors
  VALIDATION_ERROR: 'Kiritilgan ma\'lumot noto\'g\'ri',
  INVALID_EMAIL: 'Haqiqiy email kiriting',
  INVALID_URL: 'Haqiqiy URL kiriting',
  INVALID_UUID: 'Haqiqiy ID kiriting',

  // Resource errors
  RESOURCE_NOT_FOUND: 'Resurs topilmadi',
  CHAT_NOT_FOUND: 'Chat topilmadi',
  USER_NOT_FOUND: 'Foydalanuvchi topilmadi',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Rate limitga yetdingiz',

  // AI errors
  AI_PROVIDER_ERROR: 'AI provayder xatosi',
  AI_TIMEOUT: 'AI provayder vaqt tugadi',
  NO_ACTIVE_MODELS: 'Tizimda faol AI modellari topilmadi',

  // Server errors
  INTERNAL_ERROR: 'Tizim xatoligi yuz berdi',
  DATABASE_ERROR: 'Ma\'lumotlar bazasi xatosi',
  SERVICE_UNAVAILABLE: 'Xizmat vaqtincha mavjud emas',
}

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  CHAT_CREATED: 'Chat yaratildi',
  CHAT_DELETED: 'Chat o\'chirildi',
  CHAT_UPDATED: 'Chat yangilandi',
  MESSAGE_SENT: 'Xabar yuborildi',
  USER_CREATED: 'Foydalanuvchi yaratildi',
  LOGIN_SUCCESS: 'Muvaffaqiyatli kirildi',
  LOGOUT_SUCCESS: 'Muvaffaqiyatli chiqildi',
}

// ============================================================================
// LOGGING CONFIG
// ============================================================================

export const LOGGING_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  PRETTY_PRINT: process.env.NODE_ENV !== 'production',
  INCLUDE_STACK_TRACE: true,
  MAX_LOG_SIZE: 1000, // Max chars per log
}

// ============================================================================
// CACHE CONFIG
// ============================================================================

export const CACHE_CONFIG = {
  // In-memory cache TTLs (milliseconds)
  MODEL_LIST_TTL: 5 * 60 * 1000, // 5 minutes
  USER_DATA_TTL: 10 * 60 * 1000, // 10 minutes
  SETTINGS_TTL: 15 * 60 * 1000, // 15 minutes

  // Cache strategy
  ENABLE_QUERY_CACHING: true,
  MAX_CACHED_ITEMS: 1000,
}

// ============================================================================
// PRICING CONFIG
// ============================================================================

export const PRICING_CONFIG = {
  // Default model pricing (per 1M tokens)
  DEFAULT_PRICING: {
    INPUT: 0.005,
    OUTPUT: 0.015,
  },

  // Cost tracking
  ENABLE_COST_TRACKING: true,
  UPDATE_COST_INTERVAL_MS: 5 * 60 * 1000, // Update every 5 mins
}

// ============================================================================
// EMAIL CONFIG (Future)
// ============================================================================

export const EMAIL_CONFIG = {
  FROM: 'noreply@tynex-ai.com',
  SUBJECT_PREFIX: '[TYNEX AI]',
  ENABLE_TRANSACTIONAL: false,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
}

// ============================================================================
// ADMIN CONFIG
// ============================================================================

export const ADMIN_CONFIG = {
  // Default admin access level
  REQUIRE_TOTP: true,

  // Admin actions that require logging
  AUDIT_ACTIONS: [
    'create_provider',
    'delete_provider',
    'create_model',
    'delete_model',
    'ban_user',
    'unban_user',
    'change_user_role',
    'update_settings',
  ],

  // Admin dashboard
  STATS_REFRESH_INTERVAL_MS: 60_000, // 1 minute
}

// ============================================================================
// DATABASE CONFIG
// ============================================================================

export const DATABASE_CONFIG = {
  // Connection pooling
  POOL_SIZE: process.env.NODE_ENV === 'production' ? 20 : 5,
  MAX_IDLE_TIME_MS: 60_000,

  // Query optimization
  ENABLE_QUERY_LOGGING: process.env.NODE_ENV !== 'production',
  SLOW_QUERY_THRESHOLD_MS: 1000,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get config value by key with type safety
 */
export function getConfig<T>(path: string, defaultValue?: T): T {
  const parts = path.split('.')
  let value: any = global

  for (const part of parts) {
    value = value[part]
    if (value === undefined) {
      return defaultValue as T
    }
  }

  return value as T
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature]
}

/**
 * Get environment-specific config
 */
export function getEnvironmentConfig() {
  const isDev = process.env.NODE_ENV === 'development'
  const isProd = process.env.NODE_ENV === 'production'

  return {
    isDev,
    isProd,
    isStaging: !isDev && !isProd,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    appName: 'TYNEX AI',
    version: '1.0.0',
  }
}

export default {
  SECURITY_CONFIG,
  API_CONFIG,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOGGING_CONFIG,
  CACHE_CONFIG,
  PRICING_CONFIG,
  EMAIL_CONFIG,
  ADMIN_CONFIG,
  DATABASE_CONFIG,
}
