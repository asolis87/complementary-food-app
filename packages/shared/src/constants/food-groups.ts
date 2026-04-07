/**
 * Food group constants for plate composition rules.
 * BASE_GROUPS are always required; OPTIONAL_GROUPS can be toggled via groupCount.
 *
 * Source: Dra. Paulina Trueba Villaseñor — Protocolo Beikost
 * - 6-9 months: 4 groups (Cereal, Fruta, Verdura, Proteína)
 * - 10-11 months: 5 groups (+ Grasas)
 * - 12-23 months: 6 groups (+ Lácteos — not yet implemented)
 */

import type { FoodGroup } from '../types/food.js'

/** Human-readable Spanish labels — convenience re-export from food.ts */
export { FOOD_GROUP_LABELS } from '../types/food.js'

/**
 * The 4 mandatory groups always present on the plate.
 * Corresponds to groupCount = 4.
 */
export const BASE_GROUPS: FoodGroup[] = ['FRUIT', 'VEGETABLE', 'PROTEIN', 'CEREAL_TUBER']

/**
 * Optional group added when groupCount = 5.
 */
export const OPTIONAL_GROUPS: FoodGroup[] = ['HEALTHY_FAT']

/**
 * Dual-group foods: foods whose plate assignment changes based on groupCount.
 *
 * In a 4-group plate, these foods appear under their DB group (PROTEIN or VEGETABLE).
 * In a 5-group plate, they move to HEALTHY_FAT and disappear from their original group.
 *
 * Source: Dra. Paulina Trueba — in the 6-9 month table (4 groups), nuts/seeds are
 * listed under Proteínas. In the 10-11 month table (5 groups), they move to Grasas.
 * Aguacate follows Protocolo Beikost: Verdura at 6-9m, Grasa at 10+m.
 *
 * Keyed by food name (matches Food.name from the database).
 */
export const DUAL_GROUP_FOODS: Record<string, { baseGroup: FoodGroup; fiveGroupTarget: FoodGroup }> = {
  'Aguacate': { baseGroup: 'VEGETABLE', fiveGroupTarget: 'HEALTHY_FAT' },
  'Crema de cacahuate (sin sal, sin azúcar)': { baseGroup: 'PROTEIN', fiveGroupTarget: 'HEALTHY_FAT' },
  'Crema de almendras (sin sal)': { baseGroup: 'PROTEIN', fiveGroupTarget: 'HEALTHY_FAT' },
  'Marañón/Nuez de la India (crema)': { baseGroup: 'PROTEIN', fiveGroupTarget: 'HEALTHY_FAT' },
  'Nuez pecana (molida)': { baseGroup: 'PROTEIN', fiveGroupTarget: 'HEALTHY_FAT' },
  'Pistachos (molidos)': { baseGroup: 'PROTEIN', fiveGroupTarget: 'HEALTHY_FAT' },
}

/**
 * Returns the effective plate group for a food based on the current groupCount.
 *
 * - groupCount = 4 → dual foods use their baseGroup (e.g., cacahuate → PROTEIN)
 * - groupCount = 5 → dual foods use fiveGroupTarget (e.g., cacahuate → HEALTHY_FAT)
 * - Non-dual foods always return their DB group unchanged.
 *
 * Use this for filtering which foods appear in each plate zone.
 */
export function getEffectiveGroup(foodName: string, dbGroup: FoodGroup, groupCount: 4 | 5): FoodGroup {
  const dual = DUAL_GROUP_FOODS[foodName]
  if (!dual) return dbGroup
  return groupCount === 5 ? dual.fiveGroupTarget : dual.baseGroup
}
