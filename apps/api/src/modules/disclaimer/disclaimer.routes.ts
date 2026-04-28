/**
 * Disclaimer routes — POST /accept
 *
 * Spec: REQ-DC-01, REQ-DC-02, REQ-DC-03, REQ-DC-04
 * Design: AD-DC-04 (always-insert, auth required, captures UA + IP)
 *
 * Registered under prefix /api/disclaimer in app.ts.
 *
 * Rate limit: 10 req/min per route (tighter than the global 100/min) to
 * prevent abuse of the acceptance endpoint (REQ-DC-03).
 *
 * Security:
 * - originGuardPlugin (global) blocks non-whitelisted POST origins (H-01).
 * - cacheControlPlugin (global) sets Cache-Control: no-store, private (M-05).
 * - requireAuth (preHandler) returns 401 when no session.
 */

import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { PrismaDisclaimerRepository } from './infrastructure/adapters/prisma-disclaimer.repository.js'
import { DisclaimerService } from './disclaimer.service.js'

// ─── Request body schema (AD-DC-04) ──────────────────────────────────────────

const acceptDisclaimerBodySchema = z.object({
  version: z.string().min(1).max(32),
})

// ─── Route plugin ─────────────────────────────────────────────────────────────

export const disclaimerRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/disclaimer/accept
   *
   * Validates the disclaimer version, persists an acceptance row, and returns
   * the lastAcceptedDisclaimerVersion so the frontend can update authStore
   * without a page reload (AD-DC-04).
   *
   * Response is intentionally minimal — Phase 4 will extend session-info with
   * this field; for now we return only what is needed for the store update.
   */
  fastify.post(
    '/accept',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      // ── Auth guard ──────────────────────────────────────────────────────
      await requireAuth(request, reply)

      // ── Zod validation ──────────────────────────────────────────────────
      const { version } = acceptDisclaimerBodySchema.parse(request.body)

      // ── Build service (depends on Prisma when in production) ────────────
      // In integration tests, prisma is not available, but the service is
      // injected via the __testService decorator when present.
      const fastifyAny = fastify as typeof fastify & { __testService?: DisclaimerService }
      const service: DisclaimerService =
        fastifyAny.__testService ??
        new DisclaimerService(new PrismaDisclaimerRepository(fastify.prisma))

      // ── Capture forensic headers ─────────────────────────────────────────
      const userAgent = request.headers['user-agent']
      const ipAddress = request.ip ?? undefined

      // ── Execute use case ─────────────────────────────────────────────────
      const row = await service.acceptDisclaimer({
        userId: request.user!.id,
        version,
        userAgent,
        ipAddress,
      })

      reply.status(200).send({
        user: {
          lastAcceptedDisclaimerVersion: row.version,
        },
      })
    },
  )
}
