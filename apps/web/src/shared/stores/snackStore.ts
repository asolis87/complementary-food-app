/**
 * Snack Pinia store.
 * Manages the list of saved snacks (Colaciones) for the menu snack picker.
 * Mirrors plateStore's fetch pattern and API envelope handling.
 * Snacks have NO balance scoring (unlike Plates).
 */

import type { Snack, PlateStage, CreateSnackInput } from '@pakulab/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient } from '../api/client.js'

export const useSnackStore = defineStore('snacks', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  /** Saved snacks (from API) */
  const savedSnacks = ref<Snack[]>([])
  const loading = ref(false)
  const fetchMoreLoading = ref(false)
  const error = ref<string | null>(null)

  /** Pagination state */
  const currentPage = ref(1)
  const totalSnacks = ref(0)
  const SNACKS_PER_PAGE = 20

  // ─── Getters ──────────────────────────────────────────────────────────────

  /** True when there are more pages of snacks to fetch */
  const hasMore = computed(() => savedSnacks.value.length < totalSnacks.value)

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
      totalSnacks.value = result.total
      currentPage.value = result.page
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar colaciones'
    } finally {
      loading.value = false
    }
  }

  /** Fetch the next page and append results to the existing list. */
  async function fetchMoreSnacks() {
    if (!hasMore.value || fetchMoreLoading.value) return
    fetchMoreLoading.value = true
    error.value = null
    try {
      const nextPage = currentPage.value + 1
      const result = await apiClient.get<PaginatedSnacksResponse>(
        `/snacks?page=${nextPage}&limit=${SNACKS_PER_PAGE}`,
      )
      savedSnacks.value = [...savedSnacks.value, ...result.data]
      totalSnacks.value = result.total
      currentPage.value = result.page
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar más colaciones'
    } finally {
      fetchMoreLoading.value = false
    }
  }

  /**
   * Create a new snack via API.
   * POSTs to /snacks → { data: Snack, warnings?: string[] }
   * Unshifts the new snack to savedSnacks (optimistic top-of-list).
   * Returns { snack, warnings }.
   */
  async function createSnack(payload: CreateSnackInput): Promise<{ snack: Snack; warnings: string[] }> {
    error.value = null
    try {
      const result = await apiClient.post<{ data: Snack; warnings?: string[] }>('/snacks', payload)
      const snack = result.data
      const warnings = result.warnings ?? []
      // Unshift preserves descending sort order from API (mirrors plateStore pattern)
      savedSnacks.value.unshift(snack)
      // Keep the pagination total in sync so hasMore/fetchMoreSnacks stay correct
      totalSnacks.value += 1
      return { snack, warnings }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear colación'
      throw err
    }
  }

  /**
   * Delete a snack by ID.
   * DELETEs /snacks/:id and removes it from savedSnacks.
   */
  async function deleteSnack(snackId: string): Promise<void> {
    error.value = null
    try {
      await apiClient.delete(`/snacks/${snackId}`)
      savedSnacks.value = savedSnacks.value.filter((s) => s.id !== snackId)
      // Keep the pagination total in sync (mirror createSnack)
      if (totalSnacks.value > 0) totalSnacks.value -= 1
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar colación'
      throw err
    }
  }

  return {
    // State
    savedSnacks,
    loading,
    fetchMoreLoading,
    error,
    currentPage,
    totalSnacks,
    // Getters
    hasMore,
    // Actions
    fetchSavedSnacks,
    fetchMoreSnacks,
    createSnack,
    deleteSnack,
  }
})
