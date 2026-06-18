/**
 * Dashboard constants — configuration and curated data.
 *
 * Spec: REQ-DASH-BIZ-05 (curated tip rotation)
 * Spec: REQ-DASH-BIZ-06 (cache strategy TTLs)
 */

import { MealType } from '../types/diary.js'
import type { FoodGroup } from '../types/food.js'

// ── Curated Balance Tips ──────────────────────────────────────────────────────

/**
 * Curated tips for the balance insight card.
 * NEVER generate these dynamically — always pull from this list.
 * Tips must be based on real food properties in the database.
 *
 * Spec: REQ-DASH-BIZ-05
 */
export const BALANCE_TIPS: readonly string[] = [
  'La avena es suave para el estómago.',
  'Las zanahorias cocidas son fáciles de digerir.',
  'El pollo es una proteína magra ideal para bebés.',
  'Las frutas como la manzana aportan fibra natural.',
  'El camote es nutritivo y de sabor dulce natural.',
  'Combinar cereales con verduras da energía sostenida.',
  'Las proteínas ayudan al crecimiento del bebé.',
  'Los tubérculos son fáciles de preparar y nutritivos.',
] as const

// ── Cache TTL Configuration ───────────────────────────────────────────────────

/**
 * Cache TTL (Time-To-Live) for each dashboard endpoint in seconds.
 *
 * Spec: REQ-DASH-BIZ-06
 */
export const DASHBOARD_CACHE_TTL = {
  /** GET /api/dashboard — consolidated response */
  dashboard: 60,
  /** GET /api/dashboard/suggestions — food suggestions */
  suggestions: 24 * 60 * 60, // 24 hours
  /** GET /api/dashboard/allergens — pending allergens */
  allergens: 60 * 60, // 1 hour
  /** GET /api/dashboard/roadmap — food progress */
  roadmap: 15 * 60, // 15 minutes
  /** GET /api/dashboard/today — real-time logs (no cache) */
  today: 0,
  /** GET /api/dashboard/balance — weekly A/L balance */
  balance: 60 * 60, // 1 hour
} as const

// ── Suggestion Configuration ──────────────────────────────────────────────────

/** Default number of suggested foods to return */
export const DEFAULT_SUGGESTIONS_LIMIT = 3

/** Maximum number of suggested foods that can be requested */
export const MAX_SUGGESTIONS_LIMIT = 10

/** Number of days to look back when excluding already-tried foods from suggestions */
export const SUGGESTION_LOOKBACK_DAYS = 30

// ── Meal Slot Configuration ───────────────────────────────────────────────────

/** The 4 meal types used for the dashboard meal slots */
export const MEAL_TYPES_FOR_SLOTS: readonly MealType[] = [
  'BREAKFAST' as MealType,
  'LUNCH' as MealType,
  'DINNER' as MealType,
  'SNACK' as MealType,
] as const

/** Static meal slot definitions — label + icon for each meal type */
export interface MealSlotDef {
  mealType: MealType
  label: string
  icon: string
}

// ponytail: keep icon style consistent with the legacy SNACK ('🍪') so 5-meal
// downstream code reads naturally. SNACK_1 is morning (apple), SNACK_2 afternoon.
const SLOTS_3_MEALS: readonly MealSlotDef[] = [
  { mealType: MealType.BREAKFAST, label: 'Desayuno', icon: '🌅' },
  { mealType: MealType.LUNCH, label: 'Comida', icon: '☀️' },
  { mealType: MealType.DINNER, label: 'Cena', icon: '🌙' },
] as const

const SLOTS_4_MEALS: readonly MealSlotDef[] = [
  ...SLOTS_3_MEALS,
  { mealType: MealType.SNACK_1, label: 'Colación', icon: '🍎' },
] as const

const SLOTS_5_MEALS: readonly MealSlotDef[] = [
  { mealType: MealType.BREAKFAST, label: 'Desayuno', icon: '🌅' },
  { mealType: MealType.SNACK_1, label: 'Colación 1', icon: '🍎' },
  { mealType: MealType.LUNCH, label: 'Comida', icon: '☀️' },
  { mealType: MealType.SNACK_2, label: 'Colación 2', icon: '🍪' },
  { mealType: MealType.DINNER, label: 'Cena', icon: '🌙' },
] as const

/**
 * Age-aware meal slot configuration. Single source of truth for all UI
 * surfaces (dashboard, menu, diary) and for any backend filter that needs to
 * know which meal types apply for a baby of `months` old.
 *
 * Stages per the clinical guide (pág. 5):
 *   < 10m  → 3 main meals (BREAKFAST, LUNCH, DINNER)
 *   10–12m → + SNACK_1 (afternoon colación per la guía, but exposed as
 *           `SNACK_1` for forward compat; UI labels it "Colación")
 *   ≥ 13m  → + SNACK_1 and SNACK_2 in chronological order
 *
 * Negatives / non-finite numbers fall through to the 3-meal case (no throw).
 */
export function getMealSlotsForAge(months: number): readonly MealSlotDef[] {
  if (!Number.isFinite(months) || months < 10) return SLOTS_3_MEALS
  if (months < 13) return SLOTS_4_MEALS
  return SLOTS_5_MEALS
}

export const DASHBOARD_MEAL_SLOTS: readonly MealSlotDef[] = [
  { mealType: 'BREAKFAST' as MealType, label: 'Desayuno', icon: '🌅' },
  { mealType: 'LUNCH' as MealType, label: 'Almuerzo', icon: '☀️' },
  { mealType: 'DINNER' as MealType, label: 'Cena', icon: '🌙' },
  { mealType: 'SNACK' as MealType, label: 'Snack', icon: '🍪' },
] as const

// ── Food Group Labels for Roadmap ─────────────────────────────────────────────

/** Spanish labels for each food group used in the roadmap card */
export const FOOD_GROUP_LABELS_DASHBOARD: Record<FoodGroup, string> = {
  FRUIT: 'Frutas',
  VEGETABLE: 'Verduras',
  PROTEIN: 'Proteínas',
  CEREAL_TUBER: 'Cereales y Tubérculos',
  HEALTHY_FAT: 'Grasas Saludables',
}
