/**
 * Bitácora / Food log routes.
 * Spec: REQ-LOG-01 — 7-day window for Free, full history for Pro.
 */

import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'
import { userHasTier } from '../../shared/hooks/requireTier.js'
import { createLogSchema, updateLogSchema, listQuerySchema, foodHistoryQuerySchema } from './diary.schemas.js'
import { aggregateFoodHistory } from './diary.utils.js'

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────

export const diaryRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/diary — list food log entries
  fastify.get('/', { preHandler: [requireAuth, requireTier('FREE')] }, async (request, reply) => {
    const isPro = userHasTier(request, 'PRO')
    const userId = request.user!.id
    const query = listQuerySchema.parse(request.query)

    // Free users only see last 7 days
    const dateWindowFilter = isPro
      ? {}
      : {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        }

    const where: Record<string, unknown> = {
      userId,
      deletedAt: null,
      ...dateWindowFilter,
    }

    if (query.babyProfileId) {
      where.babyProfileId = query.babyProfileId
    }

    if (query.date) {
      where.date = new Date(query.date)
    }

    const entries = await fastify.prisma.foodLog.findMany({
      where,
      include: {
        food: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    reply.send({
      data: entries,
      meta: {
        windowDays: isPro ? null : 7,
        isPro,
      },
    })
  })

  // POST /api/diary — log a meal entry
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const input = createLogSchema.parse(request.body)
      const userId = request.user!.id

      const entry = await fastify.prisma.$transaction(async (tx) => {
        return tx.foodLog.create({
          data: {
            userId,
            babyProfileId: input.babyProfileId,
            foodId: input.foodId,
            date: new Date(input.date),
            time: input.time ?? null,
            mealType: input.mealType,
            reaction: input.reaction ?? null,
            notes: input.notes ?? null,
            plateId: input.plateId ?? null,
            plateBalanceLabel: input.plateBalanceLabel ?? null,
          },
          include: {
            food: true,
          },
        })
      })

      reply.status(201).send({ data: entry })
    },
  )

  // PATCH /api/diary/:id — update reaction, accepted, or notes after review moment
  fastify.patch(
    '/:id',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = request.user!.id
      const input = updateLogSchema.parse(request.body)

      const existing = await fastify.prisma.foodLog.findFirst({
        where: { id, deletedAt: null },
      })

      if (!existing) return reply.status(404).send({ error: 'Not found' })
      if (existing.userId !== userId) return reply.status(403).send({ error: 'Forbidden' })

      const updated = await fastify.prisma.foodLog.update({
        where: { id },
        data: {
          ...(input.reaction !== undefined && { reaction: input.reaction }),
          ...(input.accepted !== undefined && { accepted: input.accepted }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
        include: { food: true },
      })

      reply.send({ data: updated })
    },
  )

  // DELETE /api/diary/:id — soft-delete a meal log entry
  fastify.delete(
    '/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = request.user!.id

      const existing = await fastify.prisma.foodLog.findFirst({
        where: { id, userId, deletedAt: null },
      })

      if (!existing) {
        return reply.status(404).send({ error: 'Not found' })
      }

      await fastify.prisma.foodLog.update({
        where: { id },
        data: { deletedAt: new Date() },
      })

      reply.status(204).send()
    },
  )

  // GET /api/diary/food-history — aggregated food history for multiple foods
  // Spec: Plato↔Bitácora Connection — AD-1 (findMany + JS reduce)
  fastify.get(
    '/food-history',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const query = foodHistoryQuerySchema.safeParse(request.query)
      if (!query.success) {
        return reply.status(400).send({ error: 'Bad Request', issues: query.error.issues })
      }

      const { babyProfileId, foodIds } = query.data
      const userId = request.user!.id
      const isPro = userHasTier(request, 'PRO')

      // Verify ownership of the baby profile
      const profile = await fastify.prisma.babyProfile.findFirst({
        where: { id: babyProfileId, userId },
        select: { id: true },
      })
      if (!profile) return reply.status(403).send({ error: 'Forbidden' })

      // Date window: Free tier = last 7 days, Pro tier = all time
      const dateFilter = isPro
        ? {}
        : {
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          }

      const logs = await fastify.prisma.foodLog.findMany({
        where: {
          userId,
          babyProfileId,
          foodId: { in: foodIds },
          deletedAt: null,
          ...dateFilter,
        },
        select: { foodId: true, reaction: true, date: true },
        orderBy: { date: 'desc' },
      })

      // Aggregate with pure function — AD-1 (findMany + JS reduce)
      const historyMap = aggregateFoodHistory(logs, foodIds)

      reply.send({ data: historyMap })
    },
  )
}
