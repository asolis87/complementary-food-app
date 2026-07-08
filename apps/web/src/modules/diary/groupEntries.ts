import type { MealLog, MealType } from '@pakulab/shared'

/**
 * A group of meal-log entries that render as a single diary card.
 *
 * Served plates and served snacks each collapse their multiple food entries
 * into ONE card. Manual single-food logs (no plateId, no snackId) are NOT
 * grouped — they stay in `standalone`.
 */
export interface MealGroup {
  /** Source id — the plateId or snackId the grouped foods came from. */
  id: string
  mealType: MealType
  time?: string
  balanceLabel: string | null
  entries: MealLog[]
}

/** Result of grouping a day's meal-log entries for the diary timeline. */
export interface GroupedEntries {
  mealGroups: MealGroup[]
  standalone: MealLog[]
}

/**
 * Groups a day's meal-log entries into plate/snack cards + standalone entries.
 *
 * Grouping rules (order matters — plateId wins over snackId):
 *   - `plateId` present → group by `plate|<plateId>|<mealType>`
 *   - else `snackId` present → group by `snack|<snackId>|<mealType>`
 *   - else → standalone (a manual single-food log)
 *
 * The `mealType` is part of the key so the same plate/snack served in two
 * different meals stays as two separate cards. Snacks carry no balance score,
 * so `balanceLabel` is `null` for a snack group.
 *
 * This is a pure function extracted from DiaryPage.vue so the grouping
 * behavior can be regression-tested without mounting the component.
 */
export function groupDiaryEntries(entries: MealLog[]): GroupedEntries {
  const groupMap = new Map<string, MealLog[]>()
  const standalone: MealLog[] = []

  for (const entry of entries) {
    // Served plates and served snacks both group their foods under one card.
    // Manual single-food logs (no plateId/snackId) stay standalone.
    if (entry.plateId) {
      // Group by plateId + mealType so the same plate in different meals stays separate
      const key = `plate|${entry.plateId}|${entry.mealType}`
      const group = groupMap.get(key) ?? []
      group.push(entry)
      groupMap.set(key, group)
    } else if (entry.snackId) {
      // Group by snackId + mealType, mirroring plates, so a served snack's
      // foods render as one card instead of one card per food.
      const key = `snack|${entry.snackId}|${entry.mealType}`
      const group = groupMap.get(key) ?? []
      group.push(entry)
      groupMap.set(key, group)
    } else {
      standalone.push(entry)
    }
  }

  const mealGroups: MealGroup[] = [...groupMap.values()].map((grouped) => ({
    id: grouped[0].plateId ?? grouped[0].snackId!,
    mealType: grouped[0].mealType,
    time: grouped[0].time ?? undefined,
    // Snacks carry no balance score; the badge is hidden via v-if.
    balanceLabel: grouped[0].plateBalanceLabel ?? null,
    entries: grouped,
  }))

  return { mealGroups, standalone }
}
