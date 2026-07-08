/**
 * Snack composition constants and age-based helpers.
 * REQ-SM4: Age-suggested snack composition (suggest-not-enforce).
 */

import type { FoodGroup } from '../types/food.js'

/**
 * Valid food groups for snack items (subset of FoodGroup).
 * Snacks use 2-3 of these groups (no proteins, vegetables, or dairy).
 */
export const SNACK_GROUPS = ['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT'] as const

export type SnackGroup = (typeof SNACK_GROUPS)[number]

/**
 * Get the clinically suggested food groups for a snack based on baby's age.
 * Per clinical guidelines (PDF p.5):
 * - < 10m: no snacks
 * - 10-12m: HEALTHY_FAT + CEREAL_TUBER (2 groups)
 * - ≥ 13m: HEALTHY_FAT + CEREAL_TUBER + FRUIT (3 groups)
 *
 * This is ADVISORY only — the system does NOT enforce exact composition.
 */
export function getSnackGroupsForAge(ageMonths: number): FoodGroup[] {
  // Guard invalid input (NaN/Infinity from a malformed birthDate): treat as
  // "no snack" rather than falling through to the oldest 3-group case.
  // Mirrors the Number.isFinite guard in getMealSlotsForAge (dashboard.ts).
  if (!Number.isFinite(ageMonths) || ageMonths < 10) {
    return []
  }
  if (ageMonths >= 10 && ageMonths < 13) {
    return ['HEALTHY_FAT', 'CEREAL_TUBER']
  }
  // ageMonths >= 13
  return ['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT']
}

/**
 * Get the missing snack groups for a given list of items and baby's age.
 * Returns the suggested groups that are NOT present in the items.
 * Used for non-blocking warnings in the API response.
 */
export function getMissingSnackGroups(
  items: { groupAssignment: FoodGroup }[],
  ageMonths: number,
): FoodGroup[] {
  const suggested = getSnackGroupsForAge(ageMonths)
  const present = new Set(items.map((item) => item.groupAssignment))
  return suggested.filter((group) => !present.has(group))
}

/**
 * Get the extra snack groups for a given list of items and baby's age.
 * Returns the present groups that are NOT part of the age-suggested set
 * (deduplicated, in first-seen order). Used for non-blocking warnings in the
 * API response.
 *
 * When no groups are suggested for the age (< 10 months), there is no snack
 * guidance to compare against, so nothing is flagged as extra (returns []).
 */
export function getExtraSnackGroups(
  items: { groupAssignment: FoodGroup }[],
  ageMonths: number,
): FoodGroup[] {
  const suggested = getSnackGroupsForAge(ageMonths)
  // No age context (no snacks suggested) → nothing is "extra".
  if (suggested.length === 0) {
    return []
  }
  const suggestedSet = new Set(suggested)
  const extra: FoodGroup[] = []
  const seen = new Set<FoodGroup>()
  for (const item of items) {
    const group = item.groupAssignment
    if (!suggestedSet.has(group) && !seen.has(group)) {
      seen.add(group)
      extra.push(group)
    }
  }
  return extra
}
