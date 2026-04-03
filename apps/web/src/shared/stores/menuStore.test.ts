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
import type { WeeklyMenuResponse, ServeMealResponse } from '@pakulab/shared'

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
            servedAt: servedAtMap['lun:almuerzo'] ?? null,
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
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const store = useMenuStore()

      const servedAt = store.getServedAt('lun', 'almuerzo')
      expect(servedAt).toBeNull()
    })

    it('returns null when meal has not been served', () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const store = useMenuStore()

      // Set up a menu with unserved meal
      store.weekMenus.set('2024-06-10', createMockMenu({}, { 'lun:almuerzo': null }))
      store.currentWeekStart = '2024-06-10'

      const servedAt = store.getServedAt('lun', 'almuerzo')
      expect(servedAt).toBeNull()
    })

    it('returns ISO timestamp when meal has been served', () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const store = useMenuStore()

      const serveTimestamp = '2024-06-15T12:30:00.000Z'
      store.weekMenus.set('2024-06-10', createMockMenu({}, { 'lun:almuerzo': serveTimestamp }))
      store.currentWeekStart = '2024-06-10'

      const servedAt = store.getServedAt('lun', 'almuerzo')
      expect(servedAt).toBe(serveTimestamp)
    })

    it('returns null for non-existent day', () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const store = useMenuStore()

      store.weekMenus.set('2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      // Sunday has no meals in our mock
      const servedAt = store.getServedAt('dom', 'almuerzo')
      expect(servedAt).toBeNull()
    })

    it('returns null for non-existent meal type', () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const store = useMenuStore()

      store.weekMenus.set('2024-06-10', createMockMenu())
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
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      // Set up initial menu
      store.weekMenus.set('2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      // Mock successful API response
      const serveTimestamp = '2024-06-15T12:30:00.000Z'
      apiClient.post.mockResolvedValue({
        servedAt: serveTimestamp,
        entriesCount: 2,
      })

      // Call serveMeal
      const result = await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'almuerzo')

      // Verify cache was updated
      expect(result.servedAt).toBe(serveTimestamp)
      expect(store.getServedAt('lun', 'almuerzo')).toBe(serveTimestamp)
    })

    it('includes force flag in API call when re-serving', async () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      store.weekMenus.set('2024-06-10', createMockMenu({}, { 'lun:almuerzo': '2024-06-15T10:00:00.000Z' }))
      store.currentWeekStart = '2024-06-10'

      apiClient.post.mockResolvedValue({
        servedAt: '2024-06-15T14:00:00.000Z',
        entriesCount: 2,
        replacedCount: 2,
      })

      await store.reServeMeal(VALID_BABY_PROFILE_CUID, 'lun', 'almuerzo')

      // Verify API was called with force=true
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('force=true'),
        expect.any(Object)
      )
    })

    it('updates timestamp on re-serve', async () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      const oldTimestamp = '2024-06-15T10:00:00.000Z'
      const newTimestamp = '2024-06-15T14:00:00.000Z'

      store.weekMenus.set('2024-06-10', createMockMenu({}, { 'lun:almuerzo': oldTimestamp }))
      store.currentWeekStart = '2024-06-10'

      apiClient.post.mockResolvedValue({
        servedAt: newTimestamp,
        entriesCount: 2,
        replacedCount: 2,
      })

      await store.reServeMeal(VALID_BABY_PROFILE_CUID, 'lun', 'almuerzo')

      // Verify timestamp was updated
      expect(store.getServedAt('lun', 'almuerzo')).toBe(newTimestamp)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Optimistic state rollback on error
  // ─────────────────────────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('clears serveLoading on error', async () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      store.weekMenus.set('2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      // Mock API error
      apiClient.post.mockRejectedValue(new Error('Network error'))

      // Verify serveLoading starts empty
      expect(store.isServeLoading('lun', 'almuerzo')).toBe(false)

      // Call serveMeal and catch error
      try {
        await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'almuerzo')
      } catch (e) {
        // Expected error
      }

      // Verify serveLoading was cleared
      expect(store.isServeLoading('lun', 'almuerzo')).toBe(false)
    })

    it('does not update servedAt on API error', async () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      store.weekMenus.set('2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      apiClient.post.mockRejectedValue(new Error('Network error'))

      try {
        await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'almuerzo')
      } catch (e) {
        // Expected error
      }

      // Verify servedAt was not updated
      expect(store.getServedAt('lun', 'almuerzo')).toBeNull()
    })

    it('sets error state on API error', async () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      store.weekMenus.set('2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      apiClient.post.mockRejectedValue(new Error('Network error'))

      try {
        await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'almuerzo')
      } catch (e) {
        // Expected error
      }

      // Verify error was set
      expect(store.error).toContain('Error')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Served badge transitions
  // ─────────────────────────────────────────────────────────────────────────────

  describe('served badge transitions', () => {
    it('transition: null → timestamp (first serve)', async () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      const serveTimestamp = '2024-06-15T12:30:00.000Z'

      // Initial state: not served
      store.weekMenus.set('2024-06-10', createMockMenu({}, { 'lun:almuerzo': null }))
      store.currentWeekStart = '2024-06-10'
      expect(store.getServedAt('lun', 'almuerzo')).toBeNull()

      apiClient.post.mockResolvedValue({
        servedAt: serveTimestamp,
        entriesCount: 2,
      })

      // First serve
      await store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'almuerzo')

      // Verify transition to served
      expect(store.getServedAt('lun', 'almuerzo')).toBe(serveTimestamp)
    })

    it('transition: timestamp → new timestamp (re-serve)', async () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      const oldTimestamp = '2024-06-15T12:30:00.000Z'
      const newTimestamp = '2024-06-15T14:00:00.000Z'

      // Initial state: already served
      store.weekMenus.set('2024-06-10', createMockMenu({}, { 'lun:almuerzo': oldTimestamp }))
      store.currentWeekStart = '2024-06-10'
      expect(store.getServedAt('lun', 'almuerzo')).toBe(oldTimestamp)

      apiClient.post.mockResolvedValue({
        servedAt: newTimestamp,
        entriesCount: 2,
        replacedCount: 2,
      })

      // Re-serve with force
      await store.reServeMeal(VALID_BABY_PROFILE_CUID, 'lun', 'almuerzo')

      // Verify transition to new timestamp
      expect(store.getServedAt('lun', 'almuerzo')).toBe(newTimestamp)
    })

    it('transition: null → remains null (serve on empty slot fails)', async () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      // Create menu with empty dinner slot
      const menuWithEmptySlot = createMockMenu()
      store.weekMenus.set('2024-06-10', menuWithEmptySlot)
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
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const store = useMenuStore()

      expect(store.isServeLoading('lun', 'almuerzo')).toBe(false)
    })

    it('returns true while serving is in progress', async () => {
      const { useMenuStore } = require('@/shared/stores/menuStore.js')
      const { apiClient } = require('@/shared/api/client.js')
      const store = useMenuStore()

      store.weekMenus.set('2024-06-10', createMockMenu())
      store.currentWeekStart = '2024-06-10'

      // Create a promise that won't resolve immediately
      let resolveApi: (value: ServeMealResponse) => void
      const apiPromise = new Promise<ServeMealResponse>((resolve) => {
        resolveApi = resolve
      })
      apiClient.post.mockReturnValue(apiPromise)

      // Start serving (don't await)
      const servePromise = store.serveMeal(VALID_BABY_PROFILE_CUID, 'lun', 'almuerzo')

      // Check loading is true while in progress
      expect(store.isServeLoading('lun', 'almuerzo')).toBe(true)

      // Resolve the API call
      resolveApi!({
        servedAt: '2024-06-15T12:30:00.000Z',
        entriesCount: 2,
      })

      // Wait for serve to complete
      await servePromise

      // Check loading is false after completion
      expect(store.isServeLoading('lun', 'almuerzo')).toBe(false)
    })
  })
})
