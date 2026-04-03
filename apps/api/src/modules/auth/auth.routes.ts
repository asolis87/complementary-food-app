/**
 * Auth routes — mounts BetterAuth at /api/auth/*.
 * BetterAuth handles all routes internally via the toNodeHandler bridge.
 * We add a /session-info endpoint that returns user + tier for the frontend.
 *
 * CRITICAL: BetterAuth reads the raw IncomingMessage stream internally (get_raw_body).
 * Any Fastify content type parser that uses `parseAs: 'buffer'` or `parseAs: 'string'`
 * fully consumes the stream BEFORE our handler runs, causing BetterAuth to hang.
 *
 * Fix: remove all content type parsers in this scoped plugin and register a no-op parser
 * for application/json WITHOUT `parseAs`. Without `parseAs`, Fastify passes the raw
 * IncomingMessage stream to the callback — we call done(null, null) immediately, leaving
 * the stream unconsumed so BetterAuth can read it from request.raw.
 */

import type { FastifyPluginAsync } from 'fastify'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.config.js'

const betterAuthHandler = toNodeHandler(auth)

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Remove any inherited content type parsers (e.g. custom global JSON parser) and
   * register a no-op one. Without `parseAs`, Fastify hands us the raw stream; we
   * call done(null, null) without reading it so request.raw stays unconsumed.
   */
  fastify.removeAllContentTypeParsers()
  fastify.addContentTypeParser('application/json', (_req, _payload, done) => {
    done(null, null)
  })
  fastify.addContentTypeParser('text/plain', (_req, _payload, done) => {
    done(null, null)
  })

  /**
   * POST /api/auth/anonymous
   * Creates an anonymous session using BetterAuth's anonymous plugin.
   * This endpoint wraps auth.api.signInAnonymous() to provide a REST interface.
   * Note: BetterAuth exposes this as /sign-in/anonymous internally.
   */
  fastify.post('/anonymous', async (request, reply) => {
    const result = await auth.api.signInAnonymous({
      headers: request.headers,
      asResponse: true,
    })
    // Forward cookies from BetterAuth response to Fastify reply
    const setCookieHeader = result.headers.get('set-cookie')
    if (setCookieHeader) {
      reply.header('set-cookie', setCookieHeader)
    }
    reply.send(await result.json())
  })

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
   *   GET  /api/auth/session
   *   etc.
   *
   * NOTE: this wildcard must be registered AFTER the named routes above.
   */
  fastify.all('/*', async (request, reply) => {
    await betterAuthHandler(request.raw, reply.raw)
  })
}
