/**
 * @cfa/shared — Public API
 *
 * Shared types, constants, and utilities used by both
 * the API (apps/api) and the frontend (apps/web).
 */

// Types
export type { ALClassification, FoodGroup, Food, FoodSummary } from './types/food.js'
export { FOOD_GROUP_LABELS, AL_CLASSIFICATION_LABELS } from './types/food.js'

export type { PlateItem, Plate, CreatePlateInput, UpdatePlateInput } from './types/plate.js'

export type { UserTier, BabyProfile, AuthUser, Reaction } from './types/user.js'
export { REACTION_LABELS } from './types/user.js'

export type { BalanceLabel, BalanceResult } from './types/balance.js'

// Constants
export { TOP_ALLERGENS, ALLERGEN_KEYS, ALLERGEN_INTRO_WAIT_DAYS } from './constants/allergens.js'
export type { AllergenInfo } from './constants/allergens.js'

export {
  PLATE_LIMITS,
  BABY_PROFILE_LIMITS,
  DIARY_WINDOW_DAYS,
  FEATURE_TIERS,
  PRICING,
  TRIAL_TRIGGER,
  tierAtLeast,
} from './constants/tiers.js'

export {
  BALANCE_THRESHOLD,
  IMBALANCE_THRESHOLD,
  BALANCE_COLORS,
} from './constants/balance.js'

export { FOOD_GROUP_LABELS as FOOD_CATEGORY_LABELS, BASE_GROUPS, OPTIONAL_GROUPS } from './constants/food-groups.js'

// Utils
export { calculateBalance, getBalanceSeverity } from './utils/balance.js'
export { ageInMonths, formatAgeEs, isFoodAgeAppropriate } from './utils/age.js'
