/**
 * Plate builder Pinia store.
 * Manages active plate state, saved plates, and offline draft.
 * Design: AD4 — Pinia for server-synced state.
 */

import type { Food, FoodGroup, Plate, BalanceResult } from '@pakulab/shared'
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
  const error = ref<string | null>(null)

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

  async function fetchSavedPlates() {
    loading.value = true
    error.value = null
    try {
      const result = await apiClient.get<{ data: Plate[] }>('/plates')
      savedPlates.value = result.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar platos'
    } finally {
      loading.value = false
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

  async function saveDraftAsPlate(): Promise<Plate> {
    error.value = null

    const itemsPayload = draftItems.value.map((item) => ({
      foodId: item.food.id,
      groupAssignment: item.groupAssignment,
    }))

    try {
      const result = await apiClient.post<{ data: Plate }>('/plates', {
        name: draftName.value,
        groupCount: draftGroupCount.value,
        items: itemsPayload,
      })
      savedPlates.value.unshift(result.data)
      return result.data
    } catch (err) {
      if (err instanceof OfflineError) {
        // Queue the plate for sync when back online
        await enqueuePlate({
          localId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: draftName.value,
          groupCount: draftGroupCount.value,
          items: itemsPayload,
          queuedAt: Date.now(),
        })
        // Return an optimistic plate (computed balance client-side)
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
          items: draftItems.value.map((item) => ({
            id: item.id,
            plateId: '',
            foodId: item.food.id,
            groupAssignment: item.groupAssignment,
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
   */
  async function updatePlate(plateId: string): Promise<Plate> {
    error.value = null

    const itemsPayload = draftItems.value.map((item) => ({
      foodId: item.food.id,
      groupAssignment: item.groupAssignment,
    }))

    const result = await apiClient.put<{ data: Plate }>(`/plates/${plateId}`, {
      name: draftName.value,
      groupCount: draftGroupCount.value,
      items: itemsPayload,
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
    error,
    // Getters
    balance,
    itemsByGroup,
    hasItems,
    isBalanced,
    canSave,
    // Actions
    addFoodToDraft,
    removeFoodFromDraft,
    setGroupCount,
    resetDraft,
    clearItems,
    fetchSavedPlates,
    loadPlate,
    saveDraftAsPlate,
    updatePlate,
    deletePlate,
  }
})
