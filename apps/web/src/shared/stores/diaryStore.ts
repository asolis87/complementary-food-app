/**
 * Diary / food-log Pinia store.
 * Manages meal log entries, day observations, date selection, and API sync.
 * Design: Composition API, online-first, server-synced state.
 *
 * babyProfileId convention: follows the existing fetchEntries pattern —
 * callers pass babyProfileId explicitly. This matches how DiaryPage.vue
 * reads it from profileStore and passes it down. The store does not import
 * profileStore to avoid circular store dependencies.
 */

import { MealType } from '@pakulab/shared'
import type {
  MealLog,
  CreateMealLogPayload,
  UpdateMealLogPayload,
  DayObservation,
  DayObservationUpsertInput,
} from '@pakulab/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient } from '../api/client.js'
import { toDateOnlyString } from '../utils/date.js'

import { useDashboardStore } from './dashboardStore.js'
import { useFoodHistoryStore } from './foodHistoryStore.js'

export const useDiaryStore = defineStore('diary', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  const entries = ref<MealLog[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const now = new Date()
  const selectedDate = ref<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  )

  /**
   * Cache of day observations keyed by YYYY-MM-DD date string.
   * - Map key exists + value is DayObservation: fetched, observation present
   * - Map key exists + value is null: fetched, confirmed empty for that date
   * - Map.get() returns undefined: not yet fetched for that date
   */
  const observationsByDate = ref<Map<string, DayObservation | null>>(new Map())

  // ─── Getters ──────────────────────────────────────────────────────────────

  const MEAL_TYPE_ORDER: Record<MealType, number> = {
    [MealType.BREAKFAST]: 1,
    [MealType.SNACK_1]:   2,
    [MealType.LUNCH]:     3,
    [MealType.SNACK_2]:   4,
    [MealType.DINNER]:    5,
    [MealType.SNACK]:     6,
  }

  /** Entries filtered to the currently selected date and sorted chronologically */
  const entriesForDate = computed<MealLog[]>(() => {
    const filtered = entries.value.filter((e) => toDateOnlyString(e.date) === selectedDate.value)
    return [...filtered].sort((a, b) => {
      // 1. Sort by mealType order first
      const orderA = MEAL_TYPE_ORDER[a.mealType] ?? 99
      const orderB = MEAL_TYPE_ORDER[b.mealType] ?? 99
      if (orderA !== orderB) {
        return orderA - orderB
      }
      // 2. If same mealType, sort by time if available
      if (a.time && b.time) {
        return a.time.localeCompare(b.time)
      }
      if (a.time) return -1
      if (b.time) return 1
      // 3. Otherwise, fallback to creation order (ascending: older first)
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return timeA - timeB
    })
  })

  /** Entries grouped by meal type for the selected date */
  const entriesGroupedByMeal = computed<Record<MealType, MealLog[]>>(() => {
    const groups = {} as Record<MealType, MealLog[]>
    for (const entry of entriesForDate.value) {
      if (!groups[entry.mealType]) groups[entry.mealType] = []
      groups[entry.mealType].push(entry)
    }
    return groups
  })

  /**
   * Returns the cached observation for a given date, or null if confirmed empty.
   * Returns null (not undefined) when the date key is absent — callers that need
   * to distinguish "not fetched yet" from "fetched + empty" should read
   * observationsByDate.value.get(date) directly (undefined = not fetched).
   */
  function observationForDate(date: string): DayObservation | null {
    return observationsByDate.value.get(date) ?? null
  }

  /** Observation for the currently selected date (reactive computed) */
  const observationForSelectedDate = computed<DayObservation | null>(
    () => observationsByDate.value.get(selectedDate.value) ?? null,
  )

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Fetch diary entries for a baby profile, optionally filtered by date.
   * Updates selectedDate when a date is passed.
   */
  async function fetchEntries(babyProfileId: string, date?: string): Promise<void> {
    if (!babyProfileId) return

    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({ babyProfileId })
      const targetDate = date ?? selectedDate.value
      if (targetDate) params.set('date', targetDate)

      const result = await apiClient.get<{ data: MealLog[] }>(`/diary?${params.toString()}`)
      entries.value = result.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el diario'
    } finally {
      loading.value = false
    }
  }

  /** POST a new meal log entry, prepend to local state */
  async function logMeal(payload: CreateMealLogPayload): Promise<MealLog> {
    const result = await apiClient.post<{ data: MealLog }>('/diary', payload)
    
    // Invalidate dashboard and food history caches
    useDashboardStore().invalidate()
    useFoodHistoryStore().invalidateFood(result.data.babyProfileId, result.data.foodId)

    entries.value.unshift(result.data)
    return result.data
  }

  /** PATCH an existing meal log entry (reaction, accepted, notes) */
  async function updateEntry(id: string, payload: UpdateMealLogPayload): Promise<MealLog> {
    const originalEntry = entries.value.find((e) => e.id === id)
    const result = await apiClient.patch<{ data: MealLog }>(`/diary/${id}`, payload)
    
    // Invalidate dashboard and food history caches
    useDashboardStore().invalidate()
    if (originalEntry) {
      useFoodHistoryStore().invalidateFood(originalEntry.babyProfileId, originalEntry.foodId)
    }
    useFoodHistoryStore().invalidateFood(result.data.babyProfileId, result.data.foodId)

    const idx = entries.value.findIndex((e) => e.id === id)
    if (idx !== -1) entries.value[idx] = result.data
    return result.data
  }

  /** Soft-delete a meal log entry */
  async function deleteEntry(id: string): Promise<void> {
    const entryToDelete = entries.value.find((e) => e.id === id)
    await apiClient.delete(`/diary/${id}`)
    
    // Invalidate dashboard and food history caches
    useDashboardStore().invalidate()
    if (entryToDelete) {
      useFoodHistoryStore().invalidateFood(entryToDelete.babyProfileId, entryToDelete.foodId)
    }

    entries.value = entries.value.filter((e) => e.id !== id)
  }

  /**
   * Fetch the DayObservation for a given (babyProfileId, date).
   * Stores result (or null for confirmed-empty) in observationsByDate.
   * Returns the observation or null.
   */
  async function fetchObservation(babyProfileId: string, date: string): Promise<DayObservation | null> {
    if (!babyProfileId) return null

    try {
      const params = new URLSearchParams({ babyProfileId, date })
      const result = await apiClient.get<{ data: DayObservation | null }>(
        `/day-observation?${params.toString()}`,
      )
      const observation = result.data ?? null
      observationsByDate.value.set(date, observation)
      return observation
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar la observación del día'
      return null
    }
  }

  /**
   * Idempotent upsert for a DayObservation (PUT /api/day-observation).
   * Writes the returned row into the local cache keyed by input.date.
   */
  async function upsertObservation(input: DayObservationUpsertInput): Promise<DayObservation> {
    const result = await apiClient.put<{ data: DayObservation }>('/day-observation', input)
    const observation = result.data
    observationsByDate.value.set(input.date, observation)
    return observation
  }

  /**
   * Delete the DayObservation for the given (babyProfileId, date).
   * On success, caches null for that date (confirmed empty — avoids a refetch).
   */
  async function deleteObservation(babyProfileId: string, date: string): Promise<void> {
    const params = new URLSearchParams({ babyProfileId, date })
    await apiClient.delete(`/day-observation?${params.toString()}`)
    // Set to null (confirmed empty) rather than removing — prevents spurious refetches
    observationsByDate.value.set(date, null)
  }

  /**
   * Fetch a date range of logs + observations (GET /api/diary/range).
   * Hydrates both the entries cache (replaces current entries) and observationsByDate.
   * Days in the range that have no observation are set to null in the map.
   *
   * @param babyProfileId - the baby profile to query
   * @param from - YYYY-MM-DD start (inclusive)
   * @param to   - YYYY-MM-DD end (inclusive), max 31 days ahead of from
   */
  async function fetchRange(
    babyProfileId: string,
    from: string,
    to: string,
  ): Promise<{ logs: MealLog[]; observations: DayObservation[] }> {
    const params = new URLSearchParams({ babyProfileId, from, to })
    const result = await apiClient.get<{
      data: { logs: MealLog[]; observations: DayObservation[] }
    }>(`/diary/range?${params.toString()}`)
    const payload = result.data

    // Hydrate entries (replace — caller owns the range context)
    entries.value = payload.logs

    // Hydrate observations: first, mark every day in the range as null (confirmed empty),
    // then overwrite with actual observations returned. This ensures days without
    // observations are cached as null and won't trigger individual fetches later.
    const rangeStart = new Date(from + 'T00:00:00')
    const rangeEnd = new Date(to + 'T00:00:00')
    for (const d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      observationsByDate.value.set(key, null)
    }
    for (const obs of payload.observations) {
      observationsByDate.value.set(toDateOnlyString(obs.date), obs)
    }

    return payload
  }

  /**
   * Update the active date.
   * When babyProfileId is provided, triggers fetchEntries and fetchObservation
   * in parallel via Promise.all so both requests fire simultaneously.
   *
   * DiaryPage.vue can call this with babyProfileId to get parallel fetches,
   * or call setSelectedDate(date) + fetchEntries(id, date) separately (existing pattern).
   */
  function setSelectedDate(date: string, babyProfileId?: string): void {
    selectedDate.value = date
    if (babyProfileId) {
      // Fire both fetches in parallel — do not await; caller can await the returned promise if needed
      void Promise.all([fetchEntries(babyProfileId, date), fetchObservation(babyProfileId, date)])
    }
  }

  return {
    // State
    entries,
    loading,
    error,
    selectedDate,
    observationsByDate,
    // Getters
    entriesForDate,
    entriesGroupedByMeal,
    observationForDate,
    observationForSelectedDate,
    // Actions
    fetchEntries,
    logMeal,
    updateEntry,
    deleteEntry,
    fetchObservation,
    upsertObservation,
    deleteObservation,
    fetchRange,
    setSelectedDate,
  }
})
