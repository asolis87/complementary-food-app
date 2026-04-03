/**
 * Pure utility functions for the diary module.
 * Extracted for testability — no I/O, no side effects.
 *
 * Spec: Plato↔Bitácora Connection — AD-1 (findMany + JS reduce)
 */

import type { FoodHistory, ReactionType as SharedReactionType } from '@pakulab/shared'
import type { ReactionType as PrismaReactionType } from '@prisma/client'

export interface FoodLogEntry {
  foodId: string
  reaction: PrismaReactionType | null
  date: Date
}

/**
 * Aggregates raw FoodLog entries into a FoodHistory map.
 *
 * Design: AD-1 — findMany + JS reduce pattern.
 *
 * - timesOffered: count of entries per food
 * - reactions: deduplicated non-null reactions
 * - lastReaction: most recent entry WHERE reaction IS NOT NULL
 * - lastDate: date of the most recent entry (regardless of reaction)
 * - hasAllergyReaction: true when ALLERGIC or RASH is present
 *
 * @param entries  FoodLog rows from Prisma (ordered by date DESC)
 * @param requestedFoodIds  All food IDs requested — ensures every ID gets an entry even if never offered
 * @returns Record<foodId, FoodHistory>
 */
export function aggregateFoodHistory(
  entries: FoodLogEntry[],
  requestedFoodIds: string[],
): Record<string, FoodHistory> {
  const initial: Record<string, FoodHistory> = {}

  // Seed with zeroed-out entries for every requested food
  for (const foodId of requestedFoodIds) {
    initial[foodId] = {
      foodId,
      timesOffered: 0,
      reactions: [],
      lastReaction: null,
      lastDate: null,
      hasAllergyReaction: false,
    }
  }

  // Reduce entries into the map using Array.reduce (AD-1)
  // Entries are already ordered by date DESC from Prisma
  return entries.reduce<Record<string, FoodHistory>>((acc, entry) => {
    const history = acc[entry.foodId]
    // Skip entries for food IDs not in the requested set
    if (!history) return acc

    const dateStr = entry.date.toISOString().split('T')[0] ?? null

    // ── timesOffered
    history.timesOffered += 1

    // ── lastDate: first time we see a food (earliest by reduce order = most recent date)
    if (history.lastDate === null) {
      history.lastDate = dateStr
    }

    // ── lastReaction: first non-null reaction we encounter (most recent by date DESC ordering)
    if (entry.reaction !== null && history.lastReaction === null) {
      history.lastReaction = entry.reaction as unknown as SharedReactionType
    }

    // ── reactions: deduplicated set
    if (entry.reaction !== null) {
      const reactionAsShared = entry.reaction as unknown as SharedReactionType
      if (!history.reactions.includes(reactionAsShared)) {
        history.reactions.push(reactionAsShared)
      }
    }

    // ── hasAllergyReaction
    if (entry.reaction === 'ALLERGIC' || entry.reaction === 'RASH') {
      history.hasAllergyReaction = true
    }

    return acc
  }, initial)
}
