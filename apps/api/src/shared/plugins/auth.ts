/**
 * Fastify plugin: extracts BetterAuth session from every request
 * and decorates `request.user` with id, email, tier and isAnonymous.
 *
 * Registers as a global onRequest hook so every downstream handler
 * can safely read `request.user` without extra plumbing.
 *
 * Design: AD5 — Anonymous → Free → Pro flow.
 */

import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../../modules/auth/auth.config.js'
import type { UserTier } from '@cfa/shared'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email?: string
      tier: UserTier
      isAnonymous: boolean
    }
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.raw.headers),
      })

      if (!session?.user) {
        request.user = undefined
        return
      }

      // Determine tier: look up subscription
      const sub = await fastify.prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: { status: true, currentPeriodEnd: true },
      })

      let tier: UserTier = 'FREE'
      if (sub) {
        if (sub.status === 'ACTIVE' || sub.status === 'TRIALING') {
          tier = 'PRO'
        } else if (sub.status === 'PAST_DUE') {
          // Grace period: 3 days past currentPeriodEnd → still PRO
          // After 3 days: effectively FREE
          const GRACE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
          const graceDeadline = sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd.getTime() + GRACE_DAYS_MS)
            : null
          if (graceDeadline && new Date() < graceDeadline) {
            tier = 'PRO'
          }
        }
      }

      request.user = {
        id: session.user.id,
        email: session.user.email ?? undefined,
        tier,
        // BetterAuth anonymous plugin adds isAnonymous to the user object
        isAnonymous: (session.user as { isAnonymous?: boolean }).isAnonymous ?? false,
      }
    } catch {
      // Never block the request on auth errors — let requireAuth handle it
      request.user = undefined
    }
  })
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['prisma'],
})
