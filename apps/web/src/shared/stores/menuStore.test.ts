/**
 * Menu Store tests — Serve and Re-serve functionality.
 *
 * Tests:
 * - serve/re-serve cache updates
 * - Optimistic state rollback on error
 * - Served badge transitions (null → timestamp → new timestamp)
 * - getServedAt getter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import { MealType } from '@pakulab/shared'
import type { WeeklyMenuResponse, ServeMealResponse, Snack } from '@pakulab/shared'
import { useMenuStore } from '@/shared/stores/menuStore'
import { apiClient } from '@/shared/api/client'

// Mock the api client
vi.mock('@/shared/api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

// Valid CUIDs
const VALID_MENU_CUID = 'clh3x7y8z0002p6rm5b4d8e9f'
const VALID_BABY_PROFILE_CUID = 'clh3x7y8z0000p6rm5b4d8e9f'
const VALID_PLATE_CUID = 'clh3x7y8z0003p6rm5b4d8e9f'
const VALID_SNACK_CUID = 'clh3x7y8z0004p6rm5b4d8e9f'

function setWeekMenu(store: ReturnType<typeof useMenuStore>, weekStart: string, menu: WeeklyMenuResponse) {
  store.$patch({
    weekMenus: new Map([[weekStart, menu]]),
  } as Partial<ReturnType<typeof useMenuStore>>)
}

// Helper to create a mock menu with meals
function createMockMenu(
  overrides: Partial<WeeklyMenuResponse> = {},
  servedAtMap: Record<string, string | null> = {}
): WeeklyMenuResponse {
  const baseMenu: WeeklyMenuResponse = {
    id: VALID_MENU_CUID,
    userId: 'user-123',
    babyProfileId: VALID_BABY_PROFILE_CUID,
    weekStart: '2024-06-10',
    balanceScore: 0.75,
    createdAt: '2024-06-10T10:00:00.000Z',
    updatedAt: '2024-06-10T10:00:00.000Z',
    days: [
      {
        id: 'day-0',
        menuId: VALID_MENU_CUID,
        dayOfWeek: 0,
        createdAt: '2024-06-10T10:00:00.000Z',
        meals: [
          {
            id: 'meal-1',
            menuDayId: 'day-0',
            mealType: MealType.LUNCH,
            plateId: VALID_PLATE_CUID,
            notes: null,
            servedAt: servedAtMap['lun:comida'] ?? null,
            plate: {
              id: VALID_PLATE_CUID,
              name: 'Plato de prueba',
              balanceScore: 0.75,
              groupCount: 4,
              astringentCount: 0,
              laxativeCount: 1,
              neutralCount: 3,
              userId: 'user-123',
              babyProfileId: VALID_BABY_PROFILE_CUID,
              createdAt: '2024-06-10T10:00:00.000Z',
              updatedAt: '2024-06-10T10:00:00.000Z',
              items: [
                { id: 'item-1', foodId: 'food-1', groupAssignment: 'FRUIT', food: { name: 'Manzana', alClassification: 'NEUTRAL' } },
                { id: 'item-2', foodId: 'food-2', groupAssignment: 'PROTEIN', food: { name: 'Pollo', alClassification: 'ASTRINGENT' } },
              ],
            },
          },
          {
            id: 'meal-2',
            menuDayId: 'day-0',
            mealType: MealType.DINNER,
            plateId: null,
            notes: null,
            servedAt: null,
            plate: null,
          },
        ],
      },
      {
        id: 'day-1',
        menuId: VALID_MENU_CUID,
        dayOfWeek: 1,
        createdAt: '2024-06-10T10:00:00.000Z',
        meals: [],
      },
    ],
    ...overrides,
  }

  return baseMenu
}

describe('useMenuStore — Serve/Re-serve', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // getServedAt getter
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getServedAt', () => {
    it('returns null when menu is not loaded', () => {
      const store = useMenuStore()

      const servedAt = store.getServedAt('lun', 'comida')
      expect(servedAt).toBeNull()
    })

    it('returns null when meal has not been served', () => {
      const store = useMenuStore()

      // Set up a menu with unserved meal
      setWeekMenu(store, '2024-06-10', createMockMenu({}, { 'lun:comida': null }))
      store.currentWeekStart = '2024-06-10'

      const servedAt = store.getServedAt('lun', 'comida')
      expect(servedAt).toBeNull()
    })

    it('returns ISO timestamp when meal has been served', () => {
      const store = useMenuStore()

      const serveTimestamp = '2024-06-15T12:30:00.000Z'
      setWeekMenu(store, '2024-06-10', createMockMenu({}, { 'lun:comida': serveTimestamp }))
      store.currentWeekStart = '2024-06-10'

      const servedAt = store.getServedAt('lun', 'comida')
      expect(servedAt).toBe(serveTimestamp)
    })

    it('returns null for non-existent day', () => {
      const store = useMenuStore()

      setWeekMenu(store, '2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      // Sunday has no meals in our mock
      const servedAt = store.getServedAt('dom', 'comida')
      expect(servedAt).toBeNull()
    })

    it('returns null for non-existent meal type', () => {
      const store = useMenuStore()

      setWeekMenu(store, '2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      // Breakfast doesn't exist in our mock for Monday
      const servedAt = store.getServedAt('lun', 'desayuno')
      expect(servedAt).toBeNull()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Serve/Re-serve cache updates
  // ─────────────────────────────────────────────────────────────────────────────

  describe('serveMeal', () => {
    it('updates cache with servedAt timestamp on successful serve', async () => {
      const store = useMenuStore()

      // Set up initial menu
      setWeekMenu(store, '2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      // Mock successful API response
      const serveTimestamp = '2024-06-15T12:30:00.000Z'
      apiClient.post.mockResolvedValue({
        data: {
          servedAt: serveTimestamp,
          entriesCount: 2,
        },
      })

      // Call serveMeal
      const result = await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'comida')

      // Verify cache was updated
      expect(result.servedAt).toBe(serveTimestamp)
      expect(store.getServedAt('lun', 'comida')).toBe(serveTimestamp)
    })

    it('includes force flag in API call when re-serving', async () => {
      const store = useMenuStore()

      setWeekMenu(store, '2024-06-10', createMockMenu({}, { 'lun:comida': '2024-06-15T10:00:00.000Z' }))
      store.currentWeekStart = '2024-06-10'

      apiClient.post.mockResolvedValue({
        data: {
          servedAt: '2024-06-15T14:00:00.000Z',
          entriesCount: 2,
          replacedCount: 2,
        },
      })

      await store.reServeMeal(VALID_BABY_PROFILE_CUID, 'lun', 'comida')

      // Verify API was called with force=true
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('force=true'),
        expect.any(Object)
      )
    })

    it('updates timestamp on re-serve', async () => {
      const store = useMenuStore()

      const oldTimestamp = '2024-06-15T10:00:00.000Z'
      const newTimestamp = '2024-06-15T14:00:00.000Z'

      setWeekMenu(store, '2024-06-10', createMockMenu({}, { 'lun:comida': oldTimestamp }))
      store.currentWeekStart = '2024-06-10'

      apiClient.post.mockResolvedValue({
        data: {
          servedAt: newTimestamp,
          entriesCount: 2,
          replacedCount: 2,
        },
      })

      await store.reServeMeal(VALID_BABY_PROFILE_CUID, 'lun', 'comida')

      // Verify timestamp was updated
      expect(store.getServedAt('lun', 'comida')).toBe(newTimestamp)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Optimistic state rollback on error
  // ─────────────────────────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('clears serveLoading on error', async () => {
      const store = useMenuStore()

      setWeekMenu(store, '2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      // Mock API error
      apiClient.post.mockRejectedValue(new Error('Network error'))

      // Verify serveLoading starts empty
      expect(store.isServeLoading('lun', 'comida')).toBe(false)

      // Call serveMeal and catch error
      try {
        await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'comida')
      } catch (e) {
        // Expected error
      }

      // Verify serveLoading was cleared
      expect(store.isServeLoading('lun', 'comida')).toBe(false)
    })

    it('does not update servedAt on API error', async () => {
      const store = useMenuStore()

      setWeekMenu(store, '2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      apiClient.post.mockRejectedValue(new Error('Network error'))

      try {
        await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'comida')
      } catch (e) {
        // Expected error
      }

      // Verify servedAt was not updated
      expect(store.getServedAt('lun', 'comida')).toBeNull()
    })

    it('sets error state on API error', async () => {
      const store = useMenuStore()

      setWeekMenu(store, '2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      apiClient.post.mockRejectedValue(new Error('Network error'))

      try {
        await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'comida')
      } catch (e) {
        // Expected error
      }

      // Verify error was set
      expect(store.error).toContain('Network error')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Served badge transitions
  // ─────────────────────────────────────────────────────────────────────────────

  describe('served badge transitions', () => {
    it('transition: null → timestamp (first serve)', async () => {
      const store = useMenuStore()

      const serveTimestamp = '2024-06-15T12:30:00.000Z'

      // Initial state: not served
      setWeekMenu(store, '2024-06-10', createMockMenu({}, { 'lun:comida': null }))
      store.currentWeekStart = '2024-06-10'
      expect(store.getServedAt('lun', 'comida')).toBeNull()

      apiClient.post.mockResolvedValue({
        data: {
          servedAt: serveTimestamp,
          entriesCount: 2,
        },
      })

      // First serve
      await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'comida')

      // Verify transition to served
      expect(store.getServedAt('lun', 'comida')).toBe(serveTimestamp)
    })

    it('transition: timestamp → new timestamp (re-serve)', async () => {
      const store = useMenuStore()

      const oldTimestamp = '2024-06-15T12:30:00.000Z'
      const newTimestamp = '2024-06-15T14:00:00.000Z'

      // Initial state: already served
      setWeekMenu(store, '2024-06-10', createMockMenu({}, { 'lun:comida': oldTimestamp }))
      store.currentWeekStart = '2024-06-10'
      expect(store.getServedAt('lun', 'comida')).toBe(oldTimestamp)

      apiClient.post.mockResolvedValue({
        data: {
          servedAt: newTimestamp,
          entriesCount: 2,
          replacedCount: 2,
        },
      })

      // Re-serve with force
      await store.reServeMeal(VALID_BABY_PROFILE_CUID, 'lun', 'comida')

      // Verify transition to new timestamp
      expect(store.getServedAt('lun', 'comida')).toBe(newTimestamp)
    })

    it('transition: null → remains null (serve on empty slot fails)', async () => {
      const store = useMenuStore()

      // Create menu with empty dinner slot
      const menuWithEmptySlot = createMockMenu()
      setWeekMenu(store, '2024-06-10', menuWithEmptySlot)
      store.currentWeekStart = '2024-06-10'

      // API returns error for empty slot
      apiClient.post.mockRejectedValue(new Error('EMPTY_PLATE'))

      try {
        await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'cena')
      } catch (e) {
        // Expected error
      }

      // ServedAt should still be null
      expect(store.getServedAt('lun', 'cena')).toBeNull()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // isServeLoading
  // ─────────────────────────────────────────────────────────────────────────────

  describe('isServeLoading', () => {
    it('returns false when not serving', () => {
      const store = useMenuStore()

      expect(store.isServeLoading('lun', 'comida')).toBe(false)
    })

    it('returns true while serving is in progress', async () => {
      const store = useMenuStore()

      setWeekMenu(store, '2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      // Create a promise that won't resolve immediately
      let resolveApi: (value: ServeMealResponse) => void
      const apiPromise = new Promise<ServeMealResponse>((resolve) => {
        resolveApi = resolve
      })
      apiClient.post.mockReturnValue(apiPromise)

      // Start serving (don't await)
      const servePromise = store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'comida')

      // Check loading is true while in progress
      expect(store.isServeLoading('lun', 'comida')).toBe(true)

      // Resolve the API call (apiClient.post returns { data: ServeMealResponse })
      resolveApi!({
        data: {
          servedAt: '2024-06-15T12:30:00.000Z',
          entriesCount: 2,
        },
      })

      // Wait for serve to complete
      await servePromise

      // Check loading is false after completion
      expect(store.isServeLoading('lun', 'comida')).toBe(false)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Snack slots — separate snackMap + assignSnack/removeSnack (PR-1b)
// ─────────────────────────────────────────────────────────────────────────────

function createMockSnack(overrides: Partial<Snack> = {}): Snack {
  return {
    id: VALID_SNACK_CUID,
    userId: 'user-123',
    babyProfileId: VALID_BABY_PROFILE_CUID,
    name: 'Colación de prueba',
    stageFor: null,
    createdAt: '2024-06-10T10:00:00.000Z',
    updatedAt: '2024-06-10T10:00:00.000Z',
    deletedAt: null,
    items: [],
    ...overrides,
  }
}

/**
 * Build a menu that has a plate on LUNCH (main meal) and a snack on SNACK_1.
 * Used to prove snacks live in snackMap and never leak into menuMap.
 */
