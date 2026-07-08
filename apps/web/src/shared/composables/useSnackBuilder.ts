/**
 * useSnackBuilder — composable-owned draft state for snack building.
 *
 * Each call-site gets its own isolated reactive draft state,
 * preventing singleton collision when multiple builders are open.
 *
 * Mirrors usePlateBuilder pattern but for snacks:
 * - 3 snack groups (HEALTHY_FAT, CEREAL_TUBER, FRUIT), no groupCount toggle
 * - NO balance calculation (snacks have no A/L scoring)
 * - Age-driven suggested groups via getSnackGroupsForAge
 * - Warnings returned from createSnack response
 *
 * Design: AD-1 — Composable-owned draft state per call-site.
 */

import type { Food, FoodGroup, Snack, CreateSnackInput, PlateStage } from '@pakulab/shared'
import { SNACK_LIMITS, getSnackGroupsForAge } from '@pakulab/shared'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'
import { useSnackStore } from '@/shared/stores/snackStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'

// ─── Options ────────────────────────────────────────────────────────────────

export interface UseSnackBuilderOptions {
  /** Baby age in months — reactive ref or getter function */
  ageMonths: Ref<number> | (() => number)
  /** Callback invoked after a snack is successfully saved */
  onSaved?: (snack: Snack) => void
}

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseSnackBuilderReturn {
  // State
  draftItems: Ref<PlateItemDraft[]>
  draftName: Ref<string>
  draftStageFor: Ref<PlateStage | null>
  saving: Ref<boolean>
  lastWarnings: Ref<string[]>
  // Derived
  suggestedGroups: ComputedRef<FoodGroup[]>
  isSuggested: (group: FoodGroup) => boolean
  hasItems: ComputedRef<boolean>
  isValid: ComputedRef<boolean>
  canSave: ComputedRef<boolean>
  // Actions
  addFood: (food: Food, group: FoodGroup) => void
  removeFood: (localId: string) => void
  clear: () => void
  resetDraft: () => void
  saveSnack: () => Promise<{ snack: Snack; warnings: string[] }>
}

// ─── Composable ──────────────────────────────────────────────────────────────

/**
 * Creates an isolated snack builder draft.
 *
 * Each invocation creates fresh local state — two callsites
 * never share draftItems, preventing singleton collision.
 *
 * @param options - Required: ageMonths (Ref or getter), optional: onSaved callback.
 */
export function useSnackBuilder(options: UseSnackBuilderOptions): UseSnackBuilderReturn {
  const snackStore = useSnackStore()
  const authStore = useAuthStore()

  // ─── Local draft state (per-call-site, NOT the Pinia singleton) ──────────
  const draftItems = ref<PlateItemDraft[]>([])
  const draftName = ref<string>('Mi colación')
  const draftStageFor = ref<PlateStage | null>(null)
  const saving = ref(false)
  const lastWarnings = ref<string[]>([])

  // Monotonic counter for unique draft-item ids — avoids Date.now() collisions
  // when two foods are added within the same millisecond.
  let itemIdCounter = 0

  // ─── Derived state ───────────────────────────────────────────────────────

  /** Age in months — unwrap Ref or call getter */
  const ageMonths = computed(() => {
    if (typeof options.ageMonths === 'function') {
      return options.ageMonths()
    }
    return options.ageMonths.value
  })

  /** Suggested snack groups for the baby's age */
  const suggestedGroups = computed<FoodGroup[]>(() => {
    return getSnackGroupsForAge(ageMonths.value)
  })

  /** Check if a group is suggested for the baby's age */
  function isSuggested(group: FoodGroup): boolean {
    return suggestedGroups.value.includes(group)
  }

  /** True when at least one food item is in the draft */
  const hasItems = computed(() => draftItems.value.length > 0)

  /** True when the draft is valid for saving (has items AND non-empty name) */
  const isValid = computed(() => hasItems.value && draftName.value.trim() !== '')

  /** True when the user can save (authenticated + under tier snack limit) */
  const canSave = computed(() => {
    if (!authStore.isAuthenticated) return false
    // Fall back to lockout (0) if the tier is missing/corrupted so an unknown
    // tier fails safe (blocks) rather than allowing unbounded saves.
    const limit = SNACK_LIMITS[authStore.tier] ?? 0
    return snackStore.savedSnacks.length < limit
  })

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Add a food to the draft, replacing any existing item in the same group zone.
   * Only ONE food per snack group is allowed (HEALTHY_FAT, CEREAL_TUBER, FRUIT).
   */
  function addFood(food: Food, group: FoodGroup): void {
    draftItems.value = draftItems.value.filter(
      (item) => item.groupAssignment !== group,
    )
    draftItems.value.push({
      id: `${food.id}-${itemIdCounter++}`,
      food,
      groupAssignment: group,
      servingAmount: null,
    })
  }

  /** Remove a food item from the draft by its local ID */
  function removeFood(localId: string): void {
    draftItems.value = draftItems.value.filter((item) => item.id !== localId)
  }

  /** Clear items and reset name */
  function clear(): void {
    draftItems.value = []
    draftName.value = 'Mi colación'
  }

  /** Alias for clear — resets everything */
  function resetDraft(): void {
    clear()
    lastWarnings.value = []
  }

  /**
   * Save the current draft as a new snack via snackStore.
   * Builds a CreateSnackInput payload from local draft state and
   * delegates the API call + cache update to snackStore.createSnack().
   *
   * Returns { snack, warnings } from the API response.
   * Stores warnings in lastWarnings ref for UI display.
   *
   * @throws Re-throws any error from the API call (caller should handle).
   */
  async function saveSnack(): Promise<{ snack: Snack; warnings: string[] }> {
    const payload: CreateSnackInput = {
      name: draftName.value,
      stageFor: draftStageFor.value ?? undefined,
      items: draftItems.value.map((item) => ({
        foodId: item.food.id,
        groupAssignment: item.groupAssignment,
      })),
    }

    saving.value = true
    try {
      const result = await snackStore.createSnack(payload)
      lastWarnings.value = result.warnings
      options.onSaved?.(result.snack)
      return result
    } finally {
      saving.value = false
    }
  }

  return {
    // State
    draftItems,
    draftName,
    draftStageFor,
    saving,
    lastWarnings,
    // Derived
    suggestedGroups,
    isSuggested,
    hasItems,
    isValid,
    canSave,
    // Actions
    addFood,
    removeFood,
    clear,
    resetDraft,
    saveSnack,
  }
}
