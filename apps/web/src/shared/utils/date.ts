/**
 * Date helpers that tolerate the two shapes the API returns for date-like fields:
 *   - Plain calendar dates: "YYYY-MM-DD"
 *   - ISO datetimes: "YYYY-MM-DDTHH:mm:ss.sssZ" (Prisma DateTime serialization)
 *
 * Concatenating "T00:00:00" to the second shape produces an Invalid Date and
 * cascades NaN through any downstream arithmetic. These helpers normalize the
 * input first and always return a Date anchored at local midnight, so day-level
 * subtraction (e.g. age in days) is safe.
 */

/**
 * Extract the YYYY-MM-DD portion from either a string ("YYYY-MM-DD" or ISO
 * datetime) or a Date instance. Date inputs are formatted in UTC, matching
 * the legacy `.toISOString().split('T')[0]` pattern that this helper replaces.
 */
export function toDateOnlyString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0] as string
  }
  return value.split('T')[0] ?? value
}

/**
 * Parse a "YYYY-MM-DD" or ISO datetime string as a Date at local midnight.
 * Returns null when the input is empty or unparseable.
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null
  const dateOnly = toDateOnlyString(value)
  const d = new Date(dateOnly + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? null : d
}
