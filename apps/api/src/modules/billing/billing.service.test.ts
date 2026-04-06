/**
 * Unit tests for billing service — trial subscription creation.
 *
 * These tests verify the createTrialSubscription function:
 * - Creates local trial subscription with status TRIALING
 * - Sets trialEnd to 21 days from now
 * - Maps plan to correct interval (MONTHLY/YEARLY)
 * - Returns 409 if user already has ACTIVE or TRIALING subscription
 *
 * TDD Phase: RED
 * These tests should FAIL until T6 is implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRIAL_DURATION_DAYS } from '@pakulab/shared'
import { ConflictError } from '../../shared/errors/index.js'

// =============================================================================
// T5: RED TESTS - createTrialSubscription
// These tests should FAIL because createTrialSubscription doesn't exist yet.
// =============================================================================

describe('createTrialSubscription', () => {
  const mockUserId = 'user-test-123'

  // Helper to create mock Prisma client
  function createMockPrisma(scenarios: { 
    existingSubscription?: { status: string } | null 
  } = {}) {
    return {
      subscription: {
        findUnique: vi.fn().mockResolvedValue(scenarios.existingSubscription ?? null),
        upsert: vi.fn().mockResolvedValue({
          id: 'sub-test-123',
          userId: mockUserId,
          status: 'TRIALING',
          interval: 'MONTHLY',
          trialEnd: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          currentPeriodEnd: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          stripeCustomerId: null,
          stripeSubId: null,
          stripePriceId: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH TESTS
  // ===========================================================================

  it('creates subscription with status TRIALING', async () => {
    const prisma = createMockPrisma()

    // Import dynamically to ensure it fails if function doesn't exist
    const { createTrialSubscription } = await import('./billing.service.js')

    const result = await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    expect(result.status).toBe('TRIALING')
    expect(prisma.subscription.upsert).toHaveBeenCalled()
  })

  it('sets trialEnd to 21 days from now', async () => {
    const prisma = createMockPrisma()
    const { createTrialSubscription } = await import('./billing.service.js')

    const beforeTest = Date.now()
    const result = await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    // trialEnd should be approximately 21 days from now
    // Allow 2 seconds tolerance for test execution time
    const expectedMin = beforeTest + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000 - 2000
    const expectedMax = beforeTest + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000 + 2000

    expect(result.trialEnd!.getTime()).toBeGreaterThanOrEqual(expectedMin)
    expect(result.trialEnd!.getTime()).toBeLessThanOrEqual(expectedMax)
  })

  it('sets interval to MONTHLY when plan is TRIAL', async () => {
    const prisma = createMockPrisma()
    const { createTrialSubscription } = await import('./billing.service.js')

    await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    const upsertCall = prisma.subscription.upsert.mock.calls[0]
    expect(upsertCall).toBeDefined()

    // Check that the create data has interval: MONTHLY
    const createData = upsertCall![0]?.create
    expect(createData?.interval).toBe('MONTHLY')
  })

  it('sets interval to MONTHLY when plan is PRO_MONTHLY', async () => {
    const prisma = createMockPrisma()
    const { createTrialSubscription } = await import('./billing.service.js')

    await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'PRO_MONTHLY',
    })

    const upsertCall = prisma.subscription.upsert.mock.calls[0]
    expect(upsertCall).toBeDefined()

    const createData = upsertCall![0]?.create
    expect(createData?.interval).toBe('MONTHLY')
  })

  it('sets interval to YEARLY when plan is PRO_YEARLY', async () => {
    const prisma = createMockPrisma()
    const { createTrialSubscription } = await import('./billing.service.js')

    await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'PRO_YEARLY',
    })

    const upsertCall = prisma.subscription.upsert.mock.calls[0]
    expect(upsertCall).toBeDefined()

    const createData = upsertCall![0]?.create
    expect(createData?.interval).toBe('YEARLY')
  })

  it('sets stripeCustomerId, stripeSubId, stripePriceId to null', async () => {
    const prisma = createMockPrisma()
    const { createTrialSubscription } = await import('./billing.service.js')

    await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    const upsertCall = prisma.subscription.upsert.mock.calls[0]
    const createData = upsertCall![0]?.create

    expect(createData?.stripeCustomerId).toBeNull()
    expect(createData?.stripeSubId).toBeNull()
    expect(createData?.stripePriceId).toBeNull()
  })

  it('sets currentPeriodEnd to trialEnd', async () => {
    const prisma = createMockPrisma()
    const { createTrialSubscription } = await import('./billing.service.js')

    const result = await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    // currentPeriodEnd should equal trialEnd for trial subscriptions
    expect(result.currentPeriodEnd).not.toBeNull()
    expect(result.currentPeriodEnd?.getTime()).toBe(result.trialEnd?.getTime())
  })

  it('sets cancelAtPeriodEnd to false', async () => {
    const prisma = createMockPrisma()
    const { createTrialSubscription } = await import('./billing.service.js')

    await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    const upsertCall = prisma.subscription.upsert.mock.calls[0]
    const createData = upsertCall![0]?.create

    expect(createData?.cancelAtPeriodEnd).toBe(false)
  })

  // ===========================================================================
  // ERROR CASE TESTS
  // ===========================================================================

  it('throws ConflictError (409) if user already has ACTIVE subscription', async () => {
    const prisma = createMockPrisma({
      existingSubscription: { status: 'ACTIVE' },
    })

    const { createTrialSubscription } = await import('./billing.service.js')

    await expect(
      createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
        userId: mockUserId,
        plan: 'TRIAL',
      })
    ).rejects.toThrow(ConflictError)
  })

  it('throws ConflictError (409) if user already has TRIALING subscription', async () => {
    const prisma = createMockPrisma({
      existingSubscription: { status: 'TRIALING' },
    })

    const { createTrialSubscription } = await import('./billing.service.js')

    await expect(
      createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
        userId: mockUserId,
        plan: 'TRIAL',
      })
    ).rejects.toThrow(ConflictError)
  })

  it('allows creating trial if user has CANCELED subscription', async () => {
    const prisma = createMockPrisma({
      existingSubscription: { status: 'CANCELED' },
    })

    const { createTrialSubscription } = await import('./billing.service.js')

    // Should NOT throw - CANCELED users can start new trial
    const result = await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    expect(result.status).toBe('TRIALING')
    expect(prisma.subscription.upsert).toHaveBeenCalled()
  })

  it('allows creating trial if user has EXPIRED subscription', async () => {
    const prisma = createMockPrisma({
      existingSubscription: { status: 'EXPIRED' },
    })

    const { createTrialSubscription } = await import('./billing.service.js')

    // Should NOT throw - EXPIRED users can start new trial
    const result = await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    expect(result.status).toBe('TRIALING')
    expect(prisma.subscription.upsert).toHaveBeenCalled()
  })

  it('allows creating trial if user has PAST_DUE subscription', async () => {
    const prisma = createMockPrisma({
      existingSubscription: { status: 'PAST_DUE' },
    })

    const { createTrialSubscription } = await import('./billing.service.js')

    // PAST_DUE is a special case - let design decide, but likely not blocked
    // Since spec says ACTIVE or TRIALING are blocked
    const result = await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    expect(result.status).toBe('TRIALING')
    expect(prisma.subscription.upsert).toHaveBeenCalled()
  })

  // ===========================================================================
  // UPSERT BEHAVIOR TESTS
  // ===========================================================================

  it('uses upsert to create or update subscription', async () => {
    const prisma = createMockPrisma()

    const { createTrialSubscription } = await import('./billing.service.js')

    await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    // Verify upsert was called with correct where clause
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: mockUserId },
      })
    )
  })

  it('returns the created subscription object', async () => {
    const prisma = createMockPrisma()

    const { createTrialSubscription } = await import('./billing.service.js')

    const result = await createTrialSubscription(prisma as unknown as import('@prisma/client').PrismaClient, {
      userId: mockUserId,
      plan: 'TRIAL',
    })

    // Verify the result has expected shape
    expect(result).toMatchObject({
      id: expect.any(String),
      userId: mockUserId,
      status: 'TRIALING',
      interval: expect.stringMatching(/^(MONTHLY|YEARLY)$/),
      stripeCustomerId: null,
      stripeSubId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    })
    expect(result.trialEnd).toBeInstanceOf(Date)
    expect(result.currentPeriodEnd).toBeInstanceOf(Date)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })
})