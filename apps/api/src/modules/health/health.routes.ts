/**
 * Health check endpoint.
 * Used by deployment platforms (Render, Railway) for liveness probes.
 */

import type { FastifyPluginAsync } from 'fastify'
import { checkEmailHealth } from '../email/email.service.js'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/health', async (_request, reply) => {
    try {
      // Verify DB is reachable
      await fastify.prisma.$queryRaw`SELECT 1`
      reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      })
    } catch {
      reply.status(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      })
    }
  })

  // Deep health check for the email provider.
  // Intentionally NOT part of /api/health — email outages must not mark
  // the whole API unhealthy (signup fails, but login/browse keep working).
  fastify.get('/api/health/email', async (_request, reply) => {
    const health = await checkEmailHealth()
    reply
      .status(health.status === 'ok' ? 200 : 503)
      .send({ ...health, timestamp: new Date().toISOString() })
  })
}
