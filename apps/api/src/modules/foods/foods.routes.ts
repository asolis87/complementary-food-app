/**
 * Food catalog routes.
 * No auth required — public endpoints per spec (REQ-FD-01, REQ-FD-02).
 */

import type { FastifyPluginAsync } from 'fastify'
import { NotFoundError } from '../../shared/errors/index.js'
import { getFoodById, getFoodGroups, listFoods, searchFoods } from './foods.service.js'
import { listFoodsQuerySchema, searchFoodsQuerySchema } from './foods.schema.js'

export const foodsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/foods/groups — available food groups with Spanish labels
  // IMPORTANT: Must be registered BEFORE /:id to avoid route conflicts
  fastify.get('/groups', async (_request, reply) => {
    const result = getFoodGroups()
    reply.send(result)
  })

  // GET /api/foods/search — quick autocomplete search (top 10)
  fastify.get('/search', async (request, reply) => {
    const { q } = searchFoodsQuerySchema.parse(request.query)
    const results = await searchFoods(fastify.prisma, q)
    reply.send({ data: results })
  })

  // GET /api/foods — list/search foods with filtering and offset pagination
  fastify.get('/', async (request, reply) => {
    const query = listFoodsQuerySchema.parse(request.query)
    const result = await listFoods(fastify.prisma, query)
    reply.send(result)
  })

  // GET /api/foods/:id — single food detail
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const food = await getFoodById(fastify.prisma, request.params.id)
    if (!food) throw new NotFoundError('Alimento')
    reply.send({ data: food })
  })
}
