/**
 * A/L Balance types — result of the balance calculation algorithm.
 */

/** Traffic-light balance label */
export type BalanceLabel = 'balanced' | 'astringent' | 'laxative'

/** Result of the A/L balance calculation */
export interface BalanceResult {
  /** -1.0 (all laxative) to +1.0 (all astringent), 0.0 = balanced */
  score: number
  astringent: number
  laxative: number
  neutral: number
  total: number
  /** Traffic-light label for display */
  label: BalanceLabel
  /** Spanish label for display */
  labelEs: string
}
