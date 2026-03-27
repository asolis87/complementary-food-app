/**
 * Age calculation utilities for baby profiles.
 */

/**
 * Calculate age in months from a birthdate.
 * @param birthDate - ISO date string (YYYY-MM-DD)
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Age in months (floored)
 */
export function ageInMonths(birthDate: string, referenceDate?: string): number {
  const birth = new Date(birthDate)
  const ref = referenceDate ? new Date(referenceDate) : new Date()

  const yearDiff = ref.getFullYear() - birth.getFullYear()
  const monthDiff = ref.getMonth() - birth.getMonth()

  return yearDiff * 12 + monthDiff
}

/**
 * Format age in months to a human-readable Spanish string.
 * @param months - Age in months
 * @returns e.g. "6 meses", "1 año 2 meses", "2 años"
 */
export function formatAgeEs(months: number): string {
  if (months < 0) return 'No ha nacido'
  if (months < 1) return 'Recién nacido'

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'año' : 'años'}`
  }

  return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`
}

/**
 * Check if a food is age-appropriate for a baby.
 * @param foodMinAgeMonths - Minimum age for the food
 * @param babyAgeMonths - Baby's current age in months
 */
export function isFoodAgeAppropriate(foodMinAgeMonths: number, babyAgeMonths: number): boolean {
  return babyAgeMonths >= foodMinAgeMonths
}
