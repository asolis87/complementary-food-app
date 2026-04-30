/**
 * DayObservation routes.
 * Spec: REQ-B1, REQ-B2, REQ-B3, REQ-B4 — day-level observation CRUD.
 * Design § 3 — GET/PUT/DELETE /api/day-observation with composite key (babyProfileId, date).
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import {
  upsertBodySchema,
  getQuerySchema,
  deleteQuerySchema,
} from './dayObservation.schemas.js'

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Converts a YYYY-MM-DD string to a UTC Date at midnight.
 * Prisma stores @db.Date as a Date with time zeroed in UTC.
 */
function dateToUtcMidnight(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z')
}

/**
 * Verifies that the babyProfile belongs to the authenticated user.
 * Exported so range.routes.ts and any other consumer share the same check.
 */
export async function assertBabyOwnership(
  fastify: FastifyInstance,
  userId: string,
  babyProfileId: string,
): Promise<boolean> {
  const baby = await fastify.prisma.babyProfile.findFirst({
    where: { id: babyProfileId, userId, deletedAt: null },
    select: { id: true },
  })
  return baby !== null
}

/**
 * Serialises a Prisma DayObservation row to a plain DTO (date as YYYY-MM-DD string).
 * Exported so range.routes.ts and any other consumer can reuse the same serialisation.
 */
export function toDayObservationDTO(row: {
  id: string
  babyProfileId: string
  date: Date
  stool: string | null
  symptoms: string[]
  notes: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: row.id,
    babyProfileId: row.babyProfileId,
    date: row.date.toISOString().slice(0, 10),
    stool: row.stool ?? null,
    symptoms: row.symptoms,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────

export const dayObservationRoutes: FastifyPluginAsync = async (fastify) => {
  // PUT /api/day-observation — idempotent upsert (REQ-B1)
  fastify.put(
    '/day-observation',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = upsertBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Bad Request', issues: parsed.error.issues })
      }

      const { babyProfileId, date, stool, symptoms, notes } = parsed.data

      const userId = request.user!.id
      if (!(await assertBabyOwnership(fastify, userId, babyProfileId))) {
        return reply.status(403).send({ error: 'Forbidden' })
      }

      const dateValue = dateToUtcMidnight(date)

      const observation = await fastify.prisma.dayObservation.upsert({
        where: { babyProfileId_date: { babyProfileId, date: dateValue } },
        create: {
          babyProfileId,
          date: dateValue,
          stool: stool ?? null,
          symptoms: symptoms ?? [],
          notes: notes ?? null,
        },
        update: {
          stool: stool ?? null,
          symptoms: symptoms ?? [],
          notes: notes ?? null,
        },
      })

      return reply.status(200).send({ data: toDayObservationDTO(observation) })
    },
  )

  // GET /api/day-observation?babyProfileId=&date= — fetch by composite key
  fastify.get(
    '/day-observation',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = getQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Bad Request', issues: parsed.error.issues })
      }

      const { babyProfileId, date } = parsed.data

      const userId = request.user!.id
      if (!(await assertBabyOwnership(fastify, userId, babyProfileId))) {
        return reply.status(403).send({ error: 'Forbidden' })
      }

      const dateValue = dateToUtcMidnight(date)

      const observation = await fastify.prisma.dayObservation.findUnique({
        where: { babyProfileId_date: { babyProfileId, date: dateValue } },
      })

      return reply.status(200).send({ data: observation ? toDayObservationDTO(observation) : null })
    },
  )

  // DELETE /api/day-observation?babyProfileId=&date= — delete by composite key (REQ-B4)
  fastify.delete(
    '/day-observation',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = deleteQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Bad Request', issues: parsed.error.issues })
      }

      const { babyProfileId, date } = parsed.data

      const userId = request.user!.id
      if (!(await assertBabyOwnership(fastify, userId, babyProfileId))) {
        return reply.status(403).send({ error: 'Forbidden' })
      }

      const dateValue = dateToUtcMidnight(date)

      // Check existence before delete — Prisma throws P2025 if not found
      const existing = await fastify.prisma.dayObservation.findUnique({
        where: { babyProfileId_date: { babyProfileId, date: dateValue } },
      })

      if (!existing) {
        return reply.status(404).send({ error: 'Not found' })
      }

      await fastify.prisma.dayObservation.delete({
        where: { babyProfileId_date: { babyProfileId, date: dateValue } },
      })

      return reply.status(204).send()
    },
  )
}
