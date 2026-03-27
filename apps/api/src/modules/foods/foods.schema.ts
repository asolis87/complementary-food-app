/**
 * Zod schemas for food module request/response validation.
 */

import { z } from 'zod'

export const foodGroupSchema = z.enum(['FRUIT', 'VEGETABLE', 'PROTEIN', 'CEREAL_TUBER', 'HEALTHY_FAT'])
export const alClassificationSchema = z.enum(['ASTRINGENT', 'LAXATIVE', 'NEUTRAL'])

export const listFoodsQuerySchema = z.object({
  q: z.string().optional(), // text search
  group: foodGroupSchema.optional(),
  alClassification: alClassificationSchema.optional(),
  ageMonths: z.coerce.number().int().min(0).optional(),
  isAllergen: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  allergenFree: z.string().optional(), // comma-separated allergen keys to exclude
  // Offset-based pagination (per task spec)
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const searchFoodsQuerySchema = z.object({
  q: z.string().min(2, 'El término de búsqueda debe tener al menos 2 caracteres'),
})

export type ListFoodsQuery = z.infer<typeof listFoodsQuerySchema>
export type SearchFoodsQuery = z.infer<typeof searchFoodsQuerySchema>
