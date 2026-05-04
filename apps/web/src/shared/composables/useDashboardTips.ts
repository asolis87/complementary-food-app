/**
 * useDashboardTips — rotating dashboard tip composable.
 *
 * Picks a random tip from the curated BALANCE_TIPS list on each page load.
 * Rotation is per-page-load, NOT per-session — every fresh navigation picks a new tip.
 *
 * Spec: REQ-DASH-BIZ-05 — tips MUST come from the hardcoded list, never generated dynamically.
 */

import { BALANCE_TIPS } from '@pakulab/shared'
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
