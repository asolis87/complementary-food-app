/**
 * Server entry point.
 * Starts the Fastify server with configured host/port.
 */

import { buildApp } from './app.js'

const PORT = Number(process.env['PORT'] ?? 3002)
const HOST = process.env['HOST'] ?? '0.0.0.0'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    console.info(`🚀 API running at http://localhost:${PORT}`)
    console.info(`📊 Health check: http://localhost:${PORT}/api/health`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
