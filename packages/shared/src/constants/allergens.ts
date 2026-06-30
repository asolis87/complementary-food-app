/**
 * Top 9 allergens to track during complementary food introduction.
 * Based on ESPGHAN and AAP guidelines.
 */

export interface AllergenInfo {
  key: string
  nameEs: string
  icon: string // emoji icon for badges
}

/** The top 10 allergens for complementary feeding tracking */
export const TOP_ALLERGENS: AllergenInfo[] = [
  { key: 'leche', nameEs: 'Leche / Lácteos', icon: '🥛' },
  { key: 'huevo', nameEs: 'Huevo', icon: '🥚' },
  { key: 'cacahuate', nameEs: 'Cacahuate', icon: '🥜' },
  { key: 'pescado', nameEs: 'Pescado', icon: '🐟' },
  { key: 'mariscos', nameEs: 'Mariscos', icon: '🦐' },
  { key: 'soya', nameEs: 'Soya', icon: '🫘' },
  { key: 'gluten', nameEs: 'Trigo / Gluten', icon: '🌾' },
  { key: 'nueces', nameEs: 'Nueces / Frutos secos', icon: '🌰' },
  { key: 'ajonjoli', nameEs: 'Ajonjolí (Sésamo)', icon: '🌱' },
  { key: 'mostaza', nameEs: 'Mostaza', icon: '🌿' },
]

export const ALLERGEN_KEYS = TOP_ALLERGENS.map((a) => a.key)

/** Days to wait between introducing new allergens (3-day protocol) */
export const ALLERGEN_INTRO_WAIT_DAYS = 3

/**
 * Mapping from English allergen keys (used in logs/analytics) to Spanish seed allergenType values.
 *
 * Clinical source: Top 9 allergens per ESPGHAN/AAP guidelines.
 *
 * Why 9 instead of 10: mostaza (mustard) is in TOP_ALLERGENS for roadmap/dashboard UI
 * but isn't tracked via Food.allergenType in seed yet. This mapping covers the 9 seed-tracked types.
 *
 * Celery (apio) is intentionally excluded (not a priority allergen for Mexican complementary feeding).
 */
export const ALLERGEN_TYPE_MAPPING: Record<string, string> = {
  dairy: 'leche',
  egg: 'huevo',
  peanut: 'cacahuate',
  fish: 'pescado',
  shellfish: 'mariscos',
  soy: 'soya',
  gluten: 'gluten',
  tree_nuts: 'nueces',
  sesame: 'ajonjoli',
}
