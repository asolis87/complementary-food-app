/**
 * Top 9 allergens to track during complementary food introduction.
 * Based on ESPGHAN and AAP guidelines.
 */

export interface AllergenInfo {
  key: string
  nameEs: string
  icon: string // emoji icon for badges
}

/** The top 9 allergens for complementary feeding tracking */
export const TOP_ALLERGENS: AllergenInfo[] = [
  { key: 'leche', nameEs: 'Leche / Lácteos', icon: '🥛' },
  { key: 'huevo', nameEs: 'Huevo', icon: '🥚' },
  { key: 'cacahuate', nameEs: 'Cacahuate', icon: '🥜' },
  { key: 'pescado', nameEs: 'Pescado / Mariscos', icon: '🐟' },
  { key: 'soya', nameEs: 'Soya', icon: '🫘' },
  { key: 'gluten', nameEs: 'Trigo / Gluten', icon: '🌾' },
  { key: 'nueces', nameEs: 'Nueces / Frutos secos', icon: '🌰' },
  { key: 'ajonjoli', nameEs: 'Ajonjolí (Sésamo)', icon: '🌱' },
  { key: 'mostaza', nameEs: 'Mostaza', icon: '🌿' },
]

export const ALLERGEN_KEYS = TOP_ALLERGENS.map((a) => a.key)

/** Days to wait between introducing new allergens (3-day protocol) */
export const ALLERGEN_INTRO_WAIT_DAYS = 3
