/**
 * @pakulab/shared — Public API
 *
 * Shared types, constants, and utilities used by both
 * the API (apps/api) and the frontend (apps/web).
 */

// Types
export type { ALClassification, FoodGroup, Food, FoodSummary } from './types/food.js'
export { FOOD_GROUP_LABELS, AL_CLASSIFICATION_LABELS } from './types/food.js'

export { MealType, ReactionType } from './types/diary.js'
export type {
  MealLogFood,
  MealLog,
  CreateMealLogPayload,
  PlateBalanceLabel,
  UpdateMealLogPayload,
  FoodHistory,
  FoodHistoryMap,
} from './types/diary.js'

export type { PlateItem, PlateItemSummary, Plate, CreatePlateInput, UpdatePlateInput } from './types/plate.js'

export type {
  WeeklyMenuResponse,
  MenuDayResponse,
  MenuMealResponse,
  MealSlotPatch,
  CreateMenuPayload,
  ServeMealPayload,
  ServeMealResponse,
} from './types/menu.js'

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
  GOOD_THRESHOLD,
  BALANCE_COLORS,
} from './constants/balance.js'

export { FOOD_GROUP_LABELS as FOOD_CATEGORY_LABELS, BASE_GROUPS, OPTIONAL_GROUPS } from './constants/food-groups.js'

export {
  MEAL_KEY_TO_TYPE,
  MEAL_TYPE_TO_KEY,
  DAY_KEY_TO_INDEX,
  DAY_INDEX_TO_KEY,
  ACTIVE_MEAL_KEYS,
  DAY_KEYS,
} from './constants/mealType.js'
export type { MealKey, DayKey } from './constants/mealType.js'

// Utils
export { calculateBalance, getBalanceSeverity, derivePlateBalanceLabel } from './utils/balance.js'
export { ageInMonths, formatAgeEs, isFoodAgeAppropriate } from './utils/age.js'
