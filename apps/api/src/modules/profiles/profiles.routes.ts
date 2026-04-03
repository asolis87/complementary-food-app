/**
 * Baby profiles routes.
 * Spec: REQ-AUTH-03
 *
 * Endpoints:
 *   GET    /api/profiles        — list user's profiles
 *   POST   /api/profiles        — create profile (FREE tier required)
 *   GET    /api/profiles/:id    — get single profile
 *   PUT    /api/profiles/:id    — update profile
 *   DELETE /api/profiles/:id    — soft delete
 */

import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { NotFoundError, TierLimitError } from '../../shared/errors/index.js'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'
import { BABY_PROFILE_LIMITS } from '@pakulab/shared'

// ─── Zod schemas ────────────────────────────────────────────────────────────

const dateField = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))

const createProfileSchema = z.object({
  name: z.string().min(1).max(50),
  birthDate: dateField,
  acStartDate: dateField.optional(),
  notes: z.string().max(500).optional(),
})

const updateProfileSchema = createProfileSchema.partial()

// ─── Route plugin ────────────────────────────────────────────────────────────

export const profilesRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /api/profiles ─────────────────────────────────────────────────────
  fastify.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const profiles = await fastify.prisma.babyProfile.findMany({
      where: { userId: request.user!.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })
    reply.send({ data: profiles })
  })

  // ── POST /api/profiles ────────────────────────────────────────────────────
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const input = createProfileSchema.parse(request.body)
      const userId = request.user!.id
      const tier = request.user!.tier

      const count = await fastify.prisma.babyProfile.count({
        where: { userId, deletedAt: null },
      })

      const limit = BABY_PROFILE_LIMITS[tier]
      if (count >= limit) {
        throw new TierLimitError(
          tier === 'PRO'
            ? 'Has alcanzado el límite de 3 perfiles para el plan Pro.'
            : 'El plan gratuito solo permite 1 perfil de bebé. Mejora a Pro para agregar más.',
        )
      }

      const profile = await fastify.prisma.babyProfile.create({
        data: {
          userId,
          name: input.name,
          birthDate: new Date(input.birthDate),
          acStartDate: input.acStartDate ? new Date(input.acStartDate) : undefined,
          notes: input.notes,
        },
      })
      reply.status(201).send({ data: profile })
    },
  )

  // ── GET /api/profiles/:id ─────────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const profile = await fastify.prisma.babyProfile.findFirst({
        where: {
          id: request.params.id,
          userId: request.user!.id,
          deletedAt: null,
        },
      })
      if (!profile) throw new NotFoundError('Perfil')
      reply.send({ data: profile })
    },
  )

  // ── PUT /api/profiles/:id ─────────────────────────────────────────────────
  fastify.put<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const input = updateProfileSchema.parse(request.body)

      const existing = await fastify.prisma.babyProfile.findFirst({
        where: {
          id: request.params.id,
          userId: request.user!.id,
          deletedAt: null,
        },
      })
      if (!existing) throw new NotFoundError('Perfil')

      const updateData: {
        name?: string
        birthDate?: Date
        acStartDate?: Date
        notes?: string
      } = {}

      if (input.name !== undefined) updateData.name = input.name
      if (input.birthDate !== undefined) updateData.birthDate = new Date(input.birthDate)
      if (input.acStartDate !== undefined) updateData.acStartDate = new Date(input.acStartDate)
      if (input.notes !== undefined) updateData.notes = input.notes

      const profile = await fastify.prisma.babyProfile.update({
        where: { id: request.params.id },
        data: updateData,
      })
      reply.send({ data: profile })
    },
  )

  // ── DELETE /api/profiles/:id ──────────────────────────────────────────────
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const existing = await fastify.prisma.babyProfile.findFirst({
        where: {
          id: request.params.id,
          userId: request.user!.id,
          deletedAt: null,
        },
      })
      if (!existing) throw new NotFoundError('Perfil')

      await fastify.prisma.babyProfile.update({
        where: { id: request.params.id },
        data: { deletedAt: new Date() },
      })

      reply.status(204).send()
    },
  )
}
