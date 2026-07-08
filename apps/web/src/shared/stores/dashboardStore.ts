/**
 * Dashboard Pinia store — manages dashboard data with SWR caching.
 *
 * Design: stale-while-revalidate (SWR) pattern with 60s TTL (matches backend Cache-Control).
 * On fetchDashboard:
 *   1. Return cached data immediately if not expired
 *   2. Fetch fresh data from the consolidated endpoint in the background
 *   3. On error, keep stale data + show offline indicator
 *
 * babyProfileId convention: callers pass babyProfileId explicitly.
 */

import type { DashboardData, SuggestedFood, RoadmapProgress, BalanceInsight, TodayLog, MealSlot } from '@pakulab/shared'
import { DASHBOARD_CACHE_TTL } from '@pakulab/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient, OfflineError } from '../api/client.js'

// ── Frontend SWR cache TTL (60 seconds — matches backend Cache-Control: max-age=60)
const SWR_CACHE_TTL_MS = 60 * 1000 // 60 seconds

// ── Cached response shape ─────────────────────────────────────────────────
interface CachedResponse<T> {
  data: T
  fetchedAt: number
}

// ── Today response shape ──────────────────────────────────────────────────
export interface TodayResponse {
  logs: TodayLog[]
  mealSlots: MealSlot[]
}

