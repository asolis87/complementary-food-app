/**
 * Snack Pinia store.
 * Manages the list of saved snacks (Colaciones) for the menu snack picker.
 * Mirrors plateStore's fetch pattern and API envelope handling.
 * Snacks have NO balance scoring (unlike Plates).
 */

import type { Snack, PlateStage } from '@pakulab/shared'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../api/client.js'

export const useSnackStore = defineStore('snacks', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  /** Saved snacks (from API) */
  const savedSnacks = ref<Snack[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const SNACKS_PER_PAGE = 20

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Paginated response shape from GET /snacks (mirrors GET /plates). */
  interface PaginatedSnacksResponse {
    data: Snack[]
    total: number
    page: number
    limit: number
  }

  /**
   * Fetch the first page of saved snacks.
   * @param stageFor - Optional stage filter (omit for all snacks)
   */
  async function fetchSavedSnacks(stageFor?: PlateStage) {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams({ page: '1', limit: String(SNACKS_PER_PAGE) })
      if (stageFor) {
        params.set('stageFor', stageFor)
      }
      const result = await apiClient.get<PaginatedSnacksResponse>(`/snacks?${params}`)
      savedSnacks.value = result.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar colaciones'
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    savedSnacks,
    loading,
    error,
    // Actions
    fetchSavedSnacks,
  }
})
