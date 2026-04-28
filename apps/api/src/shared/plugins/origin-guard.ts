/**
 * Fastify plugin: Origin/Referer guard for state-changing requests.
 *
 * Defense-in-depth against CSRF (audit H-01, A01:2021). The primary CSRF
 * mitigations are SameSite=Lax cookies (BetterAuth default), strict CORS
 * whitelist, and JSON-only endpoints (forces preflight). This plugin adds
 * an explicit Origin/Referer check so a misconfigured CORS or proxy cannot
 * silently widen the attack surface.
 *
 * Behavior:
 * - Applies only to POST, PUT, PATCH, DELETE.
 * - Allowed origins come from CORS_ORIGIN and FRONTEND_URL env vars.
 * - Stripe webhook (/api/billing/webhook) is exempt — it has no browser
 *   Origin and is authenticated via signed payload.
 */

import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const EXEMPT_PATHS = new Set(['/api/billing/webhook'])

function buildAllowedOrigins(): Set<string> {
  const raw = [process.env['CORS_ORIGIN'], process.env['FRONTEND_URL']]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .flatMap((v) => v.split(',').map((s) => s.trim()))
    .filter((v) => v.length > 0)

  return new Set(raw.length > 0 ? raw : ['http://localhost:5173'])
}

function extractOrigin(headerValue: string | undefined): string | null {
  if (!headerValue) return null
  try {
    const url = new URL(headerValue)
    return `${url.protocol}//${url.host}`
  } catch {
    return null
  }
}

const originGuardPlugin: FastifyPluginAsync = async (fastify) => {
  const allowed = buildAllowedOrigins()

  fastify.addHook('preHandler', async (request, reply) => {
    if (!MUTATING_METHODS.has(request.method)) return
    if (EXEMPT_PATHS.has(request.url.split('?')[0] ?? '')) return

    const origin =
      extractOrigin(request.headers.origin as string | undefined) ??
      extractOrigin(request.headers.referer as string | undefined)

    if (!origin || !allowed.has(origin)) {
      return reply.code(403).send({
        message: 'Forbidden: invalid request origin',
        code: 'INVALID_ORIGIN',
      })
    }
  })
}

export default fp(originGuardPlugin, {
  name: 'origin-guard',
})
