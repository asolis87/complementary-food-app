/**
 * A/L Balance scoring thresholds.
 * Used by the balance calculation and the traffic-light display.
 */

/** Score range for "balanced" classification (|score| ≤ threshold) */
export const BALANCE_THRESHOLD = 0.34

/** Score range for "leaning" classification (0.34 < |score| ≤ threshold) */
export const IMBALANCE_THRESHOLD = 0.67

/** Balance visual colors (for reference — actual CSS in the component) */
export const BALANCE_COLORS = {
  balanced: '#22c55e', // green-500
  leaning: '#eab308', // yellow-500
  heavy: '#ef4444', // red-500
} as const