function createMenuWithSnack(): WeeklyMenuResponse {
  return {
    id: VALID_MENU_CUID,
    userId: 'user-123',
    babyProfileId: VALID_BABY_PROFILE_CUID,
    weekStart: '2024-06-10',
    balanceScore: 0.75,
    createdAt: '2024-06-10T10:00:00.000Z',
    updatedAt: '2024-06-10T10:00:00.000Z',
    days: [
      {
        id: 'day-0',
        menuId: VALID_MENU_CUID,
        dayOfWeek: 0,
        createdAt: '2024-06-10T10:00:00.000Z',
        meals: [
          {
            id: 'meal-lunch',
            menuDayId: 'day-0',
            mealType: MealType.LUNCH,
            plateId: VALID_PLATE_CUID,
            snackId: null,
            notes: null,
            servedAt: null,
            plate: {
              id: VALID_PLATE_CUID,
              name: 'Plato de comida',
              balanceScore: 0.75,
              groupCount: 4,
              astringentCount: 0,
              laxativeCount: 0,
              neutralCount: 0,
              userId: 'user-123',
              babyProfileId: VALID_BABY_PROFILE_CUID,
              createdAt: '2024-06-10T10:00:00.000Z',
              updatedAt: '2024-06-10T10:00:00.000Z',
              items: [],
            },
            snack: null,
          },
          {
            id: 'meal-snack1',
            menuDayId: 'day-0',
            mealType: MealType.SNACK_1,
            plateId: null,
            snackId: VALID_SNACK_CUID,
            notes: null,
            servedAt: null,
            plate: null,
            snack: createMockSnack(),
          },
        ],
      },
    ],
  }
}

