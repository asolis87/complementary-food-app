/**
 * Food History Pinia store.
 * Session-level cache for food offering history by baby profile.
 * Design: AD-2 — composite key `${babyProfileId}:${foodId}` in a Map.
 */

import type { FoodHistory } from '@pakulab/shared'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../api/client.js'

/** API response shape for GET /diary/food-history */
interface FoodHistoryApiResponse {
  data: Record<string, FoodHistory>
}

export const useFoodHistoryStore = defineStore('foodHistory', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  /**
   * Session-level cache.
   * Key: `${babyProfileId}:${foodId}` → FoodHistory
   * Never invalidated during session — re-opening the same group modal
   * always hits the cache (AC: A13).
   */
  const history = ref(new Map<string, FoodHistory>())
  const historyLoading = ref(false)
  const error = ref<string | null>(null)

  // ─── Getters ──────────────────────────────────────────────────────────────

  /**
   * Look up cached history for a specific baby profile + food combination.
   * Returns undefined when not yet cached (graceful degradation).
   */
  function historyForFood(babyProfileId: string, foodId: string): FoodHistory | undefined {
    if (!babyProfileId || !foodId) return undefined
    return history.value.get(`${babyProfileId}:${foodId}`)
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Fetch food history for a list of foods for a given baby profile.
   * - Skips foodIds already cached for this babyProfileId (AD-2).
   * - If all foodIds are already cached, skips the API call entirely.
   * - Merges new results into the cache Map.
   */
  async function fetchForFoods(babyProfileId: string, foodIds: string[]): Promise<void> {
    // Guard: no profile or empty list — never call API (AC: A6)
    if (!babyProfileId || foodIds.length === 0) return

    // Filter out already-cached foodIds (session cache, AD-2)
    const uncachedIds = foodIds.filter((id) => !history.value.has(`${babyProfileId}:${id}`))

    // All already cached — skip API call (AC: A13)
    if (uncachedIds.length === 0) return

    historyLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        babyProfileId,
        foodIds: uncachedIds.join(','),
      })

      const result = await apiClient.get<FoodHistoryApiResponse>(
        `/diary/food-history?${params.toString()}`,
      )

      // Merge results into cache Map
      for (const [foodId, foodHistory] of Object.entries(result.data)) {
        history.value.set(`${babyProfileId}:${foodId}`, foodHistory)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar historial'
    } finally {
      historyLoading.value = false
    }
  }

  return {
    // State
    history,
    historyLoading,
    error,
    // Getters
    historyForFood,
    // Actions
    fetchForFoods,
  }
})
