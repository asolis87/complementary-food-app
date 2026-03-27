/**
 * Weekly menu planner routes — Pro only.
 * Spec: REQ-MENU-01
 */

import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'

const createMenuSchema = z.object({
  babyProfileId: z.string().cuid(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Monday of the week
  name: z.string().max(100).optional(),
})

export const menusRoutes: FastifyPluginAsync = async (fastify) => {
  // All menu routes require Pro tier
  fastify.addHook('preHandler', requireAuth)
  fastify.addHook('preHandler', requireTier('PRO'))

  // GET /api/menus
  fastify.get('/', async (request, reply) => {
    const menus = await fastify.prisma.weeklyMenu.findMany({
      where: { userId: request.user!.id, deletedAt: null },
      include: { days: { include: { meals: true } } },
      orderBy: { weekStart: 'desc' },
    })
    reply.send({ data: menus })
  })

  // POST /api/menus
  fastify.post('/', async (request, reply) => {
    const input = createMenuSchema.parse(request.body)
    const menu = await fastify.prisma.weeklyMenu.create({
      data: {
        userId: request.user!.id,
        babyProfileId: input.babyProfileId,
        weekStart: new Date(input.weekStart),
        // Auto-create 7 days
        days: {
          create: Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
          })),
        },
      },
      include: { days: { include: { meals: true } } },
    })
    reply.status(201).send({ data: menu })
  })
}
