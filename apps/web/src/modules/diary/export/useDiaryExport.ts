/**
 * useDiaryExport — composable for triggering day and week PDF exports.
 *
 * Heavy export modules (exportDayPdf, exportWeekPdf) are dynamically imported
 * so Vite can split them into a separate chunk, keeping the initial bundle lean.
 * (Design § 10: jspdf + html2canvas combined are ~600KB.)
 */

import { ref } from 'vue'
import { useDiaryStore } from '../../../shared/stores/diaryStore.js'
import { useProfileStore } from '../../../shared/stores/profileStore.js'
import { toDateOnlyString } from '../../../shared/utils/date.js'

// ── Helper: offset a YYYY-MM-DD date by N days ─────────────────────────────

function offsetDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Helper: enumerate YYYY-MM-DD strings for [from, to] inclusive ──────────

function dateRange(from: string, to: string): string[] {
  const dates: string[] = []
  let current = from
  while (current <= to) {
    dates.push(current)
    current = offsetDate(current, 1)
  }
  return dates
}

// ── Composable ─────────────────────────────────────────────────────────────

export function useDiaryExport() {
  const diaryStore = useDiaryStore()
  const profileStore = useProfileStore()

  const isExporting = ref(false)
  const exportError = ref<string | null>(null)

  // ── Export single day ────────────────────────────────────────────────────

  async function exportDay(date: string): Promise<void> {
    const babyProfile = profileStore.activeProfile
    const babyProfileId = babyProfile?.id ?? ''

    if (!babyProfile || !babyProfileId) {
      exportError.value = 'No hay perfil de bebé activo'
      return
    }

    isExporting.value = true
    exportError.value = null

    try {
      // Re-fetch to ensure fresh data for the export
      await Promise.all([
        diaryStore.fetchEntries(babyProfileId, date),
        diaryStore.fetchObservation(babyProfileId, date),
      ])

      // Filter entries for this specific date (fetchEntries may have updated selectedDate)
      const logs = diaryStore.entries.filter((e) => toDateOnlyString(e.date) === date)

      const observation = diaryStore.observationForDate(date)

      const { exportDayPdf } = await import('./exportDayPdf.js')
      await exportDayPdf({ logs, observation, babyProfile, date })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el PDF del día'
      exportError.value = msg
    } finally {
      isExporting.value = false
    }
  }

  // ── Export 7-day week ────────────────────────────────────────────────────

  async function exportWeek(endDate: string): Promise<void> {
    const babyProfile = profileStore.activeProfile
    const babyProfileId = babyProfile?.id ?? ''

    if (!babyProfile || !babyProfileId) {
      exportError.value = 'No hay perfil de bebé activo'
      return
    }

    isExporting.value = true
    exportError.value = null

    try {
      // 7-day range: endDate - 6 days → endDate (inclusive)
      const from = offsetDate(endDate, -6)
      const to = endDate

      await diaryStore.fetchRange(babyProfileId, from, to)

      // Build days array — one entry per date in [from, to]
      const allDates = dateRange(from, to)

      const days = allDates.map((date) => {
        const logs = diaryStore.entries.filter((e) => toDateOnlyString(e.date) === date)
        const observation = diaryStore.observationForDate(date)
        return { date, logs, observation }
      })

      const { exportWeekPdf } = await import('./exportWeekPdf.js')
      await exportWeekPdf({ days, babyProfile, from, to })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el PDF de la semana'
      exportError.value = msg
    } finally {
      isExporting.value = false
    }
  }

  return {
    exportDay,
    exportWeek,
    isExporting,
    exportError,
  }
}
