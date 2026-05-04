/**
 * Dashboard routes — actionable dashboard for Pakulab.
 *
 * Aggregates diary, foods, profiles, and allergen data into
 * consolidated dashboard views.
 *
 * Spec: REQ-DASH-01 through REQ-DASH-06
 */

import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'
import { userHasTier } from '../../shared/hooks/requireTier.js'
import { ForbiddenError } from '../../shared/errors/index.js'
import { DASHBOARD_CACHE_TTL } from '@pakulab/shared'
import {
  dashboardQuerySchema,
  suggestionsQuerySchema,
  allergensQuerySchema,
  roadmapQuerySchema,
  todayQuerySchema,
  balanceQuerySchema,
} from './dashboard.schemas.js'
import {
  getDashboardData,
  getSuggestedFoods,
  getPendingAllergens,
  getRoadmapProgress,
  getTodayLogs,
  getWeeklyBalance,
} from './dashboard.service.js'

/**
 * Set cache control headers for a dashboard endpoint.
 */
function setCacheHeaders(reply: { header: (name: string, value: string) => void }, ttlSeconds: number): void {
  if (ttlSeconds === 0) {
    reply.header('Cache-Control', 'no-store, private')
    return
  }
  reply.header('Cache-Control', `max-age=${ttlSeconds}, private, stale-while-revalidate`)
}

/**
 * Verify that the baby profile belongs to the authenticated user.
 */
async function verifyBabyOwnership(
  fastify: { prisma: { babyProfile: { findFirst: (args: { where: { id: string; userId: string; deletedAt: null }; select: { id: true } }) => Promise<unknown> } } },
  babyProfileId: string,
  userId: string,
): Promise<void> {
  const profile = await fastify.prisma.babyProfile.findFirst({
    where: { id: babyProfileId, userId, deletedAt: null },
    select: { id: true },
  })
  if (!profile) {
    throw new ForbiddenError('No tienes acceso a este perfil de bebé')
  }
}

// ── Route Plugin ──────────────────────────────────────────────────────────────

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // ============================================================================
  // GET /api/dashboard — consolidated dashboard data
  // Spec: REQ-DASH-01
  // ============================================================================
  fastify.get(
    '/',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const query = dashboardQuerySchema.parse(request.query)
      const userId = request.user!.id
      const userTier = request.user!.tier

      await verifyBabyOwnership(fastify, query.babyProfileId, userId)

      const data = await getDashboardData(fastify.prisma, userId, query.babyProfileId, userTier)

      setCacheHeaders(reply, DASHBOARD_CACHE_TTL.dashboard)
      reply.send({ data })
    },
  )

  // ============================================================================
  // GET /api/dashboard/suggestions — food suggestions
  // Spec: REQ-DASH-02
  // ============================================================================
  fastify.get(
    '/suggestions',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const query = suggestionsQuerySchema.parse(request.query)
      const userId = request.user!.id

      await verifyBabyOwnership(fastify, query.babyProfileId, userId)

      // Get baby age for suggestion filtering
      const profile = await fastify.prisma.babyProfile.findFirst({
        where: { id: query.babyProfileId, userId, deletedAt: null },
        select: { birthDate: true },
      })

      if (!profile) {
        throw new ForbiddenError('No tienes acceso a este perfil de bebé')
      }

      const { calculateAgeAndDaysInAC } = await import('./dashboard.service.js')
      const { ageInMonths: babyAgeMonths } = calculateAgeAndDaysInAC(profile.birthDate, null)

      const data = await getSuggestedFoods(fastify.prisma, query.babyProfileId, babyAgeMonths, query.limit)

      setCacheHeaders(reply, DASHBOARD_CACHE_TTL.suggestions)
      reply.send({ data })
    },
  )

  // ============================================================================
  // GET /api/dashboard/allergens — pending allergens
  // Spec: REQ-DASH-03
  // ============================================================================
  fastify.get(
    '/allergens',
    { preHandler: [requireAuth, requireTier('PRO')] },
    async (request, reply) => {
      const query = allergensQuerySchema.parse(request.query)
      const userId = request.user!.id

      await verifyBabyOwnership(fastify, query.babyProfileId, userId)

      // Get baby age for allergen window logic
      const profile = await fastify.prisma.babyProfile.findFirst({
        where: { id: query.babyProfileId, userId, deletedAt: null },
        select: { birthDate: true },
      })

      if (!profile) {
        throw new ForbiddenError('No tienes acceso a este perfil de bebé')
      }

      const { calculateAgeAndDaysInAC } = await import('./dashboard.service.js')
      const { ageInMonths: babyAgeMonths } = calculateAgeAndDaysInAC(profile.birthDate, null)

      const data = await getPendingAllergens(fastify.prisma, query.babyProfileId, babyAgeMonths)

      setCacheHeaders(reply, DASHBOARD_CACHE_TTL.allergens)
      reply.send({ data })
    },
  )

  // ============================================================================
  // GET /api/dashboard/roadmap — food progress by category
  // Spec: REQ-DASH-04
  // ============================================================================
  fastify.get(
    '/roadmap',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const query = roadmapQuerySchema.parse(request.query)
      const userId = request.user!.id

      await verifyBabyOwnership(fastify, query.babyProfileId, userId)

      const profile = await fastify.prisma.babyProfile.findFirst({
        where: { id: query.babyProfileId, userId, deletedAt: null },
        select: { birthDate: true },
      })

      if (!profile) {
        throw new ForbiddenError('No tienes acceso a este perfil de bebé')
      }

      const { calculateAgeAndDaysInAC } = await import('./dashboard.service.js')
      const { ageInMonths: babyAgeMonths } = calculateAgeAndDaysInAC(profile.birthDate, null)

      const data = await getRoadmapProgress(fastify.prisma, query.babyProfileId, babyAgeMonths)

      setCacheHeaders(reply, DASHBOARD_CACHE_TTL.roadmap)
      reply.send({ data })
    },
  )

  // ============================================================================
  // GET /api/dashboard/today — today's food logs
  // Spec: REQ-DASH-05
  // ============================================================================
  fastify.get(
    '/today',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const query = todayQuerySchema.parse(request.query)
      const userId = request.user!.id

      await verifyBabyOwnership(fastify, query.babyProfileId, userId)

      const data = await getTodayLogs(fastify.prisma, query.babyProfileId)

      setCacheHeaders(reply, DASHBOARD_CACHE_TTL.today)
      reply.send({ data })
    },
  )

  // ============================================================================
  // GET /api/dashboard/balance — weekly A/L balance
  // Spec: REQ-DASH-06
  // ============================================================================
  fastify.get(
    '/balance',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const query = balanceQuerySchema.parse(request.query)
      const userId = request.user!.id

      await verifyBabyOwnership(fastify, query.babyProfileId, userId)

      const data = await getWeeklyBalance(fastify.prisma, query.babyProfileId)

      setCacheHeaders(reply, DASHBOARD_CACHE_TTL.balance)
      reply.send({ data })
    },
  )
}
