import { z } from 'zod';

export { z };

/**
 * User Validation Schemas
 */
export const userSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  imageUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  externalUserId: z.string().min(1),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  imageUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  imageUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

/**
 * Stream Validation Schemas
 */
export const streamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  thumbnailUrl: z.string().url().optional(),
  isLive: z.boolean(),
  isChatEnabled: z.boolean(),
  isChatDelayed: z.boolean(),
  isChatFollowersOnly: z.boolean(),
  viewerCount: z.number().int().min(0),
  category: z.string().min(1).max(50).optional(),
  userId: z.string().min(1),
  ingressId: z.string().min(1).optional(),
});

export const createStreamSchema = z.object({
  name: z.string().min(1).max(100),
  thumbnailUrl: z.string().url().optional(),
  category: z.string().min(1).max(50).optional(),
});

export const updateStreamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  thumbnailUrl: z.string().url().optional(),
  category: z.string().min(1).max(50).optional(),
  isChatEnabled: z.boolean().optional(),
  isChatDelayed: z.boolean().optional(),
  isChatFollowersOnly: z.boolean().optional(),
});

/**
 * Follow/Block Validation Schemas
 */
export const followSchema = z.object({
  followerId: z.string().min(1),
  followingId: z.string().min(1),
});

export const blockSchema = z.object({
  blockerId: z.string().min(1),
  blockedId: z.string().min(1),
});

/**
 * API Request Validation Schemas
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  category: z.string().min(1).max(50).optional(),
  ...paginationSchema.shape,
});

export const categoryFilterSchema = z.object({
  category: z.string().min(1).max(50),
  ...paginationSchema.shape,
});

/**
 * Cache API Validation Schemas
 */
export const cacheMetricsSchema = z.object({
  action: z.enum(['metrics', 'recent-operations', 'config']),
  limit: z.number().int().min(1).max(100).optional(),
});

export const cacheActionSchema = z.object({
  action: z.enum([
    'reset-metrics',
    'warm-cache',
    'update-warming-config',
    'update-ttl-config',
    'clear-cache'
  ]),
  data: z.record(z.any()).optional(),
});

/**
 * Stream Key Validation Schema
 */
export const streamKeySchema = z.object({
  key: z.string().min(1).max(100),
  token: z.string().min(1).max(500),
});

/**
 * Rate Limiting Schema
 */
export const rateLimitSchema = z.object({
  identifier: z.string().min(1),
  limit: z.number().int().min(1),
  windowMs: z.number().int().min(1000),
});

/**
 * Security Headers Schema
 */
export const securityHeadersSchema = z.object({
  'Content-Security-Policy': z.string().optional(),
  'X-Frame-Options': z.enum(['DENY', 'SAMEORIGIN']).optional(),
  'X-Content-Type-Options': z.enum(['nosniff']).optional(),
  'Referrer-Policy': z.enum(['strict-origin-when-cross-origin', 'no-referrer']).optional(),
  'Permissions-Policy': z.string().optional(),
});

/**
 * Error Response Schema
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

/**
 * Success Response Schema
 */
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
});

/**
 * Generic API Response Schema
 */
export const apiResponseSchema = z.union([
  successResponseSchema,
  errorResponseSchema,
]);

/**
 * Validation Helper Functions
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>, query: Record<string, string | string[] | undefined>): T {
  // Convert query parameters to proper types
  const processedQuery: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    
    // Handle array values
    if (Array.isArray(value)) {
      processedQuery[key] = value[0];
    } else {
      // Try to convert to number if it looks like a number
      if (!isNaN(Number(value)) && value !== '') {
        processedQuery[key] = Number(value);
      } else {
        processedQuery[key] = value;
      }
    }
  }
  
  return validateInput(schema, processedQuery);
}

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return validateInput(schema, body);
}
