/**
 * Integration tests for DayObservation routes.
 *
 * Spec: REQ-B1, REQ-B2, REQ-B3, REQ-B4 — day-level observation CRUD.
 *
 * Test strategy:
 * - Builds a minimal Fastify app with origin guard, cache control, and fake-auth.
 * - Injects a fake prisma decorator that controls DayObservation CRUD responses.
 * - No real DB connection required.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { ZodError } from 'zod'
import type { PrismaClient } from '@prisma/client'
import originGuardPlugin from '../../shared/plugins/origin-guard.js'
import cacheControlPlugin from '../../shared/plugins/cache-control.js'
import { AppError } from '../../shared/errors/index.js'
import { dayObservationRoutes } from './dayObservation.routes.js'

// ─── Test constants ───────────────────────────────────────────────────────────

const ORIGIN = 'http://localhost:5173'
const VALID_BABY_ID = 'clh3x7y8z0003p6rm5b4d8e9f'
const VALID_DATE = '2025-06-10'

const MOCK_USER = {
  id: 'user-test-1',
  email: 'test@example.com',
  tier: 'PRO' as const,
  emailVerified: true,
  lastAcceptedDisclaimerVersion: null,
}

const MOCK_OBSERVATION = {
  id: 'obs-cuid-1',
  babyProfileId: VALID_BABY_ID,
  date: new Date(VALID_DATE + 'T00:00:00.000Z'),
  stool: 'NORMAL' as const,
  symptoms: ['RASH'] as const,
  notes: 'Test note',
  createdAt: new Date('2026-04-29T10:00:00Z'),
  updatedAt: new Date('2026-04-29T10:00:00Z'),
}

// ─── App builder ─────────────────────────────────────────────────────────────

interface FakePrisma {
  dayObservation: {
    findUnique: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
  }
  foodLog: {
    findMany: ReturnType<typeof vi.fn>
  }
  babyProfile: {
    findFirst: ReturnType<typeof vi.fn>
  }
}

interface BuildOptions {
  authenticated?: boolean
  prisma?: Partial<FakePrisma>
}

function makeFakePrisma(overrides: Partial<FakePrisma> = {}): FakePrisma {
  return {
    dayObservation: {
      findUnique: vi.fn().mockResolvedValue(MOCK_OBSERVATION),
      upsert: vi.fn().mockResolvedValue(MOCK_OBSERVATION),
      delete: vi.fn().mockResolvedValue(MOCK_OBSERVATION),
      findMany: vi.fn().mockResolvedValue([]),
      ...overrides.dayObservation,
    },
    foodLog: {
      findMany: vi.fn().mockResolvedValue([]),
      ...overrides.foodLog,
    },
    babyProfile: {
      findFirst: vi.fn().mockResolvedValue({ id: VALID_BABY_ID }),
      ...overrides.babyProfile,
    },
  }
}

async function buildTestApp(opts: BuildOptions = {}): Promise<FastifyInstance> {
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

  // Fake auth plugin
  await app.register(
    fp(async (f) => {
      f.addHook('onRequest', async (request) => {
        request.user = authenticated ? MOCK_USER : undefined
      })
    }),
    { name: 'fake-auth' },
  )

  // Inject fake prisma (cast to satisfy Fastify decorator type)
  await app.register(
    fp(async (f) => {
      f.decorate('prisma', fakePrisma as unknown as PrismaClient)
    }),
    { name: 'prisma' },
  )

  await app.register(dayObservationRoutes, { prefix: '/api' })

  await app.ready()
  return app
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeHeaders() {
  return { origin: ORIGIN, 'content-type': 'application/json' }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PUT /api/day-observation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with the upserted observation on happy path', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'PUT',
      url: '/api/day-observation',
      headers: makeHeaders(),
      body: JSON.stringify({
        babyProfileId: VALID_BABY_ID,
        date: VALID_DATE,
        stool: 'NORMAL',
        symptoms: ['RASH'],
        notes: 'Test note',
      }),
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toBeDefined()
    await app.close()
  })

  it('returns 200 on second PUT (idempotent — no duplicate created)', async () => {
    const upsertFn = vi.fn().mockResolvedValue(MOCK_OBSERVATION)
    const app = await buildTestApp({
      prisma: { dayObservation: { upsert: upsertFn, findUnique: vi.fn(), delete: vi.fn(), findMany: vi.fn() } },
    })

    const payload = {
      method: 'PUT' as const,
      url: '/api/day-observation',
      headers: makeHeaders(),
      body: JSON.stringify({ babyProfileId: VALID_BABY_ID, date: VALID_DATE, stool: 'NORMAL' }),
    }

    await app.inject(payload)
    const res2 = await app.inject(payload)

    // upsert called twice — no create duplicate
    expect(upsertFn).toHaveBeenCalledTimes(2)
    expect(res2.statusCode).toBe(200)
    await app.close()
  })

  it('deduplicates symptoms (REQ-B3)', async () => {
    const upsertFn = vi.fn().mockResolvedValue(MOCK_OBSERVATION)
    const app = await buildTestApp({
      prisma: { dayObservation: { upsert: upsertFn, findUnique: vi.fn(), delete: vi.fn(), findMany: vi.fn() } },
    })

    await app.inject({
      method: 'PUT',
      url: '/api/day-observation',
      headers: makeHeaders(),
      body: JSON.stringify({
        babyProfileId: VALID_BABY_ID,
        date: VALID_DATE,
        symptoms: ['RASH', 'GAS', 'RASH'],
      }),
    })

    expect(upsertFn).toHaveBeenCalledOnce()
    const callArg = upsertFn.mock.calls[0]?.[0]
    // After dedup: ['RASH', 'GAS']
    expect(callArg?.create?.symptoms).toHaveLength(2)
    await app.close()
  })

  it('returns 400 when an invalid symptom value is sent (REQ-B3 — schema rejects unknown enums)', async () => {
    // SymptomType only has 5 values so exceeding max-10 post-dedup is impossible in practice.
    // The max(10) guard stays as a safety net for future enum growth.
    // This test ensures the schema rejects unknown enum values.
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'PUT',
      url: '/api/day-observation',
      headers: makeHeaders(),
      body: JSON.stringify({
        babyProfileId: VALID_BABY_ID,
        date: VALID_DATE,
        symptoms: ['RASH', 'NOT_A_SYMPTOM'],
      }),
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 200 when 11 symptoms dedup to ≤10 (REQ-B3 — dedup before max)', async () => {
    // 11 items in payload, but only 5 unique → should pass validation after dedup
    const upsertFn = vi.fn().mockResolvedValue(MOCK_OBSERVATION)
    const app = await buildTestApp({
      prisma: { dayObservation: { upsert: upsertFn, findUnique: vi.fn(), delete: vi.fn(), findMany: vi.fn() } },
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/api/day-observation',
      headers: makeHeaders(),
      body: JSON.stringify({
        babyProfileId: VALID_BABY_ID,
        date: VALID_DATE,
        // 11 values, 5 unique: RASH, GAS, ALLERGY_SUSPECT, VOMITING, FEVER
        symptoms: ['RASH', 'GAS', 'ALLERGY_SUSPECT', 'VOMITING', 'FEVER',
                   'RASH', 'GAS', 'ALLERGY_SUSPECT', 'VOMITING', 'FEVER', 'RASH'],
      }),
    })

    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('returns 401 when not authenticated', async () => {
    const app = await buildTestApp({ authenticated: false })

    const res = await app.inject({
      method: 'PUT',
      url: '/api/day-observation',
      headers: makeHeaders(),
      body: JSON.stringify({ babyProfileId: VALID_BABY_ID, date: VALID_DATE }),
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 400 on invalid date format', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'PUT',
      url: '/api/day-observation',
      headers: makeHeaders(),
      body: JSON.stringify({ babyProfileId: VALID_BABY_ID, date: '10/06/2025' }),
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })
})

// ──────────────────────────────────────────────────────────────────────────────

describe('GET /api/day-observation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with the observation when it exists', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'GET',
      url: `/api/day-observation?babyProfileId=${VALID_BABY_ID}&date=${VALID_DATE}`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toBeDefined()
    await app.close()
  })

  it('returns 200 with null when no observation exists', async () => {
    const app = await buildTestApp({
      prisma: {
        dayObservation: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
          delete: vi.fn(),
          findMany: vi.fn(),
        },
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/day-observation?babyProfileId=${VALID_BABY_ID}&date=${VALID_DATE}`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toBeNull()
    await app.close()
  })

  it('returns 401 when not authenticated', async () => {
    const app = await buildTestApp({ authenticated: false })

    const res = await app.inject({
      method: 'GET',
      url: `/api/day-observation?babyProfileId=${VALID_BABY_ID}&date=${VALID_DATE}`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 400 when date format is invalid', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'GET',
      url: `/api/day-observation?babyProfileId=${VALID_BABY_ID}&date=invalid`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })
})

// ──────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/day-observation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 204 when observation exists and is deleted', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/day-observation?babyProfileId=${VALID_BABY_ID}&date=${VALID_DATE}`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(204)
    await app.close()
  })

  it('returns 404 when observation does not exist (REQ-B4)', async () => {
    const app = await buildTestApp({
      prisma: {
        dayObservation: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
          delete: vi.fn().mockResolvedValue(null),
          findMany: vi.fn(),
        },
      },
    })

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/day-observation?babyProfileId=${VALID_BABY_ID}&date=${VALID_DATE}`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 401 when not authenticated', async () => {
    const app = await buildTestApp({ authenticated: false })

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/day-observation?babyProfileId=${VALID_BABY_ID}&date=${VALID_DATE}`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 400 when babyProfileId is not a valid CUID', async () => {
    const app = await buildTestApp()

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/day-observation?babyProfileId=not-a-cuid&date=${VALID_DATE}`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })
})

describe('Authorization (ownership)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('PUT returns 403 when babyProfile does not belong to the user', async () => {
    const app = await buildTestApp({
      prisma: { babyProfile: { findFirst: vi.fn().mockResolvedValue(null) } },
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/api/day-observation',
      headers: makeHeaders(),
      body: JSON.stringify({ babyProfileId: VALID_BABY_ID, date: VALID_DATE, stool: 'NORMAL' }),
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('GET returns 403 when babyProfile does not belong to the user', async () => {
    const app = await buildTestApp({
      prisma: { babyProfile: { findFirst: vi.fn().mockResolvedValue(null) } },
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/day-observation?babyProfileId=${VALID_BABY_ID}&date=${VALID_DATE}`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('DELETE returns 403 when babyProfile does not belong to the user', async () => {
    const app = await buildTestApp({
      prisma: { babyProfile: { findFirst: vi.fn().mockResolvedValue(null) } },
    })

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/day-observation?babyProfileId=${VALID_BABY_ID}&date=${VALID_DATE}`,
      headers: { origin: ORIGIN },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })
})
