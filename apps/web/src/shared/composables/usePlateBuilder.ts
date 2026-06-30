/**
 * usePlateBuilder — composable-owned draft state for plate building.
 *
 * Each call-site gets its own isolated reactive draft state,
 * preventing singleton collision when multiple builders are open
 * (e.g. PlateBuilderPage + PlateBuilderDrawer).
 *
 * The composable manages local draft state (items, name, groupCount)
 * and delegates persistence to plateStore.
 *
 * Design: AD-1 — Composable-owned draft state per call-site.
 *          AD-3 — plateStore.saveDraftAsPlate() handles API + cache.
 */

import type { Food, FoodGroup, Plate, CreatePlateInput } from '@pakulab/shared'
import { PLATE_LIMITS } from '@pakulab/shared'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useBalance } from '@/shared/composables/useBalance.js'
import type { BalanceResult } from '@pakulab/shared'

// ─── Options ────────────────────────────────────────────────────────────────

export interface UsePlateBuilderOptions {
  /** Callback invoked after a plate is successfully saved */
  onSaved?: (plate: Plate) => void
}

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UsePlateBuilderReturn {
  // State
  draftItems: Ref<PlateItemDraft[]>
  draftName: Ref<string>
  draftGroupCount: Ref<4 | 5>
  saving: Ref<boolean>
  // Derived
  balance: ComputedRef<BalanceResult | null>
  hasItems: ComputedRef<boolean>
  isValid: ComputedRef<boolean>
  canSave: ComputedRef<boolean>
  // Actions
  initDraft: () => void
  addFood: (food: Food, group: FoodGroup) => void
  removeFood: (localId: string) => void
  setGroupCount: (count: 4 | 5) => void
  clearItems: () => void
  resetDraft: () => void
  loadPlateIntoDraft: (plate: Plate) => void
  savePlate: () => Promise<Plate>
  updatePlate: (plateId: string) => Promise<Plate>
}

// ─── Composable ──────────────────────────────────────────────────────────────

/**
 * Creates an isolated plate builder draft.
 *
 * Each invocation creates fresh local state — two callsites
 * never share draftItems, preventing the singleton collision
 * described in the spec (REQ-COMPOSABLE-DRAFT-ISOLATION).
 *
 * @param options - Optional callbacks for lifecycle events.
 */
