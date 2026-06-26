/**
 * Allergen tracker routes — Pro only.
 *
 * Provides allergen introduction status for babies.
 * Derives status from FoodLog + Food.allergenType data.
 *
 * Spec: REQ-A1, REQ-A7
 */

import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'
import { DASHBOARD_CACHE_TTL } from '@pakulab/shared'
import { statusQuerySchema } from './allergens.schemas.js'
import { getStatus } from './allergens.service.js'

/**
 * Set cache control headers for an allergen endpoint.
 */
function setCacheHeaders(reply: { header: (name: string, value: string) => void }, ttlSeconds: number): void {
  if (ttlSeconds === 0) {
    reply.header('Cache-Control', 'no-store, private')
    return
  }
  reply.header('Cache-Control', `max-age=${ttlSeconds}, private, stale-while-revalidate`)
}

export const allergensRoutes: FastifyPluginAsync = async (fastify) => {
  // All allergen routes require Auth + Pro tier
  // Decision 3: Reuse existing requireTier('PRO') which throws 403 INSUFFICIENT_TIER
  fastify.addHook('preHandler', requireAuth)
  fastify.addHook('preHandler', requireTier('PRO'))

  // ============================================================================
  // GET /api/allergens/status — allergen introduction tracker
  // Spec: REQ-A1
  // ============================================================================
  fastify.get('/status', async (request, reply) => {
    const query = statusQuerySchema.parse(request.query)
    const userId = request.user!.id

    const data = await getStatus(fastify.prisma, query.babyProfileId, userId, request.log)

    setCacheHeaders(reply, DASHBOARD_CACHE_TTL.allergens)
    reply.send({ data })
  })

  // ============================================================================
  // GET /api/allergens — stub (legacy endpoint)
  // ============================================================================
  fastify.get('/', async (_request, reply) => {
    reply.send({ data: [], message: 'Allergen tracker — implementado en Fase 9' })
  })
}
