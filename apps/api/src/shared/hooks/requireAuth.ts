/**
 * Fastify preHandler hook: ensures request has a valid authenticated session.
 * Attaches user info to request for downstream handlers.
 *
 * Usage: { preHandler: [requireAuth] } on route definition
 */

import { UnauthorizedError } from '../errors/index.js'
import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * preHandler that blocks unauthenticated requests.
 * The actual session validation is done by BetterAuth middleware.
 */
export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!request.user) {
    throw new UnauthorizedError('Debes iniciar sesión para continuar')
  }
}
