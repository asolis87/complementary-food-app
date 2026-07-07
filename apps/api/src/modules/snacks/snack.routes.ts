/**
 * Snack catalog routes.
 * All endpoints require auth. CREATE/UPDATE/DELETE require FREE tier.
 * Mirrors the plates routes structure.
 */

import type { FastifyPluginAsync } from 'fastify'
import { NotFoundError } from '../../shared/errors/index.js'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'
import {
  createSnackSchema,
  listSnacksQuerySchema,
  getSnackSchema,
} from './snack.schemas.js'
import {
  createSnack,
  getUserSnacks,
  getSnackById,
  softDeleteSnack,
} from './snack.service.js'

export const snackRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/snacks — list user's snacks (requires auth)
  fastify.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const query = listSnacksQuerySchema.parse(request.query)
    const result = await getUserSnacks(fastify.prisma, request.user!.id, query)
    reply.send(result)
  })

  // GET /api/snacks/:id — get single snack with items
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = getSnackSchema.parse(request.params)
      const snack = await getSnackById(fastify.prisma, id, request.user!.id)
      if (!snack) throw new NotFoundError('Colación')
      reply.send({ data: snack })
    },
  )

  // POST /api/snacks — create snack (Free+ required)
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const input = createSnackSchema.parse(request.body)
      const tier = request.user!.tier === 'PRO' ? 'PRO' : 'FREE'
      const { snack, warnings } = await createSnack(fastify.prisma, request.user!.id, tier, input)
      reply.status(201).send({ data: snack, warnings })
    },
  )

  // DELETE /api/snacks/:id — soft delete (only owner can delete)
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const { id } = getSnackSchema.parse(request.params)
      const snack = await softDeleteSnack(fastify.prisma, id, request.user!.id)
      if (!snack) throw new NotFoundError('Colación')
      reply.status(204).send()
    },
  )
}
