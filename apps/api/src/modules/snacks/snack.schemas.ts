/**
 * Zod schemas for snack module validation.
 * REQ-SM2: Validate groupAssignment to snack-valid groups only.
 */

import { z } from 'zod'
import { sanitizeText } from '../../shared/utils/sanitize.js'
import { PLATE_STAGES, SNACK_GROUPS } from '@pakulab/shared'

/**
 * Snack-valid food groups (subset of FoodGroup).
 * PROTEINS, VEGETABLES, and DAIRY are NOT allowed in snacks.
 */
const snackGroupSchema = z.enum(SNACK_GROUPS)

export const snackItemInputSchema = z.object({
  foodId: z.string().cuid(),
  groupAssignment: snackGroupSchema,
  servingAmount: z.string().regex(/^[1-4]$/, 'Porción debe ser 1, 2, 3 o 4 cdas').optional(),
})

export const createSnackSchema = z.object({
  name: z.string().min(1).max(100).default('Mi colación').transform(sanitizeText),
  babyProfileId: z.string().cuid().optional().nullable(),
  stageFor: z.enum(PLATE_STAGES).optional(),
  items: z.array(snackItemInputSchema).min(1, 'La colación debe tener al menos un alimento').max(10),
})

/** Offset pagination for listing snacks */
export const listSnacksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  babyProfileId: z.string().cuid().optional(),
  stageFor: z.preprocess(
    (val) => (val === 'null' || val === '' ? null : val),
    z.enum(PLATE_STAGES).nullable().optional(),
  ),
})

export const getSnackSchema = z.object({
  id: z.string().cuid(),
})

export type CreateSnackInput = z.infer<typeof createSnackSchema>
export type ListSnacksQuery = z.infer<typeof listSnacksQuerySchema>
export type GetSnackParams = z.infer<typeof getSnackSchema>
