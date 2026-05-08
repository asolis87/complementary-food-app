import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import originGuardPlugin from './origin-guard.js'

const ALLOWED = 'https://app.example.com'
const OTHER_ALLOWED = 'https://admin.example.com'
const FORBIDDEN = 'https://evil.example.com'

async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify()
  await app.register(originGuardPlugin)

  app.get('/api/items', async () => ({ ok: true }))
  app.post('/api/items', async () => ({ ok: true }))
  app.patch('/api/items/:id', async () => ({ ok: true }))
  app.delete('/api/items/:id', async () => ({ ok: true }))
  app.post('/api/billing/webhook', async () => ({ ok: true }))

  await app.ready()
  return app
}

describe('originGuardPlugin', () => {
  let originalCorsOrigin: string | undefined
  let originalFrontendUrl: string | undefined

  beforeEach(() => {
    originalCorsOrigin = process.env['CORS_ORIGIN']
    originalFrontendUrl = process.env['FRONTEND_URL']
    process.env['CORS_ORIGIN'] = ALLOWED
    process.env['FRONTEND_URL'] = OTHER_ALLOWED
  })

  afterEach(() => {
    if (originalCorsOrigin === undefined) delete process.env['CORS_ORIGIN']
    else process.env['CORS_ORIGIN'] = originalCorsOrigin
    if (originalFrontendUrl === undefined) delete process.env['FRONTEND_URL']
    else process.env['FRONTEND_URL'] = originalFrontendUrl
  })

  it('lets GET requests pass without origin', async () => {
    const app = await buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/items' })
    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('blocks POST without origin or referer', async () => {
    const app = await buildTestApp()
    const res = await app.inject({ method: 'POST', url: '/api/items' })
    expect(res.statusCode).toBe(403)
    expect(res.json()).toMatchObject({ code: 'INVALID_ORIGIN' })
    await app.close()
  })

  it('blocks POST from a non-whitelisted origin', async () => {
    const app = await buildTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/items',
      headers: { origin: FORBIDDEN },
    })
    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('allows POST from CORS_ORIGIN', async () => {
    const app = await buildTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/items',
      headers: { origin: ALLOWED },
    })
    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('allows POST from FRONTEND_URL', async () => {
    const app = await buildTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/items',
      headers: { origin: OTHER_ALLOWED },
    })
    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('falls back to referer when origin is missing', async () => {
    const app = await buildTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/items',
      headers: { referer: `${ALLOWED}/some/path` },
    })
    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('blocks PATCH and DELETE from forbidden origins', async () => {
    const app = await buildTestApp()
    const patchRes = await app.inject({
      method: 'PATCH',
      url: '/api/items/1',
      headers: { origin: FORBIDDEN },
    })
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/items/1',
      headers: { origin: FORBIDDEN },
    })
    expect(patchRes.statusCode).toBe(403)
    expect(deleteRes.statusCode).toBe(403)
    await app.close()
  })

  it('exempts /api/billing/webhook regardless of origin', async () => {
    const app = await buildTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
    })
    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('supports comma-separated origins in env vars', async () => {
    process.env['CORS_ORIGIN'] = `${ALLOWED},https://other.example.com`
    const app = await buildTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/items',
      headers: { origin: 'https://other.example.com' },
    })
    expect(res.statusCode).toBe(200)
    await app.close()
  })
})
