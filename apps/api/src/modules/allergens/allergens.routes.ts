/**
 * Allergen tracker routes — Pro only.
 * Spec: REQ-ALLG-01
 */

import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'

export const allergensRoutes: FastifyPluginAsync = async (fastify) => {
  // All allergen routes require Pro
  fastify.addHook('preHandler', requireAuth)
  fastify.addHook('preHandler', requireTier('PRO'))

  // GET /api/allergens — stub for Phase 9 implementation (T-042)
  fastify.get('/', async (_request, reply) => {
    reply.send({ data: [], message: 'Allergen tracker — implementado en Fase 9' })
  })
}
