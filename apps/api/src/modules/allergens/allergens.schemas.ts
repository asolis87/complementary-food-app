/**
 * Allergens routes — Zod validation schemas.
 *
 * Spec: REQ-A1
 */

import { z } from 'zod'

/**
 * Query parameters for GET /api/allergens/status
 */
export const statusQuerySchema = z.object({
  babyProfileId: z.string().min(1, 'babyProfileId es requerido'),
})

export type StatusQuery = z.infer<typeof statusQuerySchema>
