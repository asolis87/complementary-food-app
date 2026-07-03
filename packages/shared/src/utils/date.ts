/**
 * Date utility functions.
 */

/**
 * Calculate age in complete months from a birth date.
 * @param birthDate - Birth date as Date object or ISO string
 * @param referenceDate - Reference date for calculation (defaults to now)
 * @returns Age in complete months (0-based)
 */
export function getAgeMonths(
  birthDate: string | Date,
  referenceDate: Date = new Date(),
): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const ref = referenceDate

  // Guard invalid input: an unparseable date must not leak NaN into the age
  // (NaN < 10 is false, so it would silently suggest the oldest stage/group count).
  if (Number.isNaN(birth.getTime())) {
    return 0
  }

  // Calculate year and month difference
  let months = (ref.getFullYear() - birth.getFullYear()) * 12
  months += ref.getMonth() - birth.getMonth()

  // If birthday hasn't occurred yet this month, subtract one
  if (ref.getDate() < birth.getDate()) {
    months -= 1
  }

  return Math.max(0, months)
}
