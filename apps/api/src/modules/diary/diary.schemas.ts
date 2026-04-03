/**
 * Zod validation schemas for the diary (food log) module.
 * Extracted for testability and reuse.
 *
 * Spec: REQ-LOG-02 — plateBalanceLabel enum-validated snapshot.
 */

import { z } from 'zod'
import { MealType, ReactionType } from '@pakulab/shared'

export const createLogSchema = z.object({
  babyProfileId: z.string(),
  foodId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  mealType: z.nativeEnum(MealType),
  reaction: z.nativeEnum(ReactionType).optional(),
  notes: z.string().max(500).optional(),
  plateId: z.string().optional(),
  plateBalanceLabel: z
    .enum([
      'BALANCED',
      'SLIGHTLY_ASTRINGENT',
      'VERY_ASTRINGENT',
      'SLIGHTLY_LAXATIVE',
      'VERY_LAXATIVE',
    ])
    .optional(),
})

export const updateLogSchema = z
  .object({
    reaction: z.nativeEnum(ReactionType).nullable().optional(),
    accepted: z.boolean().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const listQuerySchema = z.object({
  babyProfileId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const foodHistoryQuerySchema = z.object({
  babyProfileId: z.string().cuid(),
  foodIds: z
    .string()
    .min(1)
    .transform((s) => s.split(',').map((id) => id.trim()).filter((id) => id.length > 0))
    .pipe(z.array(z.string().cuid()).min(1).max(50)),
})

export type CreateLogInput = z.infer<typeof createLogSchema>
export type UpdateLogInput = z.infer<typeof updateLogSchema>
export type ListQueryInput = z.infer<typeof listQuerySchema>
export type FoodHistoryQueryInput = z.infer<typeof foodHistoryQuerySchema>
