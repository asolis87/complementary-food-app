/**
 * Menu Store — Weekly Menu Planner state management.
 * 
 * Caches weekly menus by `weekStart` ISO string. Supports optimistic UI
 * for slot assignment with per-slot loading states and rollback on error.
 * 
 * Design: AD-1 (cache by weekStart ISO), AD-4 (lazy creation), AD-7 (optimistic UI)
 */

import type { 
  WeeklyMenuResponse, 
  MenuMealResponse, 
  Plate,
  PlateItemSummary,
  CreateMenuPayload,
  MealSlotPatch,
  ServeMealPayload,
  ServeMealResponse
} from '@pakulab/shared'
import {
  MEAL_KEY_TO_TYPE,
  MEAL_TYPE_TO_KEY,
  DAY_KEY_TO_INDEX,
  GOOD_THRESHOLD,
  type MealKey,
  type DayKey,
  ACTIVE_MEAL_KEYS,
  DAY_KEYS
} from '@pakulab/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient } from '../api/client.js'

/** Slot key format: `${dayKey}:${mealKey}` e.g., "lun:desayuno" */
type SlotKey = `${DayKey}:${MealKey}`

/** Per-slot loading state */
interface SlotLoadingState {
  dayKey: DayKey
  mealKey: MealKey
}