export function usePlateBuilder(options?: UsePlateBuilderOptions): UsePlateBuilderReturn {
  const plateStore = usePlateStore()
  const authStore = useAuthStore()

  // ─── Local draft state (per-call-site, NOT the Pinia singleton) ──────────
  const draftItems = ref<PlateItemDraft[]>([])
  const draftName = ref<string>('Mi plato')
  const draftGroupCount = ref<4 | 5>(4)
  const saving = ref(false)

  // ─── Derived state ───────────────────────────────────────────────────────

  // Reuse useBalance composable — pass our local draftItems ref
  const { balance } = useBalance(draftItems)

  /** True when at least one food item is on the plate */
  const hasItems = computed(() => draftItems.value.length > 0)

  /** True when the draft is valid for saving (has items AND non-empty name) */
  const isValid = computed(() => hasItems.value && draftName.value.trim() !== '')

  /** True when the user can save (authenticated + under tier plate limit) */
  const canSave = computed(() => {
    if (!authStore.isAuthenticated) return false
    const limit = PLATE_LIMITS[authStore.tier]
    return plateStore.savedPlates.length < limit
  })

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Reset all draft state to defaults */
  function initDraft(): void {
    draftItems.value = []
    draftName.value = 'Mi plato'
    draftGroupCount.value = 4
  }

  /**
   * Add a food to the draft, replacing any existing item in the same group zone.
   * Only ONE food per zone is allowed.
   */
  function addFood(food: Food, group: FoodGroup): void {
    draftItems.value = draftItems.value.filter(
      (item) => item.groupAssignment !== group,
    )
    draftItems.value.push({
      id: `${food.id}-${Date.now()}`,
      food,
      groupAssignment: group,
    })
  }

  /** Remove a food item from the draft by its local ID */
  function removeFood(localId: string): void {
    draftItems.value = draftItems.value.filter((item) => item.id !== localId)
  }

  /**
   * Set the group count (4 or 5).
   * When switching to 4 groups, removes any HEALTHY_FAT items.
   */
  function setGroupCount(count: 4 | 5): void {
    draftGroupCount.value = count
    if (count === 4) {
      draftItems.value = draftItems.value.filter(
        (item) => item.groupAssignment !== 'HEALTHY_FAT',
      )
    }
  }

  /** Clear items and reset name, keeping group count intact */
  function clearItems(): void {
    draftItems.value = []
    draftName.value = 'Mi plato'
  }

  /** Alias for initDraft — resets everything including group count */
  function resetDraft(): void {
    initDraft()
  }

  /**
   * Load an existing Plate into the draft for editing.
   * Maps PlateItem → PlateItemDraft, filling missing Food fields from FoodSummary.
   */
  function loadPlateIntoDraft(plate: Plate): void {
    draftItems.value = []
    draftName.value = plate.name
    draftGroupCount.value = plate.groupCount

    if (plate.items?.length) {
      for (const item of plate.items) {
        if (item.food) {
          draftItems.value.push({
            id: `${item.food.id}-${Date.now()}`,
            food: {
              id: item.food.id,
              name: item.food.name,
              group: item.food.group,
              alClassification: item.food.alClassification,
              alScore: 0, // Not available in FoodSummary
              isAllergen: item.food.isAllergen,
              allergenType: item.food.allergenType ?? null,
              ageMonths: item.food.ageMonths,
              needsValidation: false, // Not available in FoodSummary
              warningTags: [], // Not available in FoodSummary
              createdAt: '', // Not available in FoodSummary
              updatedAt: '', // Not available in FoodSummary
            },
            groupAssignment: item.groupAssignment,
          })
        }
      }
    }
  }

  /**
   * Save the current draft as a new plate via plateStore.
   * Builds a CreatePlateInput payload from local draft state and
   * delegates the API call + cache update to plateStore.saveDraftAsPlate().
   *
   * @throws Re-throws any error from the API call (caller should handle).
   */
  async function savePlate(): Promise<Plate> {
    const payload: CreatePlateInput = {
      name: draftName.value,
      groupCount: draftGroupCount.value,
      items: draftItems.value.map((item) => ({
        foodId: item.food.id,
        groupAssignment: item.groupAssignment,
      })),
    }

    saving.value = true
    try {
      const plate = await plateStore.saveDraftAsPlate(payload)
      options?.onSaved?.(plate)
      return plate
    } finally {
      saving.value = false
    }
  }

  /**
   * Update an existing plate via plateStore.
   * Builds a CreatePlateInput payload from local draft state and
   * delegates the API call + cache update to plateStore.updatePlate().
   *
   * @throws Re-throws any error from the API call (caller should handle).
   */
  async function updatePlate(plateId: string): Promise<Plate> {
    const payload: CreatePlateInput = {
      name: draftName.value,
      groupCount: draftGroupCount.value,
      items: draftItems.value.map((item) => ({
        foodId: item.food.id,
        groupAssignment: item.groupAssignment,
      })),
    }

    saving.value = true
    try {
      const plate = await plateStore.updatePlate(plateId, payload)
      return plate
    } finally {
      saving.value = false
    }
  }

  return {
    // State
    draftItems,
    draftName,
    draftGroupCount,
    saving,
    // Derived
    balance,
    hasItems,
    isValid,
    canSave,
    // Actions
    initDraft,
    addFood,
    removeFood,
    setGroupCount,
    clearItems,
    resetDraft,
    loadPlateIntoDraft,
    savePlate,
    updatePlate,
  }
}