/**
 * Integration tests for GET /api/diary/range.
 *
 * Spec: REQ-C3, Design § 3 — range query with 31-day cap.
 * Returns { logs: FoodLogDTO[], observations: DayObservationDTO[] }.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { ZodError } from 'zod'
import type { PrismaClient } from '@prisma/client'
import originGuardPlugin from '../../shared/plugins/origin-guard.js'
import cacheControlPlugin from '../../shared/plugins/cache-control.js'
import { AppError } from '../../shared/errors/index.js'
import { rangeRoutes } from './range.routes.js'

// ─── Test constants ───────────────────────────────────────────────────────────

const ORIGIN = 'http://localhost:5173'
const VALID_BABY_ID = 'clh3x7y8z0003p6rm5b4d8e9f'

const MOCK_USER = {
  id: 'user-test-1',
  email: 'test@example.com',
  tier: 'PRO' as const,
  emailVerified: true,
  lastAcceptedDisclaimerVersion: null,
}

// ─── App builder ─────────────────────────────────────────────────────────────

interface FakePrisma {
  foodLog: { findMany: ReturnType<typeof vi.fn> }
  dayObservation: { findMany: ReturnType<typeof vi.fn> }
  babyProfile: { findFirst: ReturnType<typeof vi.fn> }
}

function makeFakePrisma(overrides: Partial<FakePrisma> = {}): FakePrisma {
  return {
    foodLog: { findMany: vi.fn().mockResolvedValue([]) },
    dayObservation: { findMany: vi.fn().mockResolvedValue([]) },
    babyProfile: { findFirst: vi.fn().mockResolvedValue({ id: VALID_BABY_ID }) },
    ...overrides,
  }
}

async function buildTestApp(opts: { authenticated?: boolean; prisma?: Partial<FakePrisma> } = {}): Promise<FastifyInstance> {
  const { authenticated = true } = opts
  const fakePrisma = makeFakePrisma(opts.prisma)

  const app = Fastify({ logger: false })

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

  await app.register(
    fp(async (f) => {
      f.addHook('onRequest', async (request) => {
        request.user = authenticated ? MOCK_USER : undefined
      })
    }),
    { name: 'fake-auth' },
  )

  await app.register(
    fp(async (f) => {
      f.decorate('prisma', fakePrisma as unknown as PrismaClient)
    }),
    { name: 'prisma' },
  )

  await app.register(rangeRoutes, { prefix: '/api/diary' })

  await app.ready()
  return app
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/diary/range', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with logs and observations arrays on happy path', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=2025-06-01&to=2025-06-07`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveProperty('logs')
    expect(body.data).toHaveProperty('observations')
    expect(Array.isArray(body.data.logs)).toBe(true)
    expect(Array.isArray(body.data.observations)).toBe(true)
    await app.close()
  })

  it('makes two parallel Prisma queries (one for logs, one for observations)', async () => {
    const foodLogFindMany = vi.fn().mockResolvedValue([])
    const observationFindMany = vi.fn().mockResolvedValue([])

    const app = await buildTestApp({
      prisma: {
        foodLog: { findMany: foodLogFindMany },
        dayObservation: { findMany: observationFindMany },
      },
    })

    await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=2025-06-01&to=2025-06-07`,
      headers: { origin: ORIGIN },
    })

    expect(foodLogFindMany).toHaveBeenCalledOnce()
    expect(observationFindMany).toHaveBeenCalledOnce()
    await app.close()
  })

  it('allows exactly 31-day range (boundary)', async () => {
    const app = await buildTestApp()

    // from = 2025-06-01, to = 2025-07-02 → exactly 31 days
    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=2025-06-01&to=2025-07-02`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('returns 400 when range exceeds 31 days', async () => {
    const app = await buildTestApp()

    // from = 2025-06-01, to = 2025-07-03 → 32 days
    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=2025-06-01&to=2025-07-03`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 400 when to < from', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=2025-06-10&to=2025-06-01`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 400 when from === to (same day range is valid — 0 days diff)', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=2025-06-10&to=2025-06-10`,
      headers: { origin: ORIGIN },
    })

    // 0 days diff → valid
    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('returns 401 when not authenticated', async () => {
    const app = await buildTestApp({ authenticated: false })

    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=2025-06-01&to=2025-06-07`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 400 when babyProfileId is missing', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?from=2025-06-01&to=2025-06-07`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 400 when from date format is invalid', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=01/06/2025&to=2025-06-07`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 403 when babyProfile does not belong to the user', async () => {
    const app = await buildTestApp({
      prisma: { babyProfile: { findFirst: vi.fn().mockResolvedValue(null) } },
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=2025-06-01&to=2025-06-07`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('serializes observation date as YYYY-MM-DD string (not ISO datetime)', async () => {
    const observationWithDateObj = {
      id: 'obs-1',
      babyProfileId: VALID_BABY_ID,
      date: new Date('2025-06-01T00:00:00.000Z'),
      stool: 'NORMAL',
      symptoms: ['RASH'],
      notes: null,
      createdAt: new Date('2025-06-01T10:00:00Z'),
      updatedAt: new Date('2025-06-01T10:00:00Z'),
    }

    const app = await buildTestApp({
      prisma: {
        dayObservation: { findMany: vi.fn().mockResolvedValue([observationWithDateObj]) },
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/diary/range?babyProfileId=${VALID_BABY_ID}&from=2025-06-01&to=2025-06-07`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    const obs = body.data.observations[0]
    expect(obs.date).toBe('2025-06-01')
    expect(obs.date).toHaveLength(10)
    // Must NOT contain 'T' (ISO 8601 datetime separator)
    expect(obs.date).not.toContain('T')
    await app.close()
  })
})
