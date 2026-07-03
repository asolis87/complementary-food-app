/**
 * Plate builder Pinia store.
 * Manages active plate state, saved plates, and offline draft.
 * Design: AD4 — Pinia for server-synced state.
 */

import type { Food, FoodGroup, Plate, BalanceResult, CreatePlateInput, PlateStage } from '@pakulab/shared'
import { calculateBalance, PLATE_LIMITS } from '@pakulab/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient, OfflineError } from '../api/client.js'
import { useAuthStore } from './authStore.js'
import { enqueuePlate } from '../services/syncQueue.js'

export interface PlateItemDraft {
  id: string // Local ID for list key
  food: Food
  groupAssignment: FoodGroup
  servingAmount?: string | null
}

export const usePlateStore = defineStore('plates', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  /** Active plate being built */
  const draftItems = ref<PlateItemDraft[]>([])
  const draftName = ref('Mi plato')
  const draftGroupCount = ref<4 | 5>(4)

  /** Saved plates (from API) */
  const savedPlates = ref<Plate[]>([])
  const loading = ref(false)
  const fetchMoreLoading = ref(false)
  const error = ref<string | null>(null)

  /** Pagination state */
  const currentPage = ref(1)
  const totalPlates = ref(0)
  const PLATES_PER_PAGE = 20

  // ─── Getters ──────────────────────────────────────────────────────────────

  /**
   * Real-time balance calculated locally using the shared pure function.
   * Enables instant feedback and offline-first behavior — no API round-trip needed.
   */
  const balance = computed((): BalanceResult => {
    return calculateBalance(draftItems.value.map((item) => ({ alClassification: item.food.alClassification })))
  })

  /** Items organised by food group assignment */
  const itemsByGroup = computed(() => {
    const groups = {} as Record<FoodGroup, PlateItemDraft[]>
    for (const item of draftItems.value) {
      if (!groups[item.groupAssignment]) groups[item.groupAssignment] = []
      groups[item.groupAssignment].push(item)
    }
    return groups
  })

  /** True when the draft has at least one food item */
  const hasItems = computed(() => draftItems.value.length > 0)

  /** True when the current balance is in the green (balanced) zone */
  const isBalanced = computed(() => balance.value.label === 'balanced')

  /** True when there are more pages of plates to fetch */
  const hasMore = computed(() => savedPlates.value.length < totalPlates.value)

  /**
   * True when the user can save a new plate:
   *  - must be authenticated (at least FREE tier)
   *  - must be under the tier's plate limit
   */
  const canSave = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return false
    const limit = PLATE_LIMITS[authStore.tier]
    return savedPlates.value.length < limit
  })

  // ─── Actions ──────────────────────────────────────────────────────────────

  function addFoodToDraft(food: Food, groupAssignment: FoodGroup) {
    // Remove existing item in this group — only ONE food per zone allowed
    draftItems.value = draftItems.value.filter(
      (item) => item.groupAssignment !== groupAssignment,
    )
    // Add the new one
    draftItems.value.push({
      id: `${food.id}-${Date.now()}`,
      food,
      groupAssignment,
    })
  }

  function removeFoodFromDraft(localId: string) {
    draftItems.value = draftItems.value.filter((item) => item.id !== localId)
  }

  function setGroupCount(count: 4 | 5) {
    draftGroupCount.value = count
    // Remove HEALTHY_FAT items if switching back to 4 groups
    if (count === 4) {
      draftItems.value = draftItems.value.filter((item) => item.groupAssignment !== 'HEALTHY_FAT')
    }
  }

  function resetDraft() {
    draftItems.value = []
    draftName.value = 'Mi plato'
    draftGroupCount.value = 4
  }

  /** Clear only the plate items and reset the name — keeps groupCount intact */
  function clearItems() {
    draftItems.value = []
    draftName.value = 'Mi plato'
  }

  /** Paginated response shape from GET /plates */
  interface PaginatedPlatesResponse {
    data: Plate[]
    total: number
    page: number
    limit: number
  }

  /**
   * Fetch the first page of saved plates (resets pagination state).
   * @param stageFor - Optional stage filter (omit for all plates)
   */
  async function fetchSavedPlates(stageFor?: PlateStage) {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams({ page: '1', limit: String(PLATES_PER_PAGE) })
      if (stageFor) {
        params.set('stageFor', stageFor)
      }
      const result = await apiClient.get<PaginatedPlatesResponse>(`/plates?${params}`)
      savedPlates.value = result.data
      totalPlates.value = result.total
      currentPage.value = result.page
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar platos'
    } finally {
      loading.value = false
    }
  }

  /** Fetch the next page and append results to the existing list. */
  async function fetchMorePlates() {
    if (!hasMore.value || fetchMoreLoading.value) return
    fetchMoreLoading.value = true
    error.value = null
    try {
      const nextPage = currentPage.value + 1
      const result = await apiClient.get<PaginatedPlatesResponse>(
        `/plates?page=${nextPage}&limit=${PLATES_PER_PAGE}`,
      )
      savedPlates.value = [...savedPlates.value, ...result.data]
      totalPlates.value = result.total
      currentPage.value = result.page
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar más platos'
    } finally {
      fetchMoreLoading.value = false
    }
  }

  /** Load a single plate by ID (populates detail view) */
  async function loadPlate(id: string): Promise<Plate | null> {
    loading.value = true
    error.value = null
    try {
      const result = await apiClient.get<{ data: Plate }>(`/plates/${id}`)
      return result.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el plato'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Save the current draft as a new plate via API.
   *
   * Accepts an optional `CreatePlateInput` payload for use by composable-owned
   * drafts (AD-1). When called without arguments, builds the payload from the
   * store's internal draft state (backward-compat for PlateBuilderPage).
   *
   * Design: AD-3 — composable builds payload, store executes API + caches.
   */
  async function saveDraftAsPlate(payload?: CreatePlateInput): Promise<Plate> {
    error.value = null

    // When called from the composable, use the provided payload;
    // otherwise build from internal singleton state (legacy path).
    const platePayload: CreatePlateInput = payload ?? {
      name: draftName.value,
      groupCount: draftGroupCount.value,
      items: draftItems.value.map((item) => ({
        foodId: item.food.id,
        groupAssignment: item.groupAssignment,
      })),
    }

    const itemsPayload = platePayload.items ?? []

    try {
      const result = await apiClient.post<{ data: Plate }>('/plates', {
        name: platePayload.name,
        groupCount: platePayload.groupCount,
        items: itemsPayload,
      })
      // Contract: unshift preserves descending sort order from API (UX-2).
      // The API sorts by createdAt desc, so new plates go at the top.
      savedPlates.value.unshift(result.data)
      return result.data
    } catch (err) {
      if (err instanceof OfflineError) {
        // Queue the plate for sync when back online
        await enqueuePlate({
          localId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: platePayload.name ?? 'Mi plato',
          groupCount: platePayload.groupCount ?? 4,
          items: itemsPayload,
          queuedAt: Date.now(),
        })

        if (payload) {
          // Composable path — no full Food objects available for balance calc.
          // Return a minimal optimistic plate; the caller's local draft state
          // provides immediate visual feedback for balance (AD-1).
          const optimistic: Plate = {
            id: `queued-${Date.now()}`,
            userId: '',
            name: platePayload.name ?? 'Mi plato',
            groupCount: platePayload.groupCount ?? 4,
            balanceScore: 0,
            astringentCount: 0,
            laxativeCount: 0,
            neutralCount: 0,
            babyProfileId: null,
            stageFor: null,
            deletedAt: null,
            items: itemsPayload.map((item, idx) => ({
              id: `local-item-${idx}-${Date.now()}`,
              plateId: '',
              foodId: item.foodId,
              groupAssignment: item.groupAssignment,
              servingAmount: item.servingAmount ?? null,
              createdAt: new Date().toISOString(),
              // Optimistic PlateItem without full Food — food is populated on API sync.
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          savedPlates.value.unshift(optimistic)
          return optimistic
        }

        // Legacy path — full food items available for accurate balance calculation
        const draftBalance = calculateBalance(
          draftItems.value.map((item) => ({ alClassification: item.food.alClassification })),
        )
        const optimistic: Plate = {
          id: `queued-${Date.now()}`,
          userId: '',
          name: draftName.value,
          groupCount: draftGroupCount.value,
          balanceScore: draftBalance.score,
          astringentCount: draftBalance.astringent,
          laxativeCount: draftBalance.laxative,
          neutralCount: draftBalance.neutral,
          babyProfileId: null,
          stageFor: null,
          deletedAt: null,
          items: draftItems.value.map((item) => ({
            id: item.id,
            plateId: '',
            foodId: item.food.id,
            groupAssignment: item.groupAssignment,
            servingAmount: item.servingAmount ?? null,
            createdAt: new Date().toISOString(),
            food: item.food,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        savedPlates.value.unshift(optimistic)
        return optimistic
      }
      throw err
    }
  }

  async function deletePlate(plateId: string) {
    await apiClient.delete(`/plates/${plateId}`)
    savedPlates.value = savedPlates.value.filter((p) => p.id !== plateId)
  }

  /**
   * Update an existing plate (edit mode).
   * Sends name, groupCount, and items via PUT /plates/:id.
   *
   * Accepts an optional `CreatePlateInput` payload for use by composable-owned
   * drafts (AD-1). When called without arguments, builds the payload from the
   * store's internal draft state (backward-compat for PlateBuilderPage).
   *
   * Design: AD-3 — composable builds payload, store executes API + caches.
   */
  async function updatePlate(plateId: string, payload?: CreatePlateInput): Promise<Plate> {
    error.value = null

    // When called from the composable, use the provided payload;
    // otherwise build from internal singleton state (legacy path).
    const platePayload: CreatePlateInput = payload ?? {
      name: draftName.value,
      groupCount: draftGroupCount.value,
      items: draftItems.value.map((item) => ({
        foodId: item.food.id,
        groupAssignment: item.groupAssignment,
      })),
    }

    const result = await apiClient.put<{ data: Plate }>(`/plates/${plateId}`, {
      name: platePayload.name,
      groupCount: platePayload.groupCount,
      items: platePayload.items,
    })

    // Update in local savedPlates cache if present
    const idx = savedPlates.value.findIndex((p) => p.id === plateId)
    if (idx !== -1) {
      savedPlates.value[idx] = result.data
    }

    return result.data
  }

  return {
    // State
    draftItems,
    draftName,
    draftGroupCount,
    savedPlates,
    loading,
    fetchMoreLoading,
    error,
    currentPage,
    totalPlates,
    // Getters
    balance,
    itemsByGroup,
    hasItems,
    isBalanced,
    hasMore,
    canSave,
    // Actions
    addFoodToDraft,
    removeFoodFromDraft,
    setGroupCount,
    resetDraft,
    clearItems,
    fetchSavedPlates,
    fetchMorePlates,
    loadPlate,
    saveDraftAsPlate,
    updatePlate,
    deletePlate,
  }
})
