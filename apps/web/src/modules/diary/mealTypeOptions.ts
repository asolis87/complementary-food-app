import { MealType, getMealSlotsForAge } from '@pakulab/shared'
import type { MealSlotDef } from '@pakulab/shared'

/**
 * UI shape for the AddMealModal / EditLogModal "tipo de comida" chip row.
 * Maps a domain `MealType` to a Spanish label and a Material Symbols icon.
 *
 * Why a separate map (not the icons from `MealSlotDef`): the dashboard
 * `MealSlotDef` icons are emoji (🌅, ☀️, 🌙, 🍎, 🍪) for inline rendering
 * in card layouts. The diary modals use Material Symbols (font icon) for
 * consistency with the rest of the modal chrome. Keeping the mapping
 * local avoids dragging an icon-system concern into the shared domain.
 */
export interface MealTypeOption {
  value: MealType
  label: string
  icon: string
}

// ponytail: icon choice is a UX micro-decision, not a domain concern.
// Keeping it in this file means a future icon swap is one-line.
const ICONS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'wb_sunny',
  [MealType.LUNCH]: 'lunch_dining',
  [MealType.DINNER]: 'bedtime',
  [MealType.SNACK]: 'cookie',
  [MealType.SNACK_1]: 'cookie',
  [MealType.SNACK_2]: 'cookie',
}

const LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Desayuno',
  [MealType.LUNCH]: 'Comida',
  [MealType.DINNER]: 'Cena',
  [MealType.SNACK]: 'Colación',
  [MealType.SNACK_1]: 'Colación',
  [MealType.SNACK_2]: 'Colación',
}

function toOption(def: MealSlotDef): MealTypeOption {
  return {
    value: def.mealType,
    label: def.label,
    icon: ICONS[def.mealType] ?? 'restaurant',
  }
}

/**
 * Returns the `MealTypeOption[]` for the diary "tipo de comida" picker,
 * age-aware. Source of truth: `getMealSlotsForAge` from shared. The labels
 * from `MealSlotDef` are used as-is (already curated Spanish per the
 * clinical guide: "Desayuno", "Comida", "Cena", "Colación" / "Colación 1" /
 * "Colación 2").
 *
 * Regression note (4R reliability C1): the previous hardcoded list
 * emitted `MealType.SNACK` (the legacy enum) which is invisible to the
 * dashboard's `getMealSlotsForAge(ageMonths)` filter for any baby ≥ 10m.
 * This function only ever returns `MealType` values that appear in the
 * dashboard's slot list for the given age.
 */
export function getMealTypeOptions(ageMonths: number): MealTypeOption[] {
  return getMealSlotsForAge(ageMonths).map(toOption)
}

/**
 * Auto-selects a sensible default `MealType` based on the current hour and
 * the baby's age. Mirrors the time-of-day buckets of the previous
 * `autoSelectMealType` but is age-aware so the picker never lands on a
 * slot that does not exist for this baby's stage.
 *
 * Buckets per age group:
 *   < 10m   BREAKFAST [7-11) | LUNCH [11-15) | DINNER [15-24)         (no snacks)
 *   10-12m  BREAKFAST [7-11) | LUNCH [11-15) | SNACK_1 [15-18) | DINNER [18-24)
 *   13m+    BREAKFAST [7-9)  | SNACK_1 [9-11)  | LUNCH [11-14) | SNACK_2 [14-18) | DINNER [18-24)
 */
export function autoSelectMealTypeForAge(ageMonths: number, hour: number): MealType {
  const stage = stageForAge(ageMonths)

  if (stage === 'three') {
    if (hour >= 7 && hour < 11) return MealType.BREAKFAST
    if (hour >= 11 && hour < 15) return MealType.LUNCH
    return MealType.DINNER
  }

  if (stage === 'four') {
    if (hour >= 7 && hour < 11) return MealType.BREAKFAST
    if (hour >= 11 && hour < 15) return MealType.LUNCH
    if (hour >= 15 && hour < 18) return MealType.SNACK_1
    return MealType.DINNER
  }

  // five
  if (hour >= 7 && hour < 9) return MealType.BREAKFAST
  if (hour >= 9 && hour < 11) return MealType.SNACK_1
  if (hour >= 11 && hour < 14) return MealType.LUNCH
  if (hour >= 14 && hour < 18) return MealType.SNACK_2
  return MealType.DINNER
}

function stageForAge(ageMonths: number): 'three' | 'four' | 'five' {
  if (!Number.isFinite(ageMonths) || ageMonths < 10) return 'three'
  if (ageMonths < 13) return 'four'
  return 'five'
}
