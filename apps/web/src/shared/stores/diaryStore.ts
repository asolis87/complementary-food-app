/**
 * Diary / food-log Pinia store.
 * Manages meal log entries, date selection, and API sync.
 * Design: Composition API, online-first, server-synced state.
 */

import type { MealLog, MealType, CreateMealLogPayload, UpdateMealLogPayload } from '@pakulab/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient } from '../api/client.js'

export const useDiaryStore = defineStore('diary', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  const entries = ref<MealLog[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0])

  // ─── Getters ──────────────────────────────────────────────────────────────

  /** Entries filtered to the currently selected date */
  const entriesForDate = computed<MealLog[]>(() =>
    entries.value.filter((e) => {
      // Prisma returns date as ISO string "2026-04-01T00:00:00.000Z"
      // selectedDate is "2026-04-01" — normalize both to YYYY-MM-DD
      const entryDate = typeof e.date === 'string' ? e.date.split('T')[0] : ''
      return entryDate === selectedDate.value
    }),
  )

  /** Entries grouped by meal type for the selected date */
  const entriesGroupedByMeal = computed<Record<MealType, MealLog[]>>(() => {
    const groups = {} as Record<MealType, MealLog[]>
    for (const entry of entriesForDate.value) {
      if (!groups[entry.mealType]) groups[entry.mealType] = []
      groups[entry.mealType].push(entry)
    }
    return groups
  })

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
    entries.value.unshift(result.data)
    return result.data
  }

  /** PATCH an existing meal log entry (reaction, accepted, notes) */
  async function updateEntry(id: string, payload: UpdateMealLogPayload): Promise<MealLog> {
    const result = await apiClient.patch<{ data: MealLog }>(`/diary/${id}`, payload)
    const idx = entries.value.findIndex((e) => e.id === id)
    if (idx !== -1) entries.value[idx] = result.data
    return result.data
  }

  /** Soft-delete a meal log entry */
  async function deleteEntry(id: string): Promise<void> {
    await apiClient.delete(`/diary/${id}`)
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  /** Update the active date and refresh entries */
  function setSelectedDate(date: string): void {
    selectedDate.value = date
  }

  return {
    // State
    entries,
    loading,
    error,
    selectedDate,
    // Getters
    entriesForDate,
    entriesGroupedByMeal,
    // Actions
    fetchEntries,
    logMeal,
    updateEntry,
    deleteEntry,
    setSelectedDate,
  }
})
