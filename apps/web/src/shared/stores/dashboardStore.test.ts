/**
 * Dashboard Store tests — Pinia store with SWR caching.
 *
 * Tests:
 * - Initial empty state
 * - fetchDashboard populates state
 * - fetchDashboard handles errors
 * - refreshDashboard clears cache and re-fetches
 * - clearCache resets all state
 * - isStale getter based on lastFetched + TTL
 * - Section-level cache helpers (fetchSuggestions, fetchAllergens, fetchRoadmap, fetchBalance)
 * - OfflineError fallback to cached data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { DashboardData, SuggestedFood, AllergenAlert, RoadmapProgress, BalanceInsight, MealSlot, TodayLog } from '@pakulab/shared'
import { MealType } from '@pakulab/shared'

// Mock the api client
const mockGet = vi.fn()
vi.mock('@/shared/api/client.js', () => ({
  apiClient: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number, public data: unknown) {
      super(message)
      this.name = 'ApiError'
    }
  },
  OfflineError: class OfflineError extends Error {
    constructor() {
      super('Sin conexión')
      this.name = 'OfflineError'
    }
  },
}))

// Must import after mocks
import { useDashboardStore } from './dashboardStore.js'

const VALID_BABY_ID = 'clh3x7y8z0000p6rm5b4d8e9f'

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    baby: {
      id: VALID_BABY_ID,
      name: 'Mateo',
      ageInMonths: 8,
      daysInAC: 52,
    },
    userTier: 'PRO',
    todayLogs: [
      {
        id: 'log-1',
        mealType: MealType.BREAKFAST,
        time: '08:30',
        foodId: 'food-1',
        foodName: 'Manzana',
        foodGroup: 'FRUIT' as const,
        reaction: null,
        notes: null,
      },
    ],
    suggestedFoods: [
      {
        foodId: 'food-10',
        name: 'Huevo',
        group: 'PROTEIN' as const,
        ageMonths: 8,
        benefit: 'Alto en proteína',
        isAllergen: true,
        allergenType: 'huevo',
        status: 'pending' as const,
      },
    ],
    pendingAllergens: [
      {
        allergenKey: 'huevo',
        nameEs: 'Huevo',
        icon: '🥚',
        minAgeMonths: 6,
        urgency: 'normal' as const,
      },
    ],
    roadmapProgress: [
      {
        group: 'VEGETABLE' as const,
        labelEs: 'Verduras',
        triedCount: 6,
        totalCount: 10,
        percentage: 60,
        foods: [
          { foodId: 'v1', name: 'Zanahoria', status: 'tried' as const },
          { foodId: 'v2', name: 'Brócoli', status: 'pending' as const },
        ],
      },
    ],
    weeklyBalance: {
      label: 'balanced' as const,
      labelEs: 'Mayormente equilibrada',
      severity: 'green' as const,
      tip: 'La avena es suave para el estómago.',
    },
    ...overrides,
  }
}

describe('dashboardStore', () => {
  let store: ReturnType<typeof useDashboardStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDashboardStore()
    mockGet.mockReset()
  })

  // ── Initial State ───────────────────────────────────────────────────────────

  it('has empty initial state', () => {
    expect(store.dashboardData).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.lastFetched).toBeNull()
    expect(store.isEmpty).toBe(true)
    expect(store.hasError).toBe(false)
    expect(store.isStale).toBe(true)
  })

  // ── fetchDashboard ──────────────────────────────────────────────────────────

  it('fetchDashboard populates state on success', async () => {
    const mockData = createMockDashboardData()
    mockGet.mockResolvedValueOnce({ data: mockData })

    await store.fetchDashboard(VALID_BABY_ID)

    expect(store.dashboardData).toEqual(mockData)
    expect(store.lastFetched).not.toBeNull()
    expect(store.isEmpty).toBe(false)
    expect(store.hasError).toBe(false)
    expect(store.isLoading).toBe(false)
  })

  it('fetchDashboard sets error on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))

    await store.fetchDashboard(VALID_BABY_ID)

    expect(store.dashboardData).toBeNull()
    expect(store.hasError).toBe(true)
    expect(store.error).toBe('Network error')
  })

  it('fetchDashboard does nothing for empty babyProfileId', async () => {
    await store.fetchDashboard('')

    expect(mockGet).not.toHaveBeenCalled()
    expect(store.loading).toBe(false)
  })

  // ── refreshDashboard ────────────────────────────────────────────────────────

  it('refreshDashboard clears state and re-fetches', async () => {
    // First fetch
    mockGet.mockResolvedValueOnce({ data: createMockDashboardData() })
    await store.fetchDashboard(VALID_BABY_ID)
    const firstFetchTime = store.lastFetched

    // Second fetch (refresh)
    const newData = createMockDashboardData({ userTier: 'FREE' })
    mockGet.mockResolvedValueOnce({ data: newData })
    await store.refreshDashboard(VALID_BABY_ID)

    expect(store.dashboardData).toEqual(newData)
    expect(store.lastFetched).not.toBe(firstFetchTime)
  })

  // ── clearCache ──────────────────────────────────────────────────────────────

  it('clearCache resets all state', async () => {
    mockGet.mockResolvedValueOnce({ data: createMockDashboardData() })
    await store.fetchDashboard(VALID_BABY_ID)

    store.clearCache()

    expect(store.dashboardData).toBeNull()
    expect(store.lastFetched).toBeNull()
    expect(store.error).toBeNull()
    expect(store.isEmpty).toBe(true)
  })

  // ── isStale ─────────────────────────────────────────────────────────────────

  it('isStale returns true when data is older than 5 minutes', async () => {
    mockGet.mockResolvedValueOnce({ data: createMockDashboardData() })
    await store.fetchDashboard(VALID_BABY_ID)

    // Simulate that last fetch was 6 minutes ago
    const sixMinutesAgo = Date.now() - 6 * 60 * 1000
    store.lastFetched = sixMinutesAgo

    expect(store.isStale).toBe(true)
  })

  it('isStale returns false when data was just fetched', async () => {
    mockGet.mockResolvedValueOnce({ data: createMockDashboardData() })
    await store.fetchDashboard(VALID_BABY_ID)

    expect(store.isStale).toBe(false)
  })

  // ── fetchSuggestions (cached 24h) ───────────────────────────────────────────

  it('fetchSuggestions returns cached data when fresh', async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ foodId: 'f1', name: 'Test', group: 'FRUIT', ageMonths: 6, benefit: 'Test', isAllergen: false, allergenType: null, status: 'pending' }],
    })

    const first = await store.fetchSuggestions(VALID_BABY_ID)
    const second = await store.fetchSuggestions(VALID_BABY_ID)

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
  })

  // ── fetchAllergens (cached 1h) ──────────────────────────────────────────────

  it('fetchAllergens returns cached data when fresh', async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ allergenKey: 'huevo', nameEs: 'Huevo', icon: '🥚', minAgeMonths: 6, urgency: 'normal' }],
    })

    const first = await store.fetchAllergens(VALID_BABY_ID)
    const second = await store.fetchAllergens(VALID_BABY_ID)

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
  })

  // ── fetchRoadmap (cached 15min) ─────────────────────────────────────────────

  it('fetchRoadmap returns cached data when fresh', async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ group: 'FRUIT', labelEs: 'Frutas', triedCount: 2, totalCount: 5, percentage: 40, foods: [] }],
    })

    const first = await store.fetchRoadmap(VALID_BABY_ID)
    const second = await store.fetchRoadmap(VALID_BABY_ID)

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
  })

  // ── fetchBalance (cached 1h) ────────────────────────────────────────────────

  it('fetchBalance returns cached data when fresh', async () => {
    mockGet.mockResolvedValueOnce({
      data: { label: 'balanced', labelEs: 'Equilibrada', severity: 'green', tip: 'Test tip' },
    })

    const first = await store.fetchBalance(VALID_BABY_ID)
    const second = await store.fetchBalance(VALID_BABY_ID)

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
  })

  // ── Show stale data when offline (OfflineError) ─────────────────────────────

  it('fetchDashboard keeps stale data on OfflineError', async () => {
    mockGet.mockResolvedValueOnce({ data: createMockDashboardData() })
    await store.fetchDashboard(VALID_BABY_ID)

    // Now simulate offline on next fetch
    const { OfflineError } = await import('@/shared/api/client.js')
    mockGet.mockRejectedValueOnce(new OfflineError())

    await store.fetchDashboard(VALID_BABY_ID)

    // Should still have the old data
    expect(store.dashboardData).not.toBeNull()
  })
})
