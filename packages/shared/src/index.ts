/**
 * @pakulab/shared — Public API
 *
 * Shared types, constants, and utilities used by both
 * the API (apps/api) and the frontend (apps/web).
 */

// Types
export type { ALClassification, FoodGroup, Food, FoodSummary, WarningTag } from './types/food.js'
export { FOOD_GROUP_LABELS, AL_CLASSIFICATION_LABELS, WARNING_TAGS, WARNING_TAG_LABELS, WARNING_DISCLAIMER } from './types/food.js'

export { MealType, ReactionType, StoolType, SymptomType, REACTION_TYPE_LABELS, STOOL_LABELS, SYMPTOM_LABELS } from './types/diary.js'
export type {
  AgeStage,
  MealLogFood,
  MealLog,
  CreateMealLogPayload,
  PlateBalanceLabel,
  UpdateMealLogPayload,
  FoodHistory,
  FoodHistoryMap,
  DayObservation,
  DayObservationUpsertInput,
  DayObservationDeleteInput,
} from './types/diary.js'

export type { PlateItem, PlateItemSummary, Plate, CreatePlateInput, UpdatePlateInput, PlateStage } from './types/plate.js'
export { PLATE_STAGES, PLATE_STAGE_LABELS, getSuggestedGroupCount, getSuggestedStageForAge } from './types/plate.js'

export type {
  WeeklyMenuResponse,
  MenuDayResponse,
  MenuMealResponse,
  MealSlotPatch,
  CreateMenuPayload,
  ServeMealPayload,
  ServeMealResponse,
} from './types/menu.js'

export type { UserTier, SubscriptionStatus, BabyProfile, AuthUser } from './types/user.js'

export type { BalanceLabel, BalanceResult } from './types/balance.js'

export type {
  DashboardData,
  BabyContext,
  TodayLog,
  SuggestedFood,
  AllergenAlert,
  RoadmapProgress,
  RoadmapFood,
  BalanceInsight,
  MealSlot,
} from './types/dashboard.js'

// Constants
export { TOP_ALLERGENS, ALLERGEN_KEYS, ALLERGEN_INTRO_WAIT_DAYS, ALLERGEN_TYPE_MAPPING } from './constants/allergens.js'
export type { AllergenInfo } from './constants/allergens.js'

export {
  TRIAL_DURATION_DAYS,
  TRIAL_PLAN,
  PLATE_LIMITS,
  BABY_PROFILE_LIMITS,
  DIARY_WINDOW_DAYS,
  FEATURE_TIERS,
  PRICING,
  tierAtLeast,
} from './constants/tiers.js'

export {
  BALANCE_THRESHOLD,
  IMBALANCE_THRESHOLD,
  GOOD_THRESHOLD,
  BALANCE_COLORS,
} from './constants/balance.js'

export { FOOD_GROUP_LABELS as FOOD_CATEGORY_LABELS, BASE_GROUPS, OPTIONAL_GROUPS, DUAL_GROUP_FOODS, getEffectiveGroup } from './constants/food-groups.js'

export { DISCLAIMER_CURRENT_VERSION } from './constants/disclaimer.js'

export {
  MEAL_KEY_TO_TYPE,
  MEAL_TYPE_TO_KEY,
  DAY_KEY_TO_INDEX,
  DAY_INDEX_TO_KEY,
  ACTIVE_MEAL_KEYS,
  DAY_KEYS,
} from './constants/mealType.js'
export type { MealKey, DayKey } from './constants/mealType.js'

// Dashboard constants
export {
  BALANCE_TIPS,
  STAGE_TIPS,
  DASHBOARD_CACHE_TTL,
  DEFAULT_SUGGESTIONS_LIMIT,
  MAX_SUGGESTIONS_LIMIT,
  SUGGESTION_LOOKBACK_DAYS,
  MEAL_TYPES_FOR_SLOTS,
  FOOD_GROUP_LABELS_DASHBOARD,
  getMealSlotsForAge,
  LEGACY_MEAL_SLOTS,
} from './constants/dashboard.js'
export type { MealSlotDef } from './constants/dashboard.js'

export {
  ALLERGEN_AGE_THRESHOLDS,
  DEFAULT_ALLERGEN_MIN_AGE_MONTHS,
  CLOSING_WINDOW_AGE_MONTHS,
} from './constants/allergen-age-thresholds.js'
export type { AllergenAgeThreshold } from './constants/allergen-age-thresholds.js'

// Utils
export { calculateBalance, getBalanceSeverity, derivePlateBalanceLabel } from './utils/balance.js'
export { ageInMonths, formatAgeEs, isFoodAgeAppropriate } from './utils/age.js'
export { getAgeMonths } from './utils/date.js'

// Data
export { foods } from './data/food-catalog.js'
export type { FoodSeed } from './data/food-catalog.js'
