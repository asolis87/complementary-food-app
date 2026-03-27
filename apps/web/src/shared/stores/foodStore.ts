/**
 * Food catalog Pinia store.
 * Online-first with offline fallback: always hits the API when online,
 * falls back to IndexedDB only when genuinely offline or network fails.
 * Design: AD4, AD7
 *
 * NOTE: The API uses offset-based pagination (page + limit), NOT cursor-based.
 * Response shape: { data: Food[], total: number, page: number, limit: number }
 */

import type { Food, FoodGroup, ALClassification } from '@cfa/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient, OfflineError } from '../api/client.js'
import {
  cacheFoods,
  getCachedFoods,
} from '../services/offlineStorage.js'

export interface FoodFilter {
  q?: string
  group?: FoodGroup
  alClassification?: ALClassification
  ageMonths?: number
}

/** API response shape for the /foods endpoint (offset pagination) */
interface FoodsApiResponse {
  data: Food[]
  total: number
  page: number
  limit: number
}

export const useFoodStore = defineStore('foods', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const foods = ref<Food[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const totalCount = ref(0)
  const pageLimit = ref(50)
  const hasMore = ref(false)
  /** True when foods were loaded from IndexedDB (offline or stale API) */
  const isUsingCache = ref(false)

  /** Active client-side filters */
  const filters = ref<{
    group: FoodGroup | null
    alClassification: ALClassification | null
    search: string
    ageMonths: number | null
  }>({
    group: null,
    alClassification: null,
    search: '',
    ageMonths: null,
  })

  // ─── Getters ────────────────────────────────────────────────────────────────

  /** Foods filtered by current filter state (client-side, works offline) */
  const filteredFoods = computed(() => {
    return foods.value.filter((food) => {
      if (filters.value.group && food.group !== filters.value.group) return false
      if (filters.value.alClassification && food.alClassification !== filters.value.alClassification)
        return false
      if (
        filters.value.search &&
        !food.name.toLowerCase().includes(filters.value.search.toLowerCase())
      )
        return false
      if (filters.value.ageMonths !== null && food.ageMonths > filters.value.ageMonths) return false
      return true
    })
  })

  /** Foods organised by food group */
  const foodsByGroup = computed(() => {
    const groups = {} as Record<FoodGroup, Food[]>
    for (const food of foods.value) {
      if (!groups[food.group]) groups[food.group] = []
      groups[food.group].push(food)
    }
    return groups
  })

  /** Foods that are known allergens */
  const allergenFoods = computed(() => foods.value.filter((f) => f.isAllergen))

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Load all foods — online-first strategy:
   * 1. Always try to fetch from API when online
   * 2. While waiting for API (first page, no filters), serve cached data in background
   * 3. If API call fails (offline / network error) → fall back to IndexedDB cache
   * 4. If offline and no cache → show error
   *
   * When `page` > 1, always goes to API (appends to list).
   */
  async function fetchFoods(filter: FoodFilter = {}, page = 1) {
    loading.value = true
    error.value = null

    try {
      // ── Step 1: serve from cache in background (only for first page, no filters) ──
      // This is purely a UX optimisation — it does NOT skip the API call.
      // isUsingCache stays false here because we are about to hit the API.
      if (page === 1) {
        const cached = await getCachedFoods()
        if (cached.length > 0) {
          foods.value = cached
          // Do NOT set isUsingCache=true here — we are going online next
          loading.value = false // Show cached data immediately while API loads
        }
      }

      const params = new URLSearchParams()
      if (filter.q) params.set('q', filter.q)
      if (filter.group) params.set('group', filter.group)
      if (filter.alClassification) params.set('alClassification', filter.alClassification)
      if (filter.ageMonths !== undefined) params.set('ageMonths', String(filter.ageMonths))
      params.set('page', String(page))
      params.set('limit', String(pageLimit.value))

      const result = await apiClient.get<FoodsApiResponse>(
        `/foods?${params.toString()}`,
      )

      if (page > 1) {
        // Append to existing list (load-more)
        foods.value = [...foods.value, ...result.data]
      } else {
        foods.value = result.data
        // Only cache the full catalog (no filters applied)
        const isUnfiltered = !filter.q && !filter.group && !filter.alClassification && filter.ageMonths === undefined
        if (isUnfiltered) {
          await cacheFoods(result.data)
        }
      }

      currentPage.value = result.page
      totalCount.value = result.total
      hasMore.value = result.page * result.limit < result.total
      isUsingCache.value = false
    } catch (err) {
      if (err instanceof OfflineError) {
        // We're offline — use whatever is in cache (may already be set above)
        if (foods.value.length === 0) {
          error.value = 'Sin conexión. Conectate a internet para cargar el catálogo.'
        }
        // Otherwise we already served cached data — no error shown
        isUsingCache.value = true
      } else {
        error.value = err instanceof Error ? err.message : 'Error al cargar alimentos'
      }
    } finally {
      loading.value = false
    }
  }

  /** Convenience alias — searches via the dedicated endpoint */
  async function searchFoods(query: string) {
    return fetchFoods({ q: query })
  }

  /** Find food locally first; fetch from API if not cached */
  async function getFoodById(id: string): Promise<Food | null> {
    const local = foods.value.find((f) => f.id === id)
    if (local) return local

    try {
      const result = await apiClient.get<{ data: Food }>(`/foods/${id}`)
      return result.data
    } catch {
      return null
    }
  }

  /**
   * Update a single filter key and trigger an API fetch so the server
   * applies the filter (important when we don't have the full catalog
   * in memory, e.g. with pagination or a fresh load).
   */
  function setFilter<K extends keyof typeof filters.value>(
    key: K,
    value: (typeof filters.value)[K],
  ) {
    filters.value[key] = value
    // Re-fetch from API with the full current filter state so server-side
    // filtering is applied (client-side filtering only covers loaded pages).
    const currentFilters: FoodFilter = {}
    if (filters.value.search) currentFilters.q = filters.value.search
    if (filters.value.group) currentFilters.group = filters.value.group
    if (filters.value.alClassification) currentFilters.alClassification = filters.value.alClassification
    if (filters.value.ageMonths !== null) currentFilters.ageMonths = filters.value.ageMonths
    fetchFoods(currentFilters, 1)
  }

  /** Reset all filters to their default empty state and reload the full catalog */
  function clearFilters() {
    filters.value = {
      group: null,
      alClassification: null,
      search: '',
      ageMonths: null,
    }
    fetchFoods({}, 1)
  }

  function reset() {
    foods.value = []
    currentPage.value = 1
    totalCount.value = 0
    hasMore.value = false
    error.value = null
    isUsingCache.value = false
    clearFilters()
  }

  return {
    // State
    foods,
    loading,
    error,
    currentPage,
    totalCount,
    pageLimit,
    hasMore,
    filters,
    isUsingCache,
    // Getters
    filteredFoods,
    foodsByGroup,
    allergenFoods,
    // Actions
    fetchFoods,
    searchFoods,
    getFoodById,
    setFilter,
    clearFilters,
    reset,
  }
})
