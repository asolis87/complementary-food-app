/**
 * exportDayPdf — client-side single-day PDF generation (REQ-C1 / REQ-C3).
 *
 * Mounts pdfTemplate.vue off-screen, captures with html2canvas,
 * then converts the canvas to an A4 jsPDF document and triggers download.
 *
 * Design constraints (§ 6):
 *   - Off-screen wrapper: position: absolute; left: -9999px (absolute is fine;
 *     fixed/sticky are forbidden INSIDE the template component).
 *   - html2canvas: useCORS: true, scale: 2, backgroundColor: '#ffffff', windowWidth: 794
 *   - jsPDF: format: 'a4', orientation: 'portrait', unit: 'pt'
 *   - v1 limitation: if the rendered day exceeds one A4 page height, the content is clipped.
 */

import { createApp, nextTick } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { MealLog, DayObservation, BabyProfile } from '@pakulab/shared'
import PdfTemplate from './pdfTemplate.vue'

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExportDayPdfOptions {
  logs: MealLog[]
  observation: DayObservation | null
  babyProfile: BabyProfile
  date: string // YYYY-MM-DD
  firstDateByFoodId?: Record<string, string | null>
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Slugify a baby name for use in the filename */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Main export function ───────────────────────────────────────────────────

/**
 * Generate and download a single-day PDF.
 * Throws on error so the caller (useDiaryExport) can surface it to the user.
 */
export async function exportDayPdf({
  logs,
  observation,
  babyProfile,
  date,
  firstDateByFoodId,
}: ExportDayPdfOptions): Promise<void> {
  // Off-screen container — position: absolute on the WRAPPER is acceptable;
  // the hard constraint forbids fixed/sticky INSIDE the template component.
  const container = document.createElement('div')
  container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 794px; background: #fff;'
  document.body.appendChild(container)

  const app = createApp(PdfTemplate, {
    logs,
    observation,
    babyProfile,
    date,
    firstDateByFoodId,
  })

  try {
    app.mount(container)

    // Wait one frame for the Vue render to flush to the DOM
    await nextTick()

    const templateRoot = container.firstElementChild as HTMLElement
    if (!templateRoot) throw new Error('pdfTemplate: root element not found after mount')

    const canvas = await html2canvas(templateRoot, {
      useCORS: true,
      scale: 2,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    })

    // A4 in points: 595pt × 841pt (portrait)
    const pdfWidth = 595
    const pdfHeight = (canvas.height / canvas.width) * pdfWidth

    const pdf = new jsPDF({
      format: 'a4',
      orientation: 'portrait',
      unit: 'pt',
    })

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight)

    const filename = `bitacora-${slugify(babyProfile.name)}-${date}.pdf`
    pdf.save(filename)
  } catch (err) {
    console.error('[exportDayPdf] Error generating PDF:', err)
    throw err
  } finally {
    app.unmount()
    container.remove()
  }
}
