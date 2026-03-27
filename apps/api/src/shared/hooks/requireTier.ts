/**
 * Fastify preHandler hook factory: enforces tier-based feature access.
 *
 * Design Decision AD11: Single `requireTier('pro')` preHandler on route
 * registration. Clean, declarative, one place to audit.
 *
 * Usage: { preHandler: [requireAuth, requireTier('PRO')] }
 */

import { tierAtLeast } from '@cfa/shared'
import type { UserTier } from '@cfa/shared'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ForbiddenError, UnauthorizedError } from '../errors/index.js'

/**
 * Creates a preHandler that requires at least `tier` to proceed.
 */
export function requireTier(tier: UserTier) {
  return async function tierGuard(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new UnauthorizedError()
    }

    const userTier = request.user.tier

    if (!tierAtLeast(userTier, tier)) {
      throw new ForbiddenError(
        `Esta función requiere plan ${tier === 'PRO' ? 'Pro' : 'gratuito con cuenta'}. ` +
          `Tu plan actual es: ${userTier}`,
      )
    }
  }
}

/**
 * Check if user has at least the specified tier (non-throwing version).
 * Useful in service layer for conditional logic.
 */
export function userHasTier(request: FastifyRequest, tier: UserTier): boolean {
  if (!request.user) return false
  return tierAtLeast(request.user.tier, tier)
}
