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
 *
 * Dependency injection: callers may pass `repository` to override the default
 * Prisma adapter. Production registration omits it (real Prisma instance comes
 * from `fastify.prisma`); tests pass a fake. Plugin builds the service once at
 * registration time, not per request.
 */

import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { PrismaDisclaimerRepository } from './infrastructure/adapters/prisma-disclaimer.repository.js'
import { DisclaimerService } from './disclaimer.service.js'
import type { DisclaimerRepository } from './domain/ports/disclaimer.repository.port.js'

export interface DisclaimerRoutesOptions {
  /** Optional repository override; defaults to the Prisma adapter. */
  repository?: DisclaimerRepository
}

const acceptDisclaimerBodySchema = z.object({
  version: z.string().min(1).max(32),
})

export const disclaimerRoutes: FastifyPluginAsync<DisclaimerRoutesOptions> = async (
  fastify,
  opts,
) => {
  const repository = opts.repository ?? new PrismaDisclaimerRepository(fastify.prisma)
  const service = new DisclaimerService(repository)

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
      await requireAuth(request, reply)

      const { version } = acceptDisclaimerBodySchema.parse(request.body)

      const row = await service.acceptDisclaimer({
        userId: request.user!.id,
        version,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip ?? undefined,
      })

      // Return the full session-info user shape so the frontend can update authStore
      // from a single round-trip (AD-DC-04). lastAcceptedDisclaimerVersion comes from
      // the newly inserted row — overriding the stale value hydrated at request start.
      const user = request.user!
      reply.status(200).send({
        user: {
          id: user.id,
          email: user.email,
          name: undefined as string | undefined,
          tier: user.tier,
          emailVerified: user.emailVerified ?? false,
          subscriptionStatus: user.subscriptionStatus,
          trialEnd: user.trialEnd?.toISOString() ?? null,
          createdAt: new Date().toISOString(),
          lastAcceptedDisclaimerVersion: row.version,
        },
        tier: user.tier,
      })
    },
  )
}
