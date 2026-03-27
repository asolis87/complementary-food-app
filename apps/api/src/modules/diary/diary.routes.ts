/**
 * Bitácora / Food log routes.
 * Spec: REQ-LOG-01 — 7-day window for Free, full history for Pro.
 */

import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'
import { userHasTier } from '../../shared/hooks/requireTier.js'

const createLogSchema = z.object({
  babyProfileId: z.string().cuid(),
  foodId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reaction: z.string().max(500).optional(),
  severity: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE']).optional(),
  notes: z.string().max(500).optional(),
})

export const diaryRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/diary — list food log entries
  fastify.get('/', { preHandler: [requireAuth, requireTier('FREE')] }, async (request, reply) => {
    const isPro = userHasTier(request, 'PRO')
    const userId = request.user!.id

    // Free users only see last 7 days
    const dateFilter = isPro
      ? {}
      : {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        }

    const entries = await fastify.prisma.foodLog.findMany({
      where: { userId, deletedAt: null, ...dateFilter },
      include: { food: true },
      orderBy: { date: 'desc' },
    })

    reply.send({
      data: entries,
      meta: {
        windowDays: isPro ? null : 7,
        isPro,
      },
    })
  })

  // POST /api/diary — log a food entry
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const input = createLogSchema.parse(request.body)

      const entry = await fastify.prisma.foodLog.create({
        data: {
          userId: request.user!.id,
          babyProfileId: input.babyProfileId,
          foodId: input.foodId,
          date: new Date(input.date),
          reaction: input.reaction ?? null,
          severity: input.severity ?? 'NONE',
          notes: input.notes,
        },
        include: { food: true },
      })

      reply.status(201).send({ data: entry })
    },
  )
}