describe('useMenuStore — Snack slots', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('snackMap', () => {
    it('populates from meal.snack for snack slots', () => {
      const store = useMenuStore()
      setWeekMenu(store, '2024-06-10', createMenuWithSnack())
      store.currentWeekStart = '2024-06-10'

      expect(store.snackMap['lun:snack1']?.id).toBe(VALID_SNACK_CUID)
    })

    it('getSnack returns the assigned snack for a slot', () => {
      const store = useMenuStore()
      setWeekMenu(store, '2024-06-10', createMenuWithSnack())
      store.currentWeekStart = '2024-06-10'

      expect(store.getSnack('lun', 'snack1')?.name).toBe('Colación de prueba')
      expect(store.getSnack('lun', 'snack2')).toBeNull()
    })
  })

  describe('menuMap isolation', () => {
    it('contains only the 3 main meals — snack slots are absent', () => {
      const store = useMenuStore()
      setWeekMenu(store, '2024-06-10', createMenuWithSnack())
      store.currentWeekStart = '2024-06-10'

      const keys = Object.keys(store.menuMap)
      // 7 days * 3 main meals = 21 keys, no snack keys
      expect(keys).toHaveLength(21)
      expect(keys.some(k => k.includes('snack1') || k.includes('snack2'))).toBe(false)
      // The snack must NOT leak into menuMap as a plate
      expect(store.menuMap['lun:snack1' as keyof typeof store.menuMap]).toBeUndefined()
    })

    it('keeps the plate on the LUNCH main-meal slot', () => {
      const store = useMenuStore()
      setWeekMenu(store, '2024-06-10', createMenuWithSnack())
      store.currentWeekStart = '2024-06-10'

      expect(store.menuMap['lun:comida']?.id).toBe(VALID_PLATE_CUID)
    })
  })

  describe('assignSnack', () => {
    it('optimistically sets snackId and clears plate locally, then PATCHes snackId', async () => {
      const store = useMenuStore()
      setWeekMenu(store, '2024-06-10', createMenuWithSnack())
      store.currentWeekStart = '2024-06-10'

      apiClient.patch.mockResolvedValue({})

      const newSnack = createMockSnack({ id: VALID_SNACK_CUID, name: 'Nueva colación' })
      // Assign to SNACK_2 which was empty
      await store.assignSnack(VALID_BABY_PROFILE_CUID, '2024-06-10', 'lun', 'snack2', newSnack)

      // Local state updated
      expect(store.getSnack('lun', 'snack2')?.id).toBe(VALID_SNACK_CUID)

      // PATCH sent with snackId (and plateId cleared)
      const [, body] = apiClient.patch.mock.calls[0]
      expect(body.snackId).toBe(VALID_SNACK_CUID)
      expect(body.plateId).toBeNull()
      expect(body.mealType).toBe(MealType.SNACK_2)
    })

    it('rolls back local state on API error', async () => {
      const store = useMenuStore()
      setWeekMenu(store, '2024-06-10', createMenuWithSnack())
      store.currentWeekStart = '2024-06-10'

      apiClient.patch.mockRejectedValue(new Error('Network error'))

      const newSnack = createMockSnack({ name: 'Fallará' })
      try {
        await store.assignSnack(VALID_BABY_PROFILE_CUID, '2024-06-10', 'lun', 'snack2', newSnack)
      } catch (e) {
        // expected
      }

      // SNACK_2 stays empty after rollback
      expect(store.getSnack('lun', 'snack2')).toBeNull()
    })
  })

  describe('removeSnack', () => {
    it('clears the snack locally and PATCHes snackId: null', async () => {
      const store = useMenuStore()
      setWeekMenu(store, '2024-06-10', createMenuWithSnack())
      store.currentWeekStart = '2024-06-10'

      apiClient.patch.mockResolvedValue({})

      await store.removeSnack(VALID_BABY_PROFILE_CUID, '2024-06-10', 'lun', 'snack1')

      expect(store.getSnack('lun', 'snack1')).toBeNull()

      const [, body] = apiClient.patch.mock.calls[0]
      expect(body.snackId).toBeNull()
      expect(body.mealType).toBe(MealType.SNACK_1)
    })
  })
})
