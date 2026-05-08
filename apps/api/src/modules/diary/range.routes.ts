/**
 * Diary range route.
 * Spec: REQ-C3, Design § 3 — GET /api/diary/range with 31-day cap.
 * Returns { logs: FoodLogDTO[], observations: DayObservationDTO[] }.
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { assertBabyOwnership, toDayObservationDTO } from './dayObservation.routes.js'

// ── Schema ────────────────────────────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const rangeQuerySchema = z
  .object({
    babyProfileId: z.string().cuid(),
    from: z.string().regex(dateRegex, 'from must be in YYYY-MM-DD format'),
    to: z.string().regex(dateRegex, 'to must be in YYYY-MM-DD format'),
  })
  .refine(
    ({ from, to }) => {
      const days = (Date.parse(to) - Date.parse(from)) / 86_400_000
      return days >= 0 && days <= 31
    },
    { message: 'Rango inválido — máximo 31 días, to >= from' },
  )

type RangeQueryInput = z.infer<typeof rangeQuerySchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function toUtcMidnight(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z')
}

function toNextDayUtcMidnight(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const rangeRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/diary/range?babyProfileId=&from=&to=
  fastify.get(
    '/range',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = rangeQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Bad Request', issues: parsed.error.issues })
      }

      const { babyProfileId, from, to } = parsed.data as RangeQueryInput

      const userId = request.user!.id
      if (!(await assertBabyOwnership(fastify, userId, babyProfileId))) {
        return reply.status(403).send({ error: 'Forbidden' })
      }

      const fromDate = toUtcMidnight(from)
      const toExclusive = toNextDayUtcMidnight(to)

      // Parallel queries (Design § 3)
      const [logs, observations] = await Promise.all([
        fastify.prisma.foodLog.findMany({
          where: {
            babyProfileId,
            deletedAt: null,
            date: { gte: fromDate, lt: toExclusive },
          },
          include: { food: true },
          orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
        }),
        fastify.prisma.dayObservation.findMany({
          where: {
            babyProfileId,
            date: { gte: fromDate, lt: toExclusive },
          },
          orderBy: { date: 'asc' },
        }),
      ])

      return reply.status(200).send({ data: { logs, observations: observations.map(toDayObservationDTO) } })
    },
  )
}
