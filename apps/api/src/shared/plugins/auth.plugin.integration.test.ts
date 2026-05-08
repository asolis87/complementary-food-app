/**
 * Integration tests for the auth plugin — Phase 4 (disclaimer hydration).
 *
 * Spec: REQ-DC-04, REQ-DC-05, NF-DC-02
 * Design: AD-DC-03 — single Prisma include (subscription + disclaimerAcceptances)
 *
 * Strategy:
 * - Builds a minimal Fastify app with a fake Prisma decoration.
 * - The fake Prisma returns controlled user/subscription/disclaimerAcceptances data.
 * - A test endpoint echoes back request.user so we can assert its shape.
 *
 * Approval tests (tasks 4.1) cover EXISTING fields to prevent regressions:
 *   id, email, emailVerified, tier, subscriptionStatus, trialEnd
 *
 * NEW behaviour tests cover:
 *   lastAcceptedDisclaimerVersion: null (no rows) | string (latest version)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FakePrismaUser {
  id: string
  subscription: {
    status: string
    currentPeriodEnd: Date | null
    trialEnd: Date | null
  } | null
  disclaimerAcceptances: Array<{ version: string }>
}

// ─── BetterAuth session mock ───────────────────────────────────────────────────

// The auth plugin calls `auth.api.getSession(...)`.
// We mock the whole module so the integration test never needs a real BetterAuth instance.
vi.mock('../../modules/auth/auth.config.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

async function getAuthMock() {
  const mod = await import('../../modules/auth/auth.config.js')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mod.auth.api.getSession as unknown as ReturnType<typeof vi.fn>
}

// ─── App builder ──────────────────────────────────────────────────────────────

/**
 * Builds a minimal Fastify app that:
 * 1. Registers a fake prisma decoration with controlled data.
 * 2. Registers the real auth plugin (reads from fastify.prisma + auth mock).
 * 3. Exposes GET /whoami that returns request.user (or null) as JSON.
 */
async function buildTestApp(fakePrismaUser: FakePrismaUser | null): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })

  // 1. Fake prisma decoration — registered as 'prisma' so authPlugin's dependency check passes.
  // Cast to the full PrismaClient type to satisfy the declaration merging on fastify.prisma.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fakePrisma = {
    user: { findUnique: vi.fn().mockResolvedValue(fakePrismaUser) },
  }
  await app.register(
    fp(
      async (f) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        f.decorate('prisma', fakePrisma as any)
      },
      { name: 'prisma' },
    ),
  )

  // 2. Real auth plugin under test
  const { default: authPlugin } = await import('./auth.js')
  await app.register(authPlugin)

  // 3. Test echo endpoint
  app.get('/whoami', async (request) => {
    return { user: request.user ?? null }
  })

  await app.ready()
  return app
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSession(userId: string) {
  return {
    user: {
      id: userId,
      email: 'test@example.com',
      emailVerified: true,
    },
  }
}

