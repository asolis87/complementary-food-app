/**
 * Food group constants for plate composition rules.
 * BASE_GROUPS are always required; OPTIONAL_GROUPS can be toggled via groupCount.
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
