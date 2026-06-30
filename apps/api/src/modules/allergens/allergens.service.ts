/**
 * Allergens service — business logic for allergen tracker (Pro feature).
 *
 * Computes allergen introduction status from FoodLog entries.
 * Derives status from Food.isAllergen + Food.allergenType + FoodLog.reaction.
 *
 * Spec: REQ-A2, REQ-A3, REQ-A4, REQ-A5, REQ-A6
 */

import type { PrismaClient } from '@prisma/client'
import { TOP_ALLERGENS, CLOSING_WINDOW_AGE_MONTHS, ageInMonths, ALLERGEN_TYPE_MAPPING } from '@pakulab/shared'
import { ForbiddenError } from '../../shared/errors/index.js'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AllergenStatusResponse {
  ageMonths: number
  closingWindow: boolean
  allergens: AllergenEntry[]
}

export interface AllergenEntry {
  type: string
  name: string
  status: 'introduced' | 'pending' | 'in_window'
  introducedAt: string | null
  exposureCount: number
  lastReaction: string | null
}

interface FoodLogForAllergen {
  foodId: string
  date: Date
  reaction: string | null
  food: {
    allergenType: string | null
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

// ALLERGEN_TYPE_MAPPING moved to @pakulab/shared (T-03-04, PR-5)

/**
 * Seed-side allergenType values that are intentionally excluded (not priority allergens).
 * - 'celery': Apio is not a spec priority allergen; tracked here so exclusion is explicit, not silent.
 */
const EXCLUDED_SEED_ALLERGEN_TYPES = new Set(['celery'])

/**
 * TOP_ALLERGENS keys that are excluded from tracker output.
 * - 'mostaza': No seed data exists yet.
 */
const EXCLUDED_TRACKER_KEYS = new Set(['mostaza'])

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Wrapper: verify ownership, load data, compute status.
 *
 * @throws {ForbiddenError} when babyProfile not found or doesn't belong to userId
 */
export async function getStatus(
  prisma: PrismaClient,
  babyProfileId: string,
  userId: string,
  logger?: { warn: (data: any, message: string) => void },
): Promise<AllergenStatusResponse> {
  // Verify ownership
  const profile = await prisma.babyProfile.findFirst({
    where: { id: babyProfileId, userId, deletedAt: null },
    select: { id: true, birthDate: true },
  })

  if (!profile) {
    throw new ForbiddenError('No tienes acceso a este perfil de bebé')
  }

  // Compute age
  const birthStr = profile.birthDate.toISOString().split('T')[0]!
  const babyAgeMonths = ageInMonths(birthStr)

  // FIX 2: Load ONLY allergen food logs, with deterministic ordering
  const foodLogs = await prisma.foodLog.findMany({
    where: {
      babyProfileId,
      deletedAt: null,
      food: { isAllergen: true }, // FIX 2: filter by isAllergen
    },
    include: {
      food: {
        select: { allergenType: true },
      },
    },
    // FIX 2: deterministic ordering (date asc, createdAt asc for same-date tiebreak)
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  })

  // FIX 1: Observability — detect unmapped non-null allergenTypes
  const unmappedTypes = new Set<string>()
  for (const log of foodLogs) {
    const { allergenType } = log.food
    if (
      allergenType !== null &&
      !ALLERGEN_TYPE_MAPPING[allergenType] &&
      !EXCLUDED_SEED_ALLERGEN_TYPES.has(allergenType)
    ) {
      unmappedTypes.add(allergenType)
    }
  }

  if (unmappedTypes.size > 0 && logger) {
    logger.warn(
      { unmappedAllergenTypes: Array.from(unmappedTypes) },
      'Unmapped allergenType values found in FoodLog (neither in ALLERGEN_TYPE_MAPPING nor explicit exclusions)',
    )
  }

  return computeAllergenStatus({
    foodLogs,
    ageMonths: babyAgeMonths,
    closingWindowAgeMonths: CLOSING_WINDOW_AGE_MONTHS,
  })
}

/**
 * Pure function: compute allergen introduction status from food logs.
 *
 * Status rules (REQ-A3):
 * - introduced: at least 1 non-REJECTED exposure exists
 * - pending: ageMonths >= closingWindowAgeMonths && not introduced
 * - in_window: ageMonths < closingWindowAgeMonths && not introduced
 *
 * FIX 2: Sorts logs internally by date to handle out-of-order input.
 *
 * @param input - Food logs, baby age, and closing window threshold
 * @returns Allergen status response
 */
export function computeAllergenStatus(input: {
  foodLogs: FoodLogForAllergen[]
  ageMonths: number
  closingWindowAgeMonths: number
}): AllergenStatusResponse {
  const { foodLogs, ageMonths, closingWindowAgeMonths } = input

  // FIX 2: Sort logs by date internally (removes coupling to caller's order)
  const sortedLogs = [...foodLogs].sort((a, b) => a.date.getTime() - b.date.getTime())

  // Build a map of allergen type → exposures
  const allergenExposures = new Map<string, { dates: string[]; reactions: string[] }>()

  for (const log of sortedLogs) {
    const { allergenType } = log.food

    // Ignore null allergenTypes (silently — expected)
    if (!allergenType) {
      continue
    }

    // Ignore explicitly excluded seed allergenTypes (celery)
    if (EXCLUDED_SEED_ALLERGEN_TYPES.has(allergenType)) {
      continue
    }

    // Ignore unmapped allergenTypes (observability handled in wrapper)
    if (!ALLERGEN_TYPE_MAPPING[allergenType]) {
      continue
    }

    // Ignore REJECTED exposures (REQ-A2)
    if (log.reaction === 'REJECTED') {
      continue
    }

    const normalizedType = ALLERGEN_TYPE_MAPPING[allergenType]!
    const dateStr = log.date.toISOString().split('T')[0]!

    if (!allergenExposures.has(normalizedType)) {
      allergenExposures.set(normalizedType, { dates: [], reactions: [] })
    }

    const entry = allergenExposures.get(normalizedType)!
    entry.dates.push(dateStr)
    entry.reactions.push(log.reaction ?? 'UNKNOWN')
  }

  // Build allergen entries from TOP_ALLERGENS
  const allergens: AllergenEntry[] = []

  for (const allergen of TOP_ALLERGENS) {
    // Exclude mostaza (no seed data)
    if (EXCLUDED_TRACKER_KEYS.has(allergen.key)) {
      continue
    }

    const exposures = allergenExposures.get(allergen.key)
    const hasExposures = exposures && exposures.dates.length > 0

    let status: AllergenEntry['status']
    if (hasExposures) {
      status = 'introduced'
    } else if (ageMonths >= closingWindowAgeMonths) {
      status = 'pending'
    } else {
      status = 'in_window'
    }

    allergens.push({
      type: allergen.key,
      name: allergen.nameEs,
      status,
      introducedAt: hasExposures ? exposures!.dates[0]! : null,
      exposureCount: hasExposures ? exposures!.dates.length : 0,
      lastReaction: hasExposures ? exposures!.reactions[exposures!.reactions.length - 1]! : null,
    })
  }

  return {
    ageMonths,
    closingWindow: ageMonths >= closingWindowAgeMonths,
    allergens,
  }
}
