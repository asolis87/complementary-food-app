/**
 * Dashboard constants — configuration and curated data.
 *
 * Spec: REQ-DASH-BIZ-05 (curated tip rotation)
 * Spec: REQ-DASH-BIZ-06 (cache strategy TTLs)
 */

import { MealType, type AgeStage } from '../types/diary.js'
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

// ── Stage-Specific Tips ───────────────────────────────────────────────────────

/**
 * Curated feeding tips per age stage based on the clinical guide
 * (Guía de alimentos, Pau Trueba).
 * NEVER generate these dynamically — always pull from this list.
 *
 * Spec: REQ-D1
 */

// 6-9 months tips (3 main meals, reflejo de protrusión desaparece, iniciar en silla)
const TIPS_6_9: readonly string[] = [
  'Alimenta despacio y con paciencia, sin forzar.',
  'Mantén contacto visual durante las comidas.',
  'Coloca la cuchara a media lengua, no en los labios.',
  'Ofrece 1 cucharada (15g) por grupo, aumentando gradualmente.',
  'Las arcadas son normales y no significan asfixia ni rechazo.',
  'Inicia sentado en la silla de alimentación, en posición recta.',
] as const

// 10-12 months tips (4 comidas, + desayuno formalizado + colación)
const TIPS_10_12: readonly string[] = [
  'Cada alimento nuevo necesita 10-15 exposiciones para ser aceptado.',
  'Ofrece el mismo alimento varias veces sin presionar.',
  'Experimenta con diferentes preparaciones y sabores.',
  'El agua se ofrece en vaso abierto o popote, no en mamila.',
  'Desde los 8 meses puedes usar condimentos, pero nunca sal ni azúcar.',
  'Evita miel, leche entera de vaca y azúcar añadida antes de los 24 meses.',
] as const

// 13-23 months tips (comida/cena + 2 colaciones)
// The clinical guide groups 13-23m as ONE block — do NOT invent differences.
const TIPS_13_23: readonly string[] = [
  'Identifica las señales de hambre y saciedad del bebé.',
  'Minimiza las distracciones durante las comidas.',
  'Ofrece hasta 4 cucharadas (60g) por grupo en cada comida.',
  'Orden en la mesa: leche → alimentos → agua.',
  'Evita alimentos redondos enteros como uvas o frutos secos por riesgo de atragantamiento.',
  'Sigue ofreciendo variedad de texturas, colores y sabores.',
] as const

export const STAGE_TIPS: Record<AgeStage, readonly string[]> = {
  SIX_TO_NINE_MONTHS: TIPS_6_9,
  TEN_TO_TWELVE_MONTHS: TIPS_10_12,
  THIRTEEN_TO_SEVENTEEN_MONTHS: TIPS_13_23,
  EIGHTEEN_TO_TWENTY_THREE_MONTHS: TIPS_13_23,
} as const

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

// ponytail: 4-meal layout places SNACK_1 between LUNCH and DINNER (afternoon
// merienda) per la guía p.5; 5-meal adds a mid-morning SNACK_1 and pushes
// the afternoon one to SNACK_2. SNACK_1 is unlabeled in the 4-meal layout
// because there's only one colación at that stage.
const SLOTS_3_MEALS: readonly MealSlotDef[] = [
  { mealType: MealType.BREAKFAST, label: 'Desayuno', icon: '🌅' },
  { mealType: MealType.LUNCH, label: 'Comida', icon: '☀️' },
  { mealType: MealType.DINNER, label: 'Cena', icon: '🌙' },
] as const

const SLOTS_4_MEALS: readonly MealSlotDef[] = [
  { mealType: MealType.BREAKFAST, label: 'Desayuno', icon: '🌅' },
  { mealType: MealType.LUNCH, label: 'Comida', icon: '☀️' },
  { mealType: MealType.SNACK_1, label: 'Colación', icon: '🍎' },
  { mealType: MealType.DINNER, label: 'Cena', icon: '🌙' },
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
 *   < 10m  → 3 main meals (BREAKFAST, LUNCH, DINNER) in chronological order
 *   10–12m → + SNACK_1 afternoon colación (merienda) between LUNCH and DINNER
 *   ≥ 13m  → + SNACK_1 mid-morning + SNACK_2 afternoon, both labeled with number
 *
 * Negatives / non-finite numbers fall through to the 3-meal case (no throw).
 */
export function getMealSlotsForAge(months: number): readonly MealSlotDef[] {
  if (!Number.isFinite(months) || months < 10) return SLOTS_3_MEALS
  if (months < 13) return SLOTS_4_MEALS
  return SLOTS_5_MEALS
}

/**
 * @deprecated use `getMealSlotsForAge(ageMonths)` instead. This constant
 * remains exported for the legacy `/api/dashboard` `mealSlots` field until
 * the API service migrates to the age-aware path (tracked in PR-2).
 */
export const LEGACY_MEAL_SLOTS: readonly MealSlotDef[] = [
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
