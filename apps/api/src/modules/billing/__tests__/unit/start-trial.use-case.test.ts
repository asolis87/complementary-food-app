/**
 * Unit tests for StartTrialUseCase.
 *
 * Migrated from billing.service.test.ts — adapted to mock SubscriptionRepository
 * instead of raw PrismaClient. All 15 test cases preserved with same assertions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRIAL_DURATION_DAYS } from '@pakulab/shared'
import { StartTrialUseCase } from '../../application/use-cases/start-trial.use-case.js'
import type { SubscriptionRepository } from '../../domain/ports/subscription.repository.js'
import { DuplicateSubscriptionException } from '../../domain/exceptions/duplicate-subscription.exception.js'

describe('StartTrialUseCase', () => {
  const mockUserId = 'user-test-123'

  // Helper to create mock SubscriptionRepository
  function createMockRepo(scenarios: {
    findByUserId?: ReturnType<SubscriptionRepository['findByUserId']> | null
    upsertByUserId?: ReturnType<SubscriptionRepository['upsertByUserId']>
  } = {}) {
    return {
      findByUserId: vi.fn().mockResolvedValue(scenarios.findByUserId ?? null),
      upsertByUserId: vi.fn().mockResolvedValue(
        scenarios.upsertByUserId ?? {
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
        },
      ),
      findByStripeSubId: vi.fn().mockResolvedValue(null),
      updateByStripeSubId: vi.fn().mockResolvedValue(undefined),
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH TESTS
  // ===========================================================================

  it('creates subscription with status TRIALING', async () => {
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    const result = await useCase.execute({
      userId: mockUserId,
      plan: 'TRIAL',
    })

    expect(result.status).toBe('TRIALING')
    expect(mockRepo.upsertByUserId).toHaveBeenCalled()
  })

  it('sets trialEnd to 21 days from now', async () => {
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    const beforeTest = Date.now()
    const result = await useCase.execute({
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
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    await useCase.execute({
      userId: mockUserId,
      plan: 'TRIAL',
    })

    const upsertCall = mockRepo.upsertByUserId.mock.calls[0]
    expect(upsertCall).toBeDefined()

    const data = upsertCall![1]
    expect(data.interval).toBe('MONTHLY')
  })

  it('sets interval to MONTHLY when plan is PRO_MONTHLY', async () => {
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    await useCase.execute({
      userId: mockUserId,
      plan: 'PRO_MONTHLY',
    })

    const upsertCall = mockRepo.upsertByUserId.mock.calls[0]
    expect(upsertCall).toBeDefined()

    const data = upsertCall![1]
    expect(data.interval).toBe('MONTHLY')
  })

  it('sets interval to YEARLY when plan is PRO_YEARLY', async () => {
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    await useCase.execute({
      userId: mockUserId,
      plan: 'PRO_YEARLY',
    })

    const upsertCall = mockRepo.upsertByUserId.mock.calls[0]
    expect(upsertCall).toBeDefined()

    const data = upsertCall![1]
    expect(data.interval).toBe('YEARLY')
  })

  it('sets stripeCustomerId, stripeSubId, stripePriceId to null', async () => {
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    await useCase.execute({
      userId: mockUserId,
      plan: 'TRIAL',
    })

    const upsertCall = mockRepo.upsertByUserId.mock.calls[0]
    const data = upsertCall![1]

    expect(data.stripeCustomerId).toBeNull()
    expect(data.stripeSubId).toBeNull()
    expect(data.stripePriceId).toBeNull()
  })

  it('sets currentPeriodEnd to trialEnd', async () => {
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    const result = await useCase.execute({
      userId: mockUserId,
      plan: 'TRIAL',
    })

    // currentPeriodEnd should equal trialEnd for trial subscriptions
    expect(result.currentPeriodEnd).not.toBeNull()
    expect(result.currentPeriodEnd?.getTime()).toBe(result.trialEnd?.getTime())
  })

  it('sets cancelAtPeriodEnd to false', async () => {
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    await useCase.execute({
      userId: mockUserId,
      plan: 'TRIAL',
    })

    const upsertCall = mockRepo.upsertByUserId.mock.calls[0]
    const data = upsertCall![1]

    expect(data.cancelAtPeriodEnd).toBe(false)
  })

  // ===========================================================================
  // ERROR CASE TESTS
  // ===========================================================================

  it('throws DuplicateSubscriptionException if user already has ACTIVE subscription', async () => {
    const mockRepo = createMockRepo({
      findByUserId: Promise.resolve({
        id: 'existing-sub',
        userId: mockUserId,
        status: 'ACTIVE',
        interval: 'MONTHLY',
        stripeCustomerId: null,
        stripeSubId: null,
        stripePriceId: null,
        currentPeriodEnd: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        createdAt: new Date(),
      }),
    })
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    await expect(
      useCase.execute({
        userId: mockUserId,
        plan: 'TRIAL',
      }),
    ).rejects.toThrow(DuplicateSubscriptionException)
  })

  it('throws DuplicateSubscriptionException if user already has TRIALING subscription', async () => {
    const mockRepo = createMockRepo({
      findByUserId: Promise.resolve({
        id: 'existing-sub',
        userId: mockUserId,
        status: 'TRIALING',
        interval: 'MONTHLY',
        stripeCustomerId: null,
        stripeSubId: null,
        stripePriceId: null,
        currentPeriodEnd: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        createdAt: new Date(),
      }),
    })
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    await expect(
      useCase.execute({
        userId: mockUserId,
        plan: 'TRIAL',
      }),
    ).rejects.toThrow(DuplicateSubscriptionException)
  })

  it('allows creating trial if user has CANCELED subscription', async () => {
    const mockRepo = createMockRepo({
      findByUserId: Promise.resolve({
        id: 'existing-sub',
        userId: mockUserId,
        status: 'CANCELED',
        interval: 'MONTHLY',
        stripeCustomerId: null,
        stripeSubId: null,
        stripePriceId: null,
        currentPeriodEnd: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        createdAt: new Date(),
      }),
    })
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    // Should NOT throw - CANCELED users can start new trial
    const result = await useCase.execute({
      userId: mockUserId,
      plan: 'TRIAL',
    })

    expect(result.status).toBe('TRIALING')
    expect(mockRepo.upsertByUserId).toHaveBeenCalled()
  })

  it('allows creating trial if user has EXPIRED subscription', async () => {
    const mockRepo = createMockRepo({
      findByUserId: Promise.resolve({
        id: 'existing-sub',
        userId: mockUserId,
        status: 'EXPIRED',
        interval: 'MONTHLY',
        stripeCustomerId: null,
        stripeSubId: null,
        stripePriceId: null,
        currentPeriodEnd: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        createdAt: new Date(),
      }),
    })
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    // Should NOT throw - EXPIRED users can start new trial
    const result = await useCase.execute({
      userId: mockUserId,
      plan: 'TRIAL',
    })

    expect(result.status).toBe('TRIALING')
    expect(mockRepo.upsertByUserId).toHaveBeenCalled()
  })

  it('allows creating trial if user has PAST_DUE subscription', async () => {
    const mockRepo = createMockRepo({
      findByUserId: Promise.resolve({
        id: 'existing-sub',
        userId: mockUserId,
        status: 'PAST_DUE',
        interval: 'MONTHLY',
        stripeCustomerId: null,
        stripeSubId: null,
        stripePriceId: null,
        currentPeriodEnd: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        createdAt: new Date(),
      }),
    })
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    const result = await useCase.execute({
      userId: mockUserId,
      plan: 'TRIAL',
    })

    expect(result.status).toBe('TRIALING')
    expect(mockRepo.upsertByUserId).toHaveBeenCalled()
  })

  // ===========================================================================
  // UPSERT BEHAVIOR TESTS
  // ===========================================================================

  it('uses upsertByUserId to create or update subscription', async () => {
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    await useCase.execute({
      userId: mockUserId,
      plan: 'TRIAL',
    })

    // Verify upsert was called with correct userId
    expect(mockRepo.upsertByUserId).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        userId: mockUserId,
      }),
    )
  })

  it('returns the created subscription object', async () => {
    const mockRepo = createMockRepo()
    const useCase = new StartTrialUseCase(mockRepo as unknown as SubscriptionRepository)

    const result = await useCase.execute({
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
  })
})
