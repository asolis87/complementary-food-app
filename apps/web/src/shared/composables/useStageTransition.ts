/**
 * useStageTransition — stage transition detection composable.
 *
 * Detects when a baby crosses age thresholds (10 or 13 months) based on the
 * lastSeenAgeMonths stored in localStorage.
 *
 * Spec: REQ-B1 — transition banner logic for 10-23m feature.
 */

import type { AgeStage } from '@pakulab/shared'
import { ref, computed } from 'vue'
import { safeGetItem, safeSetItem } from '@/shared/utils/safeStorage'

const STORAGE_KEY_LAST_SEEN_BASE = 'pakulab:lastSeenAgeMonths'
const STORAGE_KEY_DISMISSED_10_12_BASE = 'pakulab:stageTransition:10_12'
const STORAGE_KEY_DISMISSED_13_17_BASE = 'pakulab:stageTransition:13_17'

/**
 * Build per-baby storage keys to prevent cross-baby contamination.
 */
export function buildLastSeenKey(babyId: string): string {
  return `${STORAGE_KEY_LAST_SEEN_BASE}:${babyId}`
}

function buildDismissedKey(stage: AgeStage, babyId: string): string {
  const base = stage === 'TEN_TO_TWELVE_MONTHS'
    ? STORAGE_KEY_DISMISSED_10_12_BASE
    : STORAGE_KEY_DISMISSED_13_17_BASE
  return `${base}:${babyId}`
}

interface StageTransitionResult {
  /** The detected transition stage, or null if no crossing */
  transition: ReturnType<typeof ref<AgeStage | null>>
  /** Whether the transition was already dismissed */
  dismissed: ReturnType<typeof ref<boolean>>
  /** Dismiss the transition banner for the given stage */
  dismiss: (stage: AgeStage) => void
}

/**
 * Detects if the baby has crossed an age threshold (10 or 13 months).
 *
 * @param currentAgeMonths - The baby's current age in months
 * @param babyId - The baby's unique ID (for per-baby storage keys)
 * @returns Transition stage and dismissed status
 */
export function useStageTransition(currentAgeMonths: number, babyId: string): StageTransitionResult {
  const lastSeenKey = buildLastSeenKey(babyId)
  const lastSeenRaw = safeGetItem(localStorage, lastSeenKey)

  // Validate parseInt result: NaN from garbage storage → treat as null
  const parsedAge = lastSeenRaw ? parseInt(lastSeenRaw, 10) : NaN
  const lastSeenAgeMonths = Number.isFinite(parsedAge) ? parsedAge : null

  // Detect crossing
  let detectedStage: AgeStage | null = null

  if (lastSeenAgeMonths !== null) {
    // Check 13-17 threshold first (higher priority)
    if (currentAgeMonths >= 13 && lastSeenAgeMonths < 13) {
      detectedStage = 'THIRTEEN_TO_SEVENTEEN_MONTHS'
    }
    // Then check 10-12 threshold
    else if (currentAgeMonths >= 10 && lastSeenAgeMonths < 10) {
      detectedStage = 'TEN_TO_TWELVE_MONTHS'
    }
  }

  const transition = ref<AgeStage | null>(detectedStage)

  // Check if already dismissed
  const isDismissed = computed<boolean>(() => {
    if (!transition.value) return false

    const dismissedKey = buildDismissedKey(transition.value, babyId)
    return safeGetItem(localStorage, dismissedKey) === 'dismissed'
  })

  const dismissed = ref<boolean>(isDismissed.value)

  /**
   * Mark the transition as dismissed for the given stage.
   */
  function dismiss(stage: AgeStage): void {
    const dismissedKey = buildDismissedKey(stage, babyId)
    safeSetItem(localStorage, dismissedKey, 'dismissed')
    dismissed.value = true
  }

  return {
    transition,
    dismissed,
    dismiss,
  }
}
