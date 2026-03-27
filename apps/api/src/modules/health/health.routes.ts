/**
 * Health check endpoint.
 * Used by deployment platforms (Render, Railway) for liveness probes.
 */

import type { FastifyPluginAsync } from 'fastify'

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
}
