import { z } from 'zod'

/**
 * Comprehensive validation schemas for all API inputs
 * Ensures type safety and prevents injection attacks
 */

// Authentication Schemas
export const RegisterSchema = z.object({
  email: z.string().email('Haqiqiy email kiriting'),
  password: z.string().min(8, 'Parol kamida 8 ta belgili bo\'lishi kerak').max(128, 'Parol juda uzun'),
  name: z.string().min(1, 'Ism talab qilinadi').max(100, 'Ism juda uzun'),
  adminCode: z.string().optional(),
})

export const LoginSchema = z.object({
  email: z.string().email('Haqiqiy email kiriting'),
  password: z.string().min(1, 'Parol talab qilinadi'),
  adminCode: z.string().optional(),
})

// Google OAuth Schemas
export const GoogleOAuthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
})

export type GoogleOAuthCallbackInput = z.infer<typeof GoogleOAuthCallbackSchema>

// Chat Schemas
export const CreateChatSchema = z.object({
  title: z.string().min(1, 'Chat nomi talab qilinadi').max(255, 'Chat nomi juda uzun'),
})

export const UpdateChatSchema = z.object({
  title: z.string().min(1, 'Chat nomi talab qilinadi').max(255, 'Chat nomi juda uzun'),
})

export const DeleteChatSchema = z.object({
  id: z.string().uuid('Haqiqiy chat ID kiriting'),
})

// Message Schemas
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Xabar talab qilinadi').max(50000, 'Xabar juda uzun'),
})

export const ChatCompletionSchema = z.object({
  chatId: z.string().uuid('Haqiqiy chat ID kiriting').optional(),
  messages: z.array(MessageSchema).min(1, 'Kamida bir xabar talab qilinadi').max(100, 'Xabarlar soni juda ko\'p'),
  modelId: z.string().optional(),
  imageUrl: z.string().url('Haqiqiy rasm URL kiriting').optional(),
})

// AI Provider Schemas
export const CreateProviderSchema = z.object({
  name: z.string().min(1, 'Nomi talab qilinadi').max(100, 'Nomi juda uzun'),
  baseUrl: z.string().url('Haqiqiy URL kiriting'),
  apiKey: z.string().min(1, 'API kalit talab qilinadi'),
})

export const UpdateProviderSchema = z.object({
  name: z.string().min(1, 'Nomi talab qilinadi').max(100).optional(),
  baseUrl: z.string().url('Haqiqiy URL kiriting').optional(),
  apiKey: z.string().min(1, 'API kalit talab qilinadi').optional(),
})

// AI Model Schemas
export const CreateModelSchema = z.object({
  providerId: z.string().uuid('Haqiqiy provayder ID kiriting'),
  modelId: z.string().min(1, 'Model ID talab qilinadi').max(100),
  displayName: z.string().min(1, 'Display name talab qilinadi').max(100),
  priority: z.number().int().min(1).default(1),
  active: z.boolean().default(true),
})

export const UpdateModelSchema = z.object({
  modelId: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  priority: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
})

// Settings Schemas
export const UpdateSettingsSchema = z.object({
  rateLimitCount: z.number().int().min(1).max(1000).optional(),
  rateLimitHours: z.number().int().min(1).max(168).optional(),
  bannerMessage: z.string().max(1000).optional(),
})

// User Management Schemas
export const UpdateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
})

export const BanUserSchema = z.object({
  banned: z.boolean(),
})

// Upload Schemas
export const ImageUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= 5 * 1024 * 1024, 'Rasm 5MB dan katta bo\'lmasligi kerak'),
  userId: z.string().uuid(),
})

// Pagination Schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  skip: z.number().int().min(0).default(0),
})

// Search Schemas
export const SearchSchema = z.object({
  query: z.string().min(1).max(255),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

/**
 * Utility function to validate input against schema
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      errors[path] = issue.message
    })
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}

/**
 * Type exports for TypeScript usage
 */
export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type CreateChatInput = z.infer<typeof CreateChatSchema>
export type UpdateChatInput = z.infer<typeof UpdateChatSchema>
export type ChatCompletionInput = z.infer<typeof ChatCompletionSchema>
export type CreateProviderInput = z.infer<typeof CreateProviderSchema>
export type CreateModelInput = z.infer<typeof CreateModelSchema>
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>
