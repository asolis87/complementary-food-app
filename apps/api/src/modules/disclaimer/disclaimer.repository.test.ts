/**
 * Unit tests for DisclaimerRepository (Prisma adapter).
 *
 * Spec: REQ-DC-01 (persist acceptance), REQ-DC-04 (findLatestByUser returns null),
 *       NF-DC-04 (append-only — no update/delete exposed)
 * Design: AD-DC-01 (hexagonal port + adapter), AD-DC-03 (index-backed findLatest)
 *
 * TDD Phase: RED — written before implementation exists.
 * Prisma client is mocked via vi.fn() — no real DB connection required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DisclaimerRepository } from './domain/ports/disclaimer.repository.port.js'
import { PrismaDisclaimerRepository } from './infrastructure/adapters/prisma-disclaimer.repository.js'

// ─── Minimal mock of the Prisma DisclaimerAcceptance delegate ────────────────

function createMockPrisma(overrides?: {
  create?: ReturnType<typeof vi.fn>
  findFirst?: ReturnType<typeof vi.fn>
}) {
  return {
    disclaimerAcceptance: {
      create: overrides?.create ?? vi.fn(),
      findFirst: overrides?.findFirst ?? vi.fn(),
    },
  }
}

// ─── Type helpers ─────────────────────────────────────────────────────────────

type MockPrisma = ReturnType<typeof createMockPrisma>

function asRepo(prisma: MockPrisma): DisclaimerRepository {
  return new PrismaDisclaimerRepository(
    prisma as unknown as import('@prisma/client').PrismaClient,
  )
}

// ─── create() ─────────────────────────────────────────────────────────────────

describe('PrismaDisclaimerRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // create()
  // ===========================================================================

  describe('create(input)', () => {
    it('calls prisma.disclaimerAcceptance.create with correct data', async () => {
      const mockRow = {
        id: 'cuid-abc',
        userId: 'user-1',
        version: 'v1',
        acceptedAt: new Date('2026-01-01T00:00:00Z'),
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1',
      }
      const createFn = vi.fn().mockResolvedValue(mockRow)
      const repo = asRepo(createMockPrisma({ create: createFn }))

      const result = await repo.create({
        userId: 'user-1',
        version: 'v1',
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1',
      })

      expect(createFn).toHaveBeenCalledOnce()
      expect(createFn).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          version: 'v1',
          userAgent: 'Mozilla/5.0',
          ipAddress: '127.0.0.1',
        },
      })
      expect(result).toEqual(mockRow)
    })

    it('stores null userAgent and ipAddress when omitted', async () => {
      const mockRow = {
        id: 'cuid-xyz',
        userId: 'user-2',
        version: 'v1',
        acceptedAt: new Date(),
        userAgent: null,
        ipAddress: null,
      }
      const createFn = vi.fn().mockResolvedValue(mockRow)
      const repo = asRepo(createMockPrisma({ create: createFn }))

      await repo.create({ userId: 'user-2', version: 'v1' })

      const callArg = createFn.mock.calls[0]?.[0]
      expect(callArg?.data?.userAgent).toBeUndefined()
      expect(callArg?.data?.ipAddress).toBeUndefined()
    })

    it('returns the persisted row with all fields', async () => {
      const acceptedAt = new Date('2026-04-28T10:00:00Z')
      const mockRow = {
        id: 'cuid-123',
        userId: 'user-3',
        version: 'v1',
        acceptedAt,
        userAgent: 'curl/7.x',
        ipAddress: '10.0.0.1',
      }
      const createFn = vi.fn().mockResolvedValue(mockRow)
      const repo = asRepo(createMockPrisma({ create: createFn }))

      const result = await repo.create({
        userId: 'user-3',
        version: 'v1',
        userAgent: 'curl/7.x',
        ipAddress: '10.0.0.1',
      })

      expect(result.id).toBe('cuid-123')
      expect(result.acceptedAt).toBe(acceptedAt)
      expect(result.userAgent).toBe('curl/7.x')
      expect(result.ipAddress).toBe('10.0.0.1')
    })
  })

  // ===========================================================================
  // findLatestByUser()
  // ===========================================================================

  describe('findLatestByUser(userId)', () => {
    it('calls findFirst with take:1, orderBy acceptedAt desc filtered by userId', async () => {
      const findFirstFn = vi.fn().mockResolvedValue(null)
      const repo = asRepo(createMockPrisma({ findFirst: findFirstFn }))

      await repo.findLatestByUser('user-4')

      expect(findFirstFn).toHaveBeenCalledOnce()
      expect(findFirstFn).toHaveBeenCalledWith({
        where: { userId: 'user-4' },
        orderBy: { acceptedAt: 'desc' },
        take: 1,
      })
    })

    it('returns null when user has no acceptance history (REQ-DC-04)', async () => {
      const findFirstFn = vi.fn().mockResolvedValue(null)
      const repo = asRepo(createMockPrisma({ findFirst: findFirstFn }))

      const result = await repo.findLatestByUser('user-no-history')

      expect(result).toBeNull()
    })

    it('returns the most recent acceptance row when history exists', async () => {
      const latest = {
        id: 'cuid-latest',
        userId: 'user-5',
        version: 'v1',
        acceptedAt: new Date('2026-04-28T12:00:00Z'),
        userAgent: null,
        ipAddress: null,
      }
      const findFirstFn = vi.fn().mockResolvedValue(latest)
      const repo = asRepo(createMockPrisma({ findFirst: findFirstFn }))

      const result = await repo.findLatestByUser('user-5')

      expect(result).toEqual(latest)
      expect(result?.version).toBe('v1')
    })

    it('returns only the latest row (not an array)', async () => {
      const row = {
        id: 'single',
        userId: 'user-6',
        version: 'v1',
        acceptedAt: new Date(),
        userAgent: null,
        ipAddress: null,
      }
      const findFirstFn = vi.fn().mockResolvedValue(row)
      const repo = asRepo(createMockPrisma({ findFirst: findFirstFn }))

      const result = await repo.findLatestByUser('user-6')

      // Must be an object or null — never an array
      expect(Array.isArray(result)).toBe(false)
    })
  })

  // ===========================================================================
  // Append-only invariant — interface surface (NF-DC-04)
  // ===========================================================================

  describe('append-only invariant (NF-DC-04)', () => {
    it('does NOT expose an update method', () => {
      const repo = asRepo(createMockPrisma())
      // @ts-expect-error — update must not exist on the port
      expect((repo as Record<string, unknown>)['update']).toBeUndefined()
    })

    it('does NOT expose a delete method', () => {
      const repo = asRepo(createMockPrisma())
      // @ts-expect-error — delete must not exist on the port
      expect((repo as Record<string, unknown>)['delete']).toBeUndefined()
    })
  })
})
