/**
 * Unit tests for DisclaimerService — acceptDisclaimer use case.
 *
 * Spec: REQ-DC-01 (persist on accept), REQ-DC-02 (version validation)
 * Design: AD-DC-04 (always-insert, version mismatch → 400)
 *
 * TDD Phase: RED — written before disclaimer.service.ts exists.
 * Repository is injected as a fake — no real DB connection required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DISCLAIMER_CURRENT_VERSION } from './disclaimer.constants.js'

// ─── Fake repository ──────────────────────────────────────────────────────────

function createFakeRepo(overrides?: {
  create?: ReturnType<typeof vi.fn>
  findLatestByUser?: ReturnType<typeof vi.fn>
}) {
  return {
    create: overrides?.create ?? vi.fn(),
    findLatestByUser: overrides?.findLatestByUser ?? vi.fn(),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DisclaimerService.acceptDisclaimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Happy path
  // ===========================================================================

  it('calls repo.create with userId, version, userAgent, ipAddress when version matches', async () => {
    const mockRow = {
      id: 'cuid-1',
      userId: 'user-1',
      version: DISCLAIMER_CURRENT_VERSION,
      acceptedAt: new Date(),
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
    }
    const createFn = vi.fn().mockResolvedValue(mockRow)
    const repo = createFakeRepo({ create: createFn })

    const { DisclaimerService } = await import('./disclaimer.service.js')
    const service = new DisclaimerService(repo)

    const result = await service.acceptDisclaimer({
      userId: 'user-1',
      version: DISCLAIMER_CURRENT_VERSION,
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
    })

    expect(createFn).toHaveBeenCalledOnce()
    expect(createFn).toHaveBeenCalledWith({
      userId: 'user-1',
      version: DISCLAIMER_CURRENT_VERSION,
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
    })
    expect(result).toEqual(mockRow)
  })

  it('returns the persisted row from repo.create', async () => {
    const acceptedAt = new Date('2026-04-28T10:00:00Z')
    const mockRow = {
      id: 'cuid-abc',
      userId: 'user-2',
      version: DISCLAIMER_CURRENT_VERSION,
      acceptedAt,
      userAgent: null,
      ipAddress: null,
    }
    const createFn = vi.fn().mockResolvedValue(mockRow)
    const repo = createFakeRepo({ create: createFn })

    const { DisclaimerService } = await import('./disclaimer.service.js')
    const service = new DisclaimerService(repo)

    const result = await service.acceptDisclaimer({
      userId: 'user-2',
      version: DISCLAIMER_CURRENT_VERSION,
    })

    expect(result).toEqual(mockRow)
    expect(result.acceptedAt).toBe(acceptedAt)
  })

  it('passes undefined userAgent and ipAddress when not provided', async () => {
    const createFn = vi.fn().mockResolvedValue({
      id: 'cuid-2',
      userId: 'user-3',
      version: DISCLAIMER_CURRENT_VERSION,
      acceptedAt: new Date(),
      userAgent: null,
      ipAddress: null,
    })
    const repo = createFakeRepo({ create: createFn })

    const { DisclaimerService } = await import('./disclaimer.service.js')
    const service = new DisclaimerService(repo)

    await service.acceptDisclaimer({
      userId: 'user-3',
      version: DISCLAIMER_CURRENT_VERSION,
    })

    const callArg = createFn.mock.calls[0]?.[0]
    expect(callArg?.userAgent).toBeUndefined()
    expect(callArg?.ipAddress).toBeUndefined()
  })

  // ===========================================================================
  // Version validation (REQ-DC-02)
  // ===========================================================================

  it('throws a 400 AppError when version does not match DISCLAIMER_CURRENT_VERSION', async () => {
    const createFn = vi.fn()
    const repo = createFakeRepo({ create: createFn })

    const { DisclaimerService } = await import('./disclaimer.service.js')
    const service = new DisclaimerService(repo)

    await expect(
      service.acceptDisclaimer({
        userId: 'user-4',
        version: 'injected-version',
        userAgent: 'Mozilla/5.0',
        ipAddress: '1.2.3.4',
      }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('does NOT call repo.create when version mismatches', async () => {
    const createFn = vi.fn()
    const repo = createFakeRepo({ create: createFn })

    const { DisclaimerService } = await import('./disclaimer.service.js')
    const service = new DisclaimerService(repo)

    await expect(
      service.acceptDisclaimer({
        userId: 'user-5',
        version: 'v999',
      }),
    ).rejects.toThrow()

    expect(createFn).not.toHaveBeenCalled()
  })

  it('throws a 400 AppError when version is an empty string', async () => {
    const repo = createFakeRepo()

    const { DisclaimerService } = await import('./disclaimer.service.js')
    const service = new DisclaimerService(repo)

    await expect(
      service.acceptDisclaimer({
        userId: 'user-6',
        version: '',
      }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})
