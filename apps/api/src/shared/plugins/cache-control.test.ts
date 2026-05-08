import { describe, expect, it } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import cacheControlPlugin from './cache-control.js'

async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify()
  await app.register(cacheControlPlugin)

  app.get('/api/profiles', async () => ({ ok: true }))
  app.get('/api/diary/123', async () => ({ ok: true }))
  app.get('/api/foods', async () => ({ ok: true }))
  app.get('/api/foods/abc/details', async () => ({ ok: true }))
  app.get('/health', async () => ({ ok: true }))

  app.get('/api/custom-header', async (_req, reply) => {
    reply.header('Cache-Control', 'public, max-age=60')
    return { ok: true }
  })

  await app.ready()
  return app
}

describe('cacheControlPlugin (audit M-05)', () => {
  it('sets Cache-Control: no-store, private on private API responses', async () => {
    const app = await buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/profiles' })
    expect(res.headers['cache-control']).toBe('no-store, private')
    await app.close()
  })

  it('applies to nested private paths', async () => {
    const app = await buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/diary/123' })
    expect(res.headers['cache-control']).toBe('no-store, private')
    await app.close()
  })

  it('exempts /api/foods (public catalog)', async () => {
    const app = await buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/foods' })
    expect(res.headers['cache-control']).toBeUndefined()
    await app.close()
  })

  it('exempts nested /api/foods paths', async () => {
    const app = await buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/foods/abc/details' })
    expect(res.headers['cache-control']).toBeUndefined()
    await app.close()
  })

  it('does not affect non-/api routes', async () => {
    const app = await buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.headers['cache-control']).toBeUndefined()
    await app.close()
  })

  it('does not override an explicit Cache-Control set by the handler', async () => {
    const app = await buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/custom-header' })
    expect(res.headers['cache-control']).toBe('public, max-age=60')
    await app.close()
  })
})
