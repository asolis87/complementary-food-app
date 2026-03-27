/**
 * Auth routes — mounts BetterAuth at /api/auth/*.
 * BetterAuth handles all routes internally via the toNodeHandler bridge.
 * We add a /session-info endpoint that returns user + tier for the frontend.
 */

import type { FastifyPluginAsync } from 'fastify'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.config.js'

const betterAuthHandler = toNodeHandler(auth)

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/auth/session-info
   * Returns the currently authenticated user and their tier.
   * Used by the frontend authStore on app mount to restore session.
   */
  fastify.get('/session-info', async (request, reply) => {
    if (!request.user) {
      reply.send({ user: null, tier: 'ANONYMOUS' })
      return
    }

    reply.send({
      user: {
        id: request.user.id,
        email: request.user.email,
        name: undefined as string | undefined, // populated below
        tier: request.user.tier,
        isAnonymous: request.user.isAnonymous,
        createdAt: new Date().toISOString(),
      },
      tier: request.user.tier,
    })
  })

  /**
   * All other /api/auth/* routes are handled by BetterAuth:
   *   POST /api/auth/sign-up/email
   *   POST /api/auth/sign-in/email
   *   POST /api/auth/sign-out
   *   POST /api/auth/anonymous
   *   GET  /api/auth/session
   *   etc.
   *
   * NOTE: this wildcard must be registered AFTER the named routes above.
   */
  fastify.all('/*', async (request, reply) => {
    await betterAuthHandler(request.raw, reply.raw)
  })
}
