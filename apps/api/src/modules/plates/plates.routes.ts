/**
 * Plate builder routes.
 * Balance endpoints are public (stateless or DB-lookup, for anonymous users).
 * CRUD requires auth.
 */

import { calculateBalance } from '@cfa/shared'
import type { FastifyPluginAsync } from 'fastify'
import { NotFoundError } from '../../shared/errors/index.js'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'
import {
  balanceRequestSchema,
  calculateBalanceSchema,
  createPlateSchema,
  listPlatesQuerySchema,
  updatePlateSchema,
} from './plates.schema.js'
import {
  calculatePlateBalance,
  createPlate,
  getPlateById,
  getUserPlates,
  softDeletePlate,
  updatePlate,
} from './plates.service.js'

export const platesRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/plates/calculate-balance — CORE endpoint: DB-lookup balance calc (no auth required)
  // Anonymous users can use this to see real-time balance in the plate builder.
  // IMPORTANT: Must be registered BEFORE /:id to avoid route conflicts.
  fastify.post('/calculate-balance', async (request, reply) => {
    const input = calculateBalanceSchema.parse(request.body)
    const result = await calculatePlateBalance(fastify.prisma, input)
    reply.send({ data: result })
  })

  // POST /api/plates/:id/balance — stateless balance calc (inline A/L classification, no DB lookup)
  fastify.post<{ Params: { id: string } }>('/:id/balance', async (request, reply) => {
    const input = balanceRequestSchema.parse(request.body)
    const result = calculateBalance(input.items)
    reply.send({ data: result })
  })

  // POST /api/plates/balance — stateless balance calc without plate ID
  fastify.post('/balance', async (request, reply) => {
    const input = balanceRequestSchema.parse(request.body)
    const result = calculateBalance(input.items)
    reply.send({ data: result })
  })

  // GET /api/plates — list user's plates (requires auth)
  fastify.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const query = listPlatesQuerySchema.parse(request.query)
    const result = await getUserPlates(fastify.prisma, request.user!.id, query)
    reply.send(result)
  })

  // GET /api/plates/:id — get single plate with items and balance breakdown
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const plate = await getPlateById(fastify.prisma, request.params.id, request.user!.id)
      if (!plate) throw new NotFoundError('Plato')
      reply.send({ data: plate })
    },
  )

  // POST /api/plates — create plate (Free+ required, requires account to save)
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const input = createPlateSchema.parse(request.body)
      const tier = request.user!.tier === 'PRO' ? 'PRO' : 'FREE'
      const plate = await createPlate(fastify.prisma, request.user!.id, tier, input)
      reply.status(201).send({ data: plate })
    },
  )

  // PUT /api/plates/:id — update plate (recalculates balance on item changes)
  fastify.put<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const input = updatePlateSchema.parse(request.body)
      const plate = await updatePlate(fastify.prisma, request.params.id, request.user!.id, input)
      if (!plate) throw new NotFoundError('Plato')
      reply.send({ data: plate })
    },
  )

  // DELETE /api/plates/:id — soft delete (only owner can delete)
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const plate = await softDeletePlate(fastify.prisma, request.params.id, request.user!.id)
      if (!plate) throw new NotFoundError('Plato')
      reply.status(204).send()
    },
  )
}
