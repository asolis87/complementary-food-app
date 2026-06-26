/**
 * useDashboardTips — rotating dashboard tip composable.
 *
 * Picks a random tip from the curated BALANCE_TIPS list on each page load.
 * Rotation is per-page-load, NOT per-session — every fresh navigation picks a new tip.
 *
 * Spec: REQ-DASH-BIZ-05 — tips MUST come from the hardcoded list, never generated dynamically.
 */

import { BALANCE_TIPS, STAGE_TIPS } from '@pakulab/shared'
import type { AgeStage } from '@pakulab/shared'
import { ref } from 'vue'

/**
 * Returns a randomly selected tip from the curated list.
 * The tip is chosen once when the composable is first called on a page.
 * Subsequent calls return the same tip (per-instance, not global).
 */
export function useDashboardTips() {
  /** Pick a random tip on composable creation (per-page-load rotation) */
  const tip = ref<string>(_pickRandomTip())

  /** Re-randomise the tip — call this on manual refresh actions */
  function reshuffle(): void {
    tip.value = _pickRandomTip()
  }

  /** Current tip text */
  function getTip(): string {
    return tip.value
  }

  return {
    /** The current tip string */
    tip,
    /** Re-pick a random tip */
    reshuffle,
    /** Get the current tip */
    getTip,
    /** The full curated list (read-only) */
    tips: BALANCE_TIPS,
  }
}

// ── Private helpers ──────────────────────────────────────────────────────────

function _pickRandomTip(): string {
  const idx = Math.floor(Math.random() * BALANCE_TIPS.length)
  return BALANCE_TIPS[idx]
}

/**
 * useStageTip — age-aware rotating tip composable.
 *
 * Picks a random tip from the STAGE_TIPS list based on the baby's age.
 * Rotation is per-page-load, NOT per-session — every fresh navigation picks a new tip.
 * Rotation WITHIN the stage avoids immediate repeats.
 *
 * Spec: REQ-D2 — stage-specific tips based on age in months.
 */
export function useStageTip(ageMonths: number) {
  const stage = _getStageForAge(ageMonths)
  const stageTipsArray = STAGE_TIPS[stage]

  /** Pick a random tip on composable creation (per-page-load rotation) */
  const tip = ref<string>(_pickRandomStageTip(stageTipsArray))
  let lastTip = tip.value

  /** Re-randomise the tip — call this on manual refresh actions */
  function reshuffle(): void {
    tip.value = _pickRandomStageTip(stageTipsArray, lastTip)
    lastTip = tip.value
  }

  /** Current tip text */
  function getTip(): string {
    return tip.value
  }

  return {
    /** The current tip string */
    tip,
    /** Re-pick a random tip */
    reshuffle,
    /** Get the current tip */
    getTip,
    /** The full curated stage-specific list (read-only) */
    tips: stageTipsArray,
  }
}

/**
 * Maps age in months to an AgeStage.
 * This is a private local mapper; T-00-03 may add a shared helper later.
 */
function _getStageForAge(ageMonths: number): AgeStage {
  if (ageMonths < 10) return 'SIX_TO_NINE_MONTHS'
  if (ageMonths < 13) return 'TEN_TO_TWELVE_MONTHS'
  if (ageMonths < 18) return 'THIRTEEN_TO_SEVENTEEN_MONTHS'
  return 'EIGHTEEN_TO_TWENTY_THREE_MONTHS'
}

/**
 * Picks a random tip from the stage tips array, avoiding immediate repeat.
 * If previousTip is provided, ensures the new tip is different.
 */
function _pickRandomStageTip(
  tipsArray: readonly string[],
  previousTip?: string
): string {
  if (tipsArray.length === 0) {
    throw new Error('Empty tips array provided')
  }

  if (tipsArray.length === 1) {
    return tipsArray[0]
  }

  let attempts = 0
  const maxAttempts = 10
  let newTip: string

  do {
    const idx = Math.floor(Math.random() * tipsArray.length)
    newTip = tipsArray[idx]
    attempts++
  } while (newTip === previousTip && attempts < maxAttempts)

  return newTip
}
