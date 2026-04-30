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

/** Reaction type — maps to the ReactionType Prisma enum (trimmed: ALLERGIC, GAS, RASH removed) */
export enum ReactionType {
  LIKED = 'LIKED',
  DISLIKED = 'DISLIKED',
  NEUTRAL = 'NEUTRAL',
  REJECTED = 'REJECTED',
}

/** Human-readable Spanish labels for ReactionType */
export const REACTION_TYPE_LABELS: Record<ReactionType, string> = {
  [ReactionType.LIKED]: 'Le gustó',
  [ReactionType.DISLIKED]: 'No le gustó',
  [ReactionType.NEUTRAL]: 'Sin reacción',
  [ReactionType.REJECTED]: 'Lo rechazó',
}

/** Stool type — maps to the StoolType Prisma enum */
export enum StoolType {
  NORMAL = 'NORMAL',
  LOOSE = 'LOOSE',
  HARD = 'HARD',
  NONE = 'NONE',
}

/** Human-readable Spanish labels for StoolType */
export const STOOL_LABELS: Record<StoolType, string> = {
  [StoolType.NORMAL]: 'Normal',
  [StoolType.LOOSE]: 'Laxa (diarrea)',
  [StoolType.HARD]: 'Astringida (le costó)',
  [StoolType.NONE]: 'No hubo',
}

/** Symptom type — maps to the SymptomType Prisma enum */
export enum SymptomType {
  ALLERGY_SUSPECT = 'ALLERGY_SUSPECT',
  RASH = 'RASH',
  GAS = 'GAS',
  VOMITING = 'VOMITING',
  FEVER = 'FEVER',
}

/** Human-readable Spanish labels for SymptomType */
export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  [SymptomType.ALLERGY_SUSPECT]: 'Sospecha alérgica',
  [SymptomType.RASH]: 'Sarpullido',
  [SymptomType.GAS]: 'Gases',
  [SymptomType.VOMITING]: 'Vómito',
  [SymptomType.FEVER]: 'Fiebre',
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
  /** Date of FIRST offering (YYYY-MM-DD), or null if never offered. Used to flag "primera vez" introductions. */
  firstDate: string | null
  /** Convenience flag: true if ALLERGY_SUSPECT or RASH symptom was observed on any day this food was introduced */
  hasSuspectedReaction: boolean
}

/** Map of foodId → FoodHistory, used for bulk lookup */
export type FoodHistoryMap = Record<string, FoodHistory>

/** Day-level observation — one per (babyProfileId, date), maps to the DayObservation Prisma model */
export interface DayObservation {
  id: string
  babyProfileId: string
  /** ISO date string (YYYY-MM-DD) */
  date: string
  stool: StoolType | null
  symptoms: SymptomType[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** Input for creating or updating a DayObservation (PUT /api/day-observation — idempotent upsert) */
export interface DayObservationUpsertInput {
  babyProfileId: string
  /** ISO date string (YYYY-MM-DD) */
  date: string
  stool?: StoolType | null
  symptoms?: SymptomType[]
  notes?: string | null
}

/** Input for deleting a DayObservation (DELETE /api/day-observation) */
export interface DayObservationDeleteInput {
  babyProfileId: string
  /** ISO date string (YYYY-MM-DD) */
  date: string
}