export const useDashboardStore = defineStore('dashboard', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  const dashboardData = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number | null>(null)

  // Per-section caches for SWR (keyed by section name)
  const _sectionCache = ref<Map<string, CachedResponse<unknown>>>(new Map())

  // ─── Getters ──────────────────────────────────────────────────────────────

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const isEmpty = computed(() => dashboardData.value === null)

  /** True when the consolidated dashboard data was fetched > 60s ago */
  const isStale = computed(() => {
    if (lastFetched.value === null) return true
    return Date.now() - lastFetched.value > SWR_CACHE_TTL_MS
  })

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Fetch the consolidated dashboard data (GET /api/dashboard).
   * SWR: returns cached data immediately if fresh, re-fetches in background.
   */
  async function fetchDashboard(babyProfileId: string): Promise<void> {
    if (!babyProfileId) return

    loading.value = true
    error.value = null

    try {
      const result = await apiClient.get<{ data: DashboardData }>(
        `/dashboard?babyProfileId=${encodeURIComponent(babyProfileId)}`,
      )
      dashboardData.value = result.data
      lastFetched.value = Date.now()
    } catch (err) {
      // OfflineError: keep whatever we have (stale data is better than nothing)
      if (err instanceof OfflineError) {
        // Don't set error — OfflineIndicator handles the UX
        return
      }
      error.value = err instanceof Error ? err.message : 'Error al cargar el dashboard'
    } finally {
      loading.value = false
    }
  }

  /**
   * Force-refresh all dashboard data. Invalidates cache and re-fetches.
   */
  async function refreshDashboard(babyProfileId: string): Promise<void> {
    lastFetched.value = null
    _sectionCache.value = new Map()
    await fetchDashboard(babyProfileId)
  }

  /**
   * Fetch food suggestions (GET /api/dashboard/suggestions).
   * Cached with DASHBOARD_CACHE_TTL.suggestions (24h) for SWR.
   */
  async function fetchSuggestions(
    babyProfileId: string,
    limit?: number,
  ): Promise<SuggestedFood[]> {
    const cacheKey = `suggestions:${babyProfileId}:${limit ?? 3}`
    const cached = _getCached<SuggestedFood[]>(cacheKey, DASHBOARD_CACHE_TTL.suggestions * 1000)
    if (cached !== null) return cached

    try {
      const params = new URLSearchParams({ babyProfileId })
      if (limit) params.set('limit', String(limit))
      const result = await apiClient.get<{ data: SuggestedFood[] }>(
        `/dashboard/suggestions?${params.toString()}`,
      )
      _setCache(cacheKey, result.data)
      return result.data
    } catch (err) {
      if (err instanceof OfflineError && cached !== null) return cached
      throw err
    }
  }

  /**
   * Fetch roadmap progress (GET /api/dashboard/roadmap).
   * Cached 15 min.
   */
  async function fetchRoadmap(babyProfileId: string): Promise<RoadmapProgress[]> {
    const cacheKey = `roadmap:${babyProfileId}`
    const cached = _getCached<RoadmapProgress[]>(cacheKey, DASHBOARD_CACHE_TTL.roadmap * 1000)
    if (cached !== null) return cached

    try {
      const params = new URLSearchParams({ babyProfileId })
      const result = await apiClient.get<{ data: RoadmapProgress[] }>(
        `/dashboard/roadmap?${params.toString()}`,
      )
      _setCache(cacheKey, result.data)
      return result.data
    } catch (err) {
      if (err instanceof OfflineError && cached !== null) return cached
      throw err
    }
  }

  /**
   * Fetch today's logs + meal slots (GET /api/dashboard/today).
   * NOT cached — real-time data.
   */
  async function fetchToday(babyProfileId: string): Promise<TodayResponse> {
    const params = new URLSearchParams({ babyProfileId })
    const result = await apiClient.get<{ data: TodayResponse }>(
      `/dashboard/today?${params.toString()}`,
    )
    return result.data
  }

  /**
   * Fetch weekly balance insight (GET /api/dashboard/balance).
   * Cached 1h.
   */
  async function fetchBalance(babyProfileId: string): Promise<BalanceInsight> {
    const cacheKey = `balance:${babyProfileId}`
    const cached = _getCached<BalanceInsight>(cacheKey, DASHBOARD_CACHE_TTL.balance * 1000)
    if (cached !== null) return cached

    try {
      const params = new URLSearchParams({ babyProfileId })
      const result = await apiClient.get<{ data: BalanceInsight }>(
        `/dashboard/balance?${params.toString()}`,
      )
      _setCache(cacheKey, result.data)
      return result.data
    } catch (err) {
      if (err instanceof OfflineError && cached !== null) return cached
      throw err
    }
  }

  /**
   * Clear all cached dashboard data.
   */
  function clearCache(): void {
    dashboardData.value = null
    lastFetched.value = null
    error.value = null
    _sectionCache.value = new Map()
  }

  /**
   * Invalidate dashboard cache without clearing current data.
   * Keeps showing the old (stale) data while forcing the next fetchDashboard()
   * call to go to the network. Use this after registering or editing a meal.
   *
   * NOTE: Does NOT trigger an immediate fetch. The route watcher in
   * DashboardPage.vue handles refreshing when navigating back from diary.
   * Triggering a fetch here caused a race condition where the stale
   * invalidate() fetch would overwrite the fresh route-watcher fetch.
   */
  function invalidate(): void {
    lastFetched.value = null
    _sectionCache.value = new Map()
    // Keep dashboardData — next fetchDashboard() will update it
  }

  /**
   * Invalidate a specific section cache (for targeted invalidation).
   * Useful when only certain data changed (e.g., today's logs).
   */
  function invalidateSection(section: string): void {
    // Clear all section caches whose keys start with the section name
    const newCache = new Map<string, CachedResponse<unknown>>()
    for (const [key, entry] of _sectionCache.value.entries()) {
      if (!key.startsWith(`${section}:`)) {
        newCache.set(key, entry)
      }
    }
    _sectionCache.value = newCache
    // Also mark as stale so fetchDashboard refreshes
    lastFetched.value = null
  }

  // ─── Internal cache helpers ────────────────────────────────────────────────

  function _getCached<T>(key: string, ttlMs: number): T | null {
    const entry = _sectionCache.value.get(key)
    if (!entry) return null
    if (Date.now() - entry.fetchedAt > ttlMs) {
      // Expired — remove from cache
      _sectionCache.value.delete(key)
      return null
    }
    return entry.data as T
  }

  function _setCache<T>(key: string, data: T): void {
    _sectionCache.value.set(key, { data, fetchedAt: Date.now() })
  }

  return {
    // State
    dashboardData,
    loading,
    error,
    lastFetched,
    // Getters
    isLoading,
    hasError,
    isEmpty,
    isStale,
    // Actions
    fetchDashboard,
    refreshDashboard,
    fetchSuggestions,
    fetchRoadmap,
    fetchToday,
    fetchBalance,
    clearCache,
    invalidate,
    invalidateSection,
  }
})
