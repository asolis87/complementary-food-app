/**
 * Zod schemas for billing module validation.
 */

import { z } from 'zod'

/** POST /api/billing/create-checkout */
export const createCheckoutSchema = z.object({
  priceId: z.string().min(1, 'priceId es requerido'),
})

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>

/** POST /api/billing/start-trial */
export const startTrialSchema = z.object({
  plan: z.enum(['TRIAL', 'PRO_MONTHLY', 'PRO_YEARLY']),
})

export type StartTrialInput = z.infer<typeof startTrialSchema>