export const useMenuStore = defineStore('menus', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  /**
   * Cache of weekly menus keyed by weekStart ISO string (YYYY-MM-DD).
   * Value is null when we've fetched and confirmed no menu exists for that week.
   * AD-1: Cache by weekStart ISO string for multi-week navigation.
   */
  const weekMenus = ref<Map<string, WeeklyMenuResponse | null>>(new Map())

  /** Currently active week start ISO (for derived getters) */
  const currentWeekStart = ref<string | null>(null)

  /** Loading state for fetching menus */
  const loading = ref(false)

  /** Error state */
  const error = ref<string | null>(null)

  /**
   * Per-slot loading states for optimistic UI.
   * AD-7: Show spinner on individual slots during PATCH.
   */
  const slotLoading = ref<Set<string>>(new Set())

  /**
   * Per-slot serve loading states.
   * Shows spinner on serve button during API call.
   */
  const serveLoading = ref<Set<string>>(new Set())

  // ─── Getters ──────────────────────────────────────────────────────────────

  /**
   * The current menu for the active week, or null if none exists.
   */
  const currentMenu = computed((): WeeklyMenuResponse | null => {
    if (!currentWeekStart.value) return null
    return weekMenus.value.get(currentWeekStart.value) ?? null
  })

  /**
   * Computed menu map for easy slot lookups.
   * Returns Record<`${dayKey}:${mealKey}`, Plate | null> for the current week.
   * AD-5/AD-6: Uses MEAL_KEY_TO_TYPE and DAY_KEY_TO_INDEX from shared constants.
   */
  const menuMap = computed((): Record<SlotKey, Plate | null> => {
    const menu = currentMenu.value
    if (!menu) return {} as Record<SlotKey, Plate | null>

    const map = {} as Record<SlotKey, Plate | null>

    // Initialize all slots as empty
    for (const dayKey of DAY_KEYS) {
      for (const mealKey of ACTIVE_MEAL_KEYS) {
        map[`${dayKey}:${mealKey}`] = null
      }
    }

    // Fill in assigned plates from menu data
    for (const day of menu.days) {
      const dayKey = DAY_KEYS[day.dayOfWeek]
      if (!dayKey) continue

      for (const meal of day.meals) {
        // Use reverse mapping for cleaner lookup (AD-5)
        const mealKey = MEAL_TYPE_TO_KEY[meal.mealType]

        if (!mealKey || !ACTIVE_MEAL_KEYS.includes(mealKey)) continue

        map[`${dayKey}:${mealKey}`] = meal.plate ?? null
      }
    }

    return map
  })

  /**
   * Weekly statistics for the summary section.
   * REQ-007: Balance summary across all 21 visible slots.
   * Uses GOOD_THRESHOLD constant for balanced meal counting.
   */
  const weekStats = computed(() => {
    const map = menuMap.value
    const TOTAL_SLOTS = 7 * 3 // 7 days × 3 active meals

    let total = 0
    let balanced = 0

    for (const [key, plate] of Object.entries(map)) {
      if (plate) {
        total++
        // Plates with balanceScore >= GOOD_THRESHOLD are counted as balanced
        if (plate.balanceScore >= GOOD_THRESHOLD) {
          balanced++
        }
      }
    }

    return {
      total,
      balanced,
      empty: TOTAL_SLOTS - total,
    }
  })

  /**
   * Get the assigned plate for a specific slot.
   * Thin wrapper over menuMap for template compatibility.
   */
  function getPlate(dayKey: DayKey, mealKey: MealKey): Plate | null {
    return menuMap.value[`${dayKey}:${mealKey}`] ?? null
  }

  /**
   * Get food items from a slot's assigned plate.
   * Returns PlateItemSummary array with food details (A/L classification).
   * REQ-001: Food visualization data accessor for menu slots.
   */
  function getSlotFoods(dayKey: DayKey, mealKey: MealKey): PlateItemSummary[] {
    const plate = menuMap.value[`${dayKey}:${mealKey}`]
    if (!plate?.items) return []
    return plate.items
  }

  /**
   * Check if a specific slot is currently loading (optimistic update in progress).
   */
  function isSlotLoading(dayKey: DayKey, mealKey: MealKey): boolean {
    return slotLoading.value.has(`${dayKey}:${mealKey}`)
  }

  /**
   * Get the servedAt timestamp for a specific slot.
   * Returns ISO string or null if not served.
   */
  function getServedAt(dayKey: DayKey, mealKey: MealKey): string | null {
    const menu = currentMenu.value
    if (!menu) return null

    const dayOfWeek = DAY_KEY_TO_INDEX[dayKey]
    const mealType = MEAL_KEY_TO_TYPE[mealKey]

    const day = menu.days.find(d => d.dayOfWeek === dayOfWeek)
    if (!day) return null

    const meal = day.meals.find(m => m.mealType === mealType)
    return meal?.servedAt ?? null
  }

  /**
   * Check if a specific slot is currently serving (API call in progress).
   */
  function isServeLoading(dayKey: DayKey, mealKey: MealKey): boolean {
    return serveLoading.value.has(`${dayKey}:${mealKey}`)
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Fetch the menu for a specific week.
   * Skips API call if already cached (AD-1).
   * Returns null if no menu exists (AD-4: lazy creation — no auto-create).
   */
  async function fetchWeekMenu(
    babyProfileId: string,
    weekStartISO: string
  ): Promise<WeeklyMenuResponse | null> {
    // Check cache first (AD-1)
    if (weekMenus.value.has(weekStartISO)) {
      currentWeekStart.value = weekStartISO
      return weekMenus.value.get(weekStartISO) ?? null
    }

    loading.value = true
    error.value = null

    try {
      const result = await apiClient.get<WeeklyMenuResponse | null>(
        `/menus?babyProfileId=${babyProfileId}&weekStart=${weekStartISO}`
      )

      // Cache the result (null is a valid cached value meaning "no menu")
      weekMenus.value.set(weekStartISO, result)
      currentWeekStart.value = weekStartISO

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el menú'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Ensure a menu exists for the current week.
   * AD-4: Lazy creation — POST only called when user first assigns a plate.
   * Returns the existing or newly created menu.
   */
  async function ensureMenu(
    babyProfileId: string,
    weekStartISO: string
  ): Promise<WeeklyMenuResponse> {
    // Check if we already have a cached menu
    const cached = weekMenus.value.get(weekStartISO)
    if (cached) return cached

    // Create new menu
    loading.value = true
    error.value = null

    try {
      const payload: CreateMenuPayload = {
        babyProfileId,
        weekStart: weekStartISO,
      }

      const result = await apiClient.post<WeeklyMenuResponse>('/menus', payload)

      // Cache the newly created menu
      weekMenus.value.set(weekStartISO, result)
      currentWeekStart.value = weekStartISO

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear el menú'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear the entire cache. Called when switching profiles.
   * AD-1: Clear on profile switch.
   */
  function clearProfileCache(): void {
    weekMenus.value.clear()
    currentWeekStart.value = null
    slotLoading.value.clear()
    error.value = null
  }

  /**
   * Assign a plate to a specific slot.
   * AD-7: Optimistic UI with rollback on error.
   * AD-4: Creates menu lazily if it doesn't exist.
   */
  async function assignPlate(
    babyProfileId: string,
    weekStartISO: string,
    dayKey: DayKey,
    mealKey: MealKey,
    plate: Plate
  ): Promise<void> {
    const slotKey = `${dayKey}:${mealKey}` as SlotKey
    
    // Ensure we have a menu (lazy creation)
    let menu = weekMenus.value.get(weekStartISO)
    if (!menu) {
      menu = await ensureMenu(babyProfileId, weekStartISO)
    }

    // Store previous state for potential rollback
    const previousPlate = menuMap.value[slotKey]

    // Optimistic update: immediately update local state
    updateLocalSlot(menu.id, dayKey, mealKey, plate)
    slotLoading.value.add(slotKey)

    try {
      // API call
      const dayOfWeek = DAY_KEY_TO_INDEX[dayKey]
      const mealType = MEAL_KEY_TO_TYPE[mealKey]

      const payload: MealSlotPatch = {
        dayOfWeek,
        mealType,
        plateId: plate.id,
      }

      await apiClient.patch(`/menus/${menu.id}/meals`, payload)
      
      // Success: keep the optimistic update
    } catch (err) {
      // Rollback on error (AD-7)
      updateLocalSlot(menu.id, dayKey, mealKey, previousPlate)
      error.value = err instanceof Error ? err.message : 'Error al asignar el plato'
      throw err
    } finally {
      slotLoading.value.delete(slotKey)
    }
  }

  /**
   * Remove a plate from a specific slot (clear the slot).
   * AD-7: Optimistic UI with rollback on error.
   */
  async function removePlate(
    babyProfileId: string,
    weekStartISO: string,
    dayKey: DayKey,
    mealKey: MealKey
  ): Promise<void> {
    const slotKey = `${dayKey}:${mealKey}` as SlotKey

    // Get the current menu
    let menu = weekMenus.value.get(weekStartISO)
    if (!menu) {
      // No menu exists, nothing to remove
      return
    }

    // Store previous state for potential rollback
    const previousPlate = menuMap.value[slotKey]

    // Optimistic update: immediately clear the slot
    updateLocalSlot(menu.id, dayKey, mealKey, null)
    slotLoading.value.add(slotKey)

    try {
      // API call
      const dayOfWeek = DAY_KEY_TO_INDEX[dayKey]
      const mealType = MEAL_KEY_TO_TYPE[mealKey]

      const payload: MealSlotPatch = {
        dayOfWeek,
        mealType,
        plateId: null, // Clear the slot
      }

      await apiClient.patch(`/menus/${menu.id}/meals`, payload)

      // Success: keep the optimistic update
    } catch (err) {
      // Rollback on error (AD-7)
      updateLocalSlot(menu.id, dayKey, mealKey, previousPlate)
      error.value = err instanceof Error ? err.message : 'Error al quitar el plato'
      throw err
    } finally {
      slotLoading.value.delete(slotKey)
    }
  }

  /**
   * Serve a meal (mark as served and create food log entries).
   * Returns the servedAt timestamp on success.
   * Handles 409 conflict if already served.
   */
  async function serveMeal(
    babyProfileId: string,
    dayKey: DayKey,
    mealKey: MealKey,
    force = false
  ): Promise<ServeMealResponse> {
    const slotKey = `${dayKey}:${mealKey}` as SlotKey
    const menu = currentMenu.value
    if (!menu) {
      throw new Error('No hay menú cargado')
    }

    serveLoading.value.add(slotKey)

    try {
      const dayOfWeek = DAY_KEY_TO_INDEX[dayKey]
      const mealType = MEAL_KEY_TO_TYPE[mealKey]

      const payload: ServeMealPayload = {
        dayOfWeek,
        mealType,
        babyProfileId,
      }

      const queryParams = force ? '?force=true' : ''
      const response = await apiClient.post<{ data: ServeMealResponse }>(
        `/menus/${menu.id}/meals/serve${queryParams}`,
        payload
      )

      // API returns { data: result } envelope — unwrap it
      const result = response.data

      // Update local state with servedAt timestamp
      updateLocalServedAt(menu.id, dayKey, mealKey, result.servedAt)

      return result
    } catch (err) {
      // Handle 409 conflict - return conflict info for dialog
      if (err instanceof Error && err.message.includes('409')) {
        const servedAt = getServedAt(dayKey, mealKey)
        throw { type: 'ALREADY_SERVED', servedAt }
      }
      error.value = err instanceof Error ? err.message : 'Error al registrar la comida'
      throw err
    } finally {
      serveLoading.value.delete(slotKey)
    }
  }

  /**
   * Re-serve a meal (force=true) with confirmation.
   * Wrapper around serveMeal with force flag.
   */
  async function reServeMeal(
    babyProfileId: string,
    dayKey: DayKey,
    mealKey: MealKey
  ): Promise<ServeMealResponse> {
    return serveMeal(babyProfileId, dayKey, mealKey, true)
  }

  /**
   * Helper: Update the servedAt timestamp in cached menu data locally.
   */
  function updateLocalServedAt(
    menuId: string,
    dayKey: DayKey,
    mealKey: MealKey,
    servedAt: string
  ): void {
    const menu = Array.from(weekMenus.value.values()).find(m => m?.id === menuId)
    if (!menu) return

    const dayOfWeek = DAY_KEY_TO_INDEX[dayKey]
    const mealType = MEAL_KEY_TO_TYPE[mealKey]

    const day = menu.days.find(d => d.dayOfWeek === dayOfWeek)
    if (!day) return

    const mealIndex = day.meals.findIndex(m => m.mealType === mealType)
    if (mealIndex >= 0) {
      day.meals[mealIndex]!.servedAt = servedAt
    } else {
      // Create meal entry if it doesn't exist (defensive)
      day.meals.push({
        id: `temp-${Date.now()}`,
        menuDayId: day.id,
        mealType,
        plateId: null,
        notes: null,
        servedAt,
      })
    }

    // Trigger reactivity
    weekMenus.value.set(menu.weekStart, { ...menu })
  }

  /**
   * Helper: Update a slot in the cached menu data locally (for optimistic updates).
   */
  function updateLocalSlot(
    menuId: string,
    dayKey: DayKey,
    mealKey: MealKey,
    plate: Plate | null
  ): void {
    const menu = Array.from(weekMenus.value.values()).find(m => m?.id === menuId)
    if (!menu) return

    const dayOfWeek = DAY_KEY_TO_INDEX[dayKey]
    const mealType = MEAL_KEY_TO_TYPE[mealKey]

    // Find or create the day
    let day = menu.days.find(d => d.dayOfWeek === dayOfWeek)
    if (!day) {
      // Defensive: create day if missing (shouldn't happen normally)
      day = {
        id: `temp-${dayOfWeek}`,
        menuId,
        dayOfWeek,
        createdAt: new Date().toISOString(),
        meals: [],
      }
      menu.days.push(day)
      menu.days.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    }

    // Find the meal
    const mealIndex = day.meals.findIndex(m => m.mealType === mealType)

    if (plate) {
      // Upsert: create or update the meal
      const mealData: MenuMealResponse = {
        id: mealIndex >= 0 ? day.meals[mealIndex]!.id : `temp-${Date.now()}`,
        menuDayId: day.id,
        mealType,
        plateId: plate.id,
        notes: null,
        plate,
      }

      if (mealIndex >= 0) {
        day.meals[mealIndex] = mealData
      } else {
        day.meals.push(mealData)
      }
    } else {
      // Remove: delete the meal if it exists
      if (mealIndex >= 0) {
        day.meals.splice(mealIndex, 1)
      }
    }

    // Trigger reactivity by creating a new object reference
    const weekStart = menu.weekStart
    weekMenus.value.set(weekStart, { ...menu })
  }

  return {
    // State
    weekMenus,
    currentWeekStart,
    loading,
    error,
    slotLoading,
    serveLoading,
    // Getters
    currentMenu,
    menuMap,
    weekStats,
    getPlate,
    getSlotFoods,
    isSlotLoading,
    getServedAt,
    isServeLoading,
    // Actions
    fetchWeekMenu,
    ensureMenu,
    clearProfileCache,
    assignPlate,
    removePlate,
    serveMeal,
    reServeMeal,
  }
})
