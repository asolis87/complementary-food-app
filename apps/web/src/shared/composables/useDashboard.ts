/**
 * useDashboard — main dashboard composable.
 *
 * Provides reactive access to:
 *   - useDashboardData() — dashboard state (data, loading, error)
 *   - useDashboardActions() — refresh, clear, per-section fetchers
 *
 * All data flows through the dashboardStore (Pinia).
 */

import { computed } from 'vue'
import { useDashboardStore } from '@/shared/stores/dashboardStore.js'
import type { TodayResponse } from '@/shared/stores/dashboardStore.js'

/**
 * Reactive dashboard data + status (read-only).
 * Returns the full dashboard state for binding in components.
 */
export function useDashboardData() {
  const store = useDashboardStore()

  return {
    /** The consolidated dashboard data (null until fetched) */
    dashboardData: computed(() => store.dashboardData),
    /** True while any dashboard fetch is in progress */
    loading: computed(() => store.loading),
    /** Error message, or null */
    error: computed(() => store.error),
    /** Unix ms timestamp of the last successful fetch */
    lastFetched: computed(() => store.lastFetched),
    /** True when there's an error */
    hasError: computed(() => store.hasError),
    /** True when no data has been fetched yet */
    isEmpty: computed(() => store.isEmpty),
    /** True when the cached data is older than 60 seconds */
    isStale: computed(() => store.isStale),
  }
}

/**
 * Dashboard actions (write operations).
 */
export function useDashboardActions() {
  const store = useDashboardStore()

  return {
    /** Fetch (or re-fetch) the consolidated dashboard data */
    fetchDashboard: (babyProfileId: string) => store.fetchDashboard(babyProfileId),
    /** Force refresh — clears cache and re-fetches */
    refreshDashboard: (babyProfileId: string) => store.refreshDashboard(babyProfileId),
    /** Clear all cached dashboard state */
    clearCache: () => store.clearCache(),
    /** Invalidate cache without clearing current data (forces refetch on next visit) */
    invalidate: () => store.invalidate(),
    /** Invalidate a specific section cache */
    invalidateSection: (section: string) => store.invalidateSection(section),
    /** Fetch food suggestions (cached 24h) */
    fetchSuggestions: (babyProfileId: string, limit?: number) =>
      store.fetchSuggestions(babyProfileId, limit),
    /** Fetch roadmap progress (cached 15min) */
    fetchRoadmap: (babyProfileId: string) => store.fetchRoadmap(babyProfileId),
    /** Fetch today's logs + slots (no cache) */
    fetchToday: (babyProfileId: string) => store.fetchToday(babyProfileId),
    /** Fetch weekly balance insight (cached 1h) */
    fetchBalance: (babyProfileId: string) => store.fetchBalance(babyProfileId),
  }
}

/**
 * Convenience: returns data AND actions in a single composable.
 * Most components should use useDashboardData() + useDashboardActions() separately.
 */
export function useDashboard() {
  return {
    ...useDashboardData(),
    ...useDashboardActions(),
  }
}
