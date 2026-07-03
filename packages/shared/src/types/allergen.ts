/**
 * Allergen tracker types — shared contract for GET /api/allergens/status.
 * Consumed by the API service (response) and the web AllergenTrackerCard.
 */

/** Introduction status of a single priority allergen for a baby. */
export interface AllergenEntry {
  type: string
  name: string
  status: 'introduced' | 'pending' | 'in_window'
  introducedAt: string | null
  exposureCount: number
  lastReaction: string | null
}

/** Response payload of GET /api/allergens/status. */
export interface AllergenStatusResponse {
  ageMonths: number
  closingWindow: boolean
  allergens: AllergenEntry[]
}
