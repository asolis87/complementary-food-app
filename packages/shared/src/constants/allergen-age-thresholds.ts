/**
 * Allergen age thresholds for the dashboard allergen alerts.
 *
 * Defines the minimum recommended age (in months) for introducing
 * each common allergen during complementary feeding.
 *
 * Based on ESPGHAN and AAP guidelines: window of opportunity is 6-12 months.
 *
 * Spec: REQ-DASH-BIZ-02 (Allergen Window Logic)
 */

/** Minimum age in months before allergen alerts are shown */
export const DEFAULT_ALLERGEN_MIN_AGE_MONTHS = 6

/** Age in months at which urgency becomes 'closing_window' */
export const CLOSING_WINDOW_AGE_MONTHS = 10

/** An allergen entry with its minimum introduction age */
export interface AllergenAgeThreshold {
  allergenKey: string
  nameEs: string
  icon: string
  minAgeMonths: number
}

/**
 * Top 9 allergens with their minimum recommended introduction age.
 * All start at 6 months — the recommended window opens at 6 months.
 */
export const ALLERGEN_AGE_THRESHOLDS: readonly AllergenAgeThreshold[] = [
  { allergenKey: 'leche', nameEs: 'Leche / Lácteos', icon: '🥛', minAgeMonths: 6 },
  { allergenKey: 'huevo', nameEs: 'Huevo', icon: '🥚', minAgeMonths: 6 },
  { allergenKey: 'cacahuate', nameEs: 'Cacahuate', icon: '🥜', minAgeMonths: 6 },
  { allergenKey: 'pescado', nameEs: 'Pescado / Mariscos', icon: '🐟', minAgeMonths: 6 },
  { allergenKey: 'soya', nameEs: 'Soya', icon: '🫘', minAgeMonths: 6 },
  { allergenKey: 'gluten', nameEs: 'Trigo / Gluten', icon: '🌾', minAgeMonths: 6 },
  { allergenKey: 'nueces', nameEs: 'Nueces / Frutos secos', icon: '🌰', minAgeMonths: 6 },
  { allergenKey: 'ajonjoli', nameEs: 'Ajonjolí (Sésamo)', icon: '🌱', minAgeMonths: 6 },
  { allergenKey: 'mostaza', nameEs: 'Mostaza', icon: '🌿', minAgeMonths: 6 },
] as const
