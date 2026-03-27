/**
 * Zod schemas for plate module validation.
 */

import { z } from 'zod'

const foodGroupSchema = z.enum(['FRUIT', 'VEGETABLE', 'PROTEIN', 'CEREAL_TUBER', 'HEALTHY_FAT'])
const alClassificationSchema = z.enum(['ASTRINGENT', 'LAXATIVE', 'NEUTRAL'])

export const plateItemInputSchema = z.object({
  foodId: z.string().cuid(),
  groupAssignment: foodGroupSchema,
})

export const createPlateSchema = z.object({
  name: z.string().min(1).max(100).default('Mi plato'),
  groupCount: z.literal(4).or(z.literal(5)).default(4),
  babyProfileId: z.string().cuid().optional(),
  items: z.array(plateItemInputSchema).max(20),
})

export const updatePlateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  groupCount: z.literal(4).or(z.literal(5)).optional(),
  babyProfileId: z.string().cuid().optional().nullable(),
  items: z.array(plateItemInputSchema).max(20).optional(),
})

/**
 * Stateless balance request — items carry their A/L classification directly.
 * Used for inline/real-time balance preview without DB lookup.
 */
export const balanceRequestSchema = z.object({
  items: z.array(
    z.object({
      bowelEffect: alClassificationSchema,
    }),
  ),
})

/**
 * Calculate-balance request — items identified by foodId.
 * The server looks up the food's A/L classification from the DB.
 * Used by POST /api/plates/calculate-balance (the CORE anonymous endpoint).
 */
export const calculateBalanceSchema = z.object({
  items: z.array(
    z.object({
      foodId: z.string().cuid(),
    }),
  ).min(1, 'El plato debe tener al menos un alimento'),
})

/** Offset pagination for listing plates */
export const listPlatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreatePlateInput = z.infer<typeof createPlateSchema>
export type UpdatePlateInput = z.infer<typeof updatePlateSchema>
export type BalanceRequest = z.infer<typeof balanceRequestSchema>
export type CalculateBalanceInput = z.infer<typeof calculateBalanceSchema>
export type ListPlatesQuery = z.infer<typeof listPlatesQuerySchema>
