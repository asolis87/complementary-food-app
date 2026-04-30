/**
 * Pure utility functions for the diary module.
 * Extracted for testability — no I/O, no side effects.
 *
 * Spec: Plato↔Bitácora Connection — AD-1 (findMany + JS reduce)
 * Spec: REQ-D1, REQ-D2 — hasSuspectedReaction derived from DayObservation symptoms
 */

import type { FoodHistory, ReactionType as SharedReactionType } from '@pakulab/shared'
import type { ReactionType as PrismaReactionType } from '@prisma/client'

export interface FoodLogEntry {
  foodId: string
  reaction: PrismaReactionType | null
  date: Date
}

/** Minimal shape needed from a DayObservation to compute the suspected food signal */
export interface DayObservationEntry {
  date: Date
  symptoms: string[]
}

/**
 * Symptoms that trigger the "suspected food reaction" signal (REQ-D1).
 * GAS, VOMITING, FEVER do NOT trigger it — only ALLERGY_SUSPECT and RASH do.
 */
const SUSPECT_SYMPTOMS = new Set(['ALLERGY_SUSPECT', 'RASH'])

/** Convert a Date to a YYYY-MM-DD key using UTC. */
function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0] as string
}

/**
 * Aggregates raw FoodLog entries into a FoodHistory map.
 *
 * Design: AD-1 — findMany + JS reduce pattern.
 * Design § 4 — hasSuspectedReaction derived from DayObservation.symptoms, not FoodLog.reaction.
 *
 * - timesOffered: count of entries per food
 * - reactions: deduplicated non-null reactions
 * - lastReaction: most recent entry WHERE reaction IS NOT NULL
 * - lastDate: date of the most recent entry (regardless of reaction)
 * - hasSuspectedReaction: true when any day on which this food was introduced has
 *   a DayObservation whose symptoms array contains ALLERGY_SUSPECT or RASH
 *
 * @param entries  FoodLog rows from Prisma (ordered by date DESC)
 * @param observations  DayObservation rows for the same (babyProfileId, window) context
 * @param requestedFoodIds  All food IDs requested — ensures every ID gets an entry even if never offered
 * @returns Record<foodId, FoodHistory>
 */
export function aggregateFoodHistory(
  entries: FoodLogEntry[],
  observations: DayObservationEntry[],
  requestedFoodIds: string[],
): Record<string, FoodHistory> {
  // Build a symptom map keyed by ISO date (YYYY-MM-DD) for O(1) lookup
  const symptomMap = new Map<string, Set<string>>()
  for (const obs of observations) {
    symptomMap.set(toDateKey(obs.date), new Set(obs.symptoms))
  }

  const initial: Record<string, FoodHistory> = {}

  // Seed with zeroed-out entries for every requested food
  for (const foodId of requestedFoodIds) {
    initial[foodId] = {
      foodId,
      timesOffered: 0,
      reactions: [],
      lastReaction: null,
      lastDate: null,
      hasSuspectedReaction: false,
    }
  }

  // Reduce entries into the map using Array.reduce (AD-1)
  // Entries are already ordered by date DESC from Prisma
  return entries.reduce<Record<string, FoodHistory>>((acc, entry) => {
    const history = acc[entry.foodId]
    // Skip entries for food IDs not in the requested set
    if (!history) return acc

    const dateKey = toDateKey(entry.date)

    // ── timesOffered
    history.timesOffered += 1

    // ── lastDate: first time we see a food (earliest by reduce order = most recent date)
    if (history.lastDate === null) {
      history.lastDate = dateKey
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

    // ── hasSuspectedReaction: derived from DayObservation symptoms (REQ-D1, REQ-D2)
    // Once set to true it stays true (any single offering on a suspect day is enough)
    if (!history.hasSuspectedReaction) {
      const daySymptoms = symptomMap.get(dateKey)
      if (daySymptoms) {
        for (const suspect of SUSPECT_SYMPTOMS) {
          if (daySymptoms.has(suspect)) {
            history.hasSuspectedReaction = true
            break
          }
        }
      }
    }

    return acc
  }, initial)
}
