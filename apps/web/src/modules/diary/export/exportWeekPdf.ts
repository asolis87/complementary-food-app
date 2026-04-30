/**
 * exportWeekPdf — client-side 7-day PDF generation (REQ-C2 / REQ-C3).
 *
 * Iterates 7 days sequentially. Each day is mounted, captured, added as a
 * separate page, then unmounted before the next day is processed.
 * Days with no logs AND no observation still render (DayDetailSection shows
 * "Sin comidas registradas" + "Sin observación registrada") — satisfying REQ-C2.
 *
 * v1 limitation: single-day content that overflows one A4 page is clipped.
 */

import { createApp, nextTick } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { MealLog, DayObservation, BabyProfile } from '@pakulab/shared'
import PdfTemplate from './pdfTemplate.vue'

// ── Types ──────────────────────────────────────────────────────────────────

export interface WeekDay {
  date: string          // YYYY-MM-DD
  logs: MealLog[]
  observation: DayObservation | null
}

export interface ExportWeekPdfOptions {
  days: WeekDay[]       // must be length 7, chronological order
  babyProfile: BabyProfile
  from: string          // YYYY-MM-DD
  to: string            // YYYY-MM-DD
}

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Main export function ───────────────────────────────────────────────────

export async function exportWeekPdf({
  days,
  babyProfile,
  from,
  to,
}: ExportWeekPdfOptions): Promise<void> {
  // A4 in points (portrait)
  const pdfWidth = 595

  let pdf: jsPDF | null = null

  for (let i = 0; i < days.length; i++) {
    const day = days[i]

    const container = document.createElement('div')
    container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 794px; background: #fff;'
    document.body.appendChild(container)

    const app = createApp(PdfTemplate, {
      logs: day.logs,
      observation: day.observation,
      babyProfile,
      date: day.date,
    })

    try {
      app.mount(container)

      // Wait one frame for the Vue render to flush to the DOM
      await nextTick()

      const templateRoot = container.firstElementChild as HTMLElement
      if (!templateRoot) throw new Error(`pdfTemplate: root element not found for day ${day.date}`)

      const canvas = await html2canvas(templateRoot, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      })

      const pdfHeight = (canvas.height / canvas.width) * pdfWidth

      if (i === 0) {
        // First page — create the document
        pdf = new jsPDF({
          format: 'a4',
          orientation: 'portrait',
          unit: 'pt',
        })
      } else {
        // Subsequent pages
        pdf!.addPage()
      }

      pdf!.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight)
    } catch (err) {
      console.error(`[exportWeekPdf] Error generating page for day ${day.date}:`, err)
      throw err
    } finally {
      // Always unmount + cleanup before processing next day
      app.unmount()
      container.remove()
    }
  }

  if (!pdf) throw new Error('[exportWeekPdf] No pages were generated')

  const babySlug = slugify(babyProfile.name)
  const filename = `bitacora-${babySlug}-${from}_a_${to}.pdf`
  pdf.save(filename)
}