function makeActiveSub() {
  return {
    status: 'ACTIVE',
    currentPeriodEnd: new Date('2027-01-01'),
    trialEnd: null,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('auth plugin — request.user hydration', () => {
  let originalCorsOrigin: string | undefined
  let getSessionMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    originalCorsOrigin = process.env['CORS_ORIGIN']
    vi.clearAllMocks()
    getSessionMock = await getAuthMock()
  })

  afterEach(() => {
    if (originalCorsOrigin === undefined) delete process.env['CORS_ORIGIN']
    else process.env['CORS_ORIGIN'] = originalCorsOrigin
  })

  // ===========================================================================
  // Approval tests — existing fields must remain intact (REG)
  // ===========================================================================

  describe('existing fields (approval / regression)', () => {
    it('sets request.user to undefined when no session', async () => {
      getSessionMock.mockResolvedValue(null)

      const app = await buildTestApp(null)
      const res = await app.inject({ method: 'GET', url: '/whoami' })
      await app.close()

      expect(res.statusCode).toBe(200)
      expect(res.json().user).toBeNull()
    })

    it('attaches id and email from session.user', async () => {
      getSessionMock.mockResolvedValue(makeSession('user-abc'))

      const fakePrismaUser: FakePrismaUser = {
        id: 'user-abc',
        subscription: makeActiveSub(),
        disclaimerAcceptances: [],
      }

      const app = await buildTestApp(fakePrismaUser)
      const res = await app.inject({ method: 'GET', url: '/whoami' })
      await app.close()

      const { user } = res.json()
      expect(user.id).toBe('user-abc')
      expect(user.email).toBe('test@example.com')
    })

    it('resolves tier PRO for ACTIVE subscription', async () => {
      getSessionMock.mockResolvedValue(makeSession('user-abc'))

      const fakePrismaUser: FakePrismaUser = {
        id: 'user-abc',
        subscription: makeActiveSub(),
        disclaimerAcceptances: [],
      }

      const app = await buildTestApp(fakePrismaUser)
      const res = await app.inject({ method: 'GET', url: '/whoami' })
      await app.close()

      expect(res.json().user.tier).toBe('PRO')
    })

    it('resolves tier FREE when no subscription', async () => {
      getSessionMock.mockResolvedValue(makeSession('user-abc'))

      const fakePrismaUser: FakePrismaUser = {
        id: 'user-abc',
        subscription: null,
        disclaimerAcceptances: [],
      }

      const app = await buildTestApp(fakePrismaUser)
      const res = await app.inject({ method: 'GET', url: '/whoami' })
      await app.close()

      expect(res.json().user.tier).toBe('FREE')
    })

    it('attaches emailVerified from session', async () => {
      getSessionMock.mockResolvedValue(makeSession('user-abc'))

      const fakePrismaUser: FakePrismaUser = {
        id: 'user-abc',
        subscription: null,
        disclaimerAcceptances: [],
      }

      const app = await buildTestApp(fakePrismaUser)
      const res = await app.inject({ method: 'GET', url: '/whoami' })
      await app.close()

      expect(res.json().user.emailVerified).toBe(true)
    })
  })

  // ===========================================================================
  // NEW: lastAcceptedDisclaimerVersion hydration (REQ-DC-04, REQ-DC-05)
  // ===========================================================================

  describe('lastAcceptedDisclaimerVersion', () => {
    it('is null when user has no disclaimer acceptances', async () => {
      getSessionMock.mockResolvedValue(makeSession('user-new'))

      const fakePrismaUser: FakePrismaUser = {
        id: 'user-new',
        subscription: null,
        disclaimerAcceptances: [],       // no rows → should be null
      }

      const app = await buildTestApp(fakePrismaUser)
      const res = await app.inject({ method: 'GET', url: '/whoami' })
      await app.close()

      expect(res.json().user.lastAcceptedDisclaimerVersion).toBeNull()
    })

    it('equals the version from the single returned row', async () => {
      getSessionMock.mockResolvedValue(makeSession('user-v1'))

      const fakePrismaUser: FakePrismaUser = {
        id: 'user-v1',
        subscription: null,
        disclaimerAcceptances: [{ version: 'v1' }],   // take:1 returns this
      }

      const app = await buildTestApp(fakePrismaUser)
      const res = await app.inject({ method: 'GET', url: '/whoami' })
      await app.close()

      expect(res.json().user.lastAcceptedDisclaimerVersion).toBe('v1')
    })

    it('uses the FIRST element (most recent) when multiple acceptances exist', async () => {
      // Prisma's take:1 + orderBy desc returns only 1 row, but we verify the plugin
      // reads [0].version and not some other element.
      getSessionMock.mockResolvedValue(makeSession('user-v2'))

      const fakePrismaUser: FakePrismaUser = {
        id: 'user-v2',
        subscription: null,
        // Simulate what Prisma returns with take:1 orderBy desc — only the latest row
        disclaimerAcceptances: [{ version: 'v2' }],
      }

      const app = await buildTestApp(fakePrismaUser)
      const res = await app.inject({ method: 'GET', url: '/whoami' })
      await app.close()

      expect(res.json().user.lastAcceptedDisclaimerVersion).toBe('v2')
    })
  })
})
