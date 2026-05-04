/**
 * Zod schemas for dashboard module request validation.
 *
 * Spec: REQ-DASH-01 through REQ-DASH-06
 */

import { z } from 'zod'

// ── Query Schemas ─────────────────────────────────────────────────────────────

/** GET /api/dashboard — consolidated dashboard query params */
export const dashboardQuerySchema = z.object({
  babyProfileId: z.string().min(1, 'babyProfileId es requerido'),
})

/** GET /api/dashboard/suggestions — food suggestions query params */
export const suggestionsQuerySchema = z.object({
  babyProfileId: z.string().min(1, 'babyProfileId es requerido'),
  limit: z.coerce.number().int().min(1).max(10).default(3),
})

/** GET /api/dashboard/allergens — pending allergens query params */
export const allergensQuerySchema = z.object({
  babyProfileId: z.string().min(1, 'babyProfileId es requerido'),
})

/** GET /api/dashboard/roadmap — food roadmap query params */
export const roadmapQuerySchema = z.object({
  babyProfileId: z.string().min(1, 'babyProfileId es requerido'),
})

/** GET /api/dashboard/today — today's logs query params */
export const todayQuerySchema = z.object({
  babyProfileId: z.string().min(1, 'babyProfileId es requerido'),
})

/** GET /api/dashboard/balance — weekly balance query params */
export const balanceQuerySchema = z.object({
  babyProfileId: z.string().min(1, 'babyProfileId es requerido'),
})

// ── Inferred Types ────────────────────────────────────────────────────────────

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>
export type SuggestionsQuery = z.infer<typeof suggestionsQuerySchema>
export type AllergensQuery = z.infer<typeof allergensQuerySchema>
export type RoadmapQuery = z.infer<typeof roadmapQuerySchema>
export type TodayQuery = z.infer<typeof todayQuerySchema>
export type BalanceQuery = z.infer<typeof balanceQuerySchema>
