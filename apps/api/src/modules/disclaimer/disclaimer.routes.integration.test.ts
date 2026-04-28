/**
 * Integration tests for POST /api/disclaimer/accept.
 *
 * Spec: REQ-DC-01, REQ-DC-02, REQ-DC-03, REQ-DC-04, AD-DC-04
 *
 * Test strategy:
 * - Builds a minimal Fastify app with only the plugins needed:
 *   originGuardPlugin (must pass CORS origin header on mutating requests)
 *   cacheControlPlugin
 *   a fake-auth plugin that controls request.user
 * - Injects a fake DisclaimerRepository via the route plugin's options to
 *   avoid a real Prisma connection.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { ZodError } from 'zod'
import originGuardPlugin from '../../shared/plugins/origin-guard.js'
import cacheControlPlugin from '../../shared/plugins/cache-control.js'
import { AppError } from '../../shared/errors/index.js'
import { DISCLAIMER_CURRENT_VERSION } from './disclaimer.constants.js'
import { disclaimerRoutes } from './disclaimer.routes.js'
import type {
  DisclaimerAcceptanceRow,
  DisclaimerRepository,
} from './domain/ports/disclaimer.repository.port.js'

// ─── Test constants ───────────────────────────────────────────────────────────

const ORIGIN = 'http://localhost:5173'
const MOCK_USER = {
  id: 'user-test-1',
  email: 'test@example.com',
  tier: 'PRO' as const,
  emailVerified: true,
}

// ─── Fake row factory ─────────────────────────────────────────────────────────

function makeMockRow(overrides: Partial<DisclaimerAcceptanceRow> = {}): DisclaimerAcceptanceRow {
  return {
    id: 'cuid-row',
    userId: MOCK_USER.id,
    version: DISCLAIMER_CURRENT_VERSION,
    acceptedAt: new Date('2026-04-28T10:00:00Z'),
    userAgent: 'vitest/1.0',
    ipAddress: '127.0.0.1',
    ...overrides,
  }
}

// ─── App builder ─────────────────────────────────────────────────────────────

interface BuildOptions {
  authenticated?: boolean
  mockRow?: DisclaimerAcceptanceRow
  acceptFn?: ReturnType<typeof vi.fn>
}

async function buildTestApp(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const { authenticated = true } = opts
  const mockRow = opts.mockRow ?? makeMockRow()
  const acceptFn = opts.acceptFn ?? vi.fn().mockResolvedValue(mockRow)

  const app = Fastify({ logger: false })

  // Mirror the global error handler from app.ts — must be set before plugins
  app.setErrorHandler<FastifyError>((error, _request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } })
      return
    }
    if (error instanceof ZodError) {
      reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: error.errors } })
      return
    }
    reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } })
  })

  process.env['CORS_ORIGIN'] = ORIGIN

  await app.register(originGuardPlugin)
  await app.register(cacheControlPlugin)

  // Simulate the auth plugin: sets request.user based on test mode
  await app.register(
    fp(async (f) => {
      f.addHook('onRequest', async (request) => {
        request.user = authenticated ? MOCK_USER : undefined
      })
    }),
    { name: 'fake-auth' },
  )

  const fakeRepo: DisclaimerRepository = {
    create: acceptFn,
    findLatestByUser: vi.fn().mockResolvedValue(null),
  }

  await app.register(disclaimerRoutes, {
    prefix: '/api/disclaimer',
    repository: fakeRepo,
  })

  await app.ready()
  return app
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/disclaimer/accept', () => {
  let originalCorsOrigin: string | undefined

  beforeEach(() => {
    originalCorsOrigin = process.env['CORS_ORIGIN']
    process.env['CORS_ORIGIN'] = ORIGIN
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (originalCorsOrigin === undefined) delete process.env['CORS_ORIGIN']
    else process.env['CORS_ORIGIN'] = originalCorsOrigin
  })

  // ===========================================================================
  // 401 — unauthenticated
  // ===========================================================================

  it('returns 401 when no session', async () => {
    const app = await buildTestApp({ authenticated: false })

    const res = await app.inject({
      method: 'POST',
      url: '/api/disclaimer/accept',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify({ version: DISCLAIMER_CURRENT_VERSION }),
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  // ===========================================================================
  // 400 — validation errors
  // ===========================================================================

  it('returns 400 when version field is missing', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/disclaimer/accept',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 400 when version does not match DISCLAIMER_CURRENT_VERSION', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/disclaimer/accept',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify({ version: 'injected-version' }),
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 400 when version is an empty string', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/disclaimer/accept',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify({ version: '' }),
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  // ===========================================================================
  // 200 — happy path
  // ===========================================================================

  it('returns 200 with lastAcceptedDisclaimerVersion on happy path', async () => {
    const mockRow = makeMockRow()
    const app = await buildTestApp({ mockRow })

    const res = await app.inject({
      method: 'POST',
      url: '/api/disclaimer/accept',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify({ version: DISCLAIMER_CURRENT_VERSION }),
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.user.lastAcceptedDisclaimerVersion).toBe(DISCLAIMER_CURRENT_VERSION)
    await app.close()
  })

  it('captures userAgent from request headers and passes it to service', async () => {
    const acceptFn = vi.fn().mockResolvedValue(makeMockRow({ userAgent: 'TestAgent/1.0' }))
    const app = await buildTestApp({ acceptFn })

    await app.inject({
      method: 'POST',
      url: '/api/disclaimer/accept',
      headers: {
        origin: ORIGIN,
        'content-type': 'application/json',
        'user-agent': 'TestAgent/1.0',
      },
      body: JSON.stringify({ version: DISCLAIMER_CURRENT_VERSION }),
    })

    expect(acceptFn).toHaveBeenCalledOnce()
    const callArg = acceptFn.mock.calls[0]?.[0]
    expect(callArg?.userAgent).toBe('TestAgent/1.0')
    await app.close()
  })

  it('second accept inserts a second row (append-only invariant)', async () => {
    const acceptFn = vi.fn().mockResolvedValue(makeMockRow())
    const app = await buildTestApp({ acceptFn })

    const payload = {
      method: 'POST' as const,
      url: '/api/disclaimer/accept',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify({ version: DISCLAIMER_CURRENT_VERSION }),
    }

    await app.inject(payload)
    await app.inject(payload)

    // create() called twice — two rows appended
    expect(acceptFn).toHaveBeenCalledTimes(2)
    await app.close()
  })

  // ===========================================================================
  // Cache-Control (audit M-05)
  // ===========================================================================

  it('response includes Cache-Control: no-store', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/disclaimer/accept',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify({ version: DISCLAIMER_CURRENT_VERSION }),
    })

    expect(res.headers['cache-control']).toContain('no-store')
    await app.close()
  })
})
