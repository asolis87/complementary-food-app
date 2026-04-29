/**
 * Fastify plugin: extracts BetterAuth session from every request
 * and decorates `request.user` with id, email, tier, subscriptionStatus, and trialEnd.
 *
 * Registers as a global onRequest hook so every downstream handler
 * can safely read `request.user` without extra plumbing.
 *
 * Design: AD4 — trial-first model: subscriptionStatus + tier resolution.
 */

import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../../modules/auth/auth.config.js'
import type { UserTier, SubscriptionStatus } from '@pakulab/shared'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email?: string
      emailVerified?: boolean
      tier: UserTier
      subscriptionStatus?: SubscriptionStatus | null
      trialEnd?: Date | null
      lastAcceptedDisclaimerVersion: string | null
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

      // Single query: subscription + latest disclaimer acceptance (AD-DC-03, NF-DC-02).
      // A second separate round-trip is PROHIBITED per REQ-DC-05.
      const userData = await fastify.prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscription: {
            select: { status: true, currentPeriodEnd: true, trialEnd: true },
          },
          disclaimerAcceptances: {
            orderBy: { acceptedAt: 'desc' },
            take: 1,
            select: { version: true },
          },
        },
      })

      const sub = userData?.subscription ?? null
      const lastAcceptedDisclaimerVersion =
        (userData?.disclaimerAcceptances[0]?.version) ?? null

      let tier: UserTier = 'FREE'
      let subscriptionStatus: SubscriptionStatus | null = sub?.status ?? null
      let trialEnd = sub?.trialEnd ?? null

      if (sub) {
        const now = new Date()

        // Check if TRIALING subscription has expired
        if (sub.status === 'TRIALING' && sub.trialEnd && now > sub.trialEnd) {
          // Trial expired — treat as EXPIRED
          subscriptionStatus = 'EXPIRED'
          // Note: We don't update the DB here, just resolve tier
        } else if (sub.status === 'ACTIVE' || sub.status === 'TRIALING') {
          tier = 'PRO'
        } else if (sub.status === 'PAST_DUE') {
          // Grace period: 3 days past currentPeriodEnd → still PRO
          const GRACE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
          const graceDeadline = sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd.getTime() + GRACE_DAYS_MS)
            : null
          if (graceDeadline && now < graceDeadline) {
            tier = 'PRO'
          }
        }
        // EXPIRED and CANCELED both resolve to FREE tier
      }

      request.user = {
        id: session.user.id,
        email: session.user.email ?? undefined,
        emailVerified: session.user.emailVerified ?? false,
        tier,
        subscriptionStatus,
        trialEnd,
        lastAcceptedDisclaimerVersion,
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
