/**
 * Diary / food-log types for Pakulab.
 * These mirror the Prisma schema enums for use on both the API and the frontend.
 */

/** Meal type — maps to the MealType Prisma enum */
export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK_1 = 'SNACK_1',
  SNACK_2 = 'SNACK_2',
  SNACK = 'SNACK',
}

/** Reaction type — maps to the ReactionType Prisma enum */
export enum ReactionType {
  LIKED = 'LIKED',
  DISLIKED = 'DISLIKED',
  NEUTRAL = 'NEUTRAL',
  ALLERGIC = 'ALLERGIC',
  GAS = 'GAS',
  RASH = 'RASH',
}

/** Food data included in a meal log entry */
export interface MealLogFood {
  id: string
  name: string
  group: string
  isAllergen: boolean
}

/** A meal log record as returned by the API
 *  Each entry tracks ONE food item with its reaction/status
 */
export interface MealLog {
  id: string
  date: string          // ISO date string (YYYY-MM-DD)
  time?: string         // HH:mm format
  mealType: MealType
  reaction: ReactionType | null  // Nullable — filled in during review moment
  accepted?: boolean | null      // Whether parent accepted the food after review
  plateBalanceLabel?: PlateBalanceLabel | null  // Snapshot of plate A/L label at log time
  notes?: string
  plateId?: string
  foodId: string        // Single food per entry
  food?: MealLogFood    // Populated food details
  babyProfileId: string
  userId: string
  createdAt: string
  deletedAt?: string
}

/** Payload sent to POST /api/diary
 *  Single food per entry - simplified tracking model
 */
export interface CreateMealLogPayload {
  date: string          // YYYY-MM-DD
  time?: string         // HH:mm
  mealType: MealType
  reaction?: ReactionType  // Optional — no default on server
  plateBalanceLabel?: PlateBalanceLabel
  notes?: string
  plateId?: string
  babyProfileId: string
  foodId: string        // Single food per entry (replaces items array)
}

/** Plate balance label — snapshot of A/L state at log time */
export type PlateBalanceLabel =
  | 'BALANCED'
  | 'SLIGHTLY_ASTRINGENT'
  | 'VERY_ASTRINGENT'
  | 'SLIGHTLY_LAXATIVE'
  | 'VERY_LAXATIVE'

/** Payload sent to PATCH /api/diary/:id
 *  Used during the review moment to fill in reaction, acceptance, and notes
 */
export interface UpdateMealLogPayload {
  reaction?: ReactionType | null
  accepted?: boolean | null
  notes?: string | null
}

/** Food history summary for display in food selection UI.
 *  Aggregates all FoodLog entries for a specific food + baby profile.
 */
export interface FoodHistory {
  /** The food ID this history refers to */
  foodId: string
  /** Total times this food has been offered to the baby */
  timesOffered: number
  /** Deduplicated list of reactions observed (empty if never offered or no reaction logged) */
  reactions: ReactionType[]
  /** Most recent reaction logged, or null if never offered or no reaction */
  lastReaction: ReactionType | null
  /** Date of last offering (YYYY-MM-DD), or null if never offered */
  lastDate: string | null
  /** Convenience flag: true if ALLERGIC or RASH is in reactions */
  hasAllergyReaction: boolean
}

/** Map of foodId → FoodHistory, used for bulk lookup */
export type FoodHistoryMap = Record<string, FoodHistory>
