/**
 * Tests for the shared HTTP request observability plugin.
 * Unit tests cover the pure helpers; integration tests build a minimal
 * Fastify app, swap the logger for `vi.fn()` spies, and assert the
 * structured completion event shape, privacy guarantees, route
 * normalization, and technical health filtering.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Fastify from 'fastify'
import httpRequestObservability, {
  buildHttpRequestEvent,
  classifySeverity,
  isTechnicalHealthRoute,
  resolveRoutePattern,
  type HttpRequestEvent,
} from './http-request-observability.js'

// ─── Unit tests — pure helpers ────────────────────────────────────────────────
describe('classifySeverity', () => {
  it.each([
    [100, 'info'], [199, 'info'],
    [200, 'info'], [204, 'info'], [299, 'info'],
    [301, 'info'], [399, 'info'],
    [400, 'warn'], [403, 'warn'], [404, 'warn'], [499, 'warn'],
    [500, 'error'], [503, 'error'], [599, 'error'],
  ])('maps status %i to %s', (status, expected) => {
    expect(classifySeverity(status)).toBe(expected)
  })
})

describe('isTechnicalHealthRoute', () => {
  it.each([
    ['/health', true], ['/ready', true], ['/live', true],
    ['/api/health', true], ['/api/ready', true], ['/api/live', true],
    ['/api/health/email', true],
    ['/api/products', false], ['/api/orders', false], ['/api/diary', false],
    ['/api/healthcare', false], ['/healthcheck', false],
  ])('classifies %s as %s', (route, expected) => {
    expect(isTechnicalHealthRoute(route)).toBe(expected)
  })
})

describe('resolveRoutePattern', () => {
  it.each<[string | undefined, string]>([
    ['/products/:id/reviews', '/products/:id/reviews'],
    [undefined, '/__unknown'],
    ['', '/__unknown'],
  ])('maps %s to %s', (input, expected) => {
    expect(resolveRoutePattern(input)).toBe(expected)
  })
})

describe('buildHttpRequestEvent', () => {
  it('builds the exact whitelisted shape for an authenticated success', () => {
    const input = {
      method: 'GET', url: '/products', status: 200, durationMs: 45,
      severity: 'info' as const, user: 'u_123', requestId: 'req-abc',
      timestamp: '2026-08-03T00:00:00.000Z',
    }
    expect(buildHttpRequestEvent(input)).toEqual(input)
  })

  it('omits the user field entirely when no authenticated user is present', () => {
    const event = buildHttpRequestEvent({
      method: 'GET', url: '/products', status: 200, durationMs: 12,
      severity: 'info', user: undefined, requestId: 'req-xyz',
      timestamp: '2026-08-03T00:00:00.000Z',
    })
    expect(Object.prototype.hasOwnProperty.call(event, 'user')).toBe(false)
  })
})

// ─── Integration tests — Fastify plugin ───────────────────────────────────────
function buildLoggerSpy() {
  const spy = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    level: 'silent' as const,
  }
  return spy
}

type LoggerSpy = ReturnType<typeof buildLoggerSpy>

type AppOpts = { emailHealthStatus?: 200 | 503; withAuthenticatedUser?: string }

async function buildTestApp(opts: AppOpts = {}): Promise<{
  app: Awaited<ReturnType<typeof Fastify>>
  logger: LoggerSpy
}> {
  const logger = buildLoggerSpy()
  const app = Fastify({ logger: false })
  // Override the default logger with the spy so the plugin calls land on vi.fn().
  app.log = logger as unknown as typeof app.log
  await app.register(httpRequestObservability)

  if (opts.withAuthenticatedUser !== undefined) {
    const userId = opts.withAuthenticatedUser
    app.addHook('onRequest', (request, _reply, done) => {
      ;(request as unknown as { user: { id: string } }).user = { id: userId }
      done()
    })
  }

  const emailStatus = opts.emailHealthStatus ?? 200
  app.get('/products', async () => ({ ok: true }))
  app.get<{ Params: { id: string } }>('/products/:id/reviews', async () => ({ ok: true }))
  app.get('/admin', async (_r, reply) => reply.status(403).send({ error: 'forbidden' }))
  app.get('/api/data', async (_r, reply) => reply.status(500).send({ error: 'kaboom' }))
  app.get('/health', async () => ({ status: 'ok' }))
  app.get('/api/health/email', async (_r, reply) => reply.status(emailStatus).send({ status: 'ok' }))
  app.get('/api/ready', async (_r, reply) => reply.status(404).send({ error: 'not-ready' }))
  app.get('/throw', async () => { throw new Error('unexpected') })

  await app.ready()
  return { app, logger }
}

async function runCase(
  opts: AppOpts,
  payload: { method: 'GET' | 'POST'; url: string; headers?: Record<string, string> },
): Promise<{ event: HttpRequestEvent | null; logger: LoggerSpy }> {
  const { app, logger } = await buildTestApp(opts)
  logger.info.mockClear(); logger.warn.mockClear(); logger.error.mockClear()
  await app.inject(payload)
  let event: HttpRequestEvent | null = null
  for (const bucket of [logger.info, logger.warn, logger.error]) {
    for (const call of bucket.mock.calls) {
      const e = call[0] as HttpRequestEvent
      if (e && typeof e === 'object' && 'status' in e) { event = e; break }
    }
    if (event) break
  }
  await app.close()
  return { event, logger }
}

describe('httpRequestObservability plugin', () => {
  const fixedTimestamp = '2026-08-03T00:00:00.000Z'

  beforeEach(() => {
    // Pin the wall clock so timestamp assertions are deterministic.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(fixedTimestamp))
  })
  afterEach(() => { vi.useRealTimers() })

  it('emits exactly one structured info event for a 200 success', async () => {
    const { event, logger } = await runCase({}, { method: 'GET', url: '/products' })
    expect(event).toEqual({
      method: 'GET', url: '/products', status: 200,
      durationMs: expect.any(Number), severity: 'info',
      requestId: expect.any(String), timestamp: fixedTimestamp,
    })
    expect(logger.info).toHaveBeenCalledTimes(1)
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('includes the authenticated user id and the normalized route pattern', async () => {
    const { event } = await runCase(
      { withAuthenticatedUser: 'u_123' },
      { method: 'GET', url: '/products/prod_abc123/reviews?q=search&page=2' },
    )
    expect(event).not.toBeNull()
    expect(event!.url).toBe('/products/:id/reviews')
    expect(event!.user).toBe('u_123')
    expect(event!.status).toBe(200)
  })

  it('maps 4xx responses to warn severity', async () => {
    const { event, logger } = await runCase({}, { method: 'GET', url: '/admin' })
    expect(event!.status).toBe(403)
    expect(event!.severity).toBe('warn')
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  it('maps 5xx responses to error severity', async () => {
    const { event, logger } = await runCase({}, { method: 'GET', url: '/api/data' })
    expect(event!.status).toBe(500)
    expect(event!.severity).toBe('error')
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('suppresses successful shallow health checks', async () => {
    const { event, logger } = await runCase({}, { method: 'GET', url: '/health' })
    expect(event).toBeNull()
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('suppresses successful /api/health/email responses', async () => {
    const { event } = await runCase(
      { emailHealthStatus: 200 },
      { method: 'GET', url: '/api/health/email' },
    )
    expect(event).toBeNull()
  })

  it('emits warn for a failed 4xx health check on a recognised route', async () => {
    const { event } = await runCase({}, { method: 'GET', url: '/api/ready' })
    expect(event!.status).toBe(404)
    expect(event!.severity).toBe('warn')
    expect(event!.url).toBe('/api/ready')
  })

  it('emits error for a failed 5xx health check on /api/health/email', async () => {
    const { event } = await runCase(
      { emailHealthStatus: 503 },
      { method: 'GET', url: '/api/health/email' },
    )
    expect(event!.status).toBe(503)
    expect(event!.severity).toBe('error')
    expect(event!.url).toBe('/api/health/email')
  })

  it('emits error for a thrown handler 500', async () => {
    const { event } = await runCase({}, { method: 'GET', url: '/throw' })
    expect(event!.status).toBe(500)
    expect(event!.severity).toBe('error')
  })

  it('falls back to /__unknown when route metadata is missing (404)', async () => {
    const { event } = await runCase({}, { method: 'GET', url: '/totally-unknown' })
    expect(event!.url).toBe('/__unknown')
    expect(event!.status).toBe(404)
    expect(event!.severity).toBe('warn')
  })

  it('never includes bodies, headers, query strings, or parameter values', async () => {
    const { logger } = await runCase(
      { withAuthenticatedUser: 'u_123' },
      {
        method: 'GET', url: '/products/prod_abc123/reviews?q=search&page=2',
        headers: { authorization: 'Bearer secret-token', cookie: 'session=private' },
      },
    )
    const event = logger.info.mock.calls[0]![0] as Record<string, unknown>
    const allowedKeys = new Set([
      'method', 'url', 'status', 'durationMs', 'severity', 'user', 'timestamp', 'requestId',
    ])
    for (const key of Object.keys(event)) expect(allowedKeys.has(key)).toBe(true)
    const serialised = JSON.stringify(event)
    for (const leak of ['prod_abc123', 'search', 'Bearer', 'session=private']) {
      expect(serialised).not.toContain(leak)
    }
    expect(event['url']).toBe('/products/:id/reviews')
  })
})
